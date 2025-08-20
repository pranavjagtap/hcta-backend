import { Request, Response, NextFunction } from "express";
import { authProvider } from "../auth"; // ✅ Your Firebase auth utility
import { User } from "../models/user"; // ✅ Your new user model
import { getPermissionsForRole } from "../services/roleService";
import jwt from "jsonwebtoken";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    console.log("🔍 No token provided");
    res.status(401).json({ error: "Token missing" });
    return;
  }

  console.log("🔍 Token received:", token.substring(0, 50) + "...");

  try {
    let user: any = null;
    let uid: string | null = null;

    // Try to verify as JWT token first
    try {
      console.log("🔍 Attempting JWT verification...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log("🔍 JWT verification successful");
      console.log("🔍 Decoded user:", { id: decoded.id, uid: decoded.uid, email: decoded.email, permissions: decoded.permissions });
      
      uid = decoded.uid;
      
      // For JWT tokens, we can use the decoded user info directly
      if (decoded.id && decoded.uid && decoded.email) {
        // If JWT doesn't have permissions or they're empty, fetch from database
        let permissions = decoded.permissions || [];
        if (!permissions || permissions.length === 0) {
          console.log("🔍 JWT has no permissions, fetching from database...");
          permissions = await getPermissionsForRole(decoded.role);
          console.log("🔍 Permissions fetched from database:", permissions);
        }
        
        user = {
          _id: decoded.id,
          uid: decoded.uid,
          email: decoded.email,
          role: decoded.role,
          permissions: permissions,
        };
        console.log("🔍 User set from JWT:", { uid: user.uid, permissions: user.permissions });
      }
    } catch (jwtError) {
      console.log("🔍 JWT verification failed:", jwtError);
      // If JWT verification fails, try Firebase token
      try {
        console.log("🔍 Attempting Firebase verification...");
        const decoded = await authProvider.verifyToken(token);
        uid = authProvider.getUserId(decoded);
        console.log("🔍 Firebase verification successful, UID:", uid);
      } catch (firebaseError) {
        console.error("🔍 Both JWT and Firebase token verification failed:", { jwtError, firebaseError });
        res.status(403).json({ error: "Invalid or expired token" });
        return;
      }
    }

    // If we don't have user info from JWT, fetch from database
    if (!user && uid) {
      console.log("🔍 Fetching user from database for UID:", uid);
      const dbUser = await User.findOne({
        uid,
        isDeleted: false,
      })
        .populate("role")
        .lean();

      if (!dbUser || !dbUser.role || typeof dbUser.role !== "object") {
        console.log("🔍 User not found in database or role missing");
        res.status(403).json({ error: "User not registered or role not found" });
        return;
      }

      const permissions = await getPermissionsForRole(dbUser.role.toString());
      console.log("🔍 Permissions from database:", permissions);

      user = {
        _id: dbUser.id,
        uid: dbUser.uid,
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email,
        permissions,
      };
    }

    if (!user) {
      console.log("🔍 No user found");
      res.status(403).json({ error: "User not found" });
      return;
    }

    console.log("🔍 Final user object:", { uid: user.uid, permissions: user.permissions });

    // ✅ Step 3: Attach user info to request object
    req.user = user;

    next();
  } catch (err) {
    console.error("🔥 Auth Error:", err);
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
};
