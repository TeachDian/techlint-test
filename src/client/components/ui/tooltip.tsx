import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@client/lib/cn";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <div className="pointer-events-none absolute left-0 top-[calc(100%+0.5rem)] z-30 min-w-max max-w-xs border bg-popover px-2.5 py-2 text-xs leading-5 text-popover-foreground opacity-0 shadow-board transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">
        {content}
      </div>
    </div>
  );
}

export function TooltipText({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-xs text-popover-foreground", className)} {...props} />;
}
