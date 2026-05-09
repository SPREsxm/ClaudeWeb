import fs from 'fs/promises';
import path from 'path';
import { resolveWorkspacePath, isValidPath, getLanguageFromExtension } from '../utils/pathUtils.js';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
}

export interface FileContent {
  content: string;
  language: string;
  path: string;
}

export async function listDirectory(dirPath: string): Promise<FileInfo[]> {
  const resolved = resolveWorkspacePath(dirPath || '.');
  if (!isValidPath(resolved)) {
    throw new Error(`Path "${dirPath}" is outside workspace`);
  }

  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const results: FileInfo[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.git') || entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(resolved, entry.name);
    const relativePath = path.relative(resolveWorkspacePath('.'), fullPath).replace(/\\/g, '/');

    try {
      const stat = await fs.stat(fullPath);
      results.push({
        name: entry.name,
        path: relativePath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    } catch {
      // Skip files we can't stat
    }
  }

  results.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return results;
}

export async function readFile(filePath: string): Promise<FileContent> {
  const resolved = resolveWorkspacePath(filePath);
  if (!isValidPath(resolved)) {
    throw new Error(`Path "${filePath}" is outside workspace`);
  }

  const content = await fs.readFile(resolved, 'utf-8');
  return {
    content,
    language: getLanguageFromExtension(filePath),
    path: filePath,
  };
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const resolved = resolveWorkspacePath(filePath);
  if (!isValidPath(resolved)) {
    throw new Error(`Path "${filePath}" is outside workspace`);
  }

  const dir = path.dirname(resolved);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(resolved, content, 'utf-8');
}

export async function deleteFile(filePath: string): Promise<void> {
  const resolved = resolveWorkspacePath(filePath);
  if (!isValidPath(resolved)) {
    throw new Error(`Path "${filePath}" is outside workspace`);
  }

  await fs.rm(resolved, { recursive: true, force: true });
}

export async function getFileInfo(filePath: string): Promise<FileInfo> {
  const resolved = resolveWorkspacePath(filePath);
  const stat = await fs.stat(resolved);
  return {
    name: path.basename(resolved),
    path: filePath,
    type: stat.isDirectory() ? 'directory' : 'file',
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
  };
}

export async function searchFiles(rootPath: string, query: string): Promise<string[]> {
  const resolved = resolveWorkspacePath(rootPath || '.');
  const results: string[] = [];
  const lowerQuery = query.toLowerCase();

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.git') || entry.name === 'node_modules') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.name.toLowerCase().includes(lowerQuery)) {
        results.push(path.relative(resolved, fullPath).replace(/\\/g, '/'));
      }
      if (entry.isDirectory()) {
        await walk(fullPath);
      }
    }
  }

  await walk(resolved);
  return results;
}
