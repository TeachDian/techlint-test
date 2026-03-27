import type { Priority } from "@shared/api";

export const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function getPriorityLabel(priority: Priority | null) {
  if (!priority) {
    return "No priority";
  }

  return PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? "No priority";
}

export function getPriorityBadgeClass(priority: Priority | null) {
  if (priority === "low") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

  if (priority === "medium") {
    return "border-sky-300 bg-sky-100 text-sky-800";
  }

  if (priority === "high") {
    return "border-amber-300 bg-amber-100 text-amber-900";
  }

  if (priority === "urgent") {
    return "border-rose-300 bg-rose-100 text-rose-900";
  }

  return "border-border bg-background text-foreground";
}

export function getPriorityCardClass(priority: Priority | null) {
  if (priority === "low") {
    return "border-l-4 border-l-slate-400";
  }

  if (priority === "medium") {
    return "border-l-4 border-l-sky-500";
  }

  if (priority === "high") {
    return "border-l-4 border-l-amber-500";
  }

  if (priority === "urgent") {
    return "border-l-4 border-l-rose-500";
  }

  return "border-l-4 border-l-border";
}
