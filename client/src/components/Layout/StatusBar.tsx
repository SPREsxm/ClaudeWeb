import { Wifi, WifiOff, GitBranch, MapPin } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function StatusBar() {
  const { isConnected, gitStatus, workspacePath, cursorPosition } = useAppStore();

  return (
    <div className="h-6 bg-surface-900 border-t border-surface-700/50 flex items-center px-3 text-[11px] text-surface-400 select-none shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {isConnected ? (
            <>
              <Wifi size={11} className="text-terminal-green" />
              <span className="text-terminal-green">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={11} className="text-terminal-red" />
              <span className="text-terminal-red">Disconnected</span>
            </>
          )}
        </div>
        {workspacePath && (
          <div className="flex items-center gap-1">
            <MapPin size={11} />
            <span className="font-mono">{workspacePath}</span>
          </div>
        )}
      </div>

      {/* Center */}
      <div className="flex-1 flex items-center justify-center">
        {gitStatus && (
          <div className="flex items-center gap-2">
            <GitBranch size={11} />
            <span className="font-mono">{gitStatus.branch}</span>
            {gitStatus.changes.length > 0 && (
              <span>
                {gitStatus.changes.length} change{gitStatus.changes.length !== 1 ? 's' : ''}
              </span>
            )}
            {gitStatus.ahead > 0 && <span>↑{gitStatus.ahead}</span>}
            {gitStatus.behind > 0 && <span>↓{gitStatus.behind}</span>}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span className="font-mono tabular-nums">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
      </div>
    </div>
  );
}
