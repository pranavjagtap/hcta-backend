import jwt from "jsonwebtoken";
import { getPermissionsForRole } from "../services/roleService";

export const generateToken = async (user: any): Promise<string> => {
  console.log("======== generate token");

  // Get role code from the populated role object
  const roleCode = user.role?.code || user.role;
  const permissions = await getPermissionsForRole(roleCode);
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
