import { useEffect, useState } from "react";
import type { BadgeDefinition, Task, TaskComment, TaskHistory } from "@shared/api";
import type { BoardNotification } from "@client/lib/board";
import { BoardActivityPanel } from "@client/components/board-activity-panel";
import { TaskEditor } from "@client/components/task-editor";
import { TaskNotificationsPanel } from "@client/components/task-notifications-panel";
import { Button } from "@client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@client/components/ui/tabs";

type BoardSidebarProps = {
  selectedTask: Task | null;
  selectedTaskHistory: TaskHistory[];
  selectedTaskComments: TaskComment[];
  selectedTaskBadgeIds: string[];
  badgeDefinitions: BadgeDefinition[];
  boardHistory: TaskHistory[];
  notifications: BoardNotification[];
  categoryNameMap: Record<string, string>;
  taskNameMap: Record<string, string>;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
  onRequestArchiveTask: (taskId: string) => void;
  onRequestTrashTask: (taskId: string) => void;
};

export function BoardSidebar({
  selectedTask,
  selectedTaskHistory,
  selectedTaskComments,
  selectedTaskBadgeIds,
  badgeDefinitions,
  boardHistory,
  notifications,
  categoryNameMap,
  taskNameMap,
  onClose,
  onSelectTask,
  onRequestArchiveTask,
  onRequestTrashTask,
}: BoardSidebarProps) {
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (selectedTask) {
      setActiveTab("details");
    }
  }, [selectedTask?.id]);

  return (
    <Tabs className="inspector-panel" onValueChange={setActiveTab} value={activeTab}>
      <div className="inspector-header">
        <div className="min-w-0 space-y-1">
          <p className="inspector-label">Inspector</p>
          <p className="inspector-title">{selectedTask ? selectedTask.title : "Board panels"}</p>
        </div>
        <Button className="shrink-0" onClick={onClose} variant="ghost">
          Close
        </Button>
      </div>

      <div className="border-b px-4 py-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <TabsContent className="space-y-4" value="details">
          {selectedTask ? (
            <TaskEditor
              badgeDefinitions={badgeDefinitions}
              categoryNameMap={categoryNameMap}
              comments={selectedTaskComments}
              history={selectedTaskHistory}
              onRequestArchiveTask={onRequestArchiveTask}
              onRequestTrashTask={onRequestTrashTask}
              selectedBadgeIds={selectedTaskBadgeIds}
              task={selectedTask}
            />
          ) : (
            <Card className="panel-surface">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Select a task to edit it or review its activity.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="activity">
          <BoardActivityPanel
            categoryNameMap={categoryNameMap}
            history={selectedTask ? selectedTaskHistory : boardHistory}
            taskNameMap={taskNameMap}
            title={selectedTask ? "Task activity" : "Board activity"}
          />
        </TabsContent>

        <TabsContent className="space-y-4" value="notifications">
          <TaskNotificationsPanel
            notifications={notifications}
            onSelectTask={(taskId) => {
              onSelectTask(taskId);
              setActiveTab("details");
            }}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
