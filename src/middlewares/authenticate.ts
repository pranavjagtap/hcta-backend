import { Request, Response, NextFunction } from "express";
import { authProvider } from "../auth"; // ✅ Your Firebase auth utility
import { User, UserDocument } from "../models/user"; // ✅ Your new user model
import { getPermissionsForRole } from "../services/roleService";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    res.status(401).json({ error: "Token missing" });
    return;
  }

  try {
    // ✅ Step 1: Verify Firebase Token
    const decoded = await authProvider.verifyToken(token);
    const uid = authProvider.getUserId(decoded);

    if (!uid) {
      res.status(403).json({ error: "UID missing in token" });
      return;
    }

    // ✅ Step 2: Fetch user from DB using UID
    // const user = await User.findOne({ uid, isDeleted: false });
    const user = await User.findOne({
      uid,
      isDeleted: false,
    })
      .populate("role")
      .lean<UserDocument>();

    if (!user || !user.role || typeof user.role !== "object") {
      res.status(403).json({ error: "User not registered or role not found" });
      return;
    }

    // ✅ Convert to plain JS object with correct type
    // const typedUser = user.toObject() as UserDocument;
    const permissions = await getPermissionsForRole(user.role.toString());

    // ✅ Step 3: Attach user info to request object
    req.user = {
      _id: user.id,
      uid: user.uid,
      role: user.role,
      name: user.name,
      email: user.email,
      permissions, // ✅ dynamic
    };

    next();
  } catch (err) {
    console.error("🔥 Auth Error:", err);
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
};
