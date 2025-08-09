import { Request, Response, NextFunction } from "express";
import { RolePermissionsMap } from "../config/roles";
import { UserRole } from "../config/constants";

export const authorize =
  (requiredPermissions: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !user.role) {
      res.status(401).json({ error: "Unauthorized: No role found" });
      return;
    }
    const roleCode = (user.role as any).code ?? user.role;

    const userPermissions: string[] =
      user.permissions || RolePermissionsMap[roleCode as UserRole] || [];

    const hasAccess = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAccess) {
      res.status(403).json({ error: "Forbidden: Permission denied" });
      return;
    }

    next();
  };
