import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformance extends Document {
  studentId: mongoose.Types.ObjectId;
  academicYear: string;
  semester?: string;
  subject: string;
  topic?: string;
  assessmentType: 'test' | 'assignment' | 'project' | 'quiz' | 'exam';
  score: number;
  maxScore: number;
  percentage: number;
  grade?: string;
  remarks?: string;
  assessmentDate: Date;
  submittedDate?: Date;
  isLate?: boolean;
  weightage?: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'half-day';
  reason?: string;
  markedBy: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPerformanceAnalytics extends Document {
  studentId: mongoose.Types.ObjectId;
  academicYear: string;
  semester?: string;
  overallPercentage: number;
  attendancePercentage: number;
  subjectsPerformance: Array<{
    subject: string;
    averageScore: number;
    totalAssessments: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  riskScore: number; // 0-100, higher means higher risk
  predictedGrade?: string;
  aiRecommendations: Array<{
    type: 'study_plan' | 'weak_topic' | 'improvement_tip';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  trends: {
    performanceTrend: 'improving' | 'declining' | 'stable';
    attendanceTrend: 'improving' | 'declining' | 'stable';
    engagementTrend: 'improving' | 'declining' | 'stable';
  };
  lastUpdated: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPerformanceReport extends Document {
  studentId: mongoose.Types.ObjectId;
  reportType: 'individual' | 'class' | 'batch' | 'subject';
  reportPeriod: 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'annual';
  startDate: Date;
  endDate: Date;
  reportData: {
    performanceSummary: {
      overallPercentage: number;
      attendancePercentage: number;
      totalAssessments: number;
      averageScore: number;
    };
    subjectBreakdown: Array<{
      subject: string;
      averageScore: number;
      totalAssessments: number;
      strengths: string[];
      weaknesses: string[];
    }>;
    attendanceBreakdown: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      attendanceTrend: string;
    };
    aiInsights: {
      riskAssessment: string;
      predictedGrade: string;
      recommendations: Array<{
        type: string;
        title: string;
        description: string;
        priority: string;
      }>;
    };
  };
  pdfUrl?: string;
  excelUrl?: string;
  generatedBy: mongoose.Types.ObjectId;
  isScheduled: boolean;
  status: 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPerformanceAlert extends Document {
  studentId: mongoose.Types.ObjectId;
  alertType: 'low_attendance' | 'performance_drop' | 'missed_assignment' | 'failed_test' | 'academic_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: {
    currentValue?: number;
    thresholdValue?: number;
    subject?: string;
    assessmentType?: string;
    date?: Date;
  };
  channels: Array<'email' | 'sms' | 'whatsapp' | 'in_app'>;
  isSent: boolean;
  sentAt?: Date;
  isRead: boolean;
  readAt?: Date;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Performance Schema
const performanceSchema = new Schema<IPerformance>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  academicYear: {
    type: String,
    required: true,
    index: true
  },
  semester: {
    type: String,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  topic: {
    type: String,
    index: true
  },
  assessmentType: {
    type: String,
    enum: ['test', 'assignment', 'project', 'quiz', 'exam'],
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  grade: {
    type: String
  },
  remarks: {
    type: String
  },
  assessmentDate: {
    type: Date,
    required: true,
    index: true
  },
  submittedDate: {
    type: Date
  },
  isLate: {
    type: Boolean,
    default: false
  },
  weightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
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

// Attendance Schema
const attendanceSchema = new Schema<IAttendance>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    index: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    required: true
  },
  reason: {
    type: String
  },
  markedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

// Performance Analytics Schema
const performanceAnalyticsSchema = new Schema<IPerformanceAnalytics>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  academicYear: {
    type: String,
    required: true,
    index: true
  },
  semester: {
    type: String,
    index: true
  },
  overallPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  attendancePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  subjectsPerformance: [{
    subject: {
      type: String,
      required: true
    },
    averageScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalAssessments: {
      type: Number,
      required: true,
      min: 0
    },
    strengths: [{
      type: String
    }],
    weaknesses: [{
      type: String
    }]
  }],
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  predictedGrade: {
    type: String
  },
  aiRecommendations: [{
    type: {
      type: String,
      enum: ['study_plan', 'weak_topic', 'improvement_tip'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    }
  }],
  trends: {
    performanceTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable'],
      required: true
    },
    attendanceTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable'],
      required: true
    },
    engagementTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable'],
      required: true
    }
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
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

// Performance Report Schema
const performanceReportSchema = new Schema<IPerformanceReport>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['individual', 'class', 'batch', 'subject'],
    required: true,
    index: true
  },
  reportPeriod: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'semester', 'annual'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reportData: {
    performanceSummary: {
      overallPercentage: {
        type: Number,
        required: true
      },
      attendancePercentage: {
        type: Number,
        required: true
      },
      totalAssessments: {
        type: Number,
        required: true
      },
      averageScore: {
        type: Number,
        required: true
      }
    },
    subjectBreakdown: [{
      subject: {
        type: String,
        required: true
      },
      averageScore: {
        type: Number,
        required: true
      },
      totalAssessments: {
        type: Number,
        required: true
      },
      strengths: [{
        type: String
      }],
      weaknesses: [{
        type: String
      }]
    }],
    attendanceBreakdown: {
      totalDays: {
        type: Number,
        required: true
      },
      presentDays: {
        type: Number,
        required: true
      },
      absentDays: {
        type: Number,
        required: true
      },
      lateDays: {
        type: Number,
        required: true
      },
      attendanceTrend: {
        type: String,
        required: true
      }
    },
    aiInsights: {
      riskAssessment: {
        type: String,
        required: true
      },
      predictedGrade: {
        type: String,
        required: true
      },
      recommendations: [{
        type: {
          type: String,
          required: true
        },
        title: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        priority: {
          type: String,
          required: true
        }
      }]
    }
  },
  pdfUrl: {
    type: String
  },
  excelUrl: {
    type: String
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Performance Alert Schema
const performanceAlertSchema = new Schema<IPerformanceAlert>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  alertType: {
    type: String,
    enum: ['low_attendance', 'performance_drop', 'missed_assignment', 'failed_test', 'academic_risk'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    currentValue: {
      type: Number
    },
    thresholdValue: {
      type: Number
    },
    subject: {
      type: String
    },
    assessmentType: {
      type: String
    },
    date: {
      type: Date
    }
  },
  channels: [{
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'in_app'],
    required: true
  }],
  isSent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  acknowledgedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
performanceSchema.index({ studentId: 1, academicYear: 1, subject: 1 });
performanceSchema.index({ studentId: 1, assessmentDate: -1 });
performanceSchema.index({ assessmentType: 1, assessmentDate: -1 });

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ batchId: 1, date: 1 });

performanceAnalyticsSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });
performanceAnalyticsSchema.index({ riskScore: -1 });

