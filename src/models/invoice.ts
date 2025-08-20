import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  userId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  billingAddress: {
    name: string;
    email: string;
    phone?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    type: 'subscription' | 'one_time' | 'addon';
  }>;
  notes?: string;
  terms?: string;
  pdfUrl?: string;
  metadata?: {
    stripeInvoiceId?: string;
    razorpayInvoiceId?: string;
    generatedAt?: Date;
    sentAt?: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoiceModel extends Model<IInvoice> {
  generateInvoiceNumber(): Promise<string>;
  getUserInvoices(userId: string, page?: number, limit?: number): Promise<{ invoices: IInvoice[]; total: number }>;
  getInvoiceByNumber(invoiceNumber: string): Promise<IInvoice | null>;
  getOverdueInvoices(): Promise<IInvoice[]>;
  getInvoiceStats(dateRange?: { start: Date; end: Date }): Promise<any>;
  markAsPaid(invoiceId: string, paidAt?: Date): Promise<IInvoice>;
  generatePDF(invoiceId: string): Promise<string>;
}

const invoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    index: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAt: Date,
  billingAddress: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    address: {
      line1: {
        type: String,
        required: true
      },
      line2: String,
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      postalCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      }
    }
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ['subscription', 'one_time', 'addon'],
      default: 'subscription'
    }
  }],
  notes: String,
  terms: String,
  pdfUrl: String,
  metadata: {
    stripeInvoiceId: String,
    razorpayInvoiceId: String,
    generatedAt: Date,
    sentAt: Date,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ 'metadata.stripeInvoiceId': 1 });
invoiceSchema.index({ 'metadata.razorpayInvoiceId': 1 });

// Virtual for user info
invoiceSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for payment info
invoiceSchema.virtual('payment', {
  ref: 'Payment',
  localField: 'paymentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for subscription info
invoiceSchema.virtual('subscription', {
  ref: 'Subscription',
  localField: 'subscriptionId',
  foreignField: '_id',
  justOne: true
});

// Virtual for plan info
invoiceSchema.virtual('plan', {
  ref: 'SubscriptionPlan',
  localField: 'planId',
  foreignField: '_id',
  justOne: true
});

// Virtual for formatted amounts
invoiceSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

invoiceSchema.virtual('formattedTotalAmount').get(function() {
  return `${this.currency} ${this.totalAmount.toFixed(2)}`;
});

// Virtual for is overdue
invoiceSchema.virtual('isOverdue').get(function() {
  return this.status !== 'paid' && this.dueDate < new Date();
});

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function(this: any) {
  if (this.isOverdue) {
    const now = new Date();
    const due = this.dueDate;
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Method to check if invoice is paid
invoiceSchema.methods.isPaid = function() {
  return this.status === 'paid';
};

// Method to check if invoice is overdue
invoiceSchema.methods.isOverdue = function() {
  return this.status !== 'paid' && this.dueDate < new Date();
};

// Static method to generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}`;
  
  const lastInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });
  
  let sequence = 1;
  if (lastInvoice) {
    const lastNumber = lastInvoice.invoiceNumber.split('-')[2];
    sequence = parseInt(lastNumber) + 1;
  }
  
  return `${prefix}-${sequence.toString().padStart(6, '0')}`;
};

// Static method to get user invoices
invoiceSchema.statics.getUserInvoices = async function(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  const [invoices, total] = await Promise.all([
    this.find({ userId })
      .populate('payment', 'transactionId status')
      .populate('plan', 'name price')
      .populate('subscription', 'status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({ userId })
  ]);
  
  return { invoices, total };
};

// Static method to get invoice by number
invoiceSchema.statics.getInvoiceByNumber = async function(invoiceNumber: string) {
  return await this.findOne({ invoiceNumber })
    .populate('user', 'name email')
    .populate('payment')
    .populate('plan')
    .populate('subscription')
    .lean();
};

// Static method to get overdue invoices
invoiceSchema.statics.getOverdueInvoices = async function() {
  return await this.find({
    status: { $nin: ['paid', 'cancelled'] },
    dueDate: { $lt: new Date() }
  })
  .populate('user', 'name email')
  .populate('payment', 'transactionId')
  .populate('plan', 'name price')
  .sort({ dueDate: 1 })
  .lean();
};

// Static method to get invoice statistics
invoiceSchema.statics.getInvoiceStats = async function(dateRange?: { start: Date; end: Date }) {
  const match: any = {};
  
  if (dateRange) {
    match.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        avgAmount: { $avg: '$totalAmount' }
      }
    }
  ];
  
  const stats = await this.aggregate(pipeline);
  
  const result: any = {
    total: 0,
    totalAmount: 0,
    paid: 0,
    paidAmount: 0,
    overdue: 0,
    overdueAmount: 0,
    draft: 0,
    draftAmount: 0,
    sent: 0,
    sentAmount: 0,
    avgAmount: 0
  };
  
  stats.forEach((stat: any) => {
    result.total += stat.count;
    result.totalAmount += stat.totalAmount;
    result[stat._id] = stat.count;
    result[`${stat._id}Amount`] = stat.totalAmount;
  });
  
  result.avgAmount = result.total > 0 ? result.totalAmount / result.total : 0;
  
  return result;
};

// Static method to mark invoice as paid
invoiceSchema.statics.markAsPaid = async function(invoiceId: string, paidAt?: Date) {
  const invoice = await this.findById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  invoice.status = 'paid';
  invoice.paidAt = paidAt || new Date();
  
  return await invoice.save();
};

// Static method to generate PDF (placeholder)
invoiceSchema.statics.generatePDF = async function(invoiceId: string) {
  // This would integrate with a PDF generation service
  // For now, return a placeholder URL
  const invoice = await this.findById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  // In a real implementation, you would:
  // 1. Generate PDF using a library like puppeteer or jsPDF
  // 2. Upload to S3 or similar storage
  // 3. Return the URL
  
  const pdfUrl = `https://example.com/invoices/${invoice.invoiceNumber}.pdf`;
  invoice.pdfUrl = pdfUrl;
  await invoice.save();
  
  return pdfUrl;
};

export const Invoice = mongoose.model<IInvoice, IInvoiceModel>('Invoice', invoiceSchema);
