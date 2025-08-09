import mongoose from "mongoose";
import dotenv from "dotenv";
import { Permission } from "../models/permissions";
import { Role } from "../models/roles";
import { RolePermissionsMap } from "../config/roles";
import { UserRole } from "../config/constants";

dotenv.config();

const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/hcta";

export const seed = async () => {
  try {
    await mongoose.connect(dbUri);
    console.log("✅ MongoDB connected");

    const allPermissionCodes = new Set<string>();

    // Step 1: Insert permissions
    for (const permissions of Object.values(RolePermissionsMap)) {
      permissions.forEach((code) => allPermissionCodes.add(code));
    }

    const permissionDocs = [];
    for (const code of allPermissionCodes) {
      const name = code
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const existing = await Permission.findOne({ code });
      if (!existing) {
        const newPerm = await Permission.create({ code, name });
        permissionDocs.push(newPerm);
        console.log(`🟢 Created permission: ${code}`);
      } else {
        permissionDocs.push(existing);
      }
    }

    const codeToIdMap: Record<string, any> = {};
    permissionDocs.forEach((perm) => {
      codeToIdMap[perm.code] = perm._id;
    });

    // Step 2: Insert roles
    for (const [roleCode, permissionCodes] of Object.entries(
      RolePermissionsMap
    )) {
      const name = roleCode.toLowerCase();
      const permissionIds = permissionCodes.map((code) => codeToIdMap[code]);

      const existingRole = await Role.findOne({ code: roleCode });
      if (existingRole) {
        await Role.findByIdAndUpdate(existingRole._id, {
          $set: { name, permissions: permissionIds },
        });
        console.log(`🟡 Updated role: ${roleCode}`);
      } else {
        await Role.create({ code: roleCode, name, permissions: permissionIds });
        console.log(`🟢 Created role: ${roleCode}`);
      }
    }

    console.log("✅ Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};
