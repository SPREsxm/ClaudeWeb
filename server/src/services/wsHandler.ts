import { Server, Socket } from 'socket.io';
import { executeCommand } from './commandService.js';
import { streamResponse, ChatMessage, getAIMode } from './chatService.js';
import { readFile } from './fileService.js';
import { saveSession, loadSession, StoredSession } from './sessionStore.js';
import { getActiveClaudeSessions } from './claudeSessionService.js';
import { getClaudeProcessManager } from './claudeProcessManager.js';
import chokidar from 'chokidar';
import path from 'path';
import { resolveWorkspacePath } from '../utils/pathUtils.js';

const activeWatchers = new Map<string, chokidar.FSWatcher>();

export function setupWebSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Chat message with persistent Claude subprocess
    socket.on('chat:message', async (data: {
      message: string;
      history?: ChatMessage[];
      sessionId?: string;
      workspacePath?: string;
      cliSessionId?: string;
    }) => {
      const { message, history = [], sessionId, workspacePath } = data;

      try {
        // If there's an active CLI session, use it for continuity
        let cliSessionId: string | undefined;
        try {
          const activeSessions = await getActiveClaudeSessions();
          if (activeSessions.length > 0) {
            cliSessionId = activeSessions[0].sessionId;
          }
        } catch {
          // Couldn't check active sessions, proceed without
        }

        // Sync user input to Terminal panel
        socket.emit('terminal:output', {
          data: `> ${message}\n`,
          type: 'info',
        });

        const mode = getAIMode();

        // Use persistent subprocess for CLI mode (best two-way sync)
        if (mode === 'cli') {
          const manager = getClaudeProcessManager(workspacePath);

          // Do NOT share session ID with active terminal Claude — that causes
          // "Session ID is already in use" conflict. Web gets its own session.
          if (!manager.isAlive()) {
            await manager.start();
          }

          // Forward raw Claude output to Terminal panel
          manager.onTerminalOutput((text: string) => {
            const lines = text.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith('{')) continue;
              socket.emit('terminal:output', {
                data: trimmed + '\n',
                type: 'stdout',
              });
            }
          });

          let accumulated = '';

          await new Promise<void>((resolve, reject) => {
            manager.sendMessage(
              message,
              (chunk: string) => {
                accumulated += chunk;
                socket.emit('chat:chunk', {
                  content: accumulated,
                  full: false,
                });
                socket.emit('terminal:output', {
                  data: chunk,
                  type: 'stdout',
                });
              },
              () => {
                socket.emit('chat:done', { content: accumulated });
                socket.emit('terminal:done', { exitCode: 0 });
                resolve();
              },
              (error: Error) => {
                socket.emit('chat:error', { message: error.message });
                reject(error);
              },
            );
          });

          // Auto-save session to disk
          if (sessionId && accumulated) {
            const fullMessages = [
              ...history,
              { role: 'user' as const, content: message },
              { role: 'assistant' as const, content: accumulated },
            ];
            const storedSession: StoredSession = {
              id: sessionId,
              title: message.slice(0, 40),
              messages: fullMessages.map((m, i) => ({
                id: `${sessionId}-${i}`,
                role: m.role,
                content: m.content,
                timestamp: Date.now(),
              })),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            const existing = await loadSession(sessionId);
            if (existing) {
              storedSession.createdAt = existing.createdAt;
              storedSession.title = existing.title !== 'New Chat' ? existing.title : storedSession.title;
            }
            await saveSession(storedSession);
          }
          return;
        }

        // Fallback: SDK mode or offline — use streamResponse
        let accumulated = '';

        for await (const chunk of streamResponse(message, history, {
          cliSessionId,
          workspacePath,
        })) {
          accumulated += chunk;
          socket.emit('chat:chunk', {
            content: accumulated,
            full: false,
          });
          socket.emit('terminal:output', {
            data: chunk,
            type: 'stdout',
          });
        }

        socket.emit('chat:done', { content: accumulated });
        socket.emit('terminal:done', { exitCode: 0 });

        // Auto-save session to disk
        if (sessionId) {
          const fullMessages = [
            ...history,
            { role: 'user' as const, content: message },
            { role: 'assistant' as const, content: accumulated },
          ];
          const storedSession: StoredSession = {
            id: sessionId,
            title: message.slice(0, 40),
            messages: fullMessages.map((m, i) => ({
              id: `${sessionId}-${i}`,
              role: m.role,
              content: m.content,
              timestamp: Date.now(),
            })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const existing = await loadSession(sessionId);
          if (existing) {
            storedSession.createdAt = existing.createdAt;
            storedSession.title = existing.title !== 'New Chat' ? existing.title : storedSession.title;
          }
          await saveSession(storedSession);
        }
      } catch (error: any) {
        socket.emit('chat:error', { message: error.message || 'Failed to generate response' });
      }
    });

        // Terminal command execution with real-time output
    socket.on('terminal:command', async (data: { command: string; cwd?: string }) => {
      const { command, cwd } = data;

      try {
        socket.emit('terminal:output', {
          data: `$ ${command}\n`,
          type: 'info',
        });

        const result = await executeCommand(command, cwd);

        if (result.warning) {
          socket.emit('terminal:output', {
            data: `⚠ ${result.warning}\n`,
            type: 'warning',
          });
        }

        if (result.stdout) {
          socket.emit('terminal:output', {
            data: result.stdout,
            type: 'stdout',
          });
        }

        if (result.stderr) {
          socket.emit('terminal:output', {
            data: result.stderr,
            type: 'stderr',
          });
        }

        socket.emit('terminal:done', {
          exitCode: result.exitCode,
        });
      } catch (error: any) {
        socket.emit('terminal:output', {
          data: error.message || 'Command execution failed',
          type: 'stderr',
        });
        socket.emit('terminal:done', { exitCode: 1 });
      }
    });

    // File watching
    socket.on('file:watch', (data: { path: string }) => {
      const filePath = data.path;
      if (activeWatchers.has(filePath)) {
        return; // Already watching
      }

      try {
        const resolved = resolveWorkspacePath(filePath);
        const watcher = chokidar.watch(resolved, {
          persistent: true,
          ignoreInitial: true,
        });

        watcher.on('change', async () => {
          try {
            const { content } = await readFile(filePath);
            socket.emit('file:changed', {
              path: filePath,
              content,
              timestamp: Date.now(),
            });
          } catch (err) {
            // File might be temporarily unavailable
          }
        });

        activeWatchers.set(filePath, watcher);
        socket.emit('file:watch:started', { path: filePath });

        // Clean up when socket disconnects
        socket.on('disconnect', () => {
          watcher.close();
          activeWatchers.delete(filePath);
        });
      } catch (error: any) {
        socket.emit('file:watch:error', {
          path: filePath,
          message: error.message,
        });
      }
    });

    // Stop watching a file
    socket.on('file:unwatch', (data: { path: string }) => {
      const watcher = activeWatchers.get(data.path);
      if (watcher) {
        watcher.close();
        activeWatchers.delete(data.path);
        socket.emit('file:unwatch:stopped', { path: data.path });
      }
    });

    // Join project room
    socket.on('join:room', (data: { room: string }) => {
      socket.join(data.room);
      socket.emit('room:joined', { room: data.room });
    });

    // Leave project room
    socket.on('leave:room', (data: { room: string }) => {
      socket.leave(data.room);
      socket.emit('room:left', { room: data.room });
    });

    // Request workspace file tree
    socket.on('workspace:info', async () => {
      socket.emit('workspace:info', {
        root: resolveWorkspacePath('.'),
        platform: process.platform,
        nodeVersion: process.version,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Clean up any remaining watchers for this socket
      activeWatchers.forEach((watcher, filePath) => {
        watcher.close();
      });
    });
  });

  console.log('WebSocket handler initialized');
}
