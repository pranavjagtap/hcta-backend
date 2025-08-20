import { Request, Response, NextFunction } from "express";
import { RolePermissionsMap } from "../config/roles";
import { UserRole } from "../config/constants";

export const authorize =
  (requiredPermissions: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    console.log("🔐 Authorization check - Required permissions:", requiredPermissions);
    console.log("🔐 User:", { uid: user?.uid, role: user?.role, permissions: user?.permissions });

    if (!user || !user.role) {
      console.log("🔐 No user or role found");
      res.status(401).json({ error: "Unauthorized: No role found" });
      return;
    }
    const roleCode = (user.role as any).code ?? user.role;

    const userPermissions: string[] =
      user.permissions || RolePermissionsMap[roleCode as UserRole] || [];

    console.log("🔐 User permissions:", userPermissions);

    const hasAccess = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    console.log("🔐 Has access:", hasAccess);

    if (!hasAccess) {
      console.log("🔐 Access denied - missing permissions:", requiredPermissions.filter(perm => !userPermissions.includes(perm)));
      res.status(403).json({ error: "Forbidden: Permission denied" });
      return;
    }

    console.log("🔐 Access granted");
    next();
  };
