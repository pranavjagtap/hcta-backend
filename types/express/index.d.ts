import { Types } from "mongoose";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      role: Types.ObjectId;
      permissions: string[];
    }

    interface Request {
      user?: {
        _id: string;
        uid: string;
        role: { type: ObjectId; ref: "Role" };
        name?: string;
        email?: string;
        permissions: string[];
      };
    }
  }
}
