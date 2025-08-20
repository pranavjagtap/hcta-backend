import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunication extends Document {
  studentId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  messageType: 'reminder' | 'performance_report' | 'fee_reminder' | 'greeting' | 'custom';
  messageContent: string;
  whatsappNumber: string;
  sentAt: Date;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string;
  metadata?: {
    subject?: string;
    topic?: string;
    dueDate?: Date;
    reportUrl?: string;
    reportKey?: string;
    greetingType?: 'birthday' | 'festival';
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communicationSchema = new Schema<ICommunication>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  messageType: {
    type: String,
    enum: ['reminder', 'performance_report', 'fee_reminder', 'greeting', 'custom'],
    required: true,
    index: true
  },
  messageContent: {
    type: String,
    required: true
  },
  whatsappNumber: {
    type: String,
    required: true,
    index: true
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending',
    index: true
  },
  errorMessage: {
    type: String
  },
  metadata: {
    subject: String,
    topic: String,
    dueDate: Date,
    reportUrl: String,
    reportKey: String,
    greetingType: {
      type: String,
      enum: ['birthday', 'festival']
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
communicationSchema.index({ studentId: 1, sentAt: -1 });
communicationSchema.index({ messageType: 1, sentAt: -1 });
communicationSchema.index({ deliveryStatus: 1, sentAt: -1 });
communicationSchema.index({ whatsappNumber: 1, sentAt: -1 });

export const Communication = mongoose.model<ICommunication>('Communication', communicationSchema);
