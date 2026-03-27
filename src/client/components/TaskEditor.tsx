import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Task, TaskHistory, UpdateTaskPayload } from "@shared/api";
import { describeHistoryItem } from "@client/lib/board";
import { formatDateTime, toDateTimeLocalValue, toIsoFromDateTimeLocalValue } from "@client/lib/date";
import { Badge } from "@client/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { Field, FieldLabel, FieldMessage } from "@client/components/ui/field";
import { Input } from "@client/components/ui/input";
import { Textarea } from "@client/components/ui/textarea";
import { useBoard } from "@client/contexts/BoardContext";

type TaskEditorProps = {
  task: Task;
  history: TaskHistory[];
  categoryNameMap: Record<string, string>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function makeSignature(payload: UpdateTaskPayload) {
  return JSON.stringify(payload);
}

function getSaveStateLabel(saveState: SaveState) {
  if (saveState === "saving") {
    return "Saving";
  }

  if (saveState === "saved") {
    return "Saved";
  }

  if (saveState === "error") {
    return "Error";
  }

  return "Ready";
}

export function TaskEditor({ task, history, categoryNameMap }: TaskEditorProps) {
  const { updateTask } = useBoard();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [expiryValue, setExpiryValue] = useState(toDateTimeLocalValue(task.expiryAt));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const lastSavedSignature = useRef(
    makeSignature({
      title: task.title,
      description: task.description,
      expiryAt: task.expiryAt,
    }),
  );
  const pendingPayload = useRef<UpdateTaskPayload | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setExpiryValue(toDateTimeLocalValue(task.expiryAt));
    setSaveState("idle");
    setMessage(null);
    lastSavedSignature.current = makeSignature({
      title: task.title,
      description: task.description,
      expiryAt: task.expiryAt,
    });
    pendingPayload.current = null;
  }, [task.id, task.title, task.description, task.expiryAt]);

  const flushSave = useEffectEvent(async (payload: UpdateTaskPayload) => {
    pendingPayload.current = payload;

    if (savingRef.current) {
      return;
    }

    savingRef.current = true;

    while (pendingPayload.current) {
      const nextPayload = pendingPayload.current;
      pendingPayload.current = null;
      setSaveState("saving");
      setMessage(null);

      try {
        await updateTask(task.id, nextPayload);
        lastSavedSignature.current = makeSignature(nextPayload);
        setSaveState("saved");
      } catch (_error) {
        setSaveState("error");
        setMessage("Could not save your latest changes.");
      }
    }

    savingRef.current = false;
  });

  useEffect(() => {
    const nextTitle = title.trim();

    if (!nextTitle) {
      setSaveState("error");
      setMessage("Title is required before the draft can be saved.");
      return;
    }

    const nextPayload = {
      title: nextTitle,
      description,
      expiryAt: toIsoFromDateTimeLocalValue(expiryValue),
    } satisfies UpdateTaskPayload;

    if (makeSignature(nextPayload) === lastSavedSignature.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void flushSave(nextPayload);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [title, description, expiryValue, flushSave]);

  const categoryName = categoryNameMap[task.categoryId] ?? "Unknown";

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Task details</CardTitle>
            <p className="text-sm text-muted-foreground">{categoryName}</p>
          </div>
          <Badge variant={saveState === "error" ? "destructive" : saveState === "saved" ? "success" : "outline"}>
            {getSaveStateLabel(saveState)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <Field>
          <FieldLabel htmlFor="task-title">Title</FieldLabel>
          <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>

        <Field>
          <FieldLabel htmlFor="task-description">Description</FieldLabel>
          <Textarea
            id="task-description"
            className="min-h-56 leading-6"
            placeholder="Task description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="task-expiry">Expiry date</FieldLabel>
          <Input id="task-expiry" type="datetime-local" value={expiryValue} onChange={(event) => setExpiryValue(event.target.value)} />
        </Field>

        <div className="border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
          <p>Updated: {formatDateTime(task.updatedAt)}</p>
          <p className="mt-1">Draft saved: {task.draftSavedAt ? formatDateTime(task.draftSavedAt) : "No draft save yet"}</p>
          {message ? <FieldMessage className="mt-2">{message}</FieldMessage> : null}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Task history</h3>
          {history.length === 0 ? (
            <div className="border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
              No activity for this task yet.
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="border bg-card px-3 py-3">
                <p className="text-sm font-medium text-foreground">{describeHistoryItem(item, categoryNameMap)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
