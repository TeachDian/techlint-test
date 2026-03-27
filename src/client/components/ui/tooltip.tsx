import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@client/lib/cn";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
};

const VIEWPORT_PADDING = 12;

function getPreferredLeft(triggerWidth: number, tooltipWidth: number, align: TooltipProps["align"]) {
  if (align === "center") {
    return (triggerWidth - tooltipWidth) / 2;
  }

  if (align === "end") {
    return triggerWidth - tooltipWidth;
  }

  return 0;
}

export function Tooltip({ content, children, className, contentClassName, align = "start" }: TooltipProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const updatePosition = useCallback(() => {
    const rootElement = rootRef.current;
    const contentElement = contentRef.current;

    if (!rootElement || !contentElement) {
      return;
    }

    const rootRect = rootElement.getBoundingClientRect();
    const tooltipRect = contentElement.getBoundingClientRect();
    const preferredLeft = getPreferredLeft(rootRect.width, tooltipRect.width, align);
    const minLeft = VIEWPORT_PADDING - rootRect.left;
    const maxLeft = window.innerWidth - VIEWPORT_PADDING - rootRect.left - tooltipRect.width;
    const nextLeft = Math.min(Math.max(preferredLeft, minLeft), maxLeft);

    contentElement.style.left = `${nextLeft}px`;
  }, [align]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(updatePosition);

    function handlePositionChange() {
      updatePosition();
    }

    window.addEventListener("resize", handlePositionChange);
    window.addEventListener("scroll", handlePositionChange, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handlePositionChange);
      window.removeEventListener("scroll", handlePositionChange, true);
    };
  }, [isOpen, updatePosition]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex", className)}
      onBlurCapture={handleBlur}
      onFocusCapture={() => setIsOpen(true)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      <div
        ref={contentRef}
        className={cn("tooltip-content", isOpen ? "opacity-100" : "opacity-0", contentClassName)}
      >
        {content}
      </div>
    </div>
  );
}

export function TooltipText({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-xs text-popover-foreground", className)} {...props} />;
}
