import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { BadgeDefinition, CreateBadgeDefinitionPayload, Task, UpdateBadgeDefinitionPayload } from "@shared/api";
import { ApiError } from "@client/lib/api";
import { getTaskDeleteCountdown } from "@client/lib/board";
import { formatDateTime } from "@client/lib/date";
import { getPriorityLabel } from "@client/lib/task-priority";
import { TaskBadgeList } from "@client/components/task-badge-list";
import { Badge } from "@client/components/ui/badge";
import { Button } from "@client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { FieldMessage } from "@client/components/ui/field";
import { Input } from "@client/components/ui/input";
import { Textarea } from "@client/components/ui/textarea";

type BoardWorkspaceProps = {
  open: boolean;
  activeTab: BoardWorkspaceTab;
  activeTasks: Task[];
  archivedTasks: Task[];
  trashedTasks: Task[];
  badgeDefinitions: BadgeDefinition[];
  badgesByTask: Map<string, BadgeDefinition[]>;
  categoryNameMap: Record<string, string>;
  onClose: () => void;
  onActiveTabChange: (tab: BoardWorkspaceTab) => void;
  onSelectTask: (taskId: string) => void;
  onArchiveTask: (taskId: string) => void;
  onArchiveTasks: (taskIds: string[]) => Promise<void>;
  onTrashTask: (taskId: string) => void;
  onTrashTasks: (taskIds: string[]) => Promise<void>;
  onRestoreTask: (taskId: string) => void;
  onRestoreTasks: (taskIds: string[]) => Promise<void>;
  onDeleteTask: (taskId: string) => void;
  onDeleteTasks: (taskIds: string[]) => Promise<void>;
  onCreateBadge: (payload: CreateBadgeDefinitionPayload) => Promise<void>;
  onUpdateBadge: (badgeId: string, payload: UpdateBadgeDefinitionPayload) => Promise<void>;
  onDeleteBadge: (badgeId: string) => void;
};

export type BoardWorkspaceTab = "tickets" | "archive" | "trash" | "badges";

type SelectionToolbarProps = {
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  actions: ReactNode;
};

type WorkspaceTaskRowProps = {
  task: Task;
  badges: BadgeDefinition[];
  categoryName: string;
  selected: boolean;
  onToggleSelected: (taskId: string) => void;
  actions: ReactNode;
};

type NavButtonProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

