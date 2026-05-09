import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Monitor } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useState } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    theme,
    setTheme,
    workspacePath,
    setWorkspacePath,
  } = useAppStore();

  const [localFontSize, setLocalFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(2);
  const [autoSave, setAutoSave] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);

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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 top-12 bottom-4 w-80 bg-surface-850 border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/50">
              <h3 className="text-sm font-semibold text-white">Settings</h3>
              <button onClick={onClose} className="icon-btn">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-full pb-20 px-4 py-4 space-y-6">
              {/* Appearance */}
              <section>
                <h4 className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-3">
                  Appearance
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-300">Theme</span>
                    <div className="flex gap-1">
                      {(['dark', 'darker'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-colors ${
                            theme === t
                              ? 'bg-accent-primary text-white'
                              : 'bg-surface-700 text-surface-400 hover:text-white'
                          }`}
                        >
                          {t === 'dark' ? <Moon size={12} className="inline mr-1" /> : null}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Editor */}
              <section>
                <h4 className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-3">
                  Editor
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-surface-300">Font Size</span>
                      <span className="text-[10px] text-surface-500 font-mono">{localFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={localFontSize}
                      onChange={(e) => setLocalFontSize(Number(e.target.value))}
                      className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-300">Tab Size</span>
                    <select
                      value={tabSize}
                      onChange={(e) => setTabSize(Number(e.target.value))}
                      className="bg-surface-700 text-xs text-surface-300 rounded-md px-2 py-1 border border-surface-600"
                    >
                      <option value={2}>2</option>
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-300">Auto Save</span>
                    <button
                      onClick={() => setAutoSave(!autoSave)}
                      className={`w-8 h-4 rounded-full transition-colors ${
                        autoSave ? 'bg-accent-primary' : 'bg-surface-600'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          autoSave ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-300">Minimap</span>
                    <button
                      onClick={() => setShowMinimap(!showMinimap)}
                      className={`w-8 h-4 rounded-full transition-colors ${
                        showMinimap ? 'bg-accent-primary' : 'bg-surface-600'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          showMinimap ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-300">Word Wrap</span>
                    <button
                      onClick={() => setWordWrap(!wordWrap)}
                      className={`w-8 h-4 rounded-full transition-colors ${
                        wordWrap ? 'bg-accent-primary' : 'bg-surface-600'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          wordWrap ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* Workspace */}
              <section>
                <h4 className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-3">
                  Workspace
                </h4>
                <div>
                  <label className="text-[10px] text-surface-500 mb-1 block">Path</label>
                  <input
                    type="text"
                    value={workspacePath}
                    onChange={(e) => setWorkspacePath(e.target.value)}
                    placeholder="e.g. /home/user/projects/my-app"
                    className="input-field text-xs font-mono"
                  />
                </div>
              </section>

              {/* About */}
              <section>
                <h4 className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-3">
                  About
                </h4>
                <div className="text-xs text-surface-500 space-y-1">
                  <p>Claude Web v1.0.0</p>
                  <p>AI-Powered Development Interface</p>
                  <p className="text-surface-600">Built with React + TypeScript + Tailwind CSS</p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
