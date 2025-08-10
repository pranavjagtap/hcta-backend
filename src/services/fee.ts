import { Fee } from "../models/fee";
import { FilterQuery } from "mongoose";
import { FeeBase, FeeUpdate, FeeQuery, FeeStats, FeeSummary, FeePayment, FeeBulkOperation, FeeReport } from "../types/fee";
import Student from "../models/student";
import Batch from "../models/batch";

// Create fee
export const createFee = async (data: FeeBase) => {
  const fee = await Fee.create(data);
  return await Fee.findById(fee._id).populate([
    { path: "studentId", select: "name rollNumber" },
    { path: "batchId", select: "name academicYear" },
    { path: "createdBy", select: "name" },
    { path: "updatedBy", select: "name" },
  ]);
};

// Get fee by ID
export const getFeeById = async (id: string, populate: boolean = true) => {
  const query = Fee.findById(id);
  
  if (populate) {
    query.populate([
      { path: "studentId", select: "name rollNumber" },
      { path: "batchId", select: "name academicYear" },
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);
  }
  
  return await query;
};

// Get all fees with pagination and filters
export const getAllFees = async (
  filters: FilterQuery<typeof Fee> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
    populate?: boolean;
  } = {}
) => {
  const { page = 1, limit = 10, search, populate = true } = options;
  
  // Build search filter
  if (search) {
    filters.$or = [
      { receiptNumber: { $regex: search, $options: "i" } },
      { paymentMode: { $regex: search, $options: "i" } },
    ];
  }

  const query = Fee.find({ ...filters, isDeleted: false });
  
  if (populate) {
    query.populate([
      { path: "studentId", select: "name rollNumber" },
      { path: "batchId", select: "name academicYear" },
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);
  }

  const skip = (page - 1) * limit;
  const fees = await query
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Fee.countDocuments({ ...filters, isDeleted: false });

  return {
    fees,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Update fee
export const updateFee = async (id: string, data: FeeUpdate, populate: boolean = true) => {
  const fee = await Fee.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );

  if (populate && fee) {
    return await Fee.findById(fee._id).populate([
      { path: "studentId", select: "name rollNumber" },
      { path: "batchId", select: "name academicYear" },
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);
  }

  return fee;
};

// Soft delete fee
export const softDeleteFee = async (id: string) => {
  return await Fee.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};

// Process fee payment
export const processFeePayment = async (paymentData: FeePayment) => {
  const { feeId, amount, paymentMode, receiptNumber, paymentDate, updatedBy } = paymentData;

  const fee = await Fee.findById(feeId);
  if (!fee) {
    throw new Error("Fee not found");
  }

  if (fee.isLocked) {
    throw new Error("Fee is locked and cannot be modified");
  }

  const newAmountPaid = fee.amountPaid + amount;
  let newPaymentStatus: "paid" | "partial" | "unpaid";

  if (newAmountPaid >= fee.amountDue) {
    newPaymentStatus = "paid";
  } else if (newAmountPaid > 0) {
    newPaymentStatus = "partial";
  } else {
    newPaymentStatus = "unpaid";
  }

  const updatedFee = await Fee.findByIdAndUpdate(
    feeId,
    {
      amountPaid: newAmountPaid,
      paymentStatus: newPaymentStatus,
      paymentMode,
      paymentDate: paymentDate || new Date(),
      receiptNumber,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  ).populate([
    { path: "studentId", select: "name rollNumber" },
    { path: "batchId", select: "name academicYear" },
    { path: "createdBy", select: "name" },
    { path: "updatedBy", select: "name" },
  ]);

  return updatedFee;
};

// Create bulk fees
export const createBulkFees = async (bulkData: FeeBulkOperation) => {
  const { studentIds, batchId, monthYear, amountDue, createdBy } = bulkData;

  // Check if fees already exist for these students in this month
  const existingFees = await Fee.find({
    studentId: { $in: studentIds },
    batchId,
    monthYear,
    isDeleted: false,
  });

  if (existingFees.length > 0) {
    throw new Error("Fees already exist for some students in this month");
  }

  const feeData = studentIds.map(studentId => ({
    studentId,
    batchId,
    monthYear,
    amountDue,
    amountPaid: 0,
    paymentStatus: "unpaid" as const,
    createdBy,
  }));

  const fees = await Fee.insertMany(feeData);
  
  return await Fee.find({ _id: { $in: fees.map(f => f._id) } }).populate([
    { path: "studentId", select: "name rollNumber" },
    { path: "batchId", select: "name academicYear" },
    { path: "createdBy", select: "name" },
  ]);
};

// Get fee statistics
export const getFeeStats = async (filters: any = {}): Promise<FeeStats> => {
  const matchStage: any = { isDeleted: false };
  
  if (filters.batchId) matchStage.batchId = filters.batchId;
  if (filters.monthYear) matchStage.monthYear = filters.monthYear;
  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
  }

  const stats = await Fee.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalFees: { $sum: 1 },
        totalAmountDue: { $sum: "$amountDue" },
        totalAmountPaid: { $sum: "$amountPaid" },
        paidCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
        },
        partialCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "partial"] }, 1, 0] },
        },
        unpaidCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, 1, 0] },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalFees: 0,
    totalAmountDue: 0,
    totalAmountPaid: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
  };

  const totalOutstanding = result.totalAmountDue - result.totalAmountPaid;
  const paymentRate = result.totalAmountDue > 0 
    ? Math.round((result.totalAmountPaid / result.totalAmountDue) * 100) 
    : 0;

  return {
    ...result,
    totalOutstanding,
    paymentRate,
  };
};

