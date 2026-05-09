import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+-rf\s+\//, warning: 'DANGER: Recursive force remove from root' },
  { pattern: /:\(\)\s*\{\s*:\|:&\s*\};:/, warning: 'DANGER: Fork bomb detected' },
  { pattern: />\s*\/dev\/sda/, warning: 'DANGER: Writing directly to block device' },
  { pattern: /mkfs\./, warning: 'WARNING: Formatting filesystem' },
  { pattern: /dd\s+if=.*of=\/dev\//, warning: 'WARNING: Raw device write' },
];

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  warning?: string;
}

interface HistoryEntry {
  command: string;
  cwd: string;
  timestamp: number;
  result: CommandResult;
}

const commandHistory: HistoryEntry[] = [];
const MAX_HISTORY = 100;

export function checkDangerousCommand(command: string): string | undefined {
  for (const { pattern, warning } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return warning;
    }
  }
  return undefined;
}

export async function executeCommand(
  command: string,
  cwd?: string,
  timeout: number = 30000,
): Promise<CommandResult> {
  const warning = checkDangerousCommand(command);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10 MB
      shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
    });

    const result: CommandResult = {
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: 0,
      warning,
    };

    commandHistory.unshift({
      command,
      cwd: cwd || process.cwd(),
      timestamp: Date.now(),
      result,
    });

    if (commandHistory.length > MAX_HISTORY) {
      commandHistory.pop();
    }

    return result;
  } catch (error: any) {
    const result: CommandResult = {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      exitCode: error.code || 1,
      warning,
    };

    commandHistory.unshift({
      command,
      cwd: cwd || process.cwd(),
      timestamp: Date.now(),
      result,
    });

    if (commandHistory.length > MAX_HISTORY) {
      commandHistory.pop();
    }

    return result;
  }
}

export function getCommandHistory(): HistoryEntry[] {
  return commandHistory;
}

export function clearHistory(): void {
  commandHistory.length = 0;
}
