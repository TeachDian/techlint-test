import { useEffect, useState } from "react";

export type CardDensity = "comfortable" | "compact";
export type WorkspaceTabPreference = "tickets" | "archive" | "trash" | "badges";

export type BoardUiPreferences = {
  focusMode: boolean;
  cardDensity: CardDensity;
  sidebarWidth: number;
  workspaceTab: WorkspaceTabPreference;
};

const DEFAULT_PREFERENCES: BoardUiPreferences = {
  focusMode: false,
  cardDensity: "comfortable",
  sidebarWidth: 440,
  workspaceTab: "tickets",
};

function isWorkspaceTab(value: unknown): value is WorkspaceTabPreference {
  return value === "tickets" || value === "archive" || value === "trash" || value === "badges";
}

function isCardDensity(value: unknown): value is CardDensity {
  return value === "comfortable" || value === "compact";
}

function getStorageKey(userId: string) {
  return `todo-board:ui:${userId}`;
}

function normalizePreferences(value: unknown): BoardUiPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_PREFERENCES;
  }

  const record = value as Partial<BoardUiPreferences>;

  return {
    focusMode: typeof record.focusMode === "boolean" ? record.focusMode : DEFAULT_PREFERENCES.focusMode,
    cardDensity: isCardDensity(record.cardDensity) ? record.cardDensity : DEFAULT_PREFERENCES.cardDensity,
    sidebarWidth: typeof record.sidebarWidth === "number" && Number.isFinite(record.sidebarWidth) ? record.sidebarWidth : DEFAULT_PREFERENCES.sidebarWidth,
    workspaceTab: isWorkspaceTab(record.workspaceTab) ? record.workspaceTab : DEFAULT_PREFERENCES.workspaceTab,
  };
}

export function useBoardUiPreferences(userId: string | null | undefined) {
  const [preferences, setPreferences] = useState<BoardUiPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPreferences(DEFAULT_PREFERENCES);
      setHydrated(true);
      return;
    }

    try {
      const rawPreferences = window.localStorage.getItem(getStorageKey(userId));
      const nextPreferences = rawPreferences ? normalizePreferences(JSON.parse(rawPreferences)) : DEFAULT_PREFERENCES;
      setPreferences(nextPreferences);
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setHydrated(true);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !hydrated) {
      return;
    }

    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(preferences));
  }, [preferences, hydrated, userId]);

  function updatePreferences(patch: Partial<BoardUiPreferences>) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      ...patch,
    }));
  }

  return {
    preferences,
    updatePreferences,
    hydrated,
  };
}
