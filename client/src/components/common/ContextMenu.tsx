import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="fixed z-50 min-w-[160px] bg-surface-800 border border-surface-700 rounded-lg shadow-xl py-1 overflow-hidden"
        style={{ left: position.x, top: position.y }}
      >
        {items.map((item, i) => (
          <div key={i}>
            {item.divider && i > 0 && <div className="h-px bg-surface-700 my-1" />}
            <button
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:text-white hover:bg-surface-700 transition-colors"
            >
              {item.icon && <span className="text-surface-400">{item.icon}</span>}
              {item.label}
            </button>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
