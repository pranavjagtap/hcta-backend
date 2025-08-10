import { Document } from "mongoose";

// Base fee interface
export interface FeeBase {
  studentId: string;
  batchId: string;
  monthYear: string;
  amountDue: number;
  amountPaid: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  paymentMode?: string;
  paymentDate?: Date;
  receiptNumber?: string;
  isLocked?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

// Fee document interface
export interface FeeDocument extends Document, FeeBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Fee update interface
export interface FeeUpdate {
  studentId?: string;
  batchId?: string;
  monthYear?: string;
  amountDue?: number;
  amountPaid?: number;
  paymentStatus?: "paid" | "partial" | "unpaid";
  paymentMode?: string;
  paymentDate?: Date;
  receiptNumber?: string;
  isLocked?: boolean;
  updatedBy?: string;
}

// Fee query interface
export interface FeeQuery {
  studentId?: string;
  batchId?: string;
  monthYear?: string;
  paymentStatus?: "paid" | "partial" | "unpaid";
  isLocked?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

// Fee statistics interface
export interface FeeStats {
  totalFees: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  paymentRate: number;
}

// Fee summary interface
export interface FeeSummary {
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  totalFees: number;
  totalPaid: number;
  totalOutstanding: number;
  lastPaymentDate?: Date;
  paymentStatus: "paid" | "partial" | "unpaid";
}

// Fee payment interface
export interface FeePayment {
  feeId: string;
  amount: number;
  paymentMode: string;
  receiptNumber?: string;
  paymentDate: Date;
  updatedBy: string;
}

// Fee bulk operations interface
export interface FeeBulkOperation {
  studentIds: string[];
  batchId: string;
  monthYear: string;
  amountDue: number;
  createdBy: string;
}

// Fee report interface
export interface FeeReport {
  period: string;
  totalStudents: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  paymentRate: number;
  monthlyBreakdown: {
    month: string;
    amountDue: number;
    amountPaid: number;
    outstanding: number;
  }[];
  statusBreakdown: {
    status: string;
    count: number;
    amount: number;
  }[];
}
