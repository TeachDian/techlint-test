import type { ButtonHTMLAttributes } from "react";
import { cn } from "@client/lib/cn";

const buttonVariants = {
  default: "border border-foreground bg-foreground text-background shadow-sm hover:border-slate-800 hover:bg-slate-800",
  outline: "border border-input bg-background text-foreground shadow-sm hover:border-foreground hover:bg-background/90",
  secondary: "border border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "border border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
  destructive: "border border-destructive bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
};

const buttonSizes = {
  default: "h-10 px-3 py-2",
  sm: "h-8 px-2.5 py-1.5 text-xs",
  lg: "h-11 px-4 py-2",
  icon: "h-10 w-10",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-none text-sm font-medium tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
