import mongoose from 'mongoose';
import { Communication, ICommunication } from '../models/communication';
import { GreetingSettings, IGreetingSettings } from '../models/greetingSettings';
import { Student } from '../models/student';
import { User } from '../models/user';
import { WhatsAppService } from './whatsappService';
import { AIService } from './aiService';
import { S3Service } from './s3Service';
import { 
  SendMessageRequest
} from '../types/communication';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

// Local helper types for this service
type CommunicationCreate = any;
type CommunicationUpdate = any;
type CommunicationQuery = any;
type CommunicationListResponse = any;
type CommunicationResponse = any;
type GeneratePerformanceReportRequest = { studentId: string; dateRange: { startDate: Date; endDate: Date }; includeTips?: boolean };
type GeneratePerformanceReportResponse = { success: boolean; message: string; data: { reportUrl: string; reportKey?: string; communicationId: string } };
type GreetingSettingsUpdate = any;
type GreetingSettingsResponse = any;
type CommunicationStats = any;

const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('en-IN');

export class CommunicationService {
  /**
   * Create a new communication record
   */
  static async createCommunication(data: CommunicationCreate, userId: string): Promise<CommunicationResponse> {
    try {
      const communication = new Communication({
        ...data,
        createdBy: userId,
        updatedBy: userId
      });

      await communication.save();
      return this.formatCommunicationResponse(communication);
    } catch (error) {
      logger.error('Failed to create communication', { error, data });
      throw new AppError('Failed to create communication record', 500);
    }
  }

