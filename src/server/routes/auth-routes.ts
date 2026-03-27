import { Router } from "express";
import { z } from "zod";
import { handleRoute } from "../lib/http.js";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "../lib/security.js";
import type { AuthService } from "../services/auth-service.js";
import { toAppRequest } from "../types/request.js";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60, "Name must be 60 characters or less."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export function createAuthRouter(authService: AuthService) {
  const router = Router();

  router.get(
    "/session",
    handleRoute((request, response) => {
      response.json({ user: toAppRequest(request).user });
    }),
  );

  router.post(
    "/register",
    handleRoute((request, response) => {
      const payload = registerSchema.parse(request.body);
      const result = authService.registerUser(payload);

      // Store the session in a secure cookie so the browser does not expose it to scripts.
      response.cookie(SESSION_COOKIE_NAME, result.sessionToken, getSessionCookieOptions());
      response.status(201).json({ user: result.user });
    }),
  );

  router.post(
    "/login",
    handleRoute((request, response) => {
      const payload = loginSchema.parse(request.body);
      const result = authService.loginUser(payload);

      response.cookie(SESSION_COOKIE_NAME, result.sessionToken, getSessionCookieOptions());
      response.json({ user: result.user });
    }),
  );

  router.post(
    "/logout",
    handleRoute((request, response) => {
      authService.clearSession(toAppRequest(request).sessionToken);
      response.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
      response.status(204).send();
    }),
  );

  return router;
}
