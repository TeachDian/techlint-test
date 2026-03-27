import { useState } from "react";
import type { Priority } from "@shared/api";
import { ApiError } from "@client/lib/api";
import { toIsoFromDateTimeLocalValue } from "@client/lib/date";
import { PRIORITY_OPTIONS } from "@client/lib/task-priority";
import { Button } from "@client/components/ui/button";
import { FieldMessage } from "@client/components/ui/field";
import { Input } from "@client/components/ui/input";
import { Textarea } from "@client/components/ui/textarea";

type CreateTaskFormProps = {
  categoryId: string;
  onCreate: (payload: { categoryId: string; title: string; description?: string; expiryAt?: string | null; priority?: Priority | null }) => Promise<void>;
};

export function CreateTaskForm({ categoryId, onCreate }: CreateTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiryValue, setExpiryValue] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      await onCreate({
        categoryId,
        title,
        description,
        expiryAt: toIsoFromDateTimeLocalValue(expiryValue),
        priority: priority || null,
      });
      setTitle("");
      setDescription("");
      setExpiryValue("");
      setPriority("");
      setOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.fieldErrors?.title ?? error.message);
      } else {
        setMessage("Could not create the task.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button className="mt-4 w-full" onClick={() => setOpen(true)} variant="outline">
        Add task
      </Button>
    );
  }

  return (
    <form className="mt-4 space-y-3 border bg-muted/40 p-4" onSubmit={handleSubmit}>
      <Input placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <Textarea className="min-h-24" placeholder="Short description" value={description} onChange={(event) => setDescription(event.target.value)} />
      <Input type="datetime-local" value={expiryValue} onChange={(event) => setExpiryValue(event.target.value)} />
      <select
        className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
        value={priority}
        onChange={(event) => setPriority(event.target.value as Priority | "")}
      >
        <option value="">No priority</option>
        {PRIORITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {message ? <FieldMessage>{message}</FieldMessage> : null}
      <div className="flex gap-2">
        <Button disabled={busy} type="submit">
          {busy ? "Saving..." : "Create"}
        </Button>
        <Button
          onClick={() => {
            setOpen(false);
            setMessage(null);
          }}
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
