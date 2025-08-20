import { Request } from 'express';

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface ConversationResponse {
  _id: string;
  type: 'direct' | 'group';
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  }>;
  title?: string;
  batchId?: string;
  subject?: string;
  createdBy: string;
  lastMessageAt?: Date;
  lastMessage?: {
    content: string;
    senderId: string;
    type: 'text' | 'image' | 'file' | 'audio';
    timestamp: Date;
  };
  unreadCount?: number;
  settings?: {
    allowFileSharing: boolean;
    allowVoiceMessages: boolean;
    moderationEnabled: boolean;
  };
  metadata?: {
    description?: string;
    avatar?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageResponse {
  _id: string;
  conversationId: string;
  senderId: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  content: string;
  attachmentMeta?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
    duration?: number;
  };
  replyTo?: string;
  replyMessage?: MessageResponse;
  editedAt?: Date;
  deletedAt?: Date;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  metadata?: {
    clientMessageId?: string;
    deviceInfo?: string;
    location?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationRequest {
  type: 'direct' | 'group';
  participants: string[];
  title?: string;
  batchId?: string;
  subject?: string;
  settings?: {
    allowFileSharing?: boolean;
    allowVoiceMessages?: boolean;
    moderationEnabled?: boolean;
  };
  metadata?: {
    description?: string;
    avatar?: string;
    tags?: string[];
  };
}

export interface SendMessageRequest {
  studentIds: string[];
  messageType: 'reminder' | 'performance_report' | 'fee_reminder' | 'greeting' | 'custom';
  messageContent?: string;
  metadata?: {
    subject?: string;
    topic?: string;
    dueDate?: string | Date;
    greetingType?: 'birthday' | 'festival';
  };
}

export interface UpdateMessageRequest {
  content: string;
}

export interface ConversationFilters {
  type?: 'direct' | 'group';
  batchId?: string;
  subject?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MessageFilters {
  cursor?: string;
  limit?: number;
  before?: Date;
  after?: Date;
}

// ============================================================================
// CALL TYPES
// ============================================================================

export interface CallResponse {
  _id: string;
  roomId: string;
  type: 'voice' | 'video' | 'group';
  participants: Array<{
    userId: string;
    user?: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    role: 'initiator' | 'participant';
    joinedAt?: Date;
    leftAt?: Date;
    deviceInfo?: string;
  }>;
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'declined';
  startedAt?: Date;
  endedAt?: Date;
  durationSec?: number;
  recordingUrl?: string;
  metadata?: {
    subject?: string;
    notes?: string;
    tags?: string[];
  };
  webrtcConfig?: {
    iceServers?: any[];
    maxBitrate?: number;
    recordingEnabled?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface InitiateCallRequest {
  participantIds: string[];
  type: 'voice' | 'video' | 'group';
  metadata?: {
    subject?: string;
    notes?: string;
    tags?: string[];
  };
  webrtcConfig?: {
    iceServers?: any[];
    maxBitrate?: number;
    recordingEnabled?: boolean;
  };
}

export interface CallHistoryFilters {
  type?: 'voice' | 'video' | 'group';
  status?: 'ended' | 'missed' | 'declined';
  dateRange?: {
    start: Date;
    end: Date;
  };
  page?: number;
  limit?: number;
}

// ============================================================================
// DOUBT TYPES
// ============================================================================

export interface DoubtResponse {
  _id: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  subject?: string;
  query: string;
  aiResponse: {
    answer: string;
    steps: string[];
    sources: Array<{
      contentId: string;
      title: string;
      section?: string;
      relevance: number;
    }>;
    followUps: string[];
    confidence: number;
  };
  mode: 'text' | 'voice';
  transcript?: string;
  ttsUrl?: string;
  feedback?: {
    helpful: boolean;
    notes?: string;
    rating?: number;
  };
  context?: {
    courseMaterials: string[];
    weakTopics: string[];
    recentChatContext?: string;
    performanceHints?: any;
  };
  metadata?: {
    processingTime?: number;
    tokensUsed?: number;
    modelVersion?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AskDoubtRequest {
  query: string;
  subject?: string;
  mode: 'text' | 'voice';
  context?: {
    courseMaterials?: string[];
    weakTopics?: string[];
    recentChatContext?: string;
  };
}

export interface DoubtFeedbackRequest {
  helpful: boolean;
  notes?: string;
  rating?: number;
}

export interface DoubtHistoryFilters {
  subject?: string;
  mode?: 'text' | 'voice';
  helpful?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  page?: number;
  limit?: number;
}

// ============================================================================
// AVAILABILITY & MEETING TYPES
// ============================================================================

export interface AvailabilityResponse {
  _id: string;
  teacherId: string;
  teacher?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  windows: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
    isActive: boolean;
  }>;
  exceptions?: Array<{
    date: Date;
    isAvailable: boolean;
    reason?: string;
  }>;
  settings?: {
    maxBookingsPerDay: number;
    bookingDuration: number;
    advanceBookingDays: number;
    autoConfirm: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingResponse {
  _id: string;
  teacherId: string;
  teacher?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  studentIds: string[];
  students?: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  startAt: Date;
  endAt: Date;
  roomId: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  subject?: string;
  description?: string;
  meetingType: 'office-hours' | 'doubt-session' | 'group-study' | 'assessment';
  metadata?: {
    recordingUrl?: string;
    notes?: string;
    tags?: string[];
    duration?: number;
  };
  notifications?: {
    reminderSent: boolean;
    reminderSentAt?: Date;
    startNotificationSent: boolean;
    startNotificationSentAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SetAvailabilityRequest {
  windows: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone?: string;
    isActive?: boolean;
  }>;
  settings?: {
    maxBookingsPerDay?: number;
    bookingDuration?: number;
    advanceBookingDays?: number;
    autoConfirm?: boolean;
  };
}

export interface CreateMeetingRequest {
  teacherId: string;
  studentIds: string[];
  startAt: Date;
  endAt: Date;
  subject?: string;
  description?: string;
  meetingType?: 'office-hours' | 'doubt-session' | 'group-study' | 'assessment';
}

export interface MeetingFilters {
  status?: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  meetingType?: 'office-hours' | 'doubt-session' | 'group-study' | 'assessment';
  dateRange?: {
    start: Date;
    end: Date;
  };
  page?: number;
  limit?: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationResponse {
  _id: string;
  userId: string;
  type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder';
  title: string;
  message: string;
  meta?: {
    conversationId?: string;
    messageId?: string;
    callId?: string;
    meetingId?: string;
    doubtId?: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  status: 'unread' | 'read' | 'archived';
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationFilters {
  status?: 'unread' | 'read' | 'archived';
  type?: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder';
  page?: number;
  limit?: number;
}

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

export interface ChatSocketEvents {
  'join': { conversationId: string };
  'leave': { conversationId: string };
  'message:new': { message: MessageResponse };
  'message:ack': { messageId: string; conversationId: string };
  'typing': { conversationId: string; userId: string; isTyping: boolean };
  'presence': { userId: string; status: 'online' | 'offline' | 'away' };
  'read:update': { conversationId: string; userId: string; messageId: string };
  'error': { message: string; code?: string };
}

export interface CallSocketEvents {
  'call:ring': { call: CallResponse };
  'call:accept': { callId: string; userId: string };
  'call:reject': { callId: string; userId: string; reason?: string };
  'call:end': { callId: string; userId: string };
  'webrtc:offer': { callId: string; offer: any; from: string };
  'webrtc:answer': { callId: string; answer: any; from: string };
  'webrtc:ice': { callId: string; candidate: any; from: string };
  'error': { message: string; code?: string };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    uid: string;
    name?: string;
    email?: string;
    role: any;
    permissions?: string[];
  };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface ChatAnalytics {
  totalConversations: number;
  totalMessages: number;
  activeConversations: number;
  averageResponseTime: number;
  topSubjects: Array<{ subject: string; count: number }>;
  messageTypes: {
    text: number;
    image: number;
    file: number;
    audio: number;
  };
}

export interface CallAnalytics {
  totalCalls: number;
  completedCalls: number;
  missedCalls: number;
  averageDuration: number;
  callTypes: {
    voice: number;
    video: number;
    group: number;
  };
  topParticipants: Array<{ userId: string; name: string; callCount: number }>;
}

export interface DoubtAnalytics {
  totalDoubts: number;
  avgConfidence: number;
  helpfulCount: number;
  voiceCount: number;
  textCount: number;
  topSubjects: Array<{ subject: string; count: number }>;
  averageResponseTime: number;
}

export interface MeetingAnalytics {
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  noShowMeetings: number;
  avgDuration: number;
  meetingTypes: {
    'office-hours': number;
    'doubt-session': number;
    'group-study': number;
    assessment: number;
  };
}

// ============================================================================
// WHATSAPP TYPES
// ============================================================================

export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'template';
  text?: {
    body: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    caption?: string;
    filename?: string;
  };
  audio?: {
    link: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}
