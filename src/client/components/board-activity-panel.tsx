import type { TaskHistory } from "@shared/api";
import { describeActivity } from "@client/lib/board";
import { formatDateTime } from "@client/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";

type BoardActivityPanelProps = {
  history: TaskHistory[];
  taskNameMap: Record<string, string>;
  categoryNameMap: Record<string, string>;
  title?: string;
};

export function BoardActivityPanel({ history, taskNameMap, categoryNameMap, title = "Activity" }: BoardActivityPanelProps) {
  return (
    <Card className="panel-surface">
      <CardHeader className="border-b">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="panel-content-stack">
        {history.length === 0 ? (
          <div className="empty-state-box">No activity yet.</div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="panel-inset">
              <p className="text-sm font-medium text-foreground">{taskNameMap[item.taskId] ?? "Task"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{describeActivity(item, categoryNameMap)}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