performanceReportSchema.index({ studentId: 1, reportType: 1, startDate: -1 });
performanceReportSchema.index({ generatedBy: 1, createdAt: -1 });

performanceAlertSchema.index({ studentId: 1, alertType: 1, createdAt: -1 });
performanceAlertSchema.index({ severity: 1, isSent: 1 });

// Virtual for formatted assessment date
performanceSchema.virtual('formattedAssessmentDate').get(function() {
  return this.assessmentDate.toLocaleDateString();
});

// Virtual for formatted submission date
performanceSchema.virtual('formattedSubmittedDate').get(function() {
  return this.submittedDate ? this.submittedDate.toLocaleDateString() : null;
});

// Virtual for attendance status color
attendanceSchema.virtual('statusColor').get(function() {
  const colors = {
    present: 'green',
    absent: 'red',
    late: 'orange',
    'half-day': 'yellow'
  };
  return colors[this.status] || 'gray';
});

// Virtual for risk level
performanceAnalyticsSchema.virtual('riskLevel').get(function() {
  if (this.riskScore >= 80) return 'critical';
  if (this.riskScore >= 60) return 'high';
  if (this.riskScore >= 40) return 'medium';
  return 'low';
});

// Virtual for alert priority color
performanceAlertSchema.virtual('priorityColor').get(function() {
  const colors = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'green'
  };
  return colors[this.severity] || 'gray';
});

export const Performance = mongoose.model<IPerformance>('Performance', performanceSchema);
export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const PerformanceAnalytics = mongoose.model<IPerformanceAnalytics>('PerformanceAnalytics', performanceAnalyticsSchema);
export const PerformanceReport = mongoose.model<IPerformanceReport>('PerformanceReport', performanceReportSchema);
export const PerformanceAlert = mongoose.model<IPerformanceAlert>('PerformanceAlert', performanceAlertSchema);
