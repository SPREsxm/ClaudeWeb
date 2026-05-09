import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { FileNode } from '../types';

export function useFileTree() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspacePath = useAppStore((s) => s.workspacePath);
  const prevWorkspacePath = useRef(workspacePath);

  const loadFiles = useCallback(async (dirPath: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listFiles(dirPath);
      const nodes: FileNode[] = data.map((item: any) => ({
        ...item,
        expanded: false,
        children: item.type === 'directory' ? [] : undefined,
      }));
      setFiles(nodes);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleExpand = useCallback(
    async (nodePath: string, nodeType: 'file' | 'directory') => {
      if (nodeType !== 'directory') return;

      setFiles((prev) => {
        const update = (nodes: FileNode[]): FileNode[] =>
          nodes.map((node) => {
            if (node.path === nodePath) {
              const newExpanded = !node.expanded;
              if (newExpanded && (!node.children || node.children.length === 0)) {
                api.listFiles(nodePath).then((data) => {
                  setFiles((prevFiles) => {
                    const updateChildren = (n: FileNode[]): FileNode[] =>
                      n.map((item) => {
                        if (item.path === nodePath) {
                          return {
                            ...item,
                            children: data.map((child: any) => ({
                              ...child,
                              expanded: false,
                              children: child.type === 'directory' ? [] : undefined,
                            })),
                          };
                        }
                        if (item.children) {
                          return { ...item, children: updateChildren(item.children) };
                        }
                        return item;
                      });
                    return updateChildren(prevFiles);
                  });
                }).catch(() => {});
              }
              return { ...node, expanded: newExpanded };
            }
            if (node.children) {
              return { ...node, children: update(node.children) };
            }
            return node;
          });
        return update(prev);
      });
    },
    [],
  );

  const refreshFiles = useCallback(
    (dirPath: string = '') => {
      loadFiles(dirPath);
    },
    [loadFiles],
  );

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Reload when workspace path changes
  useEffect(() => {
    if (workspacePath && workspacePath !== prevWorkspacePath.current) {
      prevWorkspacePath.current = workspacePath;
      loadFiles();
    }
  }, [workspacePath, loadFiles]);

  return { files, loading, error, loadFiles, toggleExpand, refreshFiles };
}
