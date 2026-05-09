import * as pty from 'node-pty';
import path from 'path';
import os from 'os';

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

export class ClaudePtyManager {
  private term: pty.IPty | null = null;
  private sessionId: string | null = null;
  private isProcessing = false;
  private messageQueue: Array<{
    message: string;
    onChunk: ChunkCallback;
    onDone: DoneCallback;
    onError: ErrorCallback;
  }> = [];
  private onRawOutput: RawOutputCallback | null = null;
  private cwd: string;
  private outputBuffer = '';
  private promptDetected = false;
  private readyResolve: (() => void) | null = null;

  // Claude's prompt character (detects when ready for next input)
  private static readonly PROMPT = '❯';

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
    return this.term !== null;
  }

  async start(): Promise<void> {
    if (this.isAlive()) return;

    const claudeCmd = getClaudeCommand();
    const args: string[] = [];

    if (this.sessionId) {
      args.push('--session-id', this.sessionId);
      args.push('--resume', this.sessionId);
    }

    const isWindows = process.platform === 'win32';

    console.log(`[ClaudePtyManager] Starting Claude in PTY: ${claudeCmd} ${args.join(' ')}`);

    this.term = pty.spawn(claudeCmd, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: this.cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
    });

    this.term.onData((data: string) => {
      // Echo to server console for terminal sync
      process.stdout.write(data);

      // Forward to web Terminal panel
      if (this.onRawOutput) {
        this.onRawOutput(data);
      }

      // Track output buffer for response parsing
      this.outputBuffer += data;

      // Detect prompt — Claude is ready for input
      // The prompt ❯ appears at the end of the output when Claude is waiting
      if (data.includes(ClaudePtyManager.PROMPT)) {
        if (!this.promptDetected) {
          this.promptDetected = true;
          // Trigger ready callback for initial startup
          if (this.readyResolve) {
            this.readyResolve();
            this.readyResolve = null;
          }
        }

        // If we were processing a message, extract the response
        if (this.isProcessing) {
          this.extractResponse();
        }
      }
    });

    this.term.onExit(({ exitCode, signal }: { exitCode: number; signal?: number }) => {
      console.log(`[ClaudePtyManager] PTY exited with code ${exitCode}, signal ${signal}`);
      this.term = null;
      this.isProcessing = false;
    });

    // Wait for initial prompt to appear (Claude is ready)
    await new Promise<void>((resolve) => {
      this.readyResolve = resolve;
      // Timeout after 15 seconds
      setTimeout(() => {
        if (this.readyResolve) {
          this.readyResolve = null;
          console.log('[ClaudePtyManager] Timeout waiting for prompt, proceeding anyway');
          resolve();
        }
      }, 15000);
    });
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
    if (!this.term) return;

    this.isProcessing = true;
    const entry = this.messageQueue[0];

    // Clear output buffer for new response
    this.outputBuffer = '';

    // Write message to Claude's stdin via PTY
    this.term.write(entry.message + '\r');
  }

  private extractResponse(): void {
    const entry = this.messageQueue[0];
    if (!entry) {
      this.isProcessing = false;
      return;
    }

    // Parse the output buffer to extract response text
    // The response is everything between the user message and the prompt
    const cleanText = this.cleanAnsi(this.outputBuffer);
    const lines = cleanText.split('\n');

    // Find response: skip echoed user input, extract assistant response
    const responseLines: string[] = [];
    let foundUserEcho = false;
    let foundResponse = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip the echoed user message
      if (!foundUserEcho && trimmed.includes(entry.message.slice(0, 20))) {
        foundUserEcho = true;
        continue;
      }

      // Skip prompt lines
      if (trimmed.endsWith('❯') || trimmed === '❯') {
        continue;
      }

      if (foundUserEcho) {
        // Skip thinking/loading indicators
        if (
          trimmed === '⏺' ||
          trimmed.startsWith('⏺') ||
          trimmed === '●' ||
          trimmed === '○' ||
          trimmed === '◐' ||
          trimmed === '◓' ||
          trimmed === '◑' ||
          trimmed === '◒' ||
          trimmed === '' ||
          trimmed.startsWith('⎿') ||
          trimmed === '...'
        ) {
          continue;
        }

        if (trimmed) {
          foundResponse = true;
          responseLines.push(line);
        } else if (foundResponse) {
          // Empty line after response starts may be intentional
          responseLines.push(line);
        }
      }
    }

    const response = responseLines.join('\n').trim();

    if (response) {
      // Send cleaned response as chunks
      // Simulate streaming by sending word by word (real PTY provides continuous output)
      entry.onChunk(response);
    }

    // Complete processing
    this.isProcessing = false;
    this.messageQueue.shift();
    entry.onDone();

    // Process next queued message
    this.processQueue();
  }

  private cleanAnsi(text: string): string {
    // Strip ANSI escape codes
    return text
      .replace(/\x1b\[[0-9;]*m/g, '') // Colors
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '') // Other ANSI
      .replace(/\x1b\]0;[^\x07]*\x07/g, '') // OSC title sequences
      .replace(/\r/g, ''); // Carriage returns
  }

  async stop(): Promise<void> {
    this.messageQueue.length = 0;
    this.isProcessing = false;

    if (this.term) {
      this.term.kill();
      this.term = null;
    }
  }
}

// Singleton
let instance: ClaudePtyManager | null = null;

export function getClaudePtyManager(cwd?: string): ClaudePtyManager {
  if (!instance) {
    instance = new ClaudePtyManager(cwd);
  }
  return instance;
}

export function resetClaudePtyManager(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}
