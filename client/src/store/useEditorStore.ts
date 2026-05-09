import { create } from 'zustand';
import { EditorTab } from '../types';

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    json: 'json', css: 'css', scss: 'scss',
    html: 'html', htm: 'html',
    py: 'python', rs: 'rust', go: 'go',
    java: 'java', cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp',
    yaml: 'yaml', yml: 'yaml',
    xml: 'xml', sql: 'sql',
    md: 'markdown', txt: 'plaintext',
    sh: 'shell', bash: 'shell',
    bat: 'bat', ps1: 'powershell',
    toml: 'toml',
  };
  return langMap[ext] || 'plaintext';
}

interface EditorState {
  tabs: EditorTab[];
  openFile: (filePath: string, name: string, content: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabClean: (id: string) => void;
  updateTabOriginalContent: (id: string, originalContent: string) => void;
  getActiveTab: () => EditorTab | undefined;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  openFile: (filePath, name, content) => {
    const id = filePath;
    const existing = get().tabs.find((t) => t.id === id);
    if (existing) {
      set((s) => ({
        tabs: s.tabs.map((t) => ({ ...t, isActive: t.id === id })),
      }));
      return;
    }
    const newTab: EditorTab = {
      id,
      path: filePath,
      name,
      content,
      originalContent: content,
      language: getLanguage(filePath),
      isDirty: false,
      isActive: true,
    };
    set((s) => ({
      tabs: [...s.tabs.map((t) => ({ ...t, isActive: false })), newTab],
    }));
  },
  closeTab: (id) => {
    set((s) => {
      const remaining = s.tabs.filter((t) => t.id !== id);
      if (remaining.length > 0 && !remaining.some((t) => t.isActive)) {
        remaining[remaining.length - 1].isActive = true;
      }
      return { tabs: remaining };
    });
  },
  setActiveTab: (id) => {
    set((s) => ({
      tabs: s.tabs.map((t) => ({ ...t, isActive: t.id === id })),
    }));
  },
  updateTabContent: (id, content) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? { ...t, content, isDirty: content !== t.originalContent }
          : t,
      ),
    }));
  },
  markTabClean: (id) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? { ...t, isDirty: false, originalContent: t.content }
          : t,
      ),
    }));
  },
  updateTabOriginalContent: (id, originalContent) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? { ...t, originalContent, isDirty: t.content !== originalContent }
          : t,
      ),
    }));
  },
  getActiveTab: () => get().tabs.find((t) => t.isActive),
}));
