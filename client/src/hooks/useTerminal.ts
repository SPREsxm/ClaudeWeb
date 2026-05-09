import { useState, useCallback, useRef, useEffect } from 'react';
import { getSocket } from '../services/socket';
import { api } from '../services/api';

export interface TerminalOutput {
  data: string;
  type: 'stdout' | 'stderr' | 'info' | 'warning';
  timestamp: number;
}

export function useTerminal() {
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on('terminal:output', (data: TerminalOutput) => {
      setOutputs((prev) => [...prev, { ...data, timestamp: Date.now() }]);
    });

    socket.on('terminal:done', () => {
      setIsRunning(false);
    });

    return () => {
      socket.off('terminal:output');
      socket.off('terminal:done');
    };
  }, []);

  useEffect(() => {
    outputsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs]);

  const executeCommand = useCallback(
    async (command: string) => {
      if (!command.trim()) return;

      setCommandHistory((prev) => [command, ...prev].slice(0, 100));
      setHistoryIndex(-1);
      setIsRunning(true);

      try {
        await api.executeCommand(command);
        setOutputs((prev) => [
          ...prev,
          {
            data: `$ ${command}`,
            type: 'info',
            timestamp: Date.now(),
          },
        ]);

        // Also emit via WebSocket for real-time output
        const socket = getSocket();
        socket.emit('terminal:command', { command });
      } catch (err: any) {
        setOutputs((prev) => [
          ...prev,
          {
            data: `$ ${command}`,
            type: 'info',
            timestamp: Date.now(),
          },
          {
            data: err.message || 'Command execution failed',
            type: 'stderr',
            timestamp: Date.now(),
          },
        ]);
        setIsRunning(false);
      }
    },
    [],
  );

  const navigateHistory = useCallback(
    (direction: 'up' | 'down') => {
      setHistoryIndex((prev) => {
        if (direction === 'up') {
          const next = prev + 1;
          return next < commandHistory.length ? next : prev;
        } else {
          const next = prev - 1;
          return next >= -1 ? next : prev;
        }
      });
    },
    [commandHistory.length],
  );

  const getHistoryCommand = useCallback(() => {
    if (historyIndex >= 0 && historyIndex < commandHistory.length) {
      return commandHistory[historyIndex];
    }
    return '';
  }, [historyIndex, commandHistory]);

  const clearOutputs = useCallback(() => {
    setOutputs([]);
  }, []);

  return {
    outputs,
    isRunning,
    executeCommand,
    clearOutputs,
    navigateHistory,
    getHistoryCommand,
    outputsEndRef,
  };
}
