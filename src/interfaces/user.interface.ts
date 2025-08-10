// User Module API Contracts
// This file defines the request/response interfaces for User API endpoints

import { Request, Response } from "express";

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface CreateUserRequest {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  profileImageUrl?: string;
  role: string; // Role ID
  preferredLanguage?: string;
  city?: string;
  region?: string;
  isActive?: boolean;
  firebaseToken?: string;
  registeredAt?: string | Date;
}

export interface CreateUserWithRoleRequest {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  profileImageUrl?: string;
  roleName: "tutor" | "student" | "parent" | "admin";
  preferredLanguage?: string;
  city?: string;
  region?: string;
  isActive?: boolean;
  firebaseToken?: string;
  registeredAt?: string | Date;
}

export interface UpdateUserRequest {
  uid?: string;
  name?: string;
  email?: string;
  mobile?: string;
  profileImageUrl?: string;
  role?: string;
  preferredLanguage?: string;
  city?: string;
  region?: string;
  isActive?: boolean;
  firebaseToken?: string;
  registeredAt?: string | Date;
}

export interface UserQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  city?: string;
}

export interface ChangePasswordRequest {
  newPassword: string;
}

export interface ToggleStatusRequest {
  isActive?: boolean;
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface UserResponse {
  _id: string;
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  profileImageUrl?: string;
  role: {
    _id: string;
    name: string;
    permissions: string[];
  };
  preferredLanguage?: string;
  city?: string;
  region?: string;
  isActive: boolean;
  firebaseToken?: string;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  users: UserResponse[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserStatsResponse {
  total: number;
  active: number;
  recent: number;
  byRole: Record<string, number>;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// SPECIFIC API RESPONSES
// ============================================================================

export type CreateUserResponse = ApiResponse<UserResponse>;
export type GetUserResponse = ApiResponse<UserResponse>;
export type GetUsersResponse = ApiResponse<UserListResponse>;
export type UpdateUserResponse = ApiResponse<UserResponse>;
export type DeleteUserResponse = ApiResponse<{ message: string }>;
export type UserStatsResponse = ApiResponse<UserStatsResponse>;
export type ChangePasswordResponse = ApiResponse<{ message: string }>;
export type ToggleStatusResponse = ApiResponse<UserResponse>;

// ============================================================================
// CONTROLLER INTERFACES (for internal use)
// ============================================================================

export interface IUserController {
  create(req: Request<{}, {}, CreateUserRequest | CreateUserWithRoleRequest>, res: Response): Promise<void>;
  getAll(req: Request<{}, {}, {}, UserQueryRequest>, res: Response): Promise<void>;
  getById(req: Request<{ id?: string }>, res: Response): Promise<void>;
  update(req: Request<{ id?: string }, {}, UpdateUserRequest>, res: Response): Promise<void>;
  softDelete(req: Request<{ id: string }>, res: Response): Promise<void>;
  getUserStats(req: Request, res: Response): Promise<void>;
  changeUserPassword(req: Request<{ id: string }, {}, ChangePasswordRequest>, res: Response): Promise<void>;
  toggleUserStatus(req: Request<{ id: string }, {}, ToggleStatusRequest>, res: Response): Promise<void>;
}
