import { useEffect, useState } from "react";
import type { Task, TaskHistory } from "@shared/api";
import type { BoardNotification } from "@client/lib/board";
import { BoardActivityPanel } from "@client/components/BoardActivityPanel";
import { TaskEditor } from "@client/components/TaskEditor";
import { TaskNotificationsPanel } from "@client/components/TaskNotificationsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@client/components/ui/tabs";

type BoardSidebarProps = {
  selectedTask: Task | null;
  selectedTaskHistory: TaskHistory[];
  boardHistory: TaskHistory[];
  notifications: BoardNotification[];
  categoryNameMap: Record<string, string>;
  taskNameMap: Record<string, string>;
  onSelectTask: (taskId: string) => void;
};

export function BoardSidebar({
  selectedTask,
  selectedTaskHistory,
  boardHistory,
  notifications,
  categoryNameMap,
  taskNameMap,
  onSelectTask,
}: BoardSidebarProps) {
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (selectedTask) {
      setActiveTab("details");
    }
  }, [selectedTask?.id]);

  return (
    <Tabs className="flex h-full min-h-0 flex-col" onValueChange={setActiveTab} value={activeTab}>
      <div className="border-b px-4 py-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <TabsContent className="space-y-4" value="details">
          {selectedTask ? (
            <TaskEditor categoryNameMap={categoryNameMap} history={selectedTaskHistory} task={selectedTask} />
          ) : (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Select a task to edit it.</p>
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