// Get fee summary by student
export const getFeeSummary = async (filters: any = {}): Promise<FeeSummary[]> => {
  const matchStage: any = { isDeleted: false };
  
  if (filters.studentId) matchStage.studentId = filters.studentId;
  if (filters.batchId) matchStage.batchId = filters.batchId;

  const summary = await Fee.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $lookup: {
        from: "batches",
        localField: "batchId",
        foreignField: "_id",
        as: "batch",
      },
    },
    {
      $unwind: "$student",
    },
    {
      $unwind: "$batch",
    },
    {
      $group: {
        _id: "$studentId",
        studentName: { $first: "$student.name" },
        batchId: { $first: "$batchId" },
        batchName: { $first: "$batch.name" },
        totalFees: { $sum: 1 },
        totalAmountDue: { $sum: "$amountDue" },
        totalAmountPaid: { $sum: "$amountPaid" },
        lastPaymentDate: { $max: "$paymentDate" },
        paymentStatus: {
          $push: "$paymentStatus",
        },
      },
    },
    {
      $project: {
        studentId: "$_id",
        studentName: 1,
        batchId: 1,
        batchName: 1,
        totalFees: 1,
        totalPaid: "$totalAmountPaid",
        totalOutstanding: {
          $subtract: ["$totalAmountDue", "$totalAmountPaid"],
        },
        lastPaymentDate: 1,
        paymentStatus: {
          $cond: {
            if: { $gt: [{ $size: { $setDifference: ["$paymentStatus", ["paid"]] } }, 0] },
            then: {
              $cond: {
                if: { $gt: [{ $size: { $setDifference: ["$paymentStatus", ["unpaid"]] } }, 0] },
                then: "partial",
                else: "unpaid",
              },
            },
            else: "paid",
          },
        },
      },
    },
  ]);

  // Filter out students with no outstanding fees if requested
  if (filters.includeOutstanding) {
    return summary.filter(s => s.totalOutstanding > 0);
  }

  return summary;
};

// Generate fee report
export const generateFeeReport = async (filters: any = {}): Promise<FeeReport> => {
  const { period = "month", batchId, startDate, endDate } = filters;
  
  const matchStage: any = { isDeleted: false };
  if (batchId) matchStage.batchId = batchId;
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const [stats, monthlyBreakdown, statusBreakdown] = await Promise.all([
    getFeeStats(filters),
    
    // Monthly breakdown
    Fee.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$monthYear",
          amountDue: { $sum: "$amountDue" },
          amountPaid: { $sum: "$amountPaid" },
        },
      },
      {
        $project: {
          month: "$_id",
          amountDue: 1,
          amountPaid: 1,
          outstanding: {
            $subtract: ["$amountDue", "$amountPaid"],
          },
        },
      },
      { $sort: { month: 1 } },
    ]),

    // Status breakdown
    Fee.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          amount: { $sum: "$amountDue" },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          amount: 1,
        },
      },
    ]),
  ]);

  return {
    period,
    totalStudents: stats.totalFees,
    totalAmountDue: stats.totalAmountDue,
    totalAmountPaid: stats.totalAmountPaid,
    totalOutstanding: stats.totalOutstanding,
    paymentRate: stats.paymentRate,
    monthlyBreakdown,
    statusBreakdown,
  };
};

// Lock/unlock fee
export const toggleFeeLock = async (id: string, isLocked: boolean, updatedBy: string) => {
  return await Fee.findByIdAndUpdate(
    id,
    { isLocked, updatedBy, updatedAt: new Date() },
    { new: true }
  ).populate([
    { path: "studentId", select: "name rollNumber" },
    { path: "batchId", select: "name academicYear" },
    { path: "createdBy", select: "name" },
    { path: "updatedBy", select: "name" },
  ]);
};

// Get fees by student
export const getFeesByStudent = async (studentId: string, populate: boolean = true) => {
  const query = Fee.find({ studentId, isDeleted: false }).sort({ monthYear: -1 });
  
  if (populate) {
    query.populate([
      { path: "studentId", select: "name rollNumber" },
      { path: "batchId", select: "name academicYear" },
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);
  }
  
  return await query;
};

// Get fees by batch
export const getFeesByBatch = async (batchId: string, populate: boolean = true) => {
  const query = Fee.find({ batchId, isDeleted: false }).sort({ monthYear: -1 });
  
  if (populate) {
    query.populate([
      { path: "studentId", select: "name rollNumber" },
      { path: "batchId", select: "name academicYear" },
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);
  }
  
  return await query;
};

// Check if fee exists for student in month
export const checkFeeExists = async (studentId: string, batchId: string, monthYear: string) => {
  return await Fee.findOne({
    studentId,
    batchId,
    monthYear,
    isDeleted: false,
  });
};
