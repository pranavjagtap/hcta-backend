import { z } from "zod";

// Schema for creating fee
export const createFeeSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  monthYear: z.string().min(1, "Month/Year is required"),
  amountDue: z.number().min(0, "Amount due must be non-negative"),
  amountPaid: z.number().min(0, "Amount paid must be non-negative").default(0),
  paymentStatus: z.enum(["paid", "partial", "unpaid"], {
    errorMap: () => ({ message: "Payment status must be one of: paid, partial, unpaid" })
  }).default("unpaid"),
  paymentMode: z.string().optional(),
  paymentDate: z.union([z.string(), z.date()]).optional(),
  receiptNumber: z.string().optional(),
  isLocked: z.boolean().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

// Schema for updating fee
export const updateFeeSchema = createFeeSchema.partial();

// Schema for fee queries
export const feeQuerySchema = z.object({
  studentId: z.string().optional(),
  batchId: z.string().optional(),
  monthYear: z.string().optional(),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]).optional(),
  isLocked: z.string().transform(val => val === "true").optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
});

// Schema for fee payment
export const feePaymentSchema = z.object({
  feeId: z.string().min(1, "Fee ID is required"),
  amount: z.number().min(0.01, "Payment amount must be greater than 0"),
  paymentMode: z.string().min(1, "Payment mode is required"),
  receiptNumber: z.string().optional(),
  paymentDate: z.union([z.string(), z.date()]).optional(),
  updatedBy: z.string().optional(),
});

// Schema for bulk fee creation
export const bulkFeeSchema = z.object({
  studentIds: z.array(z.string().min(1, "Student ID is required")).min(1, "At least one student is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  monthYear: z.string().min(1, "Month/Year is required"),
  amountDue: z.number().min(0, "Amount due must be non-negative"),
  createdBy: z.string().optional(),
});

// Schema for fee statistics query
export const feeStatsQuerySchema = z.object({
  batchId: z.string().optional(),
  monthYear: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Schema for fee report query
export const feeReportQuerySchema = z.object({
  period: z.enum(["month", "quarter", "year"]).default("month"),
  batchId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Schema for fee summary query
export const feeSummaryQuerySchema = z.object({
  studentId: z.string().optional(),
  batchId: z.string().optional(),
  includeOutstanding: z.string().transform(val => val === "true").optional(),
});

// Schema for fee data validation
export const feeDataSchema = z.object({
  studentId: z.string(),
  batchId: z.string(),
  monthYear: z.string(),
  amountDue: z.number().min(0),
  amountPaid: z.number().min(0),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]),
  paymentMode: z.string().optional(),
  paymentDate: z.date().optional(),
  receiptNumber: z.string().optional(),
  isLocked: z.boolean().optional(),
});

// Schema for fee statistics validation
export const feeStatsSchema = z.object({
  totalFees: z.number().min(0),
  totalAmountDue: z.number().min(0),
  totalAmountPaid: z.number().min(0),
  totalOutstanding: z.number().min(0),
  paidCount: z.number().min(0),
  partialCount: z.number().min(0),
  unpaidCount: z.number().min(0),
  paymentRate: z.number().min(0).max(100),
});

// Schema for fee summary validation
export const feeSummarySchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  batchId: z.string(),
  batchName: z.string(),
  totalFees: z.number().min(0),
  totalPaid: z.number().min(0),
  totalOutstanding: z.number().min(0),
  lastPaymentDate: z.date().optional(),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]),
});
