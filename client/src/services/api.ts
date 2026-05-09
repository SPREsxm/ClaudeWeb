const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Files
  listFiles: (path: string = '') =>
    request<any[]>(`/files/list?path=${encodeURIComponent(path)}`),
  readFile: (path: string) =>
    request<{ content: string; language: string }>(`/files/read?path=${encodeURIComponent(path)}`),
  writeFile: (path: string, content: string) =>
    request('/files/write', { method: 'POST', body: JSON.stringify({ path, content }) }),
  deleteFile: (path: string) =>
    request(`/files/delete?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),

  // Chat
  sendMessage: (message: string, history?: any[]) =>
    request<{ response: string }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
  getTemplates: () => request<any[]>('/chat/templates'),

  // Commands
  executeCommand: (command: string, cwd?: string) =>
    request<any>('/command/execute', {
      method: 'POST',
      body: JSON.stringify({ command, cwd }),
    }),
  getCommandHistory: () => request<any[]>('/command/history'),

  // Git
  getGitStatus: (path: string = '') =>
    request<any>(`/git/status?path=${encodeURIComponent(path)}`),

  // Workspace
  setWorkspace: (path: string) =>
    request<{ success: boolean; workspacePath: string; files: any[] }>('/workspace/set', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  getWorkspaceInfo: () =>
    request<{ root: string; fileCount: number; platform: string }>('/workspace/info'),

  // Sessions
  listSessions: (workspace?: string) => {
    const qs = workspace ? `?workspace=${encodeURIComponent(workspace)}` : '';
    return request<any[]>(`/sessions${qs}`);
  },
  getSession: (id: string, workspace?: string) => {
    const qs = workspace ? `?workspace=${encodeURIComponent(workspace)}` : '';
    return request<any>(`/sessions/${id}${qs}`);
  },
  deleteSession: (id: string, workspace?: string) => {
    const qs = workspace ? `?workspace=${encodeURIComponent(workspace)}` : '';
    return request<any>(`/sessions/${id}${qs}`, { method: 'DELETE' });
  },

  // Claude CLI sessions
  listClaudeSessions: () => request<any[]>('/claude-sessions'),
  getClaudeActiveSessions: () => request<any[]>('/claude-sessions/active'),
  getClaudeSessionMessages: (sessionId: string, project?: string) => {
    const qs = project ? `?project=${encodeURIComponent(project)}` : '';
    return request<{ sessionId: string; messages: any[] }>(
      `/claude-sessions/${sessionId}/messages${qs}`,
    );
  },

  // Health
  checkHealth: () => request<{ status: string }>('/health'),
};
