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
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
            No due soon or overdue tasks.
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.taskId}
              className="block w-full border bg-card px-3 py-3 text-left transition-colors hover:bg-accent"
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
