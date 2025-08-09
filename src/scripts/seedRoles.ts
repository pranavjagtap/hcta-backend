import { Role } from "../models/roles";
import { Permission } from "../models/permissions";
import { Types } from "mongoose";

// ========================
// ✅ INITIAL ROLES + MATRIX
// ========================

export const rolesWithPermissions = {
  admin: [
    "worker:create",
    "worker:view",
    "attendance:mark",
    "salary:create",
    "salary:view",
    "advance:approve",
    "expense:log",
    "dashboard:view",
  ],
  manager: [
    "worker:view",
    "attendance:mark",
    "salary:view",
    "advance:approve",
    "dashboard:view",
  ],
  hr: ["worker:create", "worker:view", "salary:view", "attendance:mark"],
  accountant: [
    "salary:view",
    "salary:create",
    "advance:approve",
    "expense:log",
  ],
  viewer: ["dashboard:view", "worker:view"],
};

export const seedRoles = async () => {
  console.log("🔁 Seeding roles...");

  for (const [roleName, permissionCodes] of Object.entries(
    rolesWithPermissions
  )) {
    const permissions = await Permission.find({
      code: { $in: permissionCodes },
    });

    if (permissions.length !== permissionCodes.length) {
      const foundCodes = permissions.map((p) => p.code);
      const missing = permissionCodes.filter((c) => !foundCodes.includes(c));
      console.warn(`⚠️  Missing permissions for role '${roleName}':`, missing);
    }

    const role = await Role.findOneAndUpdate(
      { name: roleName },
      {
        name: roleName,
        permissions: permissions.map((p) => p._id as Types.ObjectId),
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Role seeded: ${role.name}`);
  }

  console.log("✅ Roles seeding complete.\n");
};
