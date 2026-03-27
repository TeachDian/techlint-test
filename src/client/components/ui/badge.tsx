import type { HTMLAttributes } from "react";
import { cn } from "@client/lib/cn";

const badgeVariants = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "text-foreground",
  success: "border-transparent bg-emerald-100 text-emerald-800",
  warning: "border-transparent bg-amber-100 text-amber-900",
  destructive: "border-transparent bg-rose-100 text-rose-800",
};

type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof badgeVariants;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-none border px-2 py-0.5 text-xs font-medium uppercase tracking-[0.08em] transition-colors",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
