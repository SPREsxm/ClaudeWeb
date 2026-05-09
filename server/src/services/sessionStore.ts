import fs from 'fs/promises';
import path from 'path';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface StoredSession {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionSummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

function getSessionsDir(workspaceDir?: string): string {
  const base = workspaceDir || process.cwd();
  return path.join(base, '.claude-web', 'sessions');
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // already exists
  }
}

export async function saveSession(session: StoredSession, workspaceDir?: string): Promise<void> {
  const dir = getSessionsDir(workspaceDir);
  await ensureDir(dir);
  const filePath = path.join(dir, `${session.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

export async function loadSession(id: string, workspaceDir?: string): Promise<StoredSession | null> {
  const dir = getSessionsDir(workspaceDir);
  try {
    const filePath = path.join(dir, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as StoredSession;
  } catch {
    return null;
  }
}

export async function listSessions(workspaceDir?: string): Promise<SessionSummary[]> {
  const dir = getSessionsDir(workspaceDir);
  try {
    const entries = await fs.readdir(dir);
    const summaries: SessionSummary[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      try {
        const data = await fs.readFile(path.join(dir, entry), 'utf-8');
        const session = JSON.parse(data) as StoredSession;
        summaries.push({
          id: session.id,
          title: session.title,
          messageCount: session.messages.length,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        });
      } catch {
        // skip corrupted files
      }
    }
    summaries.sort((a, b) => b.updatedAt - a.updatedAt);
    return summaries;
  } catch {
    return [];
  }
}

export async function deleteSession(id: string, workspaceDir?: string): Promise<boolean> {
  const dir = getSessionsDir(workspaceDir);
  try {
    await fs.unlink(path.join(dir, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}
