// models/permissions.ts

import mongoose, { Schema, Document } from "mongoose";

export interface PermissionDocument extends Document {
  code: string;
  name: string; // ✅ Add this
  description?: string;
  module?: string;
}

const permissionSchema = new Schema<PermissionDocument>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // ✅ Add this
    description: { type: String },
    module: { type: String },
  },
  { timestamps: true }
);

export const Permission = mongoose.model<PermissionDocument>(
  "Permission",
  permissionSchema
);
