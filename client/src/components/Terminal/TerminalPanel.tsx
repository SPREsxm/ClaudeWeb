import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronUp, Trash2, Loader2 } from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';

export function TerminalPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [command, setCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { outputs, isRunning, executeCommand, clearOutputs, navigateHistory, getHistoryCommand } = useTerminal();

  const handleExecute = useCallback(() => {
    if (!command.trim() || isRunning) return;
    executeCommand(command);
    setCommand('');
  }, [command, isRunning, executeCommand]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
      const histCmd = getHistoryCommand();
      if (histCmd) setCommand(histCmd);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
      const histCmd = getHistoryCommand();
      setCommand(histCmd || '');
    }
  };

  return (
    <div className="bg-surface-900 border-t border-surface-700/50 shrink-0">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-surface-800/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-surface-400" />
          <span className="text-[11px] font-medium text-surface-400 uppercase tracking-wider">
            Terminal
          </span>
          {isRunning && <Loader2 size={12} className="text-accent-primary animate-spin" />}
        </div>
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={clearOutputs} className="icon-btn" title="Clear terminal">
            <Trash2 size={12} />
          </button>
          <button className="icon-btn" title={isCollapsed ? 'Expand' : 'Collapse'}>
            <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronUp size={14} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="h-[200px] flex flex-col">
              {/* Output */}
              <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed bg-surface-950/50">
                {outputs.length === 0 && (
                  <div className="text-surface-500 py-1">
                    Terminal ready. Type a command to execute.
                  </div>
                )}
                {outputs.map((output, i) => (
                  <div key={i} className="whitespace-pre-wrap break-all">
                    {output.type === 'info' && (
                      <span className="text-terminal-green">$ {output.data.replace('$ ', '')}</span>
                    )}
                    {output.type === 'stdout' && (
                      <span className="text-surface-300">{output.data}</span>
                    )}
                    {output.type === 'stderr' && (
                      <span className="text-terminal-red">{output.data}</span>
                    )}
                    {output.type === 'warning' && (
                      <span className="text-terminal-yellow">{output.data}</span>
                    )}
                  </div>
                ))}
                {isRunning && (
                  <div className="flex items-center gap-1 text-surface-400 animate-pulse">
                    <span>▊</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-t border-surface-700/50 bg-surface-900">
                <span className="text-terminal-green font-mono text-xs">$</span>
                <input
                  ref={inputRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter command..."
                  disabled={isRunning}
                  className="flex-1 bg-transparent text-white font-mono text-xs outline-none placeholder-surface-600 disabled:opacity-50"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
