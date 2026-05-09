import { create } from 'zustand';
import { GitStatus, PanelSize, Theme } from '../types';

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  sidebarVisible: boolean;
  toggleSidebar: () => void;
  panelSizes: PanelSize;
  setPanelSize: (key: keyof PanelSize, size: number) => void;
  workspacePath: string;
  setWorkspacePath: (path: string) => void;
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  isExecuting: boolean;
  setExecuting: (executing: boolean) => void;
  gitStatus: GitStatus | null;
  setGitStatus: (status: GitStatus | null) => void;
  activeView: 'editor' | 'diff';
  setActiveView: (view: 'editor' | 'diff') => void;
  commandHistory: string[];
  addToCommandHistory: (cmd: string) => void;
  cursorPosition: { line: number; column: number };
  setCursorPosition: (pos: { line: number; column: number }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  sidebarVisible: true,
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  panelSizes: { fileTree: 260, chat: 380, terminal: 250 },
  setPanelSize: (key, size) =>
    set((s) => ({ panelSizes: { ...s.panelSizes, [key]: size } })),
  workspacePath: '',
  setWorkspacePath: (path) => set({ workspacePath: path }),
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),
  isExecuting: false,
  setExecuting: (executing) => set({ isExecuting: executing }),
  gitStatus: null,
  setGitStatus: (status) => set({ gitStatus: status }),
  activeView: 'editor',
  setActiveView: (view) => set({ activeView: view }),
  commandHistory: [],
  addToCommandHistory: (cmd) =>
    set((s) => ({ commandHistory: [cmd, ...s.commandHistory].slice(0, 50) })),
  cursorPosition: { line: 1, column: 1 },
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
}));
