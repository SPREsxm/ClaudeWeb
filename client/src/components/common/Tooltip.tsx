import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={`
              absolute z-50 px-2 py-1 text-[10px] text-white bg-surface-700 rounded-md whitespace-nowrap pointer-events-none
              ${position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}
              left-1/2 -translate-x-1/2
            `}
          >
            {content}
            <div
              className={`
                absolute left-1/2 -translate-x-1/2
                w-1.5 h-1.5 bg-surface-700 rotate-45
                ${position === 'top' ? 'bottom-[-3px]' : 'top-[-3px]'}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
