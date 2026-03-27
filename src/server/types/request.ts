import type { Request } from "express";
import type { User } from "../../shared/api.js";

export type AppRequest = Request & {
  user: User | null;
  sessionToken: string | null;
};

export function toAppRequest(request: Request) {
  return request as AppRequest;
}
