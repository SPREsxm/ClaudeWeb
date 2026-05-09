import { RefreshCw, Plus, FolderOpen } from 'lucide-react';
import { useFileTree } from '../../hooks/useFileTree';
import { FileTreeNode } from './FileTreeNode';

export function FileTreePanel() {
  const { files, loading, error, toggleExpand, refreshFiles } = useFileTree();

  return (
    <div className="w-[260px] bg-surface-900 border-r border-surface-700/50 flex flex-col shrink-0">
      <div className="panel-header">
        <span>Explorer</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => refreshFiles()} className="icon-btn" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="icon-btn" title="New File">
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {loading && files.length === 0 && (
          <div className="px-3 py-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 animate-pulse">
                <div className="w-3 h-3 bg-surface-700 rounded" />
                <div className="h-3 bg-surface-700 rounded flex-1" style={{ width: `${60 + Math.random() * 40}%` }} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="px-3 py-4 text-center">
            <div className="text-terminal-red text-xs mb-2">{error}</div>
            <button onClick={() => refreshFiles()} className="btn-secondary text-xs">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="px-3 py-8 text-center">
            <FolderOpen size={24} className="text-surface-500 mx-auto mb-2" />
            <p className="text-xs text-surface-500">No files found</p>
            <p className="text-[10px] text-surface-600 mt-1">Open a workspace to get started</p>
          </div>
        )}

        {files.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            depth={0}
            onToggle={toggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
