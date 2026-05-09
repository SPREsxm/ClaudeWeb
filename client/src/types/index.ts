export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
  children?: FileNode[];
  expanded?: boolean;
}

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent?: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  timestamp: number;
  cwd: string;
}

export interface GitStatus {
  branch: string;
  changes: Array<{ file: string; status: string }>;
  ahead: number;
  behind: number;
  isRepo: boolean;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export type PanelPosition = 'left' | 'right' | 'bottom';

export interface PanelSize {
  fileTree: number;
  chat: number;
  terminal: number;
}

export type Theme = 'dark' | 'darker';
