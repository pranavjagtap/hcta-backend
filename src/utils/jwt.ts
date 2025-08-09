import jwt from "jsonwebtoken";
import { getPermissionsForRole } from "../services/roleService";

export const generateToken = async (user: any): Promise<string> => {
  console.log("======== generate token");

  const permissions = await getPermissionsForRole(user.role);
  console.log("======== permissions", permissions);

  return jwt.sign(
    {
      id: user._id,
      uid: user.uid,
      email: user.email,
      role: user.role,
      permissions: permissions || [],
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
};
