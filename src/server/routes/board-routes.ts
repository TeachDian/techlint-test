import { Router } from "express";
import { z } from "zod";
import { handleRoute } from "../lib/http.js";
import { requireUser } from "../middleware/auth.js";
import type { BoardService } from "../services/board-service.js";
import { toAppRequest } from "../types/request.js";

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(40, "Category name must be 40 characters or less."),
});

const createTaskSchema = z.object({
  categoryId: z.string().uuid("Choose a valid category."),
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or less."),
  description: z.string().max(5000, "Description must be 5000 characters or less.").optional(),
  expiryAt: z.union([z.string(), z.null()]).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or less.").optional(),
  description: z.string().max(5000, "Description must be 5000 characters or less.").optional(),
  expiryAt: z.union([z.string(), z.null()]).optional(),
});

const moveTaskSchema = z.object({
  categoryId: z.string().uuid("Choose a valid category."),
  position: z.number().int().min(0, "Position must be zero or more."),
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

  return router;
}
