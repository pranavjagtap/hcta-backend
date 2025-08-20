import { z } from 'zod';

// Base communication schema
export const communicationBaseSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  parentId: z.string().optional(),
  messageType: z.enum(['reminder', 'performance_report', 'fee_reminder', 'greeting', 'custom'], {
    required_error: 'Message type is required',
    invalid_type_error: 'Invalid message type'
  }),
  messageContent: z.string().min(1, 'Message content is required').max(1000, 'Message content too long'),
  whatsappNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid WhatsApp number format'),
  metadata: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    reportUrl: z.string().url().optional(),
    reportKey: z.string().optional(),
    greetingType: z.enum(['birthday', 'festival']).optional()
  }).optional()
});

// Create communication schema
export const createCommunicationSchema = communicationBaseSchema;

// Update communication schema
export const updateCommunicationSchema = z.object({
  deliveryStatus: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).optional(),
  errorMessage: z.string().optional(),
  metadata: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    reportUrl: z.string().url().optional(),
    reportKey: z.string().optional(),
    greetingType: z.enum(['birthday', 'festival']).optional()
  }).optional()
});

// Communication query schema
export const communicationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  studentId: z.string().optional(),
  parentId: z.string().optional(),
  messageType: z.enum(['reminder', 'performance_report', 'fee_reminder', 'greeting', 'custom']).optional(),
  deliveryStatus: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  whatsappNumber: z.string().optional()
});

// Send message schema
export const sendMessageSchema = z.object({
  studentIds: z.array(z.string().min(1, 'Student ID is required')).min(1, 'At least one student ID is required'),
  messageType: z.enum(['reminder', 'performance_report', 'fee_reminder', 'greeting', 'custom'], {
    required_error: 'Message type is required',
    invalid_type_error: 'Invalid message type'
  }),
  messageContent: z.string().min(1, 'Message content is required').max(1000, 'Message content too long').optional(),
  metadata: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    greetingType: z.enum(['birthday', 'festival']).optional()
  }).optional()
});

// Generate performance report schema
export const generatePerformanceReportSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  dateRange: z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format')
  }).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before or equal to end date'
  }),
  includeTips: z.boolean().default(true)
});

// Communication ID schema
export const communicationIdSchema = z.object({
  id: z.string().min(1, 'Communication ID is required')
});

// Greeting settings schema
export const greetingSettingsSchema = z.object({
  autoBirthdayGreetings: z.boolean().default(true),
  autoFestivalGreetings: z.boolean().default(true),
  birthdayTemplate: z.string().min(1, 'Birthday template is required').max(500, 'Birthday template too long'),
  festivalTemplate: z.string().min(1, 'Festival template is required').max(500, 'Festival template too long'),
  customTemplates: z.record(z.string()).default({}),
  enabledFestivals: z.array(z.enum([
    'Diwali', 'Holi', 'Raksha Bandhan', 'Ganesh Chaturthi', 
    'Navratri', 'Dussehra', 'Guru Nanak Jayanti', 'Christmas',
    'Eid al-Fitr', 'Eid al-Adha', 'Makar Sankranti', 'Republic Day',
    'Independence Day', 'Gandhi Jayanti', 'Teachers Day'
  ])).default([]),
  greetingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').default('09:00'),
  isActive: z.boolean().default(true)
});

// Update greeting settings schema
export const updateGreetingSettingsSchema = greetingSettingsSchema.partial();

// Send greetings schema
export const sendGreetingsSchema = z.object({
  greetingType: z.enum(['birthday', 'festival'], {
    required_error: 'Greeting type is required',
    invalid_type_error: 'Invalid greeting type'
  }),
  festivalName: z.string().optional(),
  customMessage: z.string().optional()
});

// Bulk message schema
export const bulkMessageSchema = z.object({
  studentIds: z.array(z.string().min(1, 'Student ID is required')).min(1, 'At least one student ID is required'),
  messageType: z.enum(['reminder', 'performance_report', 'fee_reminder', 'greeting', 'custom'], {
    required_error: 'Message type is required',
    invalid_type_error: 'Invalid message type'
  }),
  messageTemplate: z.string().min(1, 'Message template is required').max(1000, 'Message template too long'),
  metadata: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    greetingType: z.enum(['birthday', 'festival']).optional()
  }).optional()
});

// Message preview schema
export const messagePreviewSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  messageType: z.enum(['reminder', 'performance_report', 'fee_reminder', 'greeting', 'custom'], {
    required_error: 'Message type is required',
    invalid_type_error: 'Invalid message type'
  }),
  messageContent: z.string().min(1, 'Message content is required').max(1000, 'Message content too long'),
  metadata: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    greetingType: z.enum(['birthday', 'festival']).optional()
  }).optional()
});
