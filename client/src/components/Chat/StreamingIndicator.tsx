import { motion } from 'framer-motion';

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-surface-400">
      <span>Claude is thinking</span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full bg-accent-primary"
            animate={{
              y: [0, -4, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
