import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../lib/jwt";

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: true, message: "Authorization token required" });
  }

  const parts = authHeader.split(" ");
  const token = parts[1];
  if (!token) {
    return res.status(401).json({ error: true, message: "Invalid authorization header" });
  }

  const decoded = verifyJwt(token);
  if (!decoded) {
    return res.status(401).json({ error: true, message: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
}

export function optionalJWT(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const parts = authHeader.split(" ");
    const token = parts[1];
    if (token) {
      const decoded = verifyJwt(token);
      if (decoded) {
        req.user = decoded;
      }
    }
  }
  next();
}
