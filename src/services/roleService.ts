import { Role } from "../models/roles";

// export const getPermissionsForRole = async (roleCodeOrId: string) => {
//   const role = await Role.findOne({
//     $or: [{ _id: roleCodeOrId }, { code: roleCodeOrId }],
//   }).populate("permissions");

//   return role?.permissions.map((p: any) => p.code) || [];
// };

import mongoose from "mongoose";

export const getPermissionsForRole = async (roleCodeOrId: string) => {
  const query = mongoose.isValidObjectId(roleCodeOrId)
    ? { _id: roleCodeOrId }
    : { code: roleCodeOrId };

  console.log("====== query", query);

  const role = await Role.findOne(query).populate("permissions");
  console.log("===== role", role);

  return role?.permissions.map((p: any) => p.code) || [];
};
