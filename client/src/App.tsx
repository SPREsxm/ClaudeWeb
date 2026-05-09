import { useEffect, useState, useCallback } from 'react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { FileTreePanel } from './components/FileTree/FileTreePanel';
import { EditorPanel } from './components/Editor/EditorPanel';
import { ChatPanel } from './components/Chat/ChatPanel';
import { TerminalPanel } from './components/Terminal/TerminalPanel';
import { StatusBar } from './components/Layout/StatusBar';
import { OpenFolderModal } from './components/common/OpenFolderModal';
import { getSocket } from './services/socket';
import { useAppStore } from './store/useAppStore';
import { api } from './services/api';
import { useChatStore } from './store/useChatStore';

export default function App() {
  const { sidebarVisible, setConnected, setWorkspacePath, setGitStatus, workspacePath } = useAppStore();
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  // Initialize connection and load workspace info
  useEffect(() => {
    const socket = getSocket();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Check health
    api.checkHealth().catch(console.error);

    // Load prompt templates
    api
      .getTemplates()
      .then((templates) => {
        useChatStore.getState().setTemplates(templates);
      })
      .catch(console.error);

    // Load workspace info from backend
    api
      .getWorkspaceInfo()
      .then((info) => {
        if (info.root) {
          setWorkspacePath(info.root);
        }
      })
      .catch(() => {
        // Workspace not configured yet, that's fine
      });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [setConnected, setWorkspacePath]);

  // Refresh git status when workspace changes
  useEffect(() => {
    if (workspacePath) {
      api
        .getGitStatus()
        .then((status) => setGitStatus(status))
        .catch(() => setGitStatus(null));
    }
  }, [workspacePath, setGitStatus]);

  const handleOpenFolder = useCallback(() => {
    setFolderModalOpen(true);
  }, []);

  const handleWorkspaceSet = useCallback(() => {
    // Refresh git status after workspace is set
    api
      .getGitStatus()
      .then((status) => setGitStatus(status))
      .catch(() => setGitStatus(null));
  }, [setGitStatus]);

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      <Toolbar onOpenFolder={handleOpenFolder} />
      <div className="flex-1 flex overflow-hidden">
        {sidebarVisible && <FileTreePanel />}
        <EditorPanel onOpenFolder={handleOpenFolder} />
        <ChatPanel />
      </div>
      <TerminalPanel />
      <StatusBar />

      {/* Open Folder Modal */}
      <OpenFolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onWorkspaceSet={handleWorkspaceSet}
      />
    </div>
  );
}
