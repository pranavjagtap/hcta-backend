import mongoose, { Document, Schema } from "mongoose";
import { UserDocument } from "../types/user";

const userSchema = new Schema<UserDocument>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, index: true },
    email: { type: String, index: true },
    mobile: String,
    profileImageUrl: String,
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    preferredLanguage: String,
    city: String,
    region: String,
    isActive: { type: Boolean, default: true },
    firebaseToken: String,
    registeredAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>("User", userSchema);
