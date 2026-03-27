import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

type UseResizablePanelOptions = {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
};

export function useResizablePanel({ initialWidth, minWidth, maxWidth }: UseResizablePanelOptions) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeState = useRef({ active: false, startX: 0, startWidth: initialWidth });

  useEffect(() => {
    function handleMouseMove(event: globalThis.MouseEvent) {
      if (!resizeState.current.active) {
        return;
      }

      const delta = resizeState.current.startX - event.clientX;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, resizeState.current.startWidth + delta));
      setWidth(nextWidth);
    }

    function stopResize() {
      resizeState.current.active = false;
      setIsResizing(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);
    window.addEventListener("mouseleave", stopResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
      window.removeEventListener("mouseleave", stopResize);
    };
  }, [maxWidth, minWidth]);

  function startResize(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    resizeState.current = {
      active: true,
      startX: event.clientX,
      startWidth: width,
    };
    setIsResizing(true);
  }

  return {
    width,
    isResizing,
    startResize,
  };
}
