import { useEffect, useRef, useState } from "react";

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[draggable="true"], button, input, textarea, select, a, label'));
}

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [isDraggingSurface, setIsDraggingSurface] = useState(false);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      const element = ref.current;

      if (!element || event.button !== 0 || isInteractiveTarget(event.target)) {
        return;
      }

      dragState.current = {
        active: true,
        startX: event.clientX,
        scrollLeft: element.scrollLeft,
      };
      setIsDraggingSurface(true);
    }

    function handleMouseMove(event: MouseEvent) {
      if (!dragState.current.active) {
        return;
      }

      const element = ref.current;

      if (!element) {
        return;
      }

      const distance = event.clientX - dragState.current.startX;
      element.scrollLeft = dragState.current.scrollLeft - distance;
    }

    function stopDragging() {
      dragState.current.active = false;
      setIsDraggingSurface(false);
    }

    const element = ref.current;

    if (!element) {
      return;
    }

    element.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("mouseleave", stopDragging);

    return () => {
      element.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("mouseleave", stopDragging);
    };
  }, []);

  return {
    ref,
    isDraggingSurface,
  };
}