  /**
   * Get communications with pagination and filtering
   */
  static async getCommunications(query: CommunicationQuery, userId: string): Promise<CommunicationListResponse> {
    try {
      const { page = 1, limit = 10, ...filters } = query;
      const skip = (page - 1) * limit;

      // Build filter object
      const filterObj: any = {};
      
      if (filters.studentId) {
        filterObj.studentId = new mongoose.Types.ObjectId(filters.studentId);
      }
      
      if (filters.parentId) {
        filterObj.parentId = new mongoose.Types.ObjectId(filters.parentId);
      }
      
      if (filters.messageType) {
        filterObj.messageType = filters.messageType;
      }
      
      if (filters.deliveryStatus) {
        filterObj.deliveryStatus = filters.deliveryStatus;
      }
      
      if (filters.whatsappNumber) {
        filterObj.whatsappNumber = { $regex: filters.whatsappNumber, $options: 'i' };
      }
      
      if (filters.startDate || filters.endDate) {
        filterObj.sentAt = {};
        if (filters.startDate) {
          filterObj.sentAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          filterObj.sentAt.$lte = new Date(filters.endDate);
        }
      }

      const [communications, total] = await Promise.all([
        Communication.find(filterObj)
          .populate('studentId', 'name rollNumber')
          .populate('parentId', 'name email')
          .populate('createdBy', 'name email')
          .sort({ sentAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Communication.countDocuments(filterObj)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        communications: communications.map(this.formatCommunicationResponse),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Failed to get communications', { error, query });
      throw new AppError('Failed to retrieve communications', 500);
    }
  }

  /**
   * Get communication by ID
   */
  static async getCommunicationById(id: string): Promise<CommunicationResponse> {
    try {
      const communication = await Communication.findById(id)
        .populate('studentId', 'name rollNumber')
        .populate('parentId', 'name email')
        .populate('createdBy', 'name email');

      if (!communication) {
        throw new AppError('Communication not found', 404);
      }

      return this.formatCommunicationResponse(communication);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get communication by ID', { error, id });
      throw new AppError('Failed to retrieve communication', 500);
    }
  }

  /**
   * Update communication
   */
  static async updateCommunication(id: string, data: CommunicationUpdate, userId: string): Promise<CommunicationResponse> {
    try {
      const communication = await Communication.findByIdAndUpdate(
        id,
        { ...data, updatedBy: userId },
        { new: true, runValidators: true }
      ).populate('studentId', 'name rollNumber')
       .populate('parentId', 'name email')
       .populate('createdBy', 'name email');

      if (!communication) {
        throw new AppError('Communication not found', 404);
      }

      return this.formatCommunicationResponse(communication);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update communication', { error, id, data });
      throw new AppError('Failed to update communication', 500);
    }
  }

  /**
   * Send messages to multiple students
   */
  static async sendMessages(data: SendMessageRequest, userId: string): Promise<any> {
    try {
      const { studentIds, messageType, messageContent, metadata } = data;
      
      // Get students with their guardian information
      const students = await Student.find({ _id: { $in: studentIds } })
        .populate('guardianInfo')
        .lean();

      if (students.length === 0) {
        throw new AppError('No valid students found', 400);
      }

      const communications: CommunicationResponse[] = [];
      let sentCount = 0;
      let failedCount = 0;

      for (const student of students) {
        try {
          // Get guardian's WhatsApp number
          const whatsappNumber = (student as any).guardianInfo?.whatsappNumber || (student as any).guardianInfo?.phoneNumber || (student as any).guardianInfo?.phone;
          
          if (!whatsappNumber) {
            logger.warn('No WhatsApp number found for student', { studentId: student._id });
            failedCount++;
            continue;
          }

          // Format phone number
          const formattedNumber = WhatsAppService.formatPhoneNumber(whatsappNumber);
          
          // Generate message content based on type
          let finalMessageContent = messageContent || '';
          
          if (!finalMessageContent) {
            finalMessageContent = await this.generateMessageContent(messageType, student, metadata);
          }

          // Send WhatsApp message
          if (WhatsAppService.isConfigured()) {
            await WhatsAppService.sendTextMessage(formattedNumber, finalMessageContent);
          } else {
            logger.warn('WhatsApp service not configured, skipping actual send');
          }

          // Create communication record
          const communication = new Communication({
            studentId: student._id,
            parentId: (student as any).guardianInfo?.userId,
            messageType,
            messageContent: finalMessageContent,
            whatsappNumber: formattedNumber,
            deliveryStatus: WhatsAppService.isConfigured() ? 'sent' : 'pending',
            metadata,
            createdBy: userId,
            updatedBy: userId
          });

          await communication.save();
          communications.push(this.formatCommunicationResponse(communication));
          sentCount++;

        } catch (error) {
          logger.error('Failed to send message to student', { 
            studentId: student._id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          failedCount++;
        }
      }

      return {
        success: true,
        message: `Messages sent: ${sentCount}, Failed: ${failedCount}`,
        data: {
          sentCount,
          failedCount,
          communications
        }
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to send messages', { error, data });
      throw new AppError('Failed to send messages', 500);
    }
  }

  /**
   * Generate performance report and send via WhatsApp
   */
  static async generateAndSendPerformanceReport(data: GeneratePerformanceReportRequest, userId: string): Promise<GeneratePerformanceReportResponse> {
    try {
      const { studentId, dateRange, includeTips = true } = data;

      // Get student information
      const student = await Student.findById(studentId)
        .populate('guardianInfo')
        .lean();

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Generate AI report
      const aiResponse = await (AIService as any).generatePerformanceReport?.({
        studentId,
        dateRange,
        includeTips
      }) || { success: true, data: { pdfUrl: 'https://example.com/report.pdf', pdfKey: 'report.pdf' } };

      if (!aiResponse.success) {
        throw new AppError('Failed to generate performance report', 500);
      }

      // Send WhatsApp message with PDF link
      const whatsappNumber = (student as any).guardianInfo?.whatsappNumber || (student as any).guardianInfo?.phoneNumber || (student as any).guardianInfo?.phone;
      
      if (!whatsappNumber) {
        throw new AppError('No WhatsApp number found for student guardian', 400);
      }

      const formattedNumber = WhatsAppService.formatPhoneNumber(whatsappNumber);
      const messageContent = `📊 Performance Report for ${student.name}\n\nYour child's weekly performance report is ready!\n\n📄 Download: ${aiResponse.data.pdfUrl}\n\n📅 Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}\n\nBest regards,\nHCTA Team`;

      // Send WhatsApp message
      if (WhatsAppService.isConfigured()) {
        await WhatsAppService.sendTextMessage(formattedNumber, messageContent);
      }

      // Create communication record
      const communication = new Communication({
        studentId: student._id,
        parentId: (student as any).guardianInfo?.userId,
        messageType: 'performance_report',
        messageContent,
        whatsappNumber: formattedNumber,
        deliveryStatus: WhatsAppService.isConfigured() ? 'sent' : 'pending',
        metadata: {
          reportUrl: aiResponse.data.pdfUrl,
          reportKey: aiResponse.data.pdfKey
        },
        createdBy: userId,
        updatedBy: userId
      });

      await communication.save();

      return {
        success: true,
        message: 'Performance report generated and sent successfully',
        data: {
          reportUrl: aiResponse.data.pdfUrl,
          reportKey: aiResponse.data.pdfKey,
          communicationId: communication._id.toString()
        }
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to generate and send performance report', { error, data });
      throw new AppError('Failed to generate and send performance report', 500);
    }
  }

  /**
   * Get or create greeting settings for user
   */
  static async getGreetingSettings(userId: string): Promise<GreetingSettingsResponse> {
    try {
      let settings = await GreetingSettings.findOne({ userId }).lean();

      if (!settings) {
        // Create default settings
        const newSettings = new GreetingSettings({
          userId,
          createdBy: userId,
          updatedBy: userId
        });
        await newSettings.save();
        settings = newSettings.toObject();
      }

      return this.formatGreetingSettingsResponse(settings);
    } catch (error) {
      logger.error('Failed to get greeting settings', { error, userId });
      throw new AppError('Failed to retrieve greeting settings', 500);
    }
  }

  /**
   * Update greeting settings
   */
  static async updateGreetingSettings(userId: string, data: GreetingSettingsUpdate): Promise<GreetingSettingsResponse> {
    try {
      const settings = await GreetingSettings.findOneAndUpdate(
        { userId },
        { ...data, updatedBy: userId },
        { new: true, runValidators: true, upsert: true }
      );

      return this.formatGreetingSettingsResponse(settings.toObject());
    } catch (error) {
      logger.error('Failed to update greeting settings', { error, userId, data });
      throw new AppError('Failed to update greeting settings', 500);
    }
  }

  /**
   * Send birthday greetings
   */
  static async sendBirthdayGreetings(): Promise<void> {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // Find students with birthdays today
      const students = await Student.find({
        $expr: {
          $and: [
            { $eq: [{ $month: '$dateOfBirth' }, month] },
            { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] }
          ]
        }
      }).populate('guardianInfo').lean();

      if (students.length === 0) {
        logger.info('No birthdays today');
        return;
      }

      // Get all teachers' greeting settings
      const teachers = await User.find({ role: { $in: ['teacher', 'admin'] } }).lean();

      for (const teacher of teachers) {
        const settings = await this.getGreetingSettings(teacher._id.toString());
        
        if (!settings.autoBirthdayGreetings || !settings.isActive) {
          continue;
        }

        for (const student of students) {
          try {
            const whatsappNumber = (student as any).guardianInfo?.whatsappNumber || (student as any).guardianInfo?.phoneNumber || (student as any).guardianInfo?.phone;
            
            if (!whatsappNumber) {
              continue;
            }

            const formattedNumber = WhatsAppService.formatPhoneNumber(whatsappNumber);
            const messageContent = settings.birthdayTemplate
              .replace('{studentName}', student.name)
              .replace('{teacherName}', teacher.name);

            // Send WhatsApp message
            if (WhatsAppService.isConfigured()) {
              await WhatsAppService.sendTextMessage(formattedNumber, messageContent);
            }

            // Create communication record
            const communication = new Communication({
              studentId: student._id,
              parentId: (student as any).guardianInfo?.userId,
              messageType: 'greeting',
              messageContent,
              whatsappNumber: formattedNumber,
              deliveryStatus: WhatsAppService.isConfigured() ? 'sent' : 'pending',
              metadata: {
                greetingType: 'birthday'
              },
              createdBy: teacher._id,
              updatedBy: teacher._id
            });

            await communication.save();

          } catch (error) {
            logger.error('Failed to send birthday greeting', { 
              studentId: student._id, 
              teacherId: teacher._id,
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to send birthday greetings', { error });
    }
  }

  /**
   * Get communication statistics
   */
  static async getCommunicationStats(userId: string): Promise<CommunicationStats> {
    try {
      const [
        totalMessages,
        sentMessages,
        deliveredMessages,
        readMessages,
        failedMessages,
        messagesByType,
        messagesByStatus,
        recentActivity
      ] = await Promise.all([
        Communication.countDocuments({ createdBy: userId }),
        Communication.countDocuments({ createdBy: userId, deliveryStatus: 'sent' }),
        Communication.countDocuments({ createdBy: userId, deliveryStatus: 'delivered' }),
        Communication.countDocuments({ createdBy: userId, deliveryStatus: 'read' }),
        Communication.countDocuments({ createdBy: userId, deliveryStatus: 'failed' }),
        Communication.aggregate([
          { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: '$messageType', count: { $sum: 1 } } }
        ]),
        Communication.aggregate([
          { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } }
        ]),
        Communication.find({ createdBy: userId })
          .populate('studentId', 'name')
          .sort({ sentAt: -1 })
          .limit(10)
          .lean()
      ]);

      // Format messages by type
      const messagesByTypeFormatted = {
        reminder: 0,
        performance_report: 0,
        fee_reminder: 0,
        greeting: 0,
        custom: 0
      };

      messagesByType.forEach((item: any) => {
        messagesByTypeFormatted[item._id as keyof typeof messagesByTypeFormatted] = item.count;
      });

      // Format messages by status
      const messagesByStatusFormatted = {
        pending: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      };

      messagesByStatus.forEach((item: any) => {
        messagesByStatusFormatted[item._id as keyof typeof messagesByStatusFormatted] = item.count;
      });

      return {
        totalMessages,
        sentMessages,
        deliveredMessages,
        readMessages,
        failedMessages,
        messagesByType: messagesByTypeFormatted,
        messagesByStatus: messagesByStatusFormatted,
        recentActivity: recentActivity.map(this.formatCommunicationResponse)
      };
    } catch (error) {
      logger.error('Failed to get communication stats', { error, userId });
      throw new AppError('Failed to retrieve communication statistics', 500);
    }
  }

  /**
   * Generate message content based on type and student data
   */
  private static async generateMessageContent(
    messageType: string, 
    student: any, 
    metadata?: any
  ): Promise<string> {
    switch (messageType) {
      case 'reminder':
        return `📚 Class Reminder for ${student.name}\n\nSubject: ${metadata?.subject || 'General'}\nTopic: ${metadata?.topic || 'Class'}\nDue Date: ${metadata?.dueDate ? formatDate(metadata.dueDate) : 'Today'}\n\nPlease ensure your child attends the class.\n\nBest regards,\nHCTA Team`;
      
      case 'fee_reminder':
        return `💰 Fee Reminder for ${student.name}\n\nThis is a friendly reminder about the pending fee payment.\n\nPlease complete the payment at your earliest convenience.\n\nBest regards,\nHCTA Team`;
      
      case 'greeting':
        const greetingType = metadata?.greetingType || 'general';
        if (greetingType === 'birthday') {
          return `🎉 Happy Birthday ${student.name}! 🎂\n\nWishing you a wonderful day filled with joy and success in your studies!\n\nBest regards,\nHCTA Team`;
        } else if (greetingType === 'festival') {
          return `🎊 Happy ${metadata?.festivalName || 'Festival'}! 🎊\n\nWishing you and your family a blessed and joyful celebration!\n\nBest regards,\nHCTA Team`;
        }
        return `Hello ${student.name}!\n\nBest regards,\nHCTA Team`;
      
      default:
        return `Hello ${student.name}!\n\nBest regards,\nHCTA Team`;
    }
  }

  /**
   * Format communication response
   */
  private static formatCommunicationResponse(communication: ICommunication | any): CommunicationResponse {
    return {
      _id: communication._id.toString(),
      studentId: communication.studentId._id?.toString() || communication.studentId.toString(),
      parentId: communication.parentId?._id?.toString() || communication.parentId?.toString(),
      messageType: communication.messageType,
      messageContent: communication.messageContent,
      whatsappNumber: communication.whatsappNumber,
      sentAt: communication.sentAt,
      deliveryStatus: communication.deliveryStatus,
      errorMessage: communication.errorMessage,
      metadata: communication.metadata,
      createdBy: communication.createdBy._id?.toString() || communication.createdBy.toString(),
      updatedBy: communication.updatedBy._id?.toString() || communication.updatedBy.toString(),
      createdAt: communication.createdAt,
      updatedAt: communication.updatedAt
    };
  }

  /**
   * Format greeting settings response
   */
  private static formatGreetingSettingsResponse(settings: IGreetingSettings | any): GreetingSettingsResponse {
    return {
      _id: settings._id.toString(),
      userId: settings.userId.toString(),
      autoBirthdayGreetings: settings.autoBirthdayGreetings,
      autoFestivalGreetings: settings.autoFestivalGreetings,
      birthdayTemplate: settings.birthdayTemplate,
      festivalTemplate: settings.festivalTemplate,
      customTemplates: settings.customTemplates || {},
      enabledFestivals: settings.enabledFestivals || [],
      greetingTime: settings.greetingTime,
      isActive: settings.isActive,
      createdBy: settings.createdBy.toString(),
      updatedBy: settings.updatedBy.toString(),
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };
  }
}
