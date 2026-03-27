import type { NextFunction, RequestHandler, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  statusCode: number;
  fieldErrors?: Record<string, string>;

  constructor(statusCode: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export function handleRoute(handler: RequestHandler): RequestHandler {
  return (request, response, next) => {
    try {
      handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

export function sendError(response: Response, error: unknown) {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      message: error.message,
      fieldErrors: error.fieldErrors,
    });
    return;
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};

    for (const issue of error.issues) {
      const path = issue.path.join(".") || "form";
      fieldErrors[path] = issue.message;
    }

    response.status(400).json({
      message: "Please check the form and try again.",
      fieldErrors,
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    message: "Something went wrong. Please try again.",
  });
}

export function requireRecord<T>(record: T | null | undefined, message: string) {
  if (!record) {
    throw new HttpError(404, message);
  }

  return record;
}

export function nextFunction(error: unknown, next: NextFunction) {
  next(error);
}
