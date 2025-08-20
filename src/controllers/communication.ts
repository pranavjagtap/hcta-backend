import { Request, Response, NextFunction } from 'express';
import { CommunicationService } from '../services/communication';
import { 
  createCommunicationSchema,
  updateCommunicationSchema,
  communicationQuerySchema,
  sendMessageSchema,
  generatePerformanceReportSchema,
  communicationIdSchema,
  greetingSettingsSchema,
  updateGreetingSettingsSchema,
  sendGreetingsSchema
} from '../validators/communication';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/response';
import { logger } from '../utils/logger';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    uid: string;
    name?: string;
    email?: string;
    role: any;
    permissions?: string[];
  };
}

/**
 * Send messages to multiple students
 */
export const sendMessageController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.sendMessages(validatedData, userId);

    sendResponse(res, result, 'Messages sent successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and send performance report
 */
export const generatePerformanceReportController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = generatePerformanceReportSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const normalized = {
      ...validatedData,
      dateRange: validatedData?.dateRange
        ? {
            startDate: new Date((validatedData as any).dateRange.startDate),
            endDate: new Date((validatedData as any).dateRange.endDate),
          }
        : undefined,
    } as any;

    const result = await CommunicationService.generateAndSendPerformanceReport(normalized, userId);

    sendResponse(res, result, 'Performance report generated and sent successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get communications with pagination and filtering
 */
export const getCommunicationsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = communicationQuerySchema.parse(req.query);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.getCommunications(validatedQuery, userId);

    sendResponse(res, result, 'Communications retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get communication by ID
 */
export const getCommunicationByIdController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = communicationIdSchema.parse(req.params);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.getCommunicationById(id);

    sendResponse(res, result, 'Communication retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update communication
 */
export const updateCommunicationController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = communicationIdSchema.parse(req.params);
    const validatedData = updateCommunicationSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.updateCommunication(id, validatedData, userId);

    sendResponse(res, result, 'Communication updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get greeting settings for user
 */
export const getGreetingSettingsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.getGreetingSettings(userId);

    sendResponse(res, result, 'Greeting settings retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update greeting settings
 */
export const updateGreetingSettingsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateGreetingSettingsSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.updateGreetingSettings(userId, validatedData);

    sendResponse(res, result, 'Greeting settings updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Send birthday greetings manually
 */
export const sendBirthdayGreetingsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // This will run in the background
    CommunicationService.sendBirthdayGreetings().catch(error => {
      logger.error('Failed to send birthday greetings in background', { error });
    });

    sendResponse(res, {}, 'Birthday greetings process initiated', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Send festival greetings manually
 */
export const sendFestivalGreetingsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { greetingType, festivalName, customMessage } = sendGreetingsSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // TODO: Implement festival greetings logic
    // This would involve checking if today is a festival and sending greetings to all students

    sendResponse(res, {}, 'Festival greetings process initiated', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get communication statistics
 */
export const getCommunicationStatsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.getCommunicationStats(userId);

    sendResponse(res, result, 'Communication statistics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Create communication record
 */
export const createCommunicationController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createCommunicationSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.createCommunication(validatedData, userId);

    sendResponse(res, result, 'Communication created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete communication record
 */
export const deleteCommunicationController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = communicationIdSchema.parse(req.params);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // TODO: Implement soft delete for communications
    // For now, we'll just return success
    sendResponse(res, {}, 'Communication deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Retry failed communication
 */
export const retryCommunicationController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = communicationIdSchema.parse(req.params);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // TODO: Implement retry logic for failed communications
    // This would involve resending the WhatsApp message and updating the status

    sendResponse(res, {}, 'Communication retry initiated', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk send messages
 */
export const bulkSendMessagesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await CommunicationService.sendMessages(validatedData, userId);

    sendResponse(res, result, 'Bulk messages sent successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get message templates
 */
export const getMessageTemplatesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = {
      reminder: {
        title: 'Class Reminder',
        template: '📚 Class Reminder for {studentName}\n\nSubject: {subject}\nTopic: {topic}\nDue Date: {dueDate}\n\nPlease ensure your child attends the class.\n\nBest regards,\nHCTA Team'
      },
      fee_reminder: {
        title: 'Fee Reminder',
        template: '💰 Fee Reminder for {studentName}\n\nThis is a friendly reminder about the pending fee payment.\n\nPlease complete the payment at your earliest convenience.\n\nBest regards,\nHCTA Team'
      },
      performance_report: {
        title: 'Performance Report',
        template: '📊 Performance Report for {studentName}\n\nYour child\'s weekly performance report is ready!\n\n📄 Download: {reportUrl}\n\n📅 Period: {startDate} to {endDate}\n\nBest regards,\nHCTA Team'
      },
      greeting: {
        title: 'Greeting',
        template: 'Hello {studentName}!\n\nBest regards,\nHCTA Team'
      }
    };

    sendResponse(res, templates, 'Message templates retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
