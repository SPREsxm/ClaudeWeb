import { useMemo } from 'react';
import { ArrowLeft, FileCode } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface DiffViewProps {
  originalContent: string;
  modifiedContent: string;
  fileName: string;
  language: string;
}

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

export function DiffView({ originalContent, modifiedContent, fileName, language }: DiffViewProps) {
  const setActiveView = useAppStore((s) => s.setActiveView);

  const diffLines = useMemo(() => {
    const oldLines = originalContent.split('\n');
    const newLines = modifiedContent.split('\n');
    const result: DiffLine[] = [];

    // Simple LCS-based diff
    const lcs: number[][] = Array(oldLines.length + 1)
      .fill(null)
      .map(() => Array(newLines.length + 1).fill(0));

    for (let i = 1; i <= oldLines.length; i++) {
      for (let j = 1; j <= newLines.length; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          lcs[i][j] = lcs[i - 1][j - 1] + 1;
        } else {
          lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
        }
      }
    }

    // Backtrack
    let i = oldLines.length;
    let j = newLines.length;
    const rawDiff: Array<{
      type: 'unchanged' | 'added' | 'removed';
      oldLine?: string;
      newLine?: string;
      oldIdx?: number;
      newIdx?: number;
    }> = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        rawDiff.unshift({ type: 'unchanged', oldLine: oldLines[i - 1], newLine: newLines[j - 1], oldIdx: i, newIdx: j });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
        rawDiff.unshift({ type: 'added', newLine: newLines[j - 1], newIdx: j });
        j--;
      } else {
        rawDiff.unshift({ type: 'removed', oldLine: oldLines[i - 1], oldIdx: i });
        i--;
      }
    }

    let oldLineNum = 0;
    let newLineNum = 0;
    for (const item of rawDiff) {
      if (item.type === 'unchanged') {
        oldLineNum++;
        newLineNum++;
        result.push({ type: 'unchanged', content: item.oldLine!, oldLineNum, newLineNum });
      } else if (item.type === 'removed') {
        oldLineNum++;
        result.push({ type: 'removed', content: item.oldLine!, oldLineNum });
      } else {
        newLineNum++;
        result.push({ type: 'added', content: item.newLine!, newLineNum });
      }
    }

    return result;
  }, [originalContent, modifiedContent]);

  const addedLines = diffLines.filter((l) => l.type === 'added').length;
  const removedLines = diffLines.filter((l) => l.type === 'removed').length;

  return (
    <div className="flex-1 flex flex-col bg-surface-950">
      {/* Header */}
      <div className="h-9 bg-surface-900 border-b border-surface-700/50 flex items-center px-3 gap-3 shrink-0">
        <button
          onClick={() => setActiveView('editor')}
          className="icon-btn"
          title="Back to editor"
        >
          <ArrowLeft size={15} />
        </button>
        <FileCode size={14} className="text-surface-400" />
        <span className="text-xs text-white font-mono">{fileName}</span>
        <span className="text-[10px] text-surface-400 uppercase">{language}</span>
        <div className="flex items-center gap-2 ml-auto text-[10px]">
          <span className="text-terminal-green">+{addedLines}</span>
          <span className="text-terminal-red">-{removedLines}</span>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto font-mono text-xs leading-5">
        <div className="flex">
          {/* Left side (original) */}
          <div className="flex-1 border-r border-surface-700/30">
            {diffLines.map((line, i) => (
              <div
                key={i}
                className={`flex ${
                  line.type === 'added'
                    ? 'bg-transparent'
                    : line.type === 'removed'
                    ? 'bg-red-900/20'
                    : ''
                }`}
              >
                <span className="w-10 text-right pr-3 text-surface-500 select-none shrink-0 py-px">
                  {line.oldLineNum || ''}
                </span>
                <span
                  className={`flex-1 whitespace-pre py-px ${
                    line.type === 'removed' ? 'text-red-300' : line.type === 'unchanged' ? 'text-surface-300' : 'text-transparent'
                  }`}
                >
                  {line.type === 'removed' || line.type === 'unchanged' ? line.content : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Right side (modified) */}
          <div className="flex-1">
            {diffLines.map((line, i) => (
              <div
                key={i}
                className={`flex ${
                  line.type === 'added'
                    ? 'bg-green-900/20'
                    : line.type === 'removed'
                    ? 'bg-transparent'
                    : ''
                }`}
              >
                <span className="w-10 text-right pr-3 text-surface-500 select-none shrink-0 py-px">
                  {line.newLineNum || ''}
                </span>
                <span
                  className={`flex-1 whitespace-pre py-px ${
                    line.type === 'added' ? 'text-green-300' : line.type === 'unchanged' ? 'text-surface-300' : 'text-transparent'
                  }`}
                >
                  {line.type === 'added' || line.type === 'unchanged' ? line.content : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
