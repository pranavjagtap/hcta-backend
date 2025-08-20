// Admin Panel Types for Module 8

export interface DashboardMetrics {
  overview: {
    totalTutors: number;
    activeStudents: number;
    activeClasses: number;
    sessionsToday: number;
    attendanceRate: number;
    homeworkSubmissionRate: number;
    averageTestScores: number;
    revenue: number;
    storageUsage: number;
  };
  trends: {
    dailyActiveUsers: Array<{ date: string; count: number }>;
    weeklyActiveUsers: Array<{ week: string; count: number }>;
    monthlyActiveUsers: Array<{ month: string; count: number }>;
    messagesSent: Array<{ date: string; count: number }>;
    materialUploads: Array<{ date: string; count: number }>;
    aiRequests: Array<{ date: string; count: number }>;
  };
  health: {
    classHealthScore: number;
    dropOffRisk: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  };
}

export interface UserFilters {
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
  batchId?: string;
  subjectId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  page?: number;
  limit?: number;
}

export interface UserManagementData {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    batch?: string;
    subjects?: string[];
    lastActive?: Date;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TutorOnboardingData {
  pendingApplications: Array<{
    id: string;
    tutorId: string;
    tutorName: string;
    tutorEmail: string;
    applicationDate: Date;
    profileCompleteness: number;
    kycStatus: 'pending' | 'verified' | 'rejected';
    certificates: Array<{
      name: string;
      status: 'pending' | 'verified' | 'rejected';
      uploadedAt: Date;
    }>;
    documents: Array<{
      type: string;
      status: 'pending' | 'verified' | 'rejected';
      uploadedAt: Date;
    }>;
  }>;
}

export interface FlagData {
  id: string;
  materialId: string;
  materialTitle: string;
  materialType: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  category: 'inappropriate' | 'copyright' | 'spam' | 'quality' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'resolved' | 'dismissed';
  notes: Array<{
    id: string;
    adminId: string;
    adminName: string;
    note: string;
    createdAt: Date;
  }>;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: {
    id: string;
    name: string;
  } | null;
  timeSinceCreation: string;
  isUrgent: boolean;
}

export interface ContentModerationData {
  flags: FlagData[];
  stats: {
    totalFlags: number;
    openFlags: number;
    resolvedFlags: number;
    dismissedFlags: number;
    byCategory: Array<{ category: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
  };
}

export interface ClassMonitoringData {
  classes: Array<{
    id: string;
    name: string;
    tutorId: string;
    tutorName: string;
    batchId: string;
    batchName: string;
    subjectId: string;
    subjectName: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    startTime: Date;
    endTime: Date;
    studentCount: number;
    attendanceCount: number;
    attendanceRate: number;
  }>;
  attendance: {
    byClass: Array<{
      classId: string;
      className: string;
      attendanceRate: number;
      totalStudents: number;
      presentStudents: number;
    }>;
    byBatch: Array<{
      batchId: string;
      batchName: string;
      averageAttendance: number;
      totalClasses: number;
    }>;
    bySubject: Array<{
      subjectId: string;
      subjectName: string;
      averageAttendance: number;
      totalClasses: number;
    }>;
  };
}

export interface CommunicationData {
  calls: Array<{
    id: string;
    callerId: string;
    callerName: string;
    receiverId: string;
    receiverName: string;
    type: 'voice' | 'video';
    status: 'initiated' | 'answered' | 'missed' | 'ended';
    duration: number;
    startTime: Date;
    endTime?: Date;
  }>;
  messages: {
    totalMessages: number;
    messagesByDay: Array<{ date: string; count: number }>;
    messagesByType: Array<{ type: string; count: number }>;
    topConversations: Array<{
      conversationId: string;
      participants: string[];
      messageCount: number;
      lastMessageAt: Date;
    }>;
  };
  analytics: {
    callVolume: number;
    averageCallDuration: number;
    missedCallRate: number;
    messageVolume: number;
    averageResponseTime: number;
  };
}

export interface BillingInsightsData {
  revenue: {
    mrr: number;
    arr: number;
    totalRevenue: number;
    revenueByMonth: Array<{ month: string; amount: number }>;
    revenueByPlan: Array<{ plan: string; amount: number }>;
  };
  subscriptions: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    cancelledSubscriptions: number;
    churnRate: number;
    trialConversionRate: number;
  };
  payments: {
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    paymentSuccessRate: number;
    refundRate: number;
    averagePaymentValue: number;
  };
  plans: {
    planDistribution: Array<{
      planId: string;
      planName: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
    popularPlans: Array<{
      planId: string;
      planName: string;
      subscriptions: number;
    }>;
  };
}

export interface ReportData {
  type: 'attendance' | 'performance' | 'usage' | 'revenue' | 'custom';
  filters: any;
  data: any;
  format: 'csv' | 'xlsx' | 'pdf';
  generatedAt: Date;
  downloadUrl?: string;
}

export interface ReportScheduleData {
  id: string;
  name: string;
  type: string;
  cron: string;
  filters: any;
  format: string;
  destination: {
    email?: string[];
    s3?: {
      bucket: string;
      key: string;
    };
  };
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastRunStatus?: string;
  runCount: number;
  createdBy: string;
  createdAt: Date;
}

export interface SettingData {
  id: string;
  scope: string;
  key: string;
  value: any;
  type: string;
  description?: string;
  category: string;
  isPublic: boolean;
  updatedBy: {
    id: string;
    name: string;
  };
  updatedAt: Date;
  formattedValue?: string;
}

export interface SettingsData {
  global: SettingData[];
  institute: SettingData[];
  tutor: SettingData[];
}

export interface FeatureFlagData {
  id: string;
  key: string;
  description?: string;
  enabled: boolean;
  audience?: {
    roles?: string[];
    tutorIds?: string[];
    cohorts?: string[];
    percentage?: number;
  };
  audienceSummary: string;
  status: string;
  metadata?: {
    rolloutDate?: Date;
    expectedImpact?: string;
    owner?: string;
    tags?: string[];
  };
  updatedBy: string;
  updatedAt: Date;
}

export interface AuditLogData {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: any;
  after?: any;
  ip: string;
  userAgent: string;
  metadata?: {
    reason?: string;
    justification?: string;
    impersonatedUserId?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number;
    affectedRecords?: number;
  };
  createdAt: Date;
  timeAgo: string;
  formattedAction: string;
}

export interface AuditLogFilters {
  actorId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface StorageData {
  totalUsage: {
    totalBytes: number;
    totalFiles: number;
    formattedSize: string;
  };
  byOwner: Array<{
    ownerId: string;
    ownerName: string;
    ownerType: string;
    bytesUsed: number;
    filesCount: number;
    formattedSize: string;
    breakdown: {
      documents: { bytes: number; count: number };
      images: { bytes: number; count: number };
      videos: { bytes: number; count: number };
      audio: { bytes: number; count: number };
      other: { bytes: number; count: number };
    };
  }>;
  topUsers: Array<{
    ownerId: string;
    ownerName: string;
    ownerType: string;
    bytesUsed: number;
    filesCount: number;
    formattedSize: string;
  }>;
}

export interface ImpersonationData {
  token: string;
  expiresAt: Date;
  impersonatedUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  impersonatedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reason: string;
  sessionId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedResponse<T = any> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
