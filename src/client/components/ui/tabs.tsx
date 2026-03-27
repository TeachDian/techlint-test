import { createContext, useContext } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@client/lib/cn";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used inside Tabs.");
  }

  return context;
}

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
};

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex items-center gap-1 border bg-muted/60 p-1", className)} {...props} />;
}

type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function TabsTrigger({ className, value, type = "button", ...props }: TabsTriggerProps) {
  const context = useTabsContext();
  const active = context.value === value;

  return (
    <button
      aria-selected={active}
      className={cn(
        "inline-flex items-center justify-center rounded-none px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        active ? "border border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
        className,
      )}
      onClick={() => context.onValueChange(value)}
      type={type}
      {...props}
    />
  );
}

type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
};

export function TabsContent({ className, value, ...props }: TabsContentProps) {
  const context = useTabsContext();

  if (context.value !== value) {
    return null;
  }

  return <div className={className} {...props} />;
}
