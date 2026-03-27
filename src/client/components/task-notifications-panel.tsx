import { Badge } from "@client/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import type { BoardNotification } from "@client/lib/board";
import { formatDateTime } from "@client/lib/date";

type TaskNotificationsPanelProps = {
  notifications: BoardNotification[];
  onSelectTask: (taskId: string) => void;
};

export function TaskNotificationsPanel({ notifications, onSelectTask }: TaskNotificationsPanelProps) {
  return (
    <Card className="panel-surface">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="panel-content-stack">
        {notifications.length === 0 ? (
          <div className="empty-state-box">No due soon or overdue tasks.</div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.taskId}
              className="panel-inset block w-full text-left transition-colors hover:bg-accent/40"
              onClick={() => onSelectTask(notification.taskId)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.categoryName}</p>
                </div>
                <Badge variant={notification.tone === "overdue" ? "destructive" : "warning"}>
                  {notification.tone === "overdue" ? "Overdue" : "Due soon"}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>{notification.detail}</p>
                {notification.expiryAt ? <p className="mt-1">{formatDateTime(notification.expiryAt)}</p> : null}
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

