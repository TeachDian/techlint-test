export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  position: number;
  taskCount: number;
};

export type Task = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  expiryAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  draftSavedAt: string | null;
};

export type TaskHistoryAction = "created" | "moved" | "updated" | "reordered" | "commented";

export type TaskHistory = {
  id: string;
  taskId: string;
  action: TaskHistoryAction;
  fromCategoryId: string | null;
  toCategoryId: string | null;
  note: string | null;
  createdAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type Board = {
  categories: Category[];
  tasks: Task[];
  history: TaskHistory[];
  comments: TaskComment[];
};

export type SessionResponse = {
  user: User | null;
};

export type AuthResponse = {
  user: User;
};

export type BoardResponse = {
  board: Board;
};

export type ErrorResponse = {
  message: string;
  fieldErrors?: Record<string, string>;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CreateCategoryPayload = {
  name: string;
};

export type CreateTaskPayload = {
  categoryId: string;
  title: string;
  description?: string;
  expiryAt?: string | null;
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string;
  expiryAt?: string | null;
};

export type MoveTaskPayload = {
  categoryId: string;
  position: number;
};

export type CreateTaskCommentPayload = {
  body: string;
};
