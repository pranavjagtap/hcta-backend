import mongoose, { Document, Schema } from "mongoose";

export interface UserDocument extends Document {
  uid: string;
  name?: string;
  email?: string;
  mobile?: string;
  profileImageUrl?: string;
  role: { type: Schema.Types.ObjectId; ref: "Role" };
  preferredLanguage?: string;
  city?: string;
  region?: string;
  isActive?: boolean;
  firebaseToken?: string;
  registeredAt?: Date;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, index: true },
    email: { type: String, index: true },
    mobile: String,
    profileImageUrl: String,
    role: {
      type: mongoose.Schema.Types.ObjectId,
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
