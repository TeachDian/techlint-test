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

export type Priority = "low" | "medium" | "high" | "urgent";

export type Task = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  expiryAt: string | null;
  position: number;
  priority: Priority | null;
  createdAt: string;
  updatedAt: string;
  draftSavedAt: string | null;
  archivedAt: string | null;
  trashedAt: string | null;
  deleteAfterAt: string | null;
};

export type TaskHistoryAction =
  | "created"
  | "moved"
  | "updated"
  | "reordered"
  | "commented"
  | "archived"
  | "trashed"
  | "restored"
  | "deleted"
  | "swapped";

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

export type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskBadge = {
  taskId: string;
  badgeId: string;
};

export type BoardFilterPreset = {
  id: string;
  name: string;
  query: string;
  startDate: string;
  endDate: string;
  priority: Priority | null;
  badgeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Board = {
  categories: Category[];
  tasks: Task[];
  history: TaskHistory[];
  comments: TaskComment[];
  badgeDefinitions: BadgeDefinition[];
  taskBadges: TaskBadge[];
  filterPresets: BoardFilterPreset[];
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
  priority?: Priority | null;
  badgeIds?: string[];
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string;
  expiryAt?: string | null;
  priority?: Priority | null;
  badgeIds?: string[];
};

export type MoveTaskPayload = {
  categoryId: string;
  position: number;
  swapWithTaskId?: string | null;
};

export type CreateTaskCommentPayload = {
  body: string;
};

export type CreateBadgeDefinitionPayload = {
  title: string;
  description?: string;
  color: string;
};

export type UpdateBadgeDefinitionPayload = CreateBadgeDefinitionPayload;

export type CreateBoardFilterPresetPayload = {
  name: string;
  query?: string;
  startDate?: string;
  endDate?: string;
  priority?: Priority | null;
  badgeId?: string | null;
};

export type UpdateBoardFilterPresetPayload = CreateBoardFilterPresetPayload;
