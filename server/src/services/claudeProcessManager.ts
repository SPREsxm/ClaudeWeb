import { spawn, ChildProcess } from 'child_process';
import path from 'path';

interface StreamInputMessage {
  type: 'user';
  message: {
    role: 'user';
    content: string | { type: string; text?: string; source?: any }[];
  };
  parent_tool_use_id?: string;
  session_id?: string;
}

interface StreamOutputEvent {
  type: string;
  event?: {
    type: string;
    delta?: {
      type: string;
      text?: string;
    };
    content_block?: {
      type: string;
      text?: string;
    };
    message?: {
      content?: Array<{ type: string; text?: string }>;
    };
  };
  result?: string;
}

type ChunkCallback = (text: string) => void;
type DoneCallback = () => void;
type ErrorCallback = (error: Error) => void;
type RawOutputCallback = (text: string) => void;

function getClaudeCommand(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'npm', 'claude.cmd');
  }
  return 'claude';
}

export class ClaudeProcessManager {
  private process: ChildProcess | null = null;
  private sessionId: string | null = null;
  private isProcessing = false;
  private isStarting = false;
  private messageQueue: Array<{
    message: string;
    onChunk: ChunkCallback;
    onDone: DoneCallback;
    onError: ErrorCallback;
  }> = [];
  private onRawOutput: RawOutputCallback | null = null;
  private cwd: string;

  constructor(cwd?: string) {
    this.cwd = cwd || process.cwd();
  }

  setSessionId(id: string): void {
    this.sessionId = id;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  onTerminalOutput(cb: RawOutputCallback): void {
    this.onRawOutput = cb;
  }

  isAlive(): boolean {
    return this.process !== null && !this.process.killed;
  }

  async start(): Promise<void> {
    if (this.isAlive()) return;
    if (this.isStarting) {
      // Wait for existing start to complete
      let tries = 0;
      while (this.isStarting && tries < 50) {
        await new Promise((r) => setTimeout(r, 100));
        tries++;
      }
      return;
    }

    this.isStarting = true;

    try {
      const claudeCmd = getClaudeCommand();
      const args: string[] = [
        '-p',
        '--input-format', 'stream-json',
        '--output-format', 'stream-json',
        '--include-partial-messages',
        '--verbose',
      ];

      if (this.sessionId) {
        args.push('--session-id', this.sessionId);
      }

      const isWindows = process.platform === 'win32';

      this.process = spawn(`"${claudeCmd}"`, args, {
        cwd: this.cwd,
        env: {
          ...process.env,
          NO_COLOR: '1',
          TERM: 'dumb',
          CI: '1',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: isWindows,
      });

      if (!this.process.stdout) {
        throw new Error('Failed to create Claude process: no stdout');
      }

      let streamBuffer = '';

      this.process.stdout.setEncoding('utf-8');

      this.process.stdout.on('data', (chunk: string) => {
        streamBuffer += chunk;

        // Emit raw output for web Terminal panel sync
        if (this.onRawOutput) {
          this.onRawOutput(chunk);
        }

        // Process complete lines (JSON events)
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const event: StreamOutputEvent = JSON.parse(trimmed);

            // Handle stream events (text deltas)
            if (
              event.type === 'stream_event' &&
              event.event?.type === 'content_block_delta' &&
              event.event.delta?.type === 'text_delta' &&
              event.event.delta.text
            ) {
              // Echo text to server console for terminal sync
              process.stdout.write(event.event.delta.text);

              const cb = this.messageQueue[0]?.onChunk;
              if (cb) {
                cb(event.event.delta.text);
              }
            }

            // Handle result event (message complete)
            if (event.type === 'result') {
              this.isProcessing = false;
              const done = this.messageQueue.shift();
              if (done) {
                done.onDone();
              }
              this.processQueue();
            }

            // Handle errors
            if (event.type === 'error') {
              this.isProcessing = false;
              const err = this.messageQueue.shift();
              if (err) {
                err.onError(new Error(event.event?.message?.content?.[0]?.text || 'Claude error'));
              }
              this.processQueue();
            }
          } catch {
            // Non-JSON line, skip silently
          }
        }
      });

      this.process.stderr?.setEncoding('utf-8');
      this.process.stderr?.on('data', (chunk: string) => {
        console.error('[Claude stderr]', chunk.trim());
      });

      this.process.on('exit', (code, signal) => {
        console.log(`[ClaudeProcessManager] Process exited with code ${code}, signal ${signal}`);
        this.process = null;

        if (this.messageQueue.length > 0 && code !== 0) {
          console.log('[ClaudeProcessManager] Respawning for queued messages...');
          this.isStarting = false;
          this.start().then(() => {
            if (this.isProcessing) return;
            this.processQueue();
          });
        }
      });

      this.process.on('error', (err) => {
        console.error('[ClaudeProcessManager] Process error:', err.message);
        this.process = null;
      });

      // Brief delay for process initialization
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      this.isStarting = false;
    }
  }

  async sendMessage(
    text: string,
    onChunk: ChunkCallback,
    onDone: DoneCallback,
    onError: ErrorCallback,
  ): Promise<void> {
    if (!this.isAlive()) {
      await this.start();
    }

    this.messageQueue.push({
      message: text,
      onChunk,
      onDone,
      onError,
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.messageQueue.length === 0 || this.isProcessing) return;
    if (!this.process || !this.process.stdin) return;

    this.isProcessing = true;
    const entry = this.messageQueue[0];

    const jsonMessage: StreamInputMessage = {
      type: 'user',
      message: {
        role: 'user',
        content: entry.message,
      },
    };

    if (this.sessionId) {
      jsonMessage.session_id = this.sessionId;
    }

    try {
      this.process.stdin.write(JSON.stringify(jsonMessage) + '\n');
    } catch (err: any) {
      this.isProcessing = false;
      this.messageQueue.shift();
      entry.onError(err);
      this.processQueue();
    }
  }

  async stop(): Promise<void> {
    this.messageQueue.length = 0;
    this.isProcessing = false;

    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

// Singleton instance
let instance: ClaudeProcessManager | null = null;

export function getClaudeProcessManager(cwd?: string): ClaudeProcessManager {
  if (!instance) {
    instance = new ClaudeProcessManager(cwd);
  }
  return instance;
}

export function resetClaudeProcessManager(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}
