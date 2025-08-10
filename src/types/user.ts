import { Document } from "mongoose";

export type UserRole = "tutor" | "student" | "parent" | "admin";

export interface UserBase {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  profileImageUrl?: string;
  role: string | any; // ObjectId as string or ObjectId
  preferredLanguage?: string;
  city?: string;
  region?: string;
  isActive?: boolean;
  firebaseToken?: string;
  registeredAt?: Date | string;
}

export type UserUpdate = Partial<UserBase>;

export interface UserDocument extends Document, UserBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated user with role details
export interface PopulatedUserDocument extends Omit<UserDocument, 'role'> {
  role: {
    _id: string;
    name: string;
    permissions: string[];
  };
}

// User statistics interface
export interface UserStats {
  total: number;
  active: number;
  recent: number;
  byRole: Record<string, number>;
}

// User query interface
export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  city?: string;
}
