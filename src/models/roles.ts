import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g., "tutor", "admin"
    name: { type: String, required: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", roleSchema);
