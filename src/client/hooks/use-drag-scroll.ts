import { useEffect, useRef, useState } from "react";

type DragState = {
  active: boolean;
  pointerId: number | null;
  startX: number;
  scrollLeft: number;
};

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[draggable="true"], button, input, textarea, select, a, label'));
}

function hasVerticalScrollAncestor(target: EventTarget | null, boundary: HTMLElement) {
  let current = target instanceof Element ? target : null;

  while (current && current !== boundary) {
    const style = window.getComputedStyle(current);
    const canScrollY = /(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight + 4;

    if (canScrollY) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const dragState = useRef<DragState>({
    active: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
  });
  const [isDraggingSurface, setIsDraggingSurface] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const scrollElement: HTMLElement = element;

    function stopDragging(pointerId?: number) {
      if (!dragState.current.active) {
        return;
      }

      if (pointerId !== undefined && dragState.current.pointerId !== pointerId) {
        return;
      }

      if (dragState.current.pointerId !== null && scrollElement.hasPointerCapture?.(dragState.current.pointerId)) {
        scrollElement.releasePointerCapture(dragState.current.pointerId);
      }

      dragState.current = {
        active: false,
        pointerId: null,
        startX: 0,
        scrollLeft: scrollElement.scrollLeft,
      };
      setIsDraggingSurface(false);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0 || event.pointerType === "touch" || isInteractiveTarget(event.target)) {
        return;
      }

      dragState.current = {
        active: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        scrollLeft: scrollElement.scrollLeft,
      };

      scrollElement.setPointerCapture?.(event.pointerId);
      setIsDraggingSurface(true);
      event.preventDefault();
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragState.current.active || dragState.current.pointerId !== event.pointerId) {
        return;
      }

      const distance = event.clientX - dragState.current.startX;
      scrollElement.scrollLeft = dragState.current.scrollLeft - distance;
      event.preventDefault();
    }

    function handlePointerUp(event: PointerEvent) {
      stopDragging(event.pointerId);
    }

    function handlePointerCancel(event: PointerEvent) {
      stopDragging(event.pointerId);
    }

    function handleLostPointerCapture() {
      stopDragging();
    }

    function handleWheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || hasVerticalScrollAncestor(event.target, scrollElement)) {
        return;
      }

      scrollElement.scrollLeft += event.deltaY;
      event.preventDefault();
    }

    scrollElement.addEventListener("pointerdown", handlePointerDown);
    scrollElement.addEventListener("pointermove", handlePointerMove);
    scrollElement.addEventListener("pointerup", handlePointerUp);
    scrollElement.addEventListener("pointercancel", handlePointerCancel);
    scrollElement.addEventListener("lostpointercapture", handleLostPointerCapture);
    scrollElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollElement.removeEventListener("pointerdown", handlePointerDown);
      scrollElement.removeEventListener("pointermove", handlePointerMove);
      scrollElement.removeEventListener("pointerup", handlePointerUp);
      scrollElement.removeEventListener("pointercancel", handlePointerCancel);
      scrollElement.removeEventListener("lostpointercapture", handleLostPointerCapture);
      scrollElement.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return {
    ref,
    isDraggingSurface,
  };
}
