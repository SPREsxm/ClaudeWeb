import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ClaudeSessionSummary {
  sessionId: string;
  lastPrompt: string;
  messageCount: number;
  timestamp: number;
  project: string;
}

export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ActiveSession {
  sessionId: string;
  pid: number;
  cwd: string;
  status: string;
  startedAt: number;
  projectPath: string;
}

// ── Paths ───────────────────────────────────────────────────────────────────

function getClaudeDir(): string {
  return path.join(os.homedir(), '.claude');
}

function getProjectsDir(): string {
  return path.join(getClaudeDir(), 'projects');
}

function getSessionsDir(): string {
  return path.join(getClaudeDir(), 'sessions');
}

// ── Project hash ────────────────────────────────────────────────────────────

export function computeProjectHash(projectPath: string): string {
  return projectPath
    .replace(/[\/\\:]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function findProjectDir(hash: string): string | null {
  // Try exact match first
  const dir = path.join(getProjectsDir(), hash);

  // Also try case-insensitive search on Windows
  return dir;
}

// ── Session listing ─────────────────────────────────────────────────────────

export async function getActiveClaudeSessions(): Promise<ActiveSession[]> {
  const dir = getSessionsDir();
  const sessions: ActiveSession[] = [];

  try {
    const entries = await fs.readdir(dir);
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      try {
        const data = await fs.readFile(path.join(dir, entry), 'utf-8');
        const s = JSON.parse(data);
        if (s.sessionId && (s.status === 'waiting' || s.status === 'busy')) {
          sessions.push({
            sessionId: s.sessionId,
            pid: s.pid,
            cwd: s.cwd,
            status: s.status,
            startedAt: s.startedAt,
            projectPath: s.cwd,
          });
        }
      } catch {
        // skip corrupted files
      }
    }
  } catch {
    // no sessions dir yet
  }

  return sessions;
}

export async function getAllClaudeSessions(): Promise<ClaudeSessionSummary[]> {
  const sessionMap = new Map<string, ClaudeSessionSummary>();

  // Use history.jsonl for fast session listing (avoids parsing huge JSONL files)
  const historyPath = path.join(getClaudeDir(), 'history.jsonl');
  try {
    const data = await fs.readFile(historyPath, 'utf-8');
    const lines = data.split('\n').filter((l) => l.trim());

    // Process newest first
    for (const line of lines.reverse()) {
      try {
        const entry = JSON.parse(line);
        if (!entry.sessionId) continue;

        if (!sessionMap.has(entry.sessionId)) {
          sessionMap.set(entry.sessionId, {
            sessionId: entry.sessionId,
            lastPrompt: (entry.display || '').slice(0, 120),
            messageCount: 0,
            timestamp: entry.timestamp || 0,
            project: entry.project || '',
          });
        }
        // Increment message count
        const existing = sessionMap.get(entry.sessionId)!;
        existing.messageCount++;
      } catch {
        // skip corrupted lines
      }
    }
  } catch {
    // no history yet
  }

  // Enrich with file stats if available
  try {
    const projectsDir = getProjectsDir();
    const projectDirs = await fs.readdir(projectsDir, { withFileTypes: true });

    for (const projEntry of projectDirs) {
      if (!projEntry.isDirectory()) continue;
      const projDir = path.join(projectsDir, projEntry.name);

      try {
        const files = await fs.readdir(projDir);
        for (const file of files) {
          if (!file.endsWith('.jsonl')) continue;
          const sessionId = file.replace('.jsonl', '');
          const existing = sessionMap.get(sessionId);
          if (existing) {
            try {
              const stat = await fs.stat(path.join(projDir, file));
              existing.timestamp = stat.mtimeMs;
            } catch {
              // keep history timestamp
            }
          }
        }
      } catch {
        // skip inaccessible project dirs
      }
    }
  } catch {
    // no projects dir
  }

  return Array.from(sessionMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

// ── Session messages ────────────────────────────────────────────────────────

export async function getSessionMessages(
  sessionId: string,
  projectPath?: string,
): Promise<ClaudeMessage[]> {
  const messages: ClaudeMessage[] = [];

  // If projectPath is provided, look there first
  if (projectPath) {
    const hash = computeProjectHash(projectPath);
    const filePath = path.join(getProjectsDir(), hash, `${sessionId}.jsonl`);
    const msgs = await parseSessionFile(filePath);
    if (msgs.length > 0) return msgs;
  }

  // Search across all project directories
  const projectsDir = getProjectsDir();
  try {
    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const filePath = path.join(projectsDir, entry.name, `${sessionId}.jsonl`);
      const msgs = await parseSessionFile(filePath);
      if (msgs.length > 0) {
        return msgs;
      }
    }
  } catch {
    // no projects dir
  }

  return messages;
}

// ── Internal parsing ───────────────────────────────────────────────────────

async function parseSessionFile(filePath: string): Promise<ClaudeMessage[]> {
  const messages: ClaudeMessage[] = [];

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const lines = data.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const msg = JSON.parse(line);

        if (msg.type === 'user' && msg.message) {
          const content =
            typeof msg.message.content === 'string'
              ? msg.message.content
              : Array.isArray(msg.message.content)
                ? msg.message.content.map((c: any) => c.text || '').join('')
                : '';

          if (content.trim()) {
            messages.push({
              id: msg.uuid || `${msg.timestamp}`,
              role: 'user',
              content,
              timestamp: new Date(msg.timestamp).getTime(),
            });
          }
        } else if (msg.type === 'assistant' && msg.message) {
          let content = '';
          if (Array.isArray(msg.message.content)) {
            content = msg.message.content
              .filter((c: any) => c.type === 'text')
              .map((c: any) => c.text || '')
              .join('\n');
          } else if (typeof msg.message.content === 'string') {
            content = msg.message.content;
          }

          if (content.trim()) {
            messages.push({
              id: msg.uuid || `${msg.timestamp}`,
              role: 'assistant',
              content,
              timestamp: new Date(msg.timestamp).getTime(),
            });
          }
        }
      } catch {
        // skip unparseable lines
      }
    }
  } catch {
    // file not found or inaccessible
  }

  return messages;
}
