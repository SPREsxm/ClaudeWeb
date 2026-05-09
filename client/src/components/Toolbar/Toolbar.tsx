import { Code2, Folder, GitBranch, Wifi, WifiOff, Settings, PanelLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useEditorStore } from '../../store/useEditorStore';
import { useState } from 'react';
import { SettingsPanel } from '../Settings/SettingsPanel';

interface ToolbarProps {
  onOpenFolder: () => void;
}

export function Toolbar({ onOpenFolder }: ToolbarProps) {
  const { isConnected, gitStatus, sidebarVisible, toggleSidebar, workspacePath } = useAppStore();
  const tabs = useEditorStore((s) => s.tabs);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="h-11 bg-surface-900 border-b border-surface-700/50 flex items-center px-2 gap-1 select-none shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <Code2 size={15} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Claude Web</span>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className={`icon-btn ${sidebarVisible ? 'icon-btn-active' : ''}`}
          title="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </button>

        {/* Tab bar */}
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto ml-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${tab.isActive ? 'tab-active' : 'tab-inactive'} whitespace-nowrap`}
            >
              <span className="text-[10px] uppercase opacity-60">
                {tab.language.slice(0, 3)}
              </span>
              <span className="max-w-[140px] truncate">{tab.name}</span>
              {tab.isDirty && (
                <span className="w-2 h-2 rounded-full bg-accent-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Git branch */}
          {gitStatus && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs text-surface-400">
              <GitBranch size={13} />
              <span className="font-mono">{gitStatus.branch}</span>
              {gitStatus.changes.length > 0 && (
                <span className="bg-accent-primary/20 text-accent-secondary px-1.5 py-0.5 rounded text-[10px] font-medium">
                  {gitStatus.changes.length}
                </span>
              )}
            </div>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1 px-2 text-xs text-surface-400">
            {isConnected ? (
              <Wifi size={13} className="text-terminal-green" />
            ) : (
              <WifiOff size={13} className="text-terminal-red" />
            )}
          </div>

          {/* Workspace path */}
          <button
            onClick={onOpenFolder}
            className="flex items-center gap-1 px-2 py-1 text-xs text-surface-400 bg-surface-800 rounded-md hover:bg-surface-700 hover:text-white transition-colors"
            title="打开项目文件夹"
          >
            <Folder size={12} />
            <span className="font-mono max-w-[120px] truncate">
              {workspacePath || '打开文件夹'}
            </span>
          </button>

          {/* Settings */}
          <button onClick={() => setSettingsOpen(true)} className="icon-btn" title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
