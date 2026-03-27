import { useState } from "react";
import { ApiError } from "@client/lib/api";
import { cn } from "@client/lib/cn";
import { Button } from "@client/components/ui/button";
import { FieldMessage } from "@client/components/ui/field";
import { Input } from "@client/components/ui/input";

type CreateCategoryFormProps = {
  onCreate: (name: string) => Promise<void>;
  size?: "default" | "sm";
  variant?: "inline" | "panel";
};

export function CreateCategoryForm({ onCreate, size = "default", variant = "inline" }: CreateCategoryFormProps) {
  const isPanel = variant === "panel";
  const [name, setName] = useState("");
  const [open, setOpen] = useState(isPanel);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      await onCreate(name);
      setName("");
      if (!isPanel) {
        setOpen(false);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.fieldErrors?.name ?? error.message);
      } else {
        setMessage("Could not create the stage.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open && !isPanel) {
    return (
      <Button onClick={() => setOpen(true)} size={size} variant="outline">
        Add stage
      </Button>
    );
  }

  return (
    <form className={cn("category-form-shell", isPanel ? "category-form-shell-panel" : "sm:w-72")} onSubmit={handleSubmit}>
      <Input placeholder="New stage name" value={name} onChange={(event) => setName(event.target.value)} />
      {message ? <FieldMessage>{message}</FieldMessage> : null}
      <div className="category-form-actions">
        <Button className={cn(isPanel && "sm:flex-1")} disabled={busy} size={size} type="submit">
          {busy ? "Adding..." : "Save stage"}
        </Button>
        {!isPanel ? (
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
        ) : null}
      </div>
    </form>
  );
}

