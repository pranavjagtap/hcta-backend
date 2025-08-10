import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import "../types/express";
import { 
  createUserSchema, 
  updateUserSchema, 
  createUserWithRoleSchema,
  userQuerySchema 
} from "../validators/user";
import {
  createUser,
  createUserByRoleName,
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  getUserStats as getStatsFromService,
  checkEmailExists,
  checkUidExists,
} from "../services/user";
import { UserBase, UserDocument, UserUpdate, UserStats } from "../types/user";
import {
  CreateUserRequest,
  CreateUserWithRoleRequest,
  UpdateUserRequest,
  UserQueryRequest,
  ChangePasswordRequest,
  ToggleStatusRequest,
  UserResponse,
  UserListResponse,
  UserStatsResponse as UserStatsResponseType,
  ApiResponse,
  DeleteUserResponse
} from "../interfaces/user.interface";

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if creating with role name or role ID
    const isRoleNameProvided = req.body.roleName && !req.body.role;
    
    if (isRoleNameProvided) {
      // Use role name schema
      const parsed = createUserWithRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ 
          success: false,
          error: "Validation failed",
          details: parsed.error.errors 
        });
        return;
      }

      // Check for duplicate email and UID
      const emailExists = await checkEmailExists(parsed.data.email);
      if (emailExists) {
        res.status(400).json({
          success: false,
          error: "Email already exists",
        });
        return;
      }

      const uidExists = await checkUidExists(parsed.data.uid);
      if (uidExists) {
        res.status(400).json({
          success: false,
          error: "UID already exists",
        });
        return;
      }

      const user = await createUserByRoleName(parsed.data);
      res.status(201).json({
        success: true,
        data: user,
        message: "User created successfully",
      });
    } else {
      // Use role ID schema
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ 
          success: false,
          error: "Validation failed",
          details: parsed.error.errors 
        });
        return;
      }

      // Check for duplicate email and UID
      const emailExists = await checkEmailExists(parsed.data.email);
      if (emailExists) {
        res.status(400).json({
          success: false,
          error: "Email already exists",
        });
        return;
      }

      const uidExists = await checkUidExists(parsed.data.uid);
      if (uidExists) {
        res.status(400).json({
          success: false,
          error: "UID already exists",
        });
        return;
      }

      const user = await createUser(parsed.data);
      res.status(201).json({
        success: true,
        data: user,
        message: "User created successfully",
      });
    }
  } catch (err: any) {
    res.status(500).json({ 
      success: false,
      error: "Failed to create user", 
      details: err.message || err 
    });
  }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const queryValidation = userQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: queryValidation.error.errors,
      });
      return;
    }

    const { page = 1, limit = 10, search, role, isActive, city } = queryValidation.data;

    // Build filters
    const filters: any = { isDeleted: false };
    
    if (role) {
      filters.role = role;
    }
    
    if (isActive !== undefined) {
      filters.isActive = isActive;
    }
    
    if (city) {
      filters.city = city;
    }

    // Use enhanced service with pagination and search
    const result = await getAllUsers(filters, {
      page,
      limit,
      search,
      populate: true,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch users", 
      details: err.message || err 
    });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle profile route (no ID parameter)
    const id = req.params.id || req.user?._id;
    
    if (!id) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    if (!isValidObjectId(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    // For profile route, ensure user can only access their own profile
    if (req.route.path === "/profile" && id !== req.user?._id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const user = await getUserById(id);
    if (!user || user.isDeleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch user", 
      details: err 
    });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle profile route (no ID parameter)
    const id = req.params.id || req.user?._id;
    
    if (!id) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    if (!isValidObjectId(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    // For profile route, ensure user can only update their own profile
    if (req.route.path === "/profile" && id !== req.user?._id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ 
        success: false,
        error: "Validation failed",
        details: parsed.error.errors 
      });
      return;
    }

    // Check for duplicate email if email is being updated
    if (parsed.data.email) {
      const emailExists = await checkEmailExists(parsed.data.email, id);
      if (emailExists) {
        res.status(400).json({
          success: false,
          error: "Email already exists",
        });
        return;
      }
    }

    // Check for duplicate UID if UID is being updated
    if (parsed.data.uid) {
      const uidExists = await checkUidExists(parsed.data.uid, id);
      if (uidExists) {
        res.status(400).json({
          success: false,
          error: "UID already exists",
        });
        return;
      }
    }

    const user = await updateUser(id, parsed.data);
    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: "Failed to update user", 
      details: err 
    });
  }
};

export const softDelete = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      res.status(400).json({ 
        success: false,
        error: "Invalid ID" 
      });
      return;
    }

    // Prevent users from deleting themselves
    if (id === req.user?._id) {
      res.status(400).json({
        success: false,
        error: "Cannot delete your own account",
      });
      return;
    }

    const user = await softDeleteUser(id);
    res.status(200).json({
      success: true,
      data: user,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: "Failed to delete user", 
      details: err 
    });
  }
};

// Get user statistics (for admin dashboard)
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getStatsFromService();
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch user statistics",
      details: err.message || err,
    });
  }
};

// Change user password (admin only)
export const changeUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
      return;
    }

    // This would require updating the user service to handle password changes
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      message: "Password change functionality to be implemented in user service",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to change password",
      details: err,
    });
  }
};

// Toggle user active status
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    // Prevent admins from deactivating themselves
    if (id === req.user?._id) {
      res.status(400).json({
        success: false,
        error: "Cannot change your own account status",
      });
      return;
    }

    const user = await getUserById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Toggle the isActive status instead of isDeleted
    const updatedUser = await updateUser(id, { isActive: !user.isActive });

    if (!updatedUser) {
      res.status(500).json({
        success: false,
        error: "Failed to update user status",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: `User ${!updatedUser.isActive ? "deactivated" : "activated"} successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to toggle user status",
      details: err,
    });
  }
};
