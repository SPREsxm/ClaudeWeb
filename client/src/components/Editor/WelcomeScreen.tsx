import { Code2, FolderOpen, FilePlus, MessageSquare, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

interface WelcomeScreenProps {
  onOpenFolder: () => void;
}

export function WelcomeScreen({ onOpenFolder }: WelcomeScreenProps) {
  const { setActiveView } = useAppStore();

  const shortcuts = [
    { keys: ['Ctrl', 'P'], desc: '快速打开文件' },
    { keys: ['Ctrl', 'S'], desc: '保存文件' },
    { keys: ['Ctrl', '`'], desc: '切换终端' },
    { keys: ['Ctrl', 'B'], desc: '切换侧边栏' },
    { keys: ['Ctrl', 'Shift', 'F'], desc: '搜索文件' },
  ];

  const handleAskClaude = () => {
    const chatInput = document.querySelector('#chat-input') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.focus();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-surface-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-primary/20">
          <Code2 size={40} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">欢迎使用 Claude Web</h1>
        <p className="text-sm text-surface-400 mb-8">
          打开项目文件夹开始编辑代码，或与 Claude 对话获取 AI 编程助手。
        </p>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <button
            onClick={onOpenFolder}
            className="card p-4 hover:border-accent-primary/30 transition-colors group cursor-pointer"
          >
            <FolderOpen size={22} className="text-surface-400 group-hover:text-accent-secondary mx-auto mb-2 transition-colors" />
            <span className="text-[11px] text-surface-400 group-hover:text-white transition-colors">打开文件夹</span>
          </button>
          <button
            onClick={onOpenFolder}
            className="card p-4 hover:border-accent-primary/30 transition-colors group cursor-pointer"
          >
            <FilePlus size={22} className="text-surface-400 group-hover:text-accent-secondary mx-auto mb-2 transition-colors" />
            <span className="text-[11px] text-surface-400 group-hover:text-white transition-colors">新建文件</span>
          </button>
          <button
            onClick={handleAskClaude}
            className="card p-4 hover:border-accent-primary/30 transition-colors group cursor-pointer"
          >
            <MessageSquare size={22} className="text-surface-400 group-hover:text-accent-secondary mx-auto mb-2 transition-colors" />
            <span className="text-[11px] text-surface-400 group-hover:text-white transition-colors">问 Claude</span>
          </button>
        </div>

        {/* Keyboard shortcuts */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Keyboard size={13} className="text-surface-400" />
            <span className="text-[11px] font-medium text-surface-400 uppercase">快捷键</span>
          </div>
          <div className="space-y-1.5">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.desc} className="flex items-center justify-between text-[11px]">
                <span className="text-surface-400">{shortcut.desc}</span>
                <div className="flex items-center gap-0.5">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      <kbd className="px-1.5 py-0.5 bg-surface-700 rounded text-surface-300 font-mono text-[10px]">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-surface-500 mx-0.5">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
