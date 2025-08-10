import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        uid: string;
        name?: string;
        email?: string;
        role: any;
        permissions?: string[];
      };
    }
  }
}
