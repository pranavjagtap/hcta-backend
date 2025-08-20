import { Availability, IAvailability } from '../models/availability';
import { Meeting, IMeeting } from '../models/meeting';
import { User } from '../models/user';
import mongoose from 'mongoose';

export interface AvailabilityWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface AvailabilityException {
  date: Date;
  isAvailable: boolean;
  reason?: string;
}

export interface CreateAvailabilityData {
  windows: AvailabilityWindow[];
  exceptions?: AvailabilityException[];
}

export interface UpdateAvailabilityData {
  windows?: AvailabilityWindow[];
  exceptions?: AvailabilityException[];
}

export interface CreateMeetingData {
  teacherId: string;
  studentIds: string[];
  startAt: Date;
  endAt: Date;
  subject?: string;
  description?: string;
  meetingType: 'office-hours' | 'doubt-session' | 'group-study' | 'assessment';
}

export interface UpdateMeetingData {
  startAt?: Date;
  endAt?: Date;
  subject?: string;
  description?: string;
  status?: 'scheduled' | 'confirmed' | 'cancelled';
}

export class AvailabilityService {
  // Get teacher availability
  async getTeacherAvailability(teacherId: string, date?: Date): Promise<IAvailability | null> {
    try {
      const availability = await Availability.findOne({ teacherId })
        .populate('teacher', 'name email avatar')
        .lean();

      if (!availability) {
        return null;
      }

      // If date is provided, check for exceptions
      if (date) {
        const dayOfWeek = date.getDay();
        const timeString = date.toTimeString().slice(0, 5); // HH:MM format
        
        // Check if there's an exception for this date
        const exception = availability.exceptions?.find(ex => 
          ex.date.toDateString() === date.toDateString()
        );

        if (exception) {
          return {
            ...availability,
            // annotate availability status in a computed field
            availabilityStatus: {
              isAvailable: exception.isAvailable,
              reason: exception.reason
            }
          } as any;
        }

        // Check regular availability windows
        const window = availability.windows.find(w => w.dayOfWeek === dayOfWeek);
        if (window) {
          const isAvailable = timeString >= window.startTime && timeString <= window.endTime;
          return {
            ...availability,
            availabilityStatus: {
              isAvailable
            },
            currentWindow: window
          } as any;
        }
      }

      return availability;
    } catch (error) {
      console.error('Error getting teacher availability:', error);
      throw error;
    }
  }

