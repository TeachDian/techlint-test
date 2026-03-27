import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@client/lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ring-offset-background",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
