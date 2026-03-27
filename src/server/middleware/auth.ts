import type { RequestHandler } from "express";
import { HttpError } from "../lib/http.js";
import { SESSION_COOKIE_NAME } from "../lib/security.js";
import type { AuthService } from "../services/auth-service.js";
import { toAppRequest } from "../types/request.js";

export function createSessionMiddleware(authService: AuthService): RequestHandler {
  return (request, _response, next) => {
    const appRequest = toAppRequest(request);
    const cookieValue = request.cookies?.[SESSION_COOKIE_NAME];

    appRequest.sessionToken = typeof cookieValue === "string" ? cookieValue : null;
    appRequest.user = appRequest.sessionToken ? authService.getSessionUser(appRequest.sessionToken) : null;
    next();
  };
}

export const requireUser: RequestHandler = (request, _response, next) => {
  const appRequest = toAppRequest(request);

  if (!appRequest.user) {
    next(new HttpError(401, "Please sign in to continue."));
    return;
  }

  next();
};