  // Set teacher availability
  async setAvailability(teacherId: string, data: CreateAvailabilityData): Promise<IAvailability> {
    try {
      // Validate teacher exists
      const teacher = await User.findById(teacherId);
      if (!teacher) {
        throw new Error('Teacher not found');
      }

      // Check if availability already exists
      let availability = await Availability.findOne({ teacherId });

      if (availability) {
        // Update existing availability
        availability.windows = data.windows;
        if (data.exceptions) {
          availability.exceptions = data.exceptions;
        }
        await availability.save();
      } else {
        // Create new availability
        availability = new Availability({
          teacherId,
          windows: data.windows,
          exceptions: data.exceptions || []
        });
        await availability.save();
      }

      return availability.populate('teacher', 'name email avatar');
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  }

  // Update teacher availability
  async updateAvailability(teacherId: string, data: UpdateAvailabilityData): Promise<IAvailability> {
    try {
      const availability = await Availability.findOne({ teacherId });
      if (!availability) {
        throw new Error('Availability not found');
      }

      if (data.windows) {
        availability.windows = data.windows;
      }

      if (data.exceptions) {
        availability.exceptions = data.exceptions;
      }

      await availability.save();
      return availability.populate('teacher', 'name email avatar');
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  // Get available time slots for a teacher
  async getAvailableSlots(teacherId: string, date: Date, durationMinutes: number = 30): Promise<Array<{ start: string; end: string }>> {
    try {
      const availability = await this.getTeacherAvailability(teacherId, date);
      if (!availability) {
        return [];
      }

      const dayOfWeek = date.getDay();
      const window = availability.windows?.find(w => w.dayOfWeek === dayOfWeek);
      
      if (!window) {
        return [];
      }

      // Check for exceptions
      const exception = availability.exceptions?.find(ex => 
        ex.date.toDateString() === date.toDateString()
      );

      if (exception && !exception.isAvailable) {
        return [];
      }

      // Generate time slots
      const slots: Array<{ start: string; end: string }> = [];
      const startTime = new Date(`2000-01-01T${window.startTime}:00`);
      const endTime = new Date(`2000-01-01T${window.endTime}:00`);
      
      let currentTime = new Date(startTime);
      
      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);
        
        if (slotEnd <= endTime) {
          slots.push({
            start: currentTime.toTimeString().slice(0, 5),
            end: slotEnd.toTimeString().slice(0, 5)
          });
        }
        
        currentTime = slotEnd;
      }

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }

  // Check if teacher is available at specific time
  async checkAvailability(teacherId: string, startAt: Date, endAt: Date): Promise<boolean> {
    try {
      const availability = await this.getTeacherAvailability(teacherId, startAt);
      if (!availability) {
        return false;
      }

      // Check if the time range falls within available windows
      const dayOfWeek = startAt.getDay();
      const window = availability.windows?.find(w => w.dayOfWeek === dayOfWeek);
      
      if (!window) {
        return false;
      }

      const startTime = startAt.toTimeString().slice(0, 5);
      const endTime = endAt.toTimeString().slice(0, 5);

      return startTime >= window.startTime && endTime <= window.endTime;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }
}

export class MeetingService {
  // Create a new meeting
  async createMeeting(data: CreateMeetingData): Promise<IMeeting> {
    try {
      const meeting = new Meeting({
        ...data,
        roomId: this.generateRoomId(),
        status: 'scheduled'
      });

      await meeting.save();
      return meeting.populate(['teacher', 'students']);
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  // Get upcoming meetings for a user
  async getUpcomingMeetings(userId: string, role: 'teacher' | 'student', limit: number = 10): Promise<IMeeting[]> {
    try {
      const now = new Date();
      const query: any = {};
      if (role === 'teacher') {
        query.teacherId = userId;
      } else {
        query.studentIds = userId;
      }
      query.startAt = { $gte: now };
      return await Meeting.find(query)
        .sort({ startAt: 1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error getting upcoming meetings:', error);
      throw error;
    }
  }

  // Get meeting details
  async getMeeting(meetingId: string, userId: string): Promise<IMeeting | null> {
    try {
      const meeting = await Meeting.findById(meetingId)
        .populate('teacher', 'name email avatar')
        .populate('students', 'name email avatar')
        .lean();

      if (!meeting) {
        return null;
      }

      // Check if user is a participant
      const isParticipant = meeting.teacherId.toString() === userId || 
                           meeting.studentIds.some(id => id.toString() === userId);

      return isParticipant ? meeting : null;
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw error;
    }
  }

  // Update meeting
  async updateMeeting(meetingId: string, userId: string, data: UpdateMeetingData): Promise<IMeeting | null> {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return null;
      }

      // Check if user is the teacher or admin
      const isTeacher = meeting.teacherId.toString() === userId;
      if (!isTeacher) {
        return null;
      }

      Object.assign(meeting, data);
      await meeting.save();

      return meeting.populate(['teacher', 'students']);
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  }

  // Confirm meeting
  async confirmMeeting(meetingId: string, userId: string): Promise<IMeeting | null> {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return null;
      }

      // Check if user is the teacher
      if (meeting.teacherId.toString() !== userId) {
        return null;
      }

      (meeting as any).status = 'confirmed';
      await meeting.save();
      return meeting as any;
    } catch (error) {
      console.error('Error confirming meeting:', error);
      throw error;
    }
  }

  // Cancel meeting
  async cancelMeeting(meetingId: string, userId: string, reason?: string): Promise<IMeeting | null> {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return null;
      }

      // Check if user is a participant
      const isParticipant = meeting.teacherId.toString() === userId || 
                           meeting.studentIds.some(id => id.toString() === userId);

      if (!isParticipant) {
        return null;
      }

      (meeting as any).status = 'cancelled';
      (meeting as any).metadata = { ...(meeting as any).metadata, cancelReason: reason };
      await meeting.save();
      return meeting as any;
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      throw error;
    }
  }

  // Check for conflicts
  async checkConflicts(teacherId: string, startAt: Date, endAt: Date, excludeMeetingId?: string): Promise<IMeeting[]> {
    try {
      const query: any = {
        teacherId,
        startAt: { $lt: endAt },
        endAt: { $gt: startAt },
        status: { $nin: ['cancelled'] }
      };
      if (excludeMeetingId) {
        query._id = { $ne: excludeMeetingId };
      }
      return await Meeting.find(query).lean();
    } catch (error) {
      console.error('Error checking conflicts:', error);
      throw error;
    }
  }

  // Get meeting statistics
  async getMeetingStats(userId: string, role: 'teacher' | 'student', dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const query: any = {};
      if (role === 'teacher') {
        query.teacherId = userId;
      } else {
        query.studentIds = userId;
      }
      if (dateRange) {
        query.startAt = { $gte: dateRange.start };
        query.endAt = { $lte: dateRange.end };
      }
      const meetings = await Meeting.find(query).lean();
      const total = meetings.length;
      const completed = meetings.filter(m => m.status === 'completed').length;
      const cancelled = meetings.filter(m => m.status === 'cancelled').length;
      const upcoming = meetings.filter(m => m.status === 'scheduled' || m.status === 'confirmed').length;
      return { total, completed, cancelled, upcoming };
    } catch (error) {
      console.error('Error getting meeting stats:', error);
      throw error;
    }
  }

  // Generate unique room ID
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
