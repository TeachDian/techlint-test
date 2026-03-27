import type { DragEvent } from "react";

function createPreviewElement(label: string, kind: "task" | "stage") {
  const preview = document.createElement("div");
  preview.className = `drag-preview drag-preview-${kind}`;
  preview.textContent = label;
  document.body.appendChild(preview);
  return preview;
}

export function attachDragPreview(event: DragEvent<HTMLElement>, label: string, kind: "task" | "stage") {
  if (typeof document === "undefined" || !event.dataTransfer) {
    return () => {};
  }

  const preview = createPreviewElement(label, kind);
  event.dataTransfer.setDragImage(preview, 20, 18);

  const cleanup = () => {
    preview.remove();
  };

  window.setTimeout(cleanup, 0);
  return cleanup;
}
