import { Request, Response, NextFunction } from "express";

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !(user as any).permissions || !(user as any).permissions.includes(permission)) {
      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  };
};
