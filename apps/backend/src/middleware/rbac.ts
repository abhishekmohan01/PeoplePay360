import type { Request, Response, NextFunction } from "express";

export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }

    const userRoles = req.user.roles || [];
    // ADMIN has universal access
    if (userRoles.includes("ADMIN")) {
      return next();
    }

    const hasRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        error: true,
        message: `Forbidden: Requires one of roles: [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
}
