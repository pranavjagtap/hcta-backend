import { Request, Response, NextFunction } from "express";
import { STATUS } from "../utils/httpStatus";
import { HttpError } from "../utils/http";

/**
 * Centralized Express error handler middleware.
 * Compatible with existing sendError, and supports HttpError class.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Determine HTTP status
  const statusCode =
    err instanceof HttpError ? err.statusCode : STATUS.INTERNAL_SERVER_ERROR;

  // Log the error safely (only internal logging here)
  console.error("🔴 [Error]", {
    message: err.message || "Unknown error",
    method: req.method,
    url: req.originalUrl,
    user: (req as any)?.user?.uid || "anonymous",
    stack: err.stack,
  });

  // Graceful response to client
  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    error: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
