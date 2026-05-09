import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

interface OpenFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceSet: () => void;
}

export function OpenFolderModal({ isOpen, onClose, onWorkspaceSet }: OpenFolderModalProps) {
  const [folderPath, setFolderPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setWorkspacePath } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      setFolderPath('');
      setError(null);
      setSuccess(false);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleOpen = async () => {
    const trimmed = folderPath.trim();
    if (!trimmed) {
      setError('请输入文件夹路径');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.setWorkspace(trimmed);
      setWorkspacePath(result.workspacePath);
      setSuccess(true);
      setTimeout(() => {
        onWorkspaceSet();
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || '无法打开该文件夹，请检查路径是否正确');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOpen();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg mx-4 bg-surface-850 border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700/50">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-accent-secondary" />
                <h3 className="text-sm font-semibold text-white">打开项目文件夹</h3>
              </div>
              <button onClick={onClose} className="icon-btn" disabled={loading}>
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-2 block">
                  文件夹路径
                </label>
                <div className="relative">
                  <FolderOpen
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={folderPath}
                    onChange={(e) => {
                      setFolderPath(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="C:\Users\Alienware\OneDrive\桌面\PROJECT"
                    className="input-field pl-9 font-mono text-xs"
                    disabled={loading}
                  />
                </div>
                <p className="text-[10px] text-surface-600 mt-1.5">
                  请输入本地项目文件夹的绝对路径，例如 C:\Users\...\my-project
                </p>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-800/30 rounded-lg"
                >
                  <AlertCircle size={14} className="text-terminal-red shrink-0" />
                  <span className="text-xs text-red-300">{error}</span>
                </motion.div>
              )}

              {/* Success */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-800/30 rounded-lg"
                >
                  <CheckCircle2 size={14} className="text-terminal-green shrink-0" />
                  <span className="text-xs text-green-300">文件夹已打开，正在加载文件...</span>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-surface-700/50 bg-surface-900/50">
              <button onClick={onClose} className="btn-secondary" disabled={loading}>
                取消
              </button>
              <button
                onClick={handleOpen}
                className="btn-primary flex items-center gap-2"
                disabled={loading || !folderPath.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    正在打开...
                  </>
                ) : (
                  <>
                    <FolderOpen size={14} />
                    打开文件夹
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
