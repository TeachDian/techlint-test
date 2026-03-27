import cookieParser from "cookie-parser";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { createDatabase } from "./db/database.js";
import { sendError } from "./lib/http.js";
import { createSessionMiddleware } from "./middleware/auth.js";
import { createAuthRouter } from "./routes/auth-routes.js";
import { createBoardRouter } from "./routes/board-routes.js";
import { createAuthService } from "./services/auth-service.js";
import { createBoardService } from "./services/board-service.js";

export function createApp(options?: { databasePath?: string }) {
  const database = createDatabase(options?.databasePath);
  const authService = createAuthService(database);
  const boardService = createBoardService(database);
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(cookieParser());
  app.use(createSessionMiddleware(authService));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/auth", createAuthRouter(authService));
  app.use("/api/board", createBoardRouter(boardService));

  if (process.env.NODE_ENV === "production") {
    const clientPath = path.resolve(process.cwd(), "dist/client");

    if (fs.existsSync(clientPath)) {
      app.use(express.static(clientPath));
      app.get("*", (_request, response) => {
        response.sendFile(path.join(clientPath, "index.html"));
      });
    }
  }

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    sendError(response, error);
  });

  return {
    app,
    close() {
      database.close();
    },
  };
}
