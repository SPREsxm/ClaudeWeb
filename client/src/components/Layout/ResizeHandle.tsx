import { useCallback, useRef } from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
}

export function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startPos = direction === 'horizontal' ? e.clientX : e.clientY;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
        const delta = currentPos - startPos;
        onResize(delta);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [direction, onResize],
  );

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className={`
        shrink-0 transition-colors duration-150 group
        ${isHorizontal ? 'w-1.5 hover:w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'}
        hover:bg-accent-primary/30
      `}
    >
      <div
        className={`
          h-full w-full transition-opacity duration-150 opacity-0 group-hover:opacity-100
          ${isHorizontal ? 'w-1.5' : 'h-1.5'}
        `}
      />
    </div>
  );
}
