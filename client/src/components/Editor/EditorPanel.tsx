import { useCallback } from 'react';
import { X, PanelRight } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import { useEditorStore } from '../../store/useEditorStore';
import { useAppStore } from '../../store/useAppStore';
import { WelcomeScreen } from './WelcomeScreen';
import { api } from '../../services/api';

interface EditorPanelProps {
  onOpenFolder: () => void;
}

export function EditorPanel({ onOpenFolder }: EditorPanelProps) {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTab = useEditorStore((s) => s.getActiveTab());
  const updateTabContent = useEditorStore((s) => s.updateTabContent);
  const closeTab = useEditorStore((s) => s.closeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const markTabClean = useEditorStore((s) => s.markTabClean);
  const setCursorPosition = useAppStore((s) => s.setCursorPosition);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTab && value !== undefined) {
        updateTabContent(activeTab.id, value);
      }
    },
    [activeTab, updateTabContent],
  );

  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    try {
      await api.writeFile(activeTab.path, activeTab.content);
      markTabClean(activeTab.id);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  }, [activeTab, markTabClean]);

  const handleEditorMount = useCallback(
    (editor: any, monaco: any) => {
      editor.onDidChangeCursorPosition((e: any) => {
        setCursorPosition({
          line: e.position.lineNumber || 1,
          column: e.position.column || 1,
        });
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
    },
    [setCursorPosition, handleSave],
  );

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-surface-950">
        <div className="h-9 bg-surface-900 border-b border-surface-700/50 flex items-center px-2 shrink-0" />
        <WelcomeScreen onOpenFolder={onOpenFolder} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-950 min-w-0">
      {/* Tab bar */}
      <div className="h-9 bg-surface-900 border-b border-surface-700/50 flex items-center overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1.5 h-full px-3 border-r border-surface-700/30 cursor-pointer
              transition-colors duration-100 min-w-0 select-none
              ${tab.isActive ? 'bg-surface-950 text-white border-t-2 border-t-accent-primary border-b-transparent -mb-px' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'}
            `}
          >
            <span className="text-[10px] uppercase opacity-50 font-mono shrink-0">
              {tab.language.slice(0, 3)}
            </span>
            <span className="text-xs truncate max-w-[120px]">{tab.name}</span>
            {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="ml-1 p-0.5 rounded hover:bg-surface-600/50 transition-colors shrink-0"
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <MonacoEditor
          key={activeTab?.id}
          height="100%"
          language={activeTab?.language || 'plaintext'}
          value={activeTab?.content || ''}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            tabSize: 2,
            insertSpaces: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 8 },
            guides: { indentation: true, bracketPairs: true },
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-surface-950">
              <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            </div>
          }
        />
      </div>

      {/* Bottom bar */}
      <div className="h-6 bg-surface-900 border-t border-surface-700/50 flex items-center px-3 gap-4 text-[10px] text-surface-500 font-mono shrink-0">
        {activeTab && (
          <>
            <span>{activeTab.language}</span>
            <span>UTF-8</span>
            <span>Spaces: 2</span>
            {activeTab.isDirty && <span className="text-terminal-yellow">Unsaved</span>}
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSave}
            className="text-surface-400 hover:text-white transition-colors"
            disabled={!activeTab?.isDirty}
          >
            Ctrl+S to save
          </button>
        </div>
      </div>
    </div>
  );
}
