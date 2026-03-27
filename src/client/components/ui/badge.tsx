import type { HTMLAttributes } from "react";
import { cn } from "@client/lib/cn";

const badgeVariants = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "bg-background/80 text-foreground",
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
        "inline-flex items-center rounded-none border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
