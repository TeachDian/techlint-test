import { useState } from "react";
import { ApiError } from "@client/lib/api";
import { Button } from "@client/components/ui/button";
import { FieldMessage } from "@client/components/ui/field";
import { Input } from "@client/components/ui/input";

type CreateCategoryFormProps = {
  onCreate: (name: string) => Promise<void>;
  size?: "default" | "sm";
};

export function CreateCategoryForm({ onCreate, size = "default" }: CreateCategoryFormProps) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      await onCreate(name);
      setName("");
      setOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.fieldErrors?.name ?? error.message);
      } else {
        setMessage("Could not create the category.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size={size} variant="outline">
        Add category
      </Button>
    );
  }

  return (
    <form className="flex w-full flex-col gap-2 sm:w-72" onSubmit={handleSubmit}>
      <Input placeholder="New category name" value={name} onChange={(event) => setName(event.target.value)} />
      {message ? <FieldMessage>{message}</FieldMessage> : null}
      <div className="flex gap-2">
        <Button disabled={busy} size={size} type="submit">
          {busy ? "Adding..." : "Save"}
        </Button>
        <Button
          onClick={() => {
            setOpen(false);
            setMessage(null);
            setName("");
          }}
          size={size}
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
