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
      <div className="pointer-events-none absolute right-0 top-[calc(100%+0.375rem)] z-30 min-w-max border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">
        {content}
      </div>
    </div>
  );
}

export function TooltipText({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-xs text-popover-foreground", className)} {...props} />;
}
