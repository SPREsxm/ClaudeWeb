import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, MessageSquare, Send, Trash2, Download, X,
  Terminal, RefreshCw, Clock, Loader2,
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAppStore } from '../../store/useAppStore';
import { getSocket } from '../../services/socket';
import { api } from '../../services/api';
import { MessageBubble } from './MessageBubble';
import { PromptTemplates } from './PromptTemplates';
import { StreamingIndicator } from './StreamingIndicator';
import { ChatMessage } from '../../types';

export function ChatPanel() {
  const {
    sessions,
    activeSessionId,
    isStreaming,
    addMessage,
    updateLastMessage,
    setStreaming,
    createSession,
    deleteSession,
    setActiveSession,
    getActiveSession,
  } = useChatStore();

  const { workspacePath } = useAppStore();

  const [input, setInput] = useState('');
  const [savedSessions, setSavedSessions] = useState<any[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'cli'>('chat');
  const [claudeSessions, setClaudeSessions] = useState<any[]>([]);
  const [activeCliSessions, setActiveCliSessions] = useState<any[]>([]);
  const [loadingCliSessions, setLoadingCliSessions] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeSession = getActiveSession();

  // Load saved sessions list
  useEffect(() => {
    api.listSessions().then(setSavedSessions).catch(() => {});
  }, []);

  // Auto-load Claude sessions
  useEffect(() => {
    if (viewMode === 'cli') {
      refreshClaudeSessions();
    }
  }, [viewMode]);

  // Poll active CLI sessions when in cli mode
  useEffect(() => {
    if (viewMode !== 'cli') return;
    const interval = setInterval(() => {
      api.getClaudeActiveSessions().then(setActiveCliSessions).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [viewMode]);

  useEffect(() => {
    if (!activeSessionId && sessions.length === 0) {
      createSession();
    }
  }, [activeSessionId, sessions.length, createSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  // Listen for streaming responses via WebSocket
  useEffect(() => {
    const socket = getSocket();

    socket.on('chat:chunk', (data: { content: string; full: boolean }) => {
      updateLastMessage(data.content);
      if (data.full) {
        setStreaming(false);
      }
    });

    socket.on('chat:done', (data: { content: string }) => {
      updateLastMessage(data.content);
      setStreaming(false);
    });

    socket.on('chat:error', (data: { message: string }) => {
      updateLastMessage(`Error: ${data.message}`);
      setStreaming(false);
    });

    return () => {
      socket.off('chat:chunk');
      socket.off('chat:done');
      socket.off('chat:error');
    };
  }, [updateLastMessage, setStreaming]);

  const refreshClaudeSessions = useCallback(async () => {
    setLoadingCliSessions(true);
    try {
      const [all, active] = await Promise.all([
        api.listClaudeSessions(),
        api.getClaudeActiveSessions(),
      ]);
      setClaudeSessions(all);
      setActiveCliSessions(active);
    } catch {
      // server might not be running
    } finally {
      setLoadingCliSessions(false);
    }
  }, []);

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isStreaming) return;

    setInput('');
    addMessage(message, 'user');

    // Start streaming
    setStreaming(true);
    addMessage('', 'assistant');

    try {
      const socket = getSocket();
      const history = getActiveSession()?.messages
        .filter((m: ChatMessage) => m.role !== 'system')
        .map((m: ChatMessage) => ({ role: m.role, content: m.content })) || [];

      socket.emit('chat:message', {
        message,
        history,
        sessionId: activeSessionId,
        workspacePath,
      });

      // Fallback: if WebSocket streaming doesn't work, use REST API
      setTimeout(async () => {
        if (useChatStore.getState().isStreaming) {
          try {
            const result = await api.sendMessage(message, history);
            updateLastMessage(result.response);
          } catch {
            updateLastMessage('Sorry, I encountered an error. Please try again.');
          } finally {
            setStreaming(false);
          }
        }
      }, 8000);
    } catch {
      updateLastMessage('Failed to connect. Please check if the server is running.');
      setStreaming(false);
    }
  }, [input, isStreaming, addMessage, setStreaming, updateLastMessage, getActiveSession, activeSessionId, workspacePath]);

  const handleLoadSaved = useCallback(async (id: string) => {
    try {
      const session = await api.getSession(id);
      if (session && session.messages) {
        useChatStore.getState().loadSavedSession({
          id: session.id,
          title: session.title,
          messages: session.messages,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        });
      }
    } catch {
      // session might be deleted
    }
    setShowSavedList(false);
  }, []);

  const handleDeleteSaved = useCallback(async (id: string) => {
    try {
      await api.deleteSession(id);
      setSavedSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  }, []);

  const handleLoadClaudeSession = useCallback(async (sessionId: string) => {
    setLoadingSessionId(sessionId);
    try {
      const result = await api.getClaudeSessionMessages(sessionId, workspacePath);
      if (result && result.messages.length > 0) {
        useChatStore.getState().loadSavedSession({
          id: `claude-${sessionId}`,
          title: `CLI: ${sessionId.slice(0, 8)}...`,
          messages: result.messages.map((m: any, i: number) => ({
            id: m.id || `${sessionId}-${i}`,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || Date.now(),
          })),
          createdAt: result.messages[0]?.timestamp || Date.now(),
          updatedAt: Date.now(),
        });
      }
    } catch {
      // could not load
    } finally {
      setLoadingSessionId(null);
      setViewMode('chat');
    }
  }, [workspacePath]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateSelect = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const messages = activeSession?.messages || [];
  const hasActiveCli = activeCliSessions.length > 0;

  return (
    <div className="w-[380px] bg-surface-900 border-l border-surface-700/50 flex flex-col shrink-0">
      {/* Header with view toggle */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('chat')}
            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors ${
              viewMode === 'chat'
                ? 'text-white bg-surface-700'
                : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => { setViewMode('cli'); refreshClaudeSessions(); }}
            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
              viewMode === 'cli'
                ? 'text-white bg-surface-700'
                : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            <Terminal size={11} />
            CLI
            {hasActiveCli && (
              <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Session selector */}
          {sessions.length > 1 && viewMode === 'chat' && (
            <select
              value={activeSessionId || ''}
              onChange={(e) => setActiveSession(e.target.value)}
              className="bg-surface-800 text-[10px] text-surface-400 border border-surface-700 rounded px-1 py-0.5 max-w-[120px]"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title.slice(0, 25)}
                </option>
              ))}
            </select>
          )}
          {/* Load saved sessions */}
          <button
            onClick={() => { setShowSavedList(!showSavedList); api.listSessions().then(setSavedSessions); }}
            className="icon-btn text-surface-400 hover:text-white"
            title="Load saved session"
          >
            <Download size={13} />
          </button>
          {activeSession && messages.length > 0 && viewMode === 'chat' && (
            <button
              onClick={() => deleteSession(activeSession.id)}
              className="icon-btn text-terminal-red/60 hover:text-terminal-red"
              title="Clear chat"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button onClick={() => createSession()} className="icon-btn" title="New chat">
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Saved sessions list */}
      {showSavedList && viewMode === 'chat' && (
        <div className="border-b border-surface-700/50 bg-surface-950/50 p-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-surface-500 uppercase tracking-wider">Saved Sessions</span>
            <button
              onClick={() => setShowSavedList(false)}
              className="icon-btn text-surface-500 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
          {savedSessions.length === 0 ? (
            <p className="text-[10px] text-surface-600 text-center py-2">No saved sessions</p>
          ) : (
            savedSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-surface-800/50 cursor-pointer group"
                onClick={() => handleLoadSaved(s.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-surface-300 truncate">{s.title}</p>
                  <p className="text-[9px] text-surface-600">
                    {new Date(s.updatedAt).toLocaleDateString()} · {s.messageCount} msgs
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSaved(s.id); }}
                  className="icon-btn text-terminal-red/40 hover:text-terminal-red opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete saved session"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Claude CLI Sessions */}
      {viewMode === 'cli' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Active session indicator */}
          {hasActiveCli && (
            <div className="mx-2 mt-2 p-2 bg-terminal-green/10 border border-terminal-green/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
                <span className="text-[10px] text-terminal-green font-medium uppercase tracking-wider">
                  Active CLI Session
                </span>
              </div>
              <p className="text-[10px] text-surface-400">
                A Claude Code session is currently running. Load it to continue.
              </p>
              <button
                onClick={() => handleLoadClaudeSession(activeCliSessions[0].sessionId)}
                disabled={loadingSessionId === activeCliSessions[0].sessionId}
                className="mt-1.5 text-[10px] bg-terminal-green/20 hover:bg-terminal-green/30 text-terminal-green px-2 py-1 rounded transition-colors w-full disabled:opacity-50"
              >
                {loadingSessionId === activeCliSessions[0].sessionId ? (
                  <span className="flex items-center justify-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> Loading...
                  </span>
                ) : (
                  `View Session ${activeCliSessions[0].sessionId.slice(0, 8)}...`
                )}
              </button>
            </div>
          )}

          {/* Session list header */}
          <div className="flex items-center justify-between px-3 py-2 mt-1">
            <span className="text-[10px] text-surface-500 uppercase tracking-wider">
              All Claude Sessions
            </span>
            <button
              onClick={refreshClaudeSessions}
              disabled={loadingCliSessions}
              className="icon-btn text-surface-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw size={11} className={loadingCliSessions ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {loadingCliSessions && claudeSessions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="text-surface-500 animate-spin" />
              </div>
            ) : claudeSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Terminal size={24} className="text-surface-600 mb-2" />
                <p className="text-[11px] text-surface-500 mb-1">No Claude CLI sessions found</p>
                <p className="text-[10px] text-surface-600">
                  Run Claude Code from the terminal to create sessions. They will appear here automatically.
                </p>
              </div>
            ) : (
              claudeSessions.map((s) => (
                <div
                  key={s.sessionId}
                  onClick={() => handleLoadClaudeSession(s.sessionId)}
                  className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-surface-800/50 cursor-pointer group mb-0.5"
                >
                  <div className="shrink-0 mt-0.5">
                    {activeCliSessions.some((a: any) => a.sessionId === s.sessionId) ? (
                      <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse block" />
                    ) : (
                      <Clock size={11} className="text-surface-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-surface-300 truncate leading-relaxed">
                      {s.lastPrompt || '(empty session)'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-surface-600">
                        {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[9px] text-surface-600">{s.messageCount} msgs</span>
                      <span className="text-[9px] text-surface-700 font-mono">{s.sessionId.slice(0, 8)}</span>
                    </div>
                  </div>
                  {loadingSessionId === s.sessionId && (
                    <Loader2 size={12} className="text-accent-primary animate-spin shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Back to chat button */}
          <div className="p-2 border-t border-surface-700/50">
            <button
              onClick={() => setViewMode('chat')}
              className="w-full text-[11px] text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-lg py-1.5 transition-colors"
            >
              Back to Chat
            </button>
          </div>
        </div>
      )}

      {/* Chat messages */}
      {viewMode === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto py-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <MessageSquare size={28} className="text-surface-600 mb-3" />
                <p className="text-xs text-surface-500 mb-1">Start a conversation</p>
                <p className="text-[10px] text-surface-600">
                  Ask Claude to explain, fix, or improve your code
                </p>
                <div className="mt-4 space-y-1.5 w-full">
                  {[
                    'Explain what this code does',
                    'How can I improve this function?',
                    'Find potential bugs here',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="w-full text-left text-[11px] text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700/50 rounded-lg px-3 py-2 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isStreaming && <StreamingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-surface-700/50">
            <div className="flex items-end gap-1.5 bg-surface-800 rounded-xl border border-surface-700 focus-within:border-accent-primary/50 transition-colors p-1.5">
              <PromptTemplates onSelectTemplate={handleTemplateSelect} />
              <textarea
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Claude..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-surface-500 resize-none outline-none py-0.5 max-h-32"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="icon-btn text-accent-primary hover:text-accent-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
