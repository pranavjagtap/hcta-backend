import { Request, Response, Router } from "express"; // ✅ CORRECT
import { authProvider } from "../auth"; // abstracted auth provider
import { User } from "../models/user";
import { generateToken } from "../utils/jwt";
import { VALID_ROLES } from "../config/constants";
import { Permission } from "../models/permissions"; // 👈 this line is critical
import { Role } from "../models/roles";

/**
 * Handle Firebase login via token
 */
export const loginHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    res.status(400).json({ error: "Missing firebaseToken in request body" });
    return;
  }

  try {
    const decoded = await authProvider.verifyToken(firebaseToken);
    const uid = authProvider.getUserId(decoded);

    const user = await User.findOne({ uid, isDeleted: false });

    if (!user) {
      res.status(403).json({ error: "User not registered" });
      return;
    }

    const jwtToken = await generateToken(user);
    res.status(200).json({ token: jwtToken });
    return;
  } catch (error) {
    res.status(401).json({
      error: "Login failed",
      details: error instanceof Error ? error.message : error,
    });
    return;
  }
};

/**
 * Signup new admin user from frontend
 */
export const signupHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { firebaseToken, role, name } = req.body;

  if (!firebaseToken || !name || !role) {
    res
      .status(400)
      .json({ error: "Missing required fields: firebaseToken, name, role" });
    return;
  }

  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({
      error: `Invalid role. Allowed roles: ${VALID_ROLES.join(", ")}`,
    });
    return;
  }

  try {
    const decoded = await authProvider.verifyToken(firebaseToken);
    const uid = authProvider.getUserId(decoded);
    const email = decoded.email;

    if (!email) {
      res.status(400).json({ error: "Email missing from token" });
      return;
    }

    const existing = await User.findOne({ uid, isDeleted: false });

    if (existing) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    // const roleDoc = await Role.findOne({ name: role });
    const roleDoc = await Role.findOne({ code: role });

    if (!roleDoc) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    // Create new user
    const newUser = new User({
      uid,
      email,
      name,
      role: roleDoc._id,
    });

    await newUser.save();

    // Auto-login: generate token
    const jwtToken = await generateToken(newUser);

    res.status(201).json({
      message: "User registered",
      token: jwtToken,
      user: {
        uid,
        email,
        name,
        role,
      },
    });
    return;
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Signup failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
