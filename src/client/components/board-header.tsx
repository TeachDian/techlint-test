import type { ReactNode } from "react";
import { Badge } from "@client/components/ui/badge";
import { Button } from "@client/components/ui/button";
import { Tooltip } from "@client/components/ui/tooltip";

type BoardHeaderProps = {
  totalTaskCount: number;
  dueSoonCount: number;
  overdueCount: number;
  isDragging: boolean;
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
  isDragging,
  isFocusMode,
  isFullscreen,
  onToggleFocusMode,
  onToggleFullscreen,
  onLogout,
  categoryAction,
}: BoardHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">Tasks</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{totalTaskCount} tasks</Badge>
            <Badge variant={dueSoonCount > 0 ? "warning" : "outline"}>{dueSoonCount} due soon</Badge>
            <Badge variant={overdueCount > 0 ? "destructive" : "outline"}>{overdueCount} overdue</Badge>
            {isDragging ? <Badge variant="secondary">Dragging</Badge> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2"> 
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
