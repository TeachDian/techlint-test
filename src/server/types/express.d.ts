import type { User } from "../../shared/api.js";

declare module "express-serve-static-core" {
  interface Request {
    user: User | null;
    sessionToken: string | null;
  }
}

export {};
