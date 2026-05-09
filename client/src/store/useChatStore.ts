import { create } from 'zustand';
import { ChatMessage, ChatSession, PromptTemplate } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 15);

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isStreaming: boolean;
  templates: PromptTemplate[];
  setTemplates: (templates: PromptTemplate[]) => void;
  createSession: () => string;
  loadSavedSession: (session: ChatSession) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  addMessage: (content: string, role: 'user' | 'assistant') => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  getActiveSession: () => ChatSession | undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isStreaming: false,
  templates: [],
  setTemplates: (templates) => set({ templates }),
  createSession: () => {
    const id = generateId();
    const session: ChatSession = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({ sessions: [...s.sessions, session], activeSessionId: id }));
    return id;
  },
  loadSavedSession: (session) => {
    set((s) => {
      // Replace session if same ID exists, otherwise add it
      const existing = s.sessions.findIndex((ses) => ses.id === session.id);
      let sessions: ChatSession[];
      if (existing >= 0) {
        sessions = [...s.sessions];
        sessions[existing] = session;
      } else {
        sessions = [...s.sessions, session];
      }
      return { sessions, activeSessionId: session.id };
    });
  },
  deleteSession: (id) => {
    set((s) => {
      const sessions = s.sessions.filter((ses) => ses.id !== id);
      const activeSessionId =
        s.activeSessionId === id ? (sessions[0]?.id ?? null) : s.activeSessionId;
      return { sessions, activeSessionId };
    });
  },
  setActiveSession: (id) => set({ activeSessionId: id }),
  addMessage: (content, role) => {
    const sessionId = get().activeSessionId || get().createSession();
    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
    };
    set((s) => ({
      sessions: s.sessions.map((ses) =>
        ses.id === sessionId
          ? {
              ...ses,
              messages: [...ses.messages, message],
              updatedAt: Date.now(),
              title:
                ses.messages.length === 0
                  ? content.slice(0, 40)
                  : ses.title,
            }
          : ses,
      ),
    }));
  },
  updateLastMessage: (content) => {
    set((s) => ({
      sessions: s.sessions.map((ses) => {
        if (ses.id !== s.activeSessionId) return ses;
        const messages = [...ses.messages];
        if (
          messages.length > 0 &&
          messages[messages.length - 1].role === 'assistant'
        ) {
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content,
            isStreaming: false,
          };
        }
        return { ...ses, messages, updatedAt: Date.now() };
      }),
    }));
  },
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId);
  },
}));
