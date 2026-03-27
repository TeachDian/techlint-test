import { useState } from "react";
import { ApiError } from "@client/lib/api";
import { toIsoFromDateTimeLocalValue } from "@client/lib/date";
import { Button } from "@client/components/ui/button";
import { FieldMessage } from "@client/components/ui/field";
import { Input } from "@client/components/ui/input";
import { Textarea } from "@client/components/ui/textarea";

type CreateTaskFormProps = {
  categoryId: string;
  onCreate: (payload: { categoryId: string; title: string; description?: string; expiryAt?: string | null }) => Promise<void>;
};

export function CreateTaskForm({ categoryId, onCreate }: CreateTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiryValue, setExpiryValue] = useState("");
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
      });
      setTitle("");
      setDescription("");
      setExpiryValue("");
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
