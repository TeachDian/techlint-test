import { useState } from "react";
import type { TaskComment } from "@shared/api";
import { formatDateTime } from "@client/lib/date";
import { ApiError } from "@client/lib/api";
import { useBoard } from "@client/contexts/BoardContext";
import { Button } from "@client/components/ui/button";
import { FieldMessage } from "@client/components/ui/field";
import { Textarea } from "@client/components/ui/textarea";

type TaskCommentsPanelProps = {
  taskId: string;
  comments: TaskComment[];
};

export function TaskCommentsPanel({ taskId, comments }: TaskCommentsPanelProps) {
  const { createTaskComment } = useBoard();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sortedComments = [...comments].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      await createTaskComment(taskId, { body });
      setBody("");
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.fieldErrors?.body ?? error.message);
      } else {
        setMessage("Could not save the comment.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack-section">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Comments</h3>
        <span className="text-xs text-muted-foreground">{sortedComments.length}</span>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Textarea
          className="min-h-24"
          maxLength={2000}
          placeholder="Add a comment for this task"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        {message ? <FieldMessage>{message}</FieldMessage> : null}
        <div className="flex justify-end">
          <Button disabled={busy || !body.trim()} type="submit">
            {busy ? "Saving..." : "Add comment"}
          </Button>
        </div>
      </form>

      {sortedComments.length === 0 ? (
        <div className="empty-state-box">No comments yet.</div>
      ) : (
        <div className="space-y-3">
          {sortedComments.map((comment) => (
            <div key={comment.id} className="panel-inset">
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{comment.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
