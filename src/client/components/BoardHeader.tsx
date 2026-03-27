import type { ReactNode } from "react";
import { Badge } from "@client/components/ui/badge";
import { Button } from "@client/components/ui/button";
import { Tooltip } from "@client/components/ui/tooltip";

type BoardHeaderProps = {
  totalTaskCount: number;
  dueSoonCount: number;
  overdueCount: number;
  isFocusMode: boolean;
  isFullscreen: boolean;
  onToggleFocusMode: () => void;
  onToggleFullscreen: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  categoryAction: ReactNode;
};

export function BoardHeader({
  totalTaskCount,
  dueSoonCount,
  overdueCount,
  isFocusMode,
  isFullscreen,
  onToggleFocusMode,
  onToggleFullscreen,
  onLogout,
  categoryAction,
}: BoardHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <h1 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">Tasks</h1>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="outline">{totalTaskCount} tasks</Badge>
            <Badge variant={dueSoonCount > 0 ? "warning" : "outline"}>{dueSoonCount} due soon</Badge>
            <Badge variant={overdueCount > 0 ? "destructive" : "outline"}>{overdueCount} overdue</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {categoryAction}
          <Tooltip content={isFocusMode ? "Show the details panel again" : "Hide the details panel and use the full width board"}>
            <Button onClick={onToggleFocusMode} variant={isFocusMode ? "secondary" : "outline"}>
              Focus board
            </Button>
          </Tooltip>
          <Tooltip content={isFullscreen ? "Exit browser full screen" : "Use the browser full screen view while dragging tasks"}>
            <Button onClick={onToggleFullscreen} variant={isFullscreen ? "secondary" : "outline"}>
              Full screen
            </Button>
          </Tooltip>
          <Button onClick={onLogout} variant="ghost">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
