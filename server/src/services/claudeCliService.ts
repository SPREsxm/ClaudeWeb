import { spawn, ChildProcess, execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

interface StreamEvent {
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

interface ActiveSession {
  sessionId: string;
  process: ChildProcess | null;
  createdAt: number;
}

const activeSessions = new Map<string, ActiveSession>();

let _cliAvailable: boolean | null = null;

function getClaudeCommand(): string {
  // On Windows, Claude Code installs as claude.cmd in npm global directory
  if (process.platform === 'win32') {
    const npmClaude = path.join(process.env.APPDATA || '', 'npm', 'claude.cmd');
    return npmClaude;
  }
  return 'claude';
}

export function isCliAvailable(): boolean {
  if (_cliAvailable !== null) return _cliAvailable;

  const cmd = getClaudeCommand();
  try {
    execSync(`"${cmd}" --version`, {
      stdio: 'pipe',
      timeout: 5000,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
    });
    _cliAvailable = true;
  } catch {
    // Try plain 'claude' as fallback
    try {
      execSync('claude --version', {
        stdio: 'pipe',
        timeout: 5000,
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
      });
      _cliAvailable = true;
    } catch {
      _cliAvailable = false;
    }
  }
  return _cliAvailable;
}

export function getOrCreateSession(workspaceDir?: string): string {
  const cwd = workspaceDir || process.cwd();
  // Check if there's already a session for this workspace
  for (const [id, session] of activeSessions) {
    if (session.createdAt > Date.now() - 3600000) {
      // Session less than 1 hour old
      return session.sessionId;
    }
  }
  const sessionId = uuidv4();
  activeSessions.set(cwd, {
    sessionId,
    process: null,
    createdAt: Date.now(),
  });
  return sessionId;
}

export async function* streamClaudeResponse(
  message: string,
  options: {
    sessionId?: string;
    cwd?: string;
    model?: string;
    continueSession?: boolean;
  } = {},
): AsyncGenerator<string> {
  const {
    sessionId = getOrCreateSession(options.cwd),
    cwd = process.cwd(),
    model,
    continueSession = false,
  } = options;

  const args: string[] = [
    '-p',
    '--output-format', 'stream-json',
    '--include-partial-messages',
    '--session-id', sessionId,
  ];

  if (model) {
    args.push('--model', model);
  }

  if (continueSession) {
    args.push('--continue');
  }

  args.push(message);

  let childProcess: ChildProcess | null = null;

  try {
    const claudeCmd = getClaudeCommand();
    const isWindows = process.platform === 'win32';

    childProcess = spawn(claudeCmd, args, {
      cwd,
      env: {
        ...process.env,
        NO_COLOR: '1',
        TERM: 'dumb',
        CI: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows,
    });

    let buffer = '';

    if (!childProcess.stdout) {
      yield '**错误**: 无法连接到 Claude CLI';
      return;
    }

    childProcess.stdout.setEncoding('utf-8');

    for await (const chunk of childProcess.stdout) {
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event: StreamEvent = JSON.parse(trimmed);

          // Extract text from content_block_delta events
          if (
            event.type === 'stream_event' &&
            event.event?.type === 'content_block_delta' &&
            event.event.delta?.type === 'text_delta' &&
            event.event.delta.text
          ) {
            yield event.event.delta.text;
          }

          // Handle final result event
          if (event.type === 'result') {
            // Session is complete
            if (event.result) {
              try {
                const result = JSON.parse(event.result);
                if (result.content) {
                  // Already streamed via deltas, nothing extra needed
                }
              } catch {
                // Not JSON, ignore
              }
            }
          }
        } catch {
          // Skip non-JSON lines (like thinking headers, progress, etc.)
          // Only forward if it looks like user-facing text
          if (
            !trimmed.startsWith('⏺') &&
            !trimmed.startsWith('⎿') &&
            !trimmed.startsWith('❯') &&
            trimmed.length > 2
          ) {
            // Could be a direct text response without JSON wrapping
            // yield trimmed;
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const event: StreamEvent = JSON.parse(buffer.trim());
        if (
          event.type === 'stream_event' &&
          event.event?.type === 'content_block_delta' &&
          event.event.delta?.type === 'text_delta' &&
          event.event.delta.text
        ) {
          yield event.event.delta.text;
        }
      } catch {
        // Ignore remaining non-JSON
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      yield '\n\n**⚠️ 找不到 Claude CLI**\n\n';
      yield '请确保 Claude Code 已安装。如果已安装，请检查 PATH 环境变量。\n\n';
      yield '作为后备方案，您可以在 `server/.env` 中设置 `ANTHROPIC_API_KEY` 来使用 API 模式。';
    } else {
      yield `\n\n**CLI 错误**: ${error.message}`;
    }
  } finally {
    if (childProcess) {
      childProcess.kill();
    }
  }
}

// Non-streaming version for REST API
export async function sendToClaude(
  message: string,
  options: {
    sessionId?: string;
    cwd?: string;
    model?: string;
  } = {},
): Promise<string> {
  let fullResponse = '';
  for await (const chunk of streamClaudeResponse(message, options)) {
    fullResponse += chunk;
  }
  return fullResponse;
}

export function isClaudeCliAvailable(): boolean {
  return isCliAvailable();
}
