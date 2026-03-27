import { Router } from "express";
import { z } from "zod";
import { handleRoute } from "../lib/http.js";
import { requireUser } from "../middleware/auth.js";
import type { BoardService } from "../services/board-service.js";
import { toAppRequest } from "../types/request.js";

const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(40, "Category name must be 40 characters or less."),
});

const badgeSchema = z.object({
  title: z.string().trim().min(1, "Badge title is required.").max(40, "Badge title must be 40 characters or less."),
  description: z.string().max(240, "Badge description must be 240 characters or less.").optional(),
  color: z.string().trim().min(3, "Badge color is required.").max(32, "Badge color must be 32 characters or less."),
});

const filterPresetSchema = z.object({
  name: z.string().trim().min(1, "Preset name is required.").max(40, "Preset name must be 40 characters or less."),
  query: z.string().max(200, "Search text must be 200 characters or less.").optional(),
  startDate: z.string().max(32, "Start date must be 32 characters or less.").optional(),
  endDate: z.string().max(32, "End date must be 32 characters or less.").optional(),
  priority: z.union([prioritySchema, z.null()]).optional(),
  badgeId: z.union([z.string().uuid("Choose a valid badge."), z.null()]).optional(),
});

const createTaskSchema = z.object({
  categoryId: z.string().uuid("Choose a valid category."),
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or less."),
  description: z.string().max(5000, "Description must be 5000 characters or less.").optional(),
  expiryAt: z.union([z.string(), z.null()]).optional(),
  priority: z.union([prioritySchema, z.null()]).optional(),
  badgeIds: z.array(z.string().uuid("Choose valid badges.")).max(12, "Pick 12 badges or fewer.").optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or less.").optional(),
  description: z.string().max(5000, "Description must be 5000 characters or less.").optional(),
  expiryAt: z.union([z.string(), z.null()]).optional(),
  priority: z.union([prioritySchema, z.null()]).optional(),
  badgeIds: z.array(z.string().uuid("Choose valid badges.")).max(12, "Pick 12 badges or fewer.").optional(),
});

const moveTaskSchema = z.object({
  categoryId: z.string().uuid("Choose a valid category."),
  position: z.number().int().min(0, "Position must be zero or more."),
  swapWithTaskId: z.union([z.string().uuid("Choose a valid task."), z.null()]).optional(),
});

const createTaskCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment text is required.").max(2000, "Comment text must be 2000 characters or less."),
});

export function createBoardRouter(boardService: BoardService) {
  const router = Router();

  router.use(requireUser);

  router.get(
    "/",
    handleRoute((request, response) => {
      response.json({ board: boardService.getBoard(toAppRequest(request).user!.id) });
    }),
  );

  router.post(
    "/categories",
    handleRoute((request, response) => {
      const payload = createCategorySchema.parse(request.body);
      response.status(201).json({ board: boardService.createCategory(toAppRequest(request).user!.id, payload) });
    }),
  );

  router.post(
    "/badges",
    handleRoute((request, response) => {
      const payload = badgeSchema.parse(request.body);
      response.status(201).json({ board: boardService.createBadgeDefinition(toAppRequest(request).user!.id, payload) });
    }),
  );

  router.patch(
    "/badges/:badgeId",
    handleRoute((request, response) => {
      const payload = badgeSchema.parse(request.body);
      const badgeId = String(request.params.badgeId);
      response.json({ board: boardService.updateBadgeDefinition(toAppRequest(request).user!.id, badgeId, payload) });
    }),
  );

  router.delete(
    "/badges/:badgeId",
    handleRoute((request, response) => {
      const badgeId = String(request.params.badgeId);
      response.json({ board: boardService.deleteBadgeDefinition(toAppRequest(request).user!.id, badgeId) });
    }),
  );

  router.post(
    "/filter-presets",
    handleRoute((request, response) => {
      const payload = filterPresetSchema.parse(request.body);
      response.status(201).json({ board: boardService.createFilterPreset(toAppRequest(request).user!.id, payload) });
    }),
  );

  router.patch(
    "/filter-presets/:presetId",
    handleRoute((request, response) => {
      const payload = filterPresetSchema.parse(request.body);
      const presetId = String(request.params.presetId);
      response.json({ board: boardService.updateFilterPreset(toAppRequest(request).user!.id, presetId, payload) });
    }),
  );

  router.delete(
    "/filter-presets/:presetId",
    handleRoute((request, response) => {
      const presetId = String(request.params.presetId);
      response.json({ board: boardService.deleteFilterPreset(toAppRequest(request).user!.id, presetId) });
    }),
  );

  router.post(
    "/tasks",
    handleRoute((request, response) => {
      const payload = createTaskSchema.parse(request.body);
      response.status(201).json({ board: boardService.createTask(toAppRequest(request).user!.id, payload) });
    }),
  );

  router.patch(
    "/tasks/:taskId",
    handleRoute((request, response) => {
      const payload = updateTaskSchema.parse(request.body);
      const taskId = String(request.params.taskId);
      response.json({ board: boardService.updateTask(toAppRequest(request).user!.id, taskId, payload) });
    }),
  );

  router.post(
    "/tasks/:taskId/move",
    handleRoute((request, response) => {
      const payload = moveTaskSchema.parse(request.body);
      const taskId = String(request.params.taskId);
      response.json({ board: boardService.moveTask(toAppRequest(request).user!.id, taskId, payload) });
    }),
  );

  router.post(
    "/tasks/:taskId/comments",
    handleRoute((request, response) => {
      const payload = createTaskCommentSchema.parse(request.body);
      const taskId = String(request.params.taskId);
      response.status(201).json({ board: boardService.addTaskComment(toAppRequest(request).user!.id, taskId, payload) });
    }),
  );

  router.post(
    "/tasks/:taskId/archive",
    handleRoute((request, response) => {
      const taskId = String(request.params.taskId);
      response.json({ board: boardService.archiveTask(toAppRequest(request).user!.id, taskId) });
    }),
  );

  router.post(
    "/tasks/:taskId/trash",
    handleRoute((request, response) => {
      const taskId = String(request.params.taskId);
      response.json({ board: boardService.trashTask(toAppRequest(request).user!.id, taskId) });
    }),
  );

  router.post(
    "/tasks/:taskId/restore",
    handleRoute((request, response) => {
      const taskId = String(request.params.taskId);
      response.json({ board: boardService.restoreTask(toAppRequest(request).user!.id, taskId) });
    }),
  );

  router.delete(
    "/tasks/:taskId",
    handleRoute((request, response) => {
      const taskId = String(request.params.taskId);
      response.json({ board: boardService.deleteTask(toAppRequest(request).user!.id, taskId) });
    }),
  );

  return router;
}
