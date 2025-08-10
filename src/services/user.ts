import { User } from "../models/user";
import { FilterQuery } from "mongoose";
import { UserBase, UserUpdate, UserStats, UserQuery } from "../types/user";

// Create user with role lookup
export const createUser = async (data: UserBase) => {
  const user = await User.create(data);
  return await User.findById(user._id).populate("role", "name permissions");
};

// Create user by role name (converts role name to ObjectId)
export const createUserByRoleName = async (data: Omit<UserBase, 'role'> & { roleName: string }) => {
  // Import Role model to find role by name
  const Role = require("../models/roles").default;
  const role = await Role.findOne({ name: data.roleName });
  
  if (!role) {
    throw new Error(`Role '${data.roleName}' not found`);
  }

  const userData = {
    ...data,
    role: role._id,
  };
  delete (userData as any).roleName;

  const user = await User.create(userData);
  return await User.findById(user._id).populate("role", "name permissions");
};

// Get all users with pagination, search, and population
export const getAllUsers = async (
  filters: FilterQuery<typeof User> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
    populate?: boolean;
  } = {}
) => {
  const { page = 1, limit = 10, search, populate = true } = options;
  
  // Always filter out deleted users
  const finalFilters = { ...filters, isDeleted: false };
  
  // Build search filter
  if (search) {
    finalFilters.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const query = User.find(finalFilters);
  
  if (populate) {
    query.populate("role", "name permissions");
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const users = await query
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await User.countDocuments(finalFilters);

  return {
    users,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get user by ID with optional population
export const getUserById = async (id: string, populate: boolean = true) => {
  const query = User.findById(id);
  
  if (populate) {
    query.populate("role", "name permissions");
  }
  
  return await query;
};

// Get user by UID with optional population
export const getUserByUid = async (uid: string, populate: boolean = true) => {
  const query = User.findOne({ uid, isDeleted: false });
  
  if (populate) {
    query.populate("role", "name permissions");
  }
  
  return await query;
};

// Update user with optional population
export const updateUser = async (id: string, data: UserUpdate, populate: boolean = true) => {
  const query = User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  
  if (populate) {
    query.populate("role", "name permissions");
  }
  
  return await query;
};

// Soft delete user
export const softDeleteUser = async (id: string) => {
  return await User.findByIdAndUpdate(
    id, 
    { isDeleted: true }, 
    { new: true }
  ).populate("role", "name permissions");
};

// Get user statistics
export const getUserStats = async (): Promise<UserStats> => {
  const Role = require("../models/roles").default;
  
  // Get all roles for mapping
  const roles = await Role.find({});
  const roleMap = roles.reduce((acc: Record<string, string>, role: any) => {
    acc[role._id.toString()] = role.name;
    return acc;
  }, {});

  const stats = await User.aggregate([
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "roles",
        localField: "_id",
        foreignField: "_id",
        as: "roleInfo"
      }
    },
    {
      $unwind: "$roleInfo"
    },
    {
      $project: {
        roleName: "$roleInfo.name",
        count: 1
      }
    }
  ]);

  // Get recent users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentUsersCount = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
    isDeleted: false
  });

  const totalUsers = await User.countDocuments({ isDeleted: false });
  const activeUsers = await User.countDocuments({ isDeleted: false, isActive: true });

  return {
    total: totalUsers,
    active: activeUsers,
    recent: recentUsersCount,
    byRole: stats.reduce((acc: Record<string, number>, stat: any) => {
      acc[stat.roleName] = stat.count;
      return acc;
    }, {}),
  };
};

// Check if email exists
export const checkEmailExists = async (email: string, excludeId?: string) => {
  const filter: any = { email, isDeleted: false };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const user = await User.findOne(filter);
  return !!user;
};

// Check if UID exists
export const checkUidExists = async (uid: string, excludeId?: string) => {
  const filter: any = { uid, isDeleted: false };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const user = await User.findOne(filter);
  return !!user;
};
