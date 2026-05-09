import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Folder, FolderOpen, File, FileCode, FileJson,
  FileText, FileType, FileImage,
} from 'lucide-react';
import { FileNode } from '../../types';
import { useEditorStore } from '../../store/useEditorStore';
import { api } from '../../services/api';

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  onToggle: (path: string, type: 'file' | 'directory') => void;
}

function getFileIcon(name: string, type: 'file' | 'directory', expanded: boolean) {
  if (type === 'directory') {
    return expanded ? (
      <FolderOpen size={15} className="text-terminal-yellow shrink-0" />
    ) : (
      <Folder size={15} className="text-terminal-yellow shrink-0" />
    );
  }
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={15} className="text-blue-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode size={15} className="text-yellow-400 shrink-0" />;
    case 'json':
      return <FileJson size={15} className="text-yellow-500 shrink-0" />;
    case 'css':
    case 'scss':
      return <FileType size={15} className="text-blue-500 shrink-0" />;
    case 'html':
      return <FileType size={15} className="text-orange-400 shrink-0" />;
    case 'md':
      return <FileText size={15} className="text-surface-400 shrink-0" />;
    case 'svg':
    case 'png':
    case 'jpg':
      return <FileImage size={15} className="text-green-400 shrink-0" />;
    default:
      return <File size={15} className="text-surface-400 shrink-0" />;
  }
}

export function FileTreeNode({ node, depth, onToggle }: FileTreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const openFile = useEditorStore((s) => s.openFile);
  const isExpanded = node.expanded || false;

  const handleClick = async () => {
    if (node.type === 'directory') {
      onToggle(node.path, node.type);
    } else {
      try {
        const result = await api.readFile(node.path);
        openFile(node.path, node.name, result.content);
      } catch (err) {
        console.error('Failed to open file:', err);
      }
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-0.5 py-[3px] cursor-pointer hover:bg-surface-800/70 transition-colors duration-100 select-none"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {node.type === 'directory' && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight size={13} className="text-surface-500 shrink-0" />
          </motion.div>
        )}
        {node.type === 'file' && <div className="w-[13px]" />}

        <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
          {getFileIcon(node.name, node.type, isExpanded)}
          <span className="text-[13px] text-surface-300 truncate">{node.name}</span>
        </div>

        {isHovered && node.type === 'file' && (
          <span className="text-[9px] text-surface-500 mr-2 font-mono">
            {node.name.split('.').pop()?.toUpperCase()}
          </span>
        )}
      </div>

      <AnimatePresence>
        {node.type === 'directory' && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
