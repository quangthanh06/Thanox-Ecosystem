import { useRef, useState, useCallback } from 'react';

/**
 * useDragScroll hook provides smooth horizontal mouse drag-to-scroll
 * with left/right scroll controls and mouse wheel support.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !ref.current) return;
      e.preventDefault();
      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Drag speed multiplier
      if (Math.abs(walk) > 3) {
        setHasMoved(true);
      }
      ref.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const scrollByAmount = useCallback((amount: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY !== 0 && ref.current) {
      ref.current.scrollLeft += e.deltaY;
    }
  }, []);

  return {
    ref,
    isDragging,
    hasMoved,
    dragProps: {
      ref,
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
      onWheel,
      style: {
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: isDragging ? ('none' as const) : undefined,
      },
    },
    scrollLeft: () => scrollByAmount(-250),
    scrollRight: () => scrollByAmount(250),
  };
}