function SelectionToolbar({ selectedCount, allSelected, onToggleAll, actions }: SelectionToolbarProps) {
  return (
    <div className="workspace-toolbar">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <label className="inline-flex items-center gap-2">
          <input checked={allSelected} onChange={onToggleAll} type="checkbox" />
          <span>Select all</span>
        </label>
        <span>{selectedCount} selected</span>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

function WorkspaceTaskRow({ task, badges, categoryName, selected, onToggleSelected, actions }: WorkspaceTaskRowProps) {
  return (
    <div className="workspace-task-row" data-testid={`workspace-task-${task.id}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="pt-1">
            <input aria-label={`Select ${task.title}`} checked={selected} onChange={() => onToggleSelected(task.id)} title={`Select ${task.title}`} type="checkbox" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{task.title}</p>
              <Badge variant="outline">{categoryName}</Badge>
              <Badge className="capitalize" variant="outline">
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{task.description || "No description yet."}</p>
            <TaskBadgeList badges={badges} />
            <div className="text-xs text-muted-foreground">
              <p>Updated: {formatDateTime(task.updatedAt)}</p>
              {task.deleteAfterAt ? <p className="mt-1">Delete window: {getTaskDeleteCountdown(task) ?? "Expired"}</p> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </div>
  );
}

function NavButton({ label, count, active, onClick }: NavButtonProps) {
  return (
    <Button className="justify-between" onClick={onClick} variant={active ? "default" : "outline"}>
      <span>{label}</span>
      <Badge variant={active ? "secondary" : "outline"}>{count}</Badge>
    </Button>
  );
}

function emptySelectionMap() {
  return {
    tickets: new Set<string>(),
    archive: new Set<string>(),
    trash: new Set<string>(),
  };
}

export function BoardWorkspace({
  open,
  activeTab,
  activeTasks,
  archivedTasks,
  trashedTasks,
  badgeDefinitions,
  badgesByTask,
  categoryNameMap,
  onClose,
  onActiveTabChange,
  onSelectTask,
  onArchiveTask,
  onArchiveTasks,
  onTrashTask,
  onTrashTasks,
  onRestoreTask,
  onRestoreTasks,
  onDeleteTask,
  onDeleteTasks,
  onCreateBadge,
  onUpdateBadge,
  onDeleteBadge,
}: BoardWorkspaceProps) {
  const [badgeTitle, setBadgeTitle] = useState("");
  const [badgeDescription, setBadgeDescription] = useState("");
  const [badgeColor, setBadgeColor] = useState("#1d4ed8");
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState(emptySelectionMap);

  const activeSelected = selectedTaskIds.tickets;
  const archiveSelected = selectedTaskIds.archive;
  const trashSelected = selectedTaskIds.trash;

  useEffect(() => {
    if (!open) {
      setSelectedTaskIds(emptySelectionMap());
      setEditingBadgeId(null);
      setMessage(null);
    }
  }, [open]);

  const editingBadge = useMemo(() => badgeDefinitions.find((badge) => badge.id === editingBadgeId) ?? null, [badgeDefinitions, editingBadgeId]);

  useEffect(() => {
    if (!editingBadge) {
      setBadgeTitle("");
      setBadgeDescription("");
      setBadgeColor("#1d4ed8");
      return;
    }

    setBadgeTitle(editingBadge.title);
    setBadgeDescription(editingBadge.description);
    setBadgeColor(editingBadge.color);
  }, [editingBadge]);

  if (!open) {
    return null;
  }

  function updateSelection(tab: Exclude<BoardWorkspaceTab, "badges">, taskId: string) {
    setSelectedTaskIds((current) => {
      const next = new Set(current[tab]);

      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }

      return {
        ...current,
        [tab]: next,
      };
    });
  }

  function toggleAll(tab: Exclude<BoardWorkspaceTab, "badges">, tasks: Task[]) {
    setSelectedTaskIds((current) => {
      const next = current[tab].size === tasks.length ? new Set<string>() : new Set(tasks.map((task) => task.id));
      return {
        ...current,
        [tab]: next,
      };
    });
  }

  function resetSelection(tab: Exclude<BoardWorkspaceTab, "badges">) {
    setSelectedTaskIds((current) => ({
      ...current,
      [tab]: new Set<string>(),
    }));
  }

  async function handleCreateOrUpdateBadge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const payload = {
        title: badgeTitle,
        description: badgeDescription,
        color: badgeColor,
      };

      if (editingBadgeId) {
        await onUpdateBadge(editingBadgeId, payload);
        setEditingBadgeId(null);
      } else {
        await onCreateBadge(payload);
      }

      setBadgeTitle("");
      setBadgeDescription("");
      setBadgeColor("#1d4ed8");
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.fieldErrors?.title ?? error.message);
      } else {
        setMessage(editingBadgeId ? "Could not update the badge." : "Could not create the badge.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkArchive() {
    if (!window.confirm(`Archive ${activeSelected.size} selected task${activeSelected.size === 1 ? "" : "s"}?`)) {
      return;
    }

    await onArchiveTasks([...activeSelected]);
    resetSelection("tickets");
  }

  async function handleBulkTrashFromActive() {
    if (!window.confirm(`Move ${activeSelected.size} selected task${activeSelected.size === 1 ? "" : "s"} to trash?`)) {
      return;
    }

    await onTrashTasks([...activeSelected]);
    resetSelection("tickets");
  }

  async function handleBulkRestore() {
    if (!window.confirm(`Restore ${archiveSelected.size} selected task${archiveSelected.size === 1 ? "" : "s"}?`)) {
      return;
    }

    await onRestoreTasks([...archiveSelected]);
    resetSelection("archive");
  }

  async function handleBulkTrashFromArchive() {
    if (!window.confirm(`Move ${archiveSelected.size} selected task${archiveSelected.size === 1 ? "" : "s"} to trash?`)) {
      return;
    }

    await onTrashTasks([...archiveSelected]);
    resetSelection("archive");
  }

  async function handleBulkRestoreFromTrash() {
    if (!window.confirm(`Restore ${trashSelected.size} selected task${trashSelected.size === 1 ? "" : "s"}?`)) {
      return;
    }

    await onRestoreTasks([...trashSelected]);
    resetSelection("trash");
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${trashSelected.size} selected task${trashSelected.size === 1 ? "" : "s"} permanently?`)) {
      return;
    }

    await onDeleteTasks([...trashSelected]);
    resetSelection("trash");
  }

  return (
    <div className="workspace-shell">
      <div className="workspace-layout">
        <aside className="workspace-nav">
          <div className="mb-5 flex items-start justify-between gap-3 xl:block">
            <div className="space-y-1">
              <p className="section-kicker">Workspace</p>
              <p className="text-sm text-muted-foreground">Tickets, archive, trash, and badges.</p>
            </div>
            <Button className="shrink-0 xl:mt-4" onClick={onClose} variant="ghost">
              Close
            </Button>
          </div>

          <div className="workspace-nav-grid">
            <NavButton active={activeTab === "tickets"} count={activeTasks.length} label="Tickets" onClick={() => onActiveTabChange("tickets")} />
            <NavButton active={activeTab === "archive"} count={archivedTasks.length} label="Archive" onClick={() => onActiveTabChange("archive")} />
            <NavButton active={activeTab === "trash"} count={trashedTasks.length} label="Trash" onClick={() => onActiveTabChange("trash")} />
            <NavButton active={activeTab === "badges"} count={badgeDefinitions.length} label="Badges" onClick={() => onActiveTabChange("badges")} />
          </div>
        </aside>

        <section className="workspace-main">
          {activeTab === "tickets" ? (
            <Card className="panel-surface overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Active tickets</CardTitle>
              </CardHeader>
              <SelectionToolbar
                actions={
                  <>
                    <Button disabled={activeSelected.size === 0} onClick={() => void handleBulkArchive()} variant="outline">
                      Archive selected
                    </Button>
                    <Button disabled={activeSelected.size === 0} onClick={() => void handleBulkTrashFromActive()} variant="destructive">
                      Trash selected
                    </Button>
                  </>
                }
                allSelected={activeTasks.length > 0 && activeSelected.size === activeTasks.length}
                onToggleAll={() => toggleAll("tickets", activeTasks)}
                selectedCount={activeSelected.size}
              />
              <CardContent className="panel-content-stack">
                {activeTasks.length === 0 ? (
                  <div className="empty-state-box">No active tickets.</div>
                ) : (
                  activeTasks.map((task) => (
                    <WorkspaceTaskRow
                      key={task.id}
                      actions={
                        <>
                          <Button onClick={() => onSelectTask(task.id)} variant="outline">
                            Open
                          </Button>
                          <Button onClick={() => onArchiveTask(task.id)} variant="outline">
                            Archive
                          </Button>
                          <Button onClick={() => onTrashTask(task.id)} variant="destructive">
                            Trash
                          </Button>
                        </>
                      }
                      badges={badgesByTask.get(task.id) ?? []}
                      categoryName={categoryNameMap[task.categoryId] ?? "Unknown"}
                      onToggleSelected={(taskId) => updateSelection("tickets", taskId)}
                      selected={activeSelected.has(task.id)}
                      task={task}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "archive" ? (
            <Card className="panel-surface overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Archived tickets</CardTitle>
              </CardHeader>
              <SelectionToolbar
                actions={
                  <>
                    <Button disabled={archiveSelected.size === 0} onClick={() => void handleBulkRestore()} variant="outline">
                      Restore selected
                    </Button>
                    <Button disabled={archiveSelected.size === 0} onClick={() => void handleBulkTrashFromArchive()} variant="destructive">
                      Trash selected
                    </Button>
                  </>
                }
                allSelected={archivedTasks.length > 0 && archiveSelected.size === archivedTasks.length}
                onToggleAll={() => toggleAll("archive", archivedTasks)}
                selectedCount={archiveSelected.size}
              />
              <CardContent className="panel-content-stack">
                {archivedTasks.length === 0 ? (
                  <div className="empty-state-box">No archived tickets.</div>
                ) : (
                  archivedTasks.map((task) => (
                    <WorkspaceTaskRow
                      key={task.id}
                      actions={
                        <>
                          <Button onClick={() => onRestoreTask(task.id)} variant="outline">
                            Restore
                          </Button>
                          <Button onClick={() => onTrashTask(task.id)} variant="destructive">
                            Move to trash
                          </Button>
                        </>
                      }
                      badges={badgesByTask.get(task.id) ?? []}
                      categoryName={categoryNameMap[task.categoryId] ?? "Unknown"}
                      onToggleSelected={(taskId) => updateSelection("archive", taskId)}
                      selected={archiveSelected.has(task.id)}
                      task={task}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "trash" ? (
            <Card className="panel-surface overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Trash</CardTitle>
              </CardHeader>
              <SelectionToolbar
                actions={
                  <>
                    <Button disabled={trashSelected.size === 0} onClick={() => void handleBulkRestoreFromTrash()} variant="outline">
                      Restore selected
                    </Button>
                    <Button disabled={trashSelected.size === 0} onClick={() => void handleBulkDelete()} variant="destructive">
                      Delete selected
                    </Button>
                  </>
                }
                allSelected={trashedTasks.length > 0 && trashSelected.size === trashedTasks.length}
                onToggleAll={() => toggleAll("trash", trashedTasks)}
                selectedCount={trashSelected.size}
              />
              <CardContent className="panel-content-stack">
                {trashedTasks.length === 0 ? (
                  <div className="empty-state-box">Trash is empty.</div>
                ) : (
                  trashedTasks.map((task) => (
                    <WorkspaceTaskRow
                      key={task.id}
                      actions={
                        <>
                          <Button onClick={() => onRestoreTask(task.id)} variant="outline">
                            Restore
                          </Button>
                          <Button onClick={() => onDeleteTask(task.id)} variant="destructive">
                            Delete now
                          </Button>
                        </>
                      }
                      badges={badgesByTask.get(task.id) ?? []}
                      categoryName={categoryNameMap[task.categoryId] ?? "Unknown"}
                      onToggleSelected={(taskId) => updateSelection("trash", taskId)}
                      selected={trashSelected.has(task.id)}
                      task={task}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "badges" ? (
            <div className="workspace-badge-grid">
              <Card className="panel-surface">
                <CardHeader className="border-b">
                  <CardTitle className="text-base">{editingBadgeId ? "Edit badge" : "Create badge"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-3" onSubmit={handleCreateOrUpdateBadge}>
                    <Input aria-label="Badge title" placeholder="Badge title" title="Badge title" value={badgeTitle} onChange={(event) => setBadgeTitle(event.target.value)} />
                    <Textarea
                      aria-label="Badge description"
                      className="min-h-24"
                      placeholder="Short badge description"
                      title="Badge description"
                      value={badgeDescription}
                      onChange={(event) => setBadgeDescription(event.target.value)}
                    />
                    <Input aria-label="Badge color" title="Badge color" type="color" value={badgeColor} onChange={(event) => setBadgeColor(event.target.value)} />
                    {message ? <FieldMessage>{message}</FieldMessage> : null}
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={busy} type="submit">
                        {busy ? "Saving..." : editingBadgeId ? "Update badge" : "Create badge"}
                      </Button>
                      {editingBadgeId ? (
                        <Button
                          onClick={() => {
                            setEditingBadgeId(null);
                            setMessage(null);
                          }}
                          type="button"
                          variant="outline"
                        >
                          Cancel edit
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="panel-surface">
                <CardHeader className="border-b">
                  <CardTitle className="text-base">Badge repository</CardTitle>
                </CardHeader>
                <CardContent className="panel-content-stack">
                  {badgeDefinitions.length === 0 ? (
                    <div className="empty-state-box">No badges yet.</div>
                  ) : (
                    badgeDefinitions.map((badge) => (
                      <div key={badge.id} className="panel-inset flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <TaskBadgeList badges={[badge]} />
                          <p className="text-sm leading-6 text-muted-foreground">{badge.description || "No extra badge info."}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => setEditingBadgeId(badge.id)} variant="outline">
                            Edit
                          </Button>
                          <Button onClick={() => onDeleteBadge(badge.id)} variant="destructive">
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
