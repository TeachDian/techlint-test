const DUE_SOON_WINDOW_MS = 1000 * 60 * 60 * 24;

type ExpiryTone = "normal" | "warning" | "overdue";

export type ExpiryState = {
  tone: ExpiryTone;
  label: string;
  detail: string | null;
  isNearExpiry: boolean;
  isOverdue: boolean;
};

function pluralize(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

function formatDistance(ms: number) {
  const minutes = Math.max(1, Math.round(ms / (1000 * 60)));

  if (minutes < 60) {
    return pluralize(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return pluralize(hours, "hour");
  }

  const days = Math.round(hours / 24);
  return pluralize(days, "day");
}

export function getExpiryState(expiryAt: string | null, now = new Date()): ExpiryState {
  if (!expiryAt) {
    return {
      tone: "normal",
      label: "No deadline",
      detail: null,
      isNearExpiry: false,
      isOverdue: false,
    };
  }

  const targetDate = new Date(expiryAt);
  const diff = targetDate.getTime() - now.getTime();

  if (diff < 0) {
    return {
      tone: "overdue",
      label: "Overdue",
      detail: `${formatDistance(Math.abs(diff))} late`,
      isNearExpiry: true,
      isOverdue: true,
    };
  }

  if (diff <= DUE_SOON_WINDOW_MS) {
    return {
      tone: "warning",
      label: "Due soon",
      detail: `In ${formatDistance(diff)}`,
      isNearExpiry: true,
      isOverdue: false,
    };
  }

  return {
    tone: "normal",
    label: "Scheduled",
    detail: formatDateTime(expiryAt),
    isNearExpiry: false,
    isOverdue: false,
  };
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ];
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ];

  return `${parts.join("-")}T${time.join(":")}`;
}

export function toIsoFromDateTimeLocalValue(value: string) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}
