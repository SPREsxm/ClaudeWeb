import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Sparkles } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

interface PromptTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

export function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const templates = useChatStore((s) => s.templates);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-btn"
        title="Prompt templates"
      >
        <Lightbulb size={15} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full right-0 mb-2 z-50 w-80 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-accent-secondary" />
                  <span className="text-xs font-medium text-white">Prompt Templates</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="icon-btn">
                  <X size={13} />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                <div className="grid grid-cols-2 gap-1">
                  {(templates.length > 0 ? templates : defaultTemplates).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        onSelectTemplate(tpl.prompt);
                        setIsOpen(false);
                      }}
                      className="text-left p-2.5 rounded-lg hover:bg-surface-700/50 transition-colors group"
                    >
                      <div className="text-[11px] font-medium text-surface-200 group-hover:text-white transition-colors">
                        {tpl.title}
                      </div>
                      <div className="text-[10px] text-surface-500 mt-0.5 line-clamp-2">
                        {tpl.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const defaultTemplates = [
  { id: 'explain', title: 'Explain Code', description: 'Get detailed code explanation', prompt: 'Please explain this code in detail.' },
  { id: 'fix', title: 'Fix Bugs', description: 'Find and fix issues', prompt: 'Find bugs and issues in this code and fix them.' },
  { id: 'refactor', title: 'Refactor', description: 'Improve code structure', prompt: 'Refactor this code for better readability and maintainability.' },
  { id: 'test', title: 'Write Tests', description: 'Generate unit tests', prompt: 'Write comprehensive unit tests for this code.' },
  { id: 'optimize', title: 'Optimize', description: 'Performance improvements', prompt: 'Optimize this code for better performance.' },
  { id: 'review', title: 'Code Review', description: 'Thorough review', prompt: 'Do a thorough code review and provide feedback.' },
];
