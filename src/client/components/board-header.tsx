import type { ReactNode } from "react";
import { Badge } from "@client/components/ui/badge";
import { Button } from "@client/components/ui/button";
import { Tooltip } from "@client/components/ui/tooltip";
import { cn } from "@client/lib/cn";

type BoardHeaderProps = {
  totalTaskCount: number;
  dueSoonCount: number;
  overdueCount: number;
  isDragging: boolean;
  isFocusMode: boolean;
  isFullscreen: boolean;
  categoryAction: ReactNode;
  filtersBar: ReactNode;
  onOpenWorkspace: () => void;
  onToggleFocusMode: () => void;
  onToggleFullscreen: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
};

type MetricChipProps = {
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "danger";
};

function MetricChip({ label, value, tone = "default" }: MetricChipProps) {
  return (
    <div className={cn("board-metric-card", tone === "warning" && "board-metric-card-warning", tone === "danger" && "board-metric-card-danger")}>
      <span className="board-metric-label">{label}</span>
      <span className="board-metric-value">{value}</span>
    </div>
  );
}

export function BoardHeader({
  totalTaskCount,
  dueSoonCount,
  overdueCount,
  isDragging,
  isFocusMode,
  isFullscreen,
  categoryAction,
  filtersBar,
  onOpenWorkspace,
  onToggleFocusMode,
  onToggleFullscreen,
  onLogout,
}: BoardHeaderProps) {
  return (
    <header className="board-header-shell">
      <div className="board-header-main">
        <div className="board-header-top">
          <div className="board-title-group">
            <div className="board-title-row">
              <div className="min-w-0">
                <p className="board-title-kicker">Board</p>
                <h1 className="board-title-heading">Task board</h1>
              </div>
              <div className="board-title-meta">
                <Badge variant="outline">Private</Badge>
                {isDragging ? <Badge variant="secondary">Dragging</Badge> : null}
              </div>
            </div>
            <div className="board-metric-list">
              <MetricChip label="Visible" value={totalTaskCount} />
              <MetricChip label="Due soon" tone={dueSoonCount > 0 ? "warning" : "default"} value={dueSoonCount} />
              <MetricChip label="Overdue" tone={overdueCount > 0 ? "danger" : "default"} value={overdueCount} />
            </div>
          </div>

          <div className="board-action-row">
            {categoryAction}
            <Button onClick={onOpenWorkspace} size="sm" variant="outline">
              More
            </Button>
            <Tooltip content={isFocusMode ? "Show the details panel again." : "Hide the details panel and give the board the full width."}>
              <Button onClick={onToggleFocusMode} size="sm" variant={isFocusMode ? "secondary" : "outline"}>
                Focus board
              </Button>
            </Tooltip>
            <Tooltip content={isFullscreen ? "Exit browser full screen." : "Use browser full screen while working on the board."}>
              <Button onClick={onToggleFullscreen} size="sm" variant={isFullscreen ? "secondary" : "outline"}>
                Full screen
              </Button>
            </Tooltip>
            <Button onClick={onLogout} size="sm" variant="ghost">
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {filtersBar}
    </header>
  );
}
