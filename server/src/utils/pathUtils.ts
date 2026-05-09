import path from 'path';
import fs from 'fs';

let workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();

export function setWorkspaceRoot(root: string): void {
  workspaceRoot = root;
}

export function getWorkspaceRoot(): string {
  return workspaceRoot;
}

export function resolveWorkspacePath(relativePath: string): string {
  const resolved = path.resolve(workspaceRoot, relativePath);
  return resolved;
}

export function isValidPath(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  const root = path.normalize(workspaceRoot);
  return normalized.startsWith(root);
}

export function getRelativePath(absolutePath: string): string {
  return path.relative(workspaceRoot, absolutePath);
}

export function getLanguageFromExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescript',
    '.js': 'javascript', '.jsx': 'javascript',
    '.json': 'json', '.css': 'css', '.scss': 'scss',
    '.html': 'html', '.htm': 'html',
    '.py': 'python', '.rs': 'rust', '.go': 'go',
    '.java': 'java', '.cpp': 'cpp', '.c': 'c',
    '.h': 'c', '.hpp': 'cpp',
    '.yaml': 'yaml', '.yml': 'yaml',
    '.xml': 'xml', '.sql': 'sql',
    '.md': 'markdown', '.txt': 'plaintext',
    '.sh': 'shell', '.bash': 'shell',
    '.bat': 'bat', '.ps1': 'powershell',
    '.toml': 'toml', '.ini': 'ini',
    '.env': 'plaintext', '.gitignore': 'plaintext',
  };
  return langMap[ext] || 'plaintext';
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
