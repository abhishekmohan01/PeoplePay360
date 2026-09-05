import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Express Error Handler:", err);
  const status = typeof err.statusCode === "number" ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    error: true,
    message,
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
