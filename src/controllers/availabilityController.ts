import { Request, Response } from 'express';
import { z } from 'zod';
import { AvailabilityService, MeetingService } from '../services/availabilityService';
import { NotificationService } from '../services/notificationService';

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

const availabilityService = new AvailabilityService();
const meetingService = new MeetingService();
const notificationService = new NotificationService();

// Simple validation helper
const validateRequest = (schema: z.ZodSchema, data: any) => {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return { success: false, errors: error };
  }
};

// Validation schemas
const createAvailabilitySchema = z.object({
  windows: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string().default('UTC')
  })).min(1),
  exceptions: z.array(z.object({
    date: z.string().datetime(),
    isAvailable: z.boolean(),
    reason: z.string().optional()
  })).optional()
});

const updateAvailabilitySchema = createAvailabilitySchema.partial();

const scheduleMeetingSchema = z.object({
  teacherId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  subject: z.string().optional(),
  description: z.string().optional(),
  meetingType: z.enum(['office-hours', 'doubt-session', 'group-study', 'assessment']).default('doubt-session')
});

const updateMeetingSchema = z.object({
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  subject: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'cancelled']).optional()
});

export const availabilityController = {
  // Get teacher availability
  async getTeacherAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;

      const availability = await availabilityService.getTeacherAvailability(
        teacherId,
        date ? new Date(date as string) : undefined
      );

      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      console.error('Error getting teacher availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get teacher availability'
      });
    }
  },

  // Set teacher availability
  async setAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const teacherId = req.user?._id;
      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const validation = validateRequest(createAvailabilitySchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const availability = await availabilityService.setAvailability(
        teacherId,
        validation.data
      );

      res.json({
        success: true,
        data: availability,
        message: 'Availability set successfully'
      });
    } catch (error) {
      console.error('Error setting availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set availability'
      });
    }
  },

  // Update teacher availability
  async updateAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const teacherId = req.user?._id;
      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const validation = validateRequest(updateAvailabilitySchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const availability = await availabilityService.updateAvailability(
        teacherId,
        validation.data
      );

      res.json({
        success: true,
        data: availability,
        message: 'Availability updated successfully'
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update availability'
      });
    }
  },

  // Get available time slots for a teacher
  async getAvailableSlots(req: AuthenticatedRequest, res: Response) {
    try {
      const { teacherId } = req.params;
      const { date, duration = 30 } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
      }

      const slots = await availabilityService.getAvailableSlots(
        teacherId,
        new Date(date as string),
        parseInt(duration as string)
      );

      res.json({
        success: true,
        data: slots
      });
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available slots'
      });
    }
  },

  // Schedule a meeting
  async scheduleMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const studentId = req.user?._id;
      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const validation = validateRequest(scheduleMeetingSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const { teacherId, startAt, endAt, subject, description, meetingType } = validation.data;

      // Check if teacher is available
      const isAvailable = await availabilityService.checkAvailability(
        teacherId,
        new Date(startAt),
        new Date(endAt)
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Teacher is not available at the requested time'
        });
      }

      // Check for conflicts
      const conflicts = await meetingService.checkConflicts(
        teacherId,
        new Date(startAt),
        new Date(endAt)
      );

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Time slot conflicts with existing meetings'
        });
      }

      const meeting = await meetingService.createMeeting({
        teacherId,
        studentIds: [studentId],
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        subject,
        description,
        meetingType
      });

      // Send notifications
      await notificationService.createNotification(
        teacherId,
        'meeting',
        'New Meeting Request',
        `Student has requested a ${meetingType} meeting on ${new Date(startAt).toLocaleDateString()}`,
        {
          meetingId: meeting._id,
          actionUrl: `/meetings/${meeting._id}`,
          priority: 'medium'
        }
      );

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting scheduled successfully'
      });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule meeting'
      });
    }
  },

  // Get upcoming meetings
  async getUpcomingMeetings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { role = 'student', limit = 10 } = req.query;

      const meetings = await meetingService.getUpcomingMeetings(
        userId,
        role as 'teacher' | 'student',
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: meetings
      });
    } catch (error) {
      console.error('Error getting upcoming meetings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get upcoming meetings'
      });
    }
  },

  // Get meeting details
  async getMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const { meetingId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const meeting = await meetingService.getMeeting(meetingId, userId);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        data: meeting
      });
    } catch (error) {
      console.error('Error getting meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get meeting'
      });
    }
  },

  // Update meeting
  async updateMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const { meetingId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const validation = validateRequest(updateMeetingSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const meeting = await meetingService.updateMeeting(
        meetingId,
        userId,
        validation.data
      );

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found or access denied'
        });
      }

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting updated successfully'
      });
    } catch (error) {
      console.error('Error updating meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update meeting'
      });
    }
  },

  // Confirm meeting
  async confirmMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const { meetingId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const meeting = await meetingService.confirmMeeting(meetingId, userId);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found or access denied'
        });
      }

      // Send confirmation notifications to students
      for (const studentId of meeting.studentIds) {
        await notificationService.createNotification(
          studentId.toString(),
          'meeting',
          'Meeting Confirmed',
          `Your meeting has been confirmed`,
          {
            meetingId: meeting._id,
            actionUrl: `/meetings/${meeting._id}`,
            priority: 'medium'
          }
        );
      }

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting confirmed successfully'
      });
    } catch (error) {
      console.error('Error confirming meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm meeting'
      });
    }
  },

  // Cancel meeting
  async cancelMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const { meetingId } = req.params;
      const userId = req.user?._id;
      const { reason } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const meeting = await meetingService.cancelMeeting(meetingId, userId, reason);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found or access denied'
        });
      }

      // Send cancellation notifications
      const participants = [...meeting.studentIds, meeting.teacherId];
      for (const participantId of participants) {
        if (participantId.toString() !== userId) {
          await notificationService.createNotification(
            participantId.toString(),
            'meeting',
            'Meeting Cancelled',
            `Meeting scheduled for ${new Date(meeting.startAt).toLocaleDateString()} has been cancelled${reason ? `: ${reason}` : ''}`,
            {
              meetingId: meeting._id,
              priority: 'high'
            }
          );
        }
      }

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel meeting'
      });
    }
  },

  // Get meeting statistics
  async getMeetingStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { role = 'student', startDate, endDate } = req.query;

      const dateRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;

      const stats = await meetingService.getMeetingStats(
        userId,
        role as 'teacher' | 'student',
        dateRange
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting meeting stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get meeting statistics'
      });
    }
  }
};
