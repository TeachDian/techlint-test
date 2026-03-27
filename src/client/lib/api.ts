import type {
  AuthResponse,
  BoardResponse,
  CreateCategoryPayload,
  CreateTaskPayload,
  ErrorResponse,
  LoginPayload,
  MoveTaskPayload,
  RegisterPayload,
  SessionResponse,
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
    throw new ApiError(
      response.status,
      errorBody?.message ?? "Request failed.",
      errorBody?.fieldErrors,
    );
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
};
