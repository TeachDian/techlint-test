import type {
  AuthResponse,
  BoardResponse,
  CreateBadgeDefinitionPayload,
  CreateBoardFilterPresetPayload,
  CreateCategoryPayload,
  CreateTaskCommentPayload,
  CreateTaskPayload,
  ErrorResponse,
  LoginPayload,
  MoveTaskPayload,
  RegisterPayload,
  SessionResponse,
  UpdateBadgeDefinitionPayload,
  UpdateBoardFilterPresetPayload,
  UpdateTaskPayload,
} from "@shared/api";

export class ApiError extends Error {
  statusCode: number;
  fieldErrors?: Record<string, string>;

  constructor(statusCode: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers,
  });

  const hasBody = response.status !== 204;
  const payload = hasBody ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const errorBody = payload as ErrorResponse | null;
    throw new ApiError(response.status, errorBody?.message ?? "Request failed.", errorBody?.fieldErrors);
  }

  return payload as T;
}

export const api = {
  getSession() {
    return request<SessionResponse>("/api/auth/session");
  },
  register(payload: RegisterPayload) {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: LoginPayload) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  logout() {
    return request<void>("/api/auth/logout", {
      method: "POST",
    });
  },
  getBoard() {
    return request<BoardResponse>("/api/board");
  },
  createCategory(payload: CreateCategoryPayload) {
    return request<BoardResponse>("/api/board/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteCategory(categoryId: string) {
    return request<BoardResponse>(`/api/board/categories/${categoryId}`, {
      method: "DELETE",
    });
  },
  createBadgeDefinition(payload: CreateBadgeDefinitionPayload) {
    return request<BoardResponse>("/api/board/badges", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateBadgeDefinition(badgeId: string, payload: UpdateBadgeDefinitionPayload) {
    return request<BoardResponse>(`/api/board/badges/${badgeId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteBadgeDefinition(badgeId: string) {
    return request<BoardResponse>(`/api/board/badges/${badgeId}`, {
      method: "DELETE",
    });
  },
  createFilterPreset(payload: CreateBoardFilterPresetPayload) {
    return request<BoardResponse>("/api/board/filter-presets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateFilterPreset(presetId: string, payload: UpdateBoardFilterPresetPayload) {
    return request<BoardResponse>(`/api/board/filter-presets/${presetId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteFilterPreset(presetId: string) {
    return request<BoardResponse>(`/api/board/filter-presets/${presetId}`, {
      method: "DELETE",
    });
  },
  createTask(payload: CreateTaskPayload) {
    return request<BoardResponse>("/api/board/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateTask(taskId: string, payload: UpdateTaskPayload) {
    return request<BoardResponse>(`/api/board/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  moveTask(taskId: string, payload: MoveTaskPayload) {
    return request<BoardResponse>(`/api/board/tasks/${taskId}/move`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createTaskComment(taskId: string, payload: CreateTaskCommentPayload) {
    return request<BoardResponse>(`/api/board/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  archiveTask(taskId: string) {
    return request<BoardResponse>(`/api/board/tasks/${taskId}/archive`, {
      method: "POST",
    });
  },
  trashTask(taskId: string) {
    return request<BoardResponse>(`/api/board/tasks/${taskId}/trash`, {
      method: "POST",
    });
  },
  restoreTask(taskId: string) {
    return request<BoardResponse>(`/api/board/tasks/${taskId}/restore`, {
      method: "POST",
    });
  },
  deleteTask(taskId: string) {
    return request<BoardResponse>(`/api/board/tasks/${taskId}`, {
      method: "DELETE",
    });
  },
};
