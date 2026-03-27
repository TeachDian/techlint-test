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
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.length === 0 ? (
          <div className="border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
            No activity yet.
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="border bg-card px-3 py-3">
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
