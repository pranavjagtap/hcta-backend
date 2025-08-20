import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailability extends Document {
  teacherId: mongoose.Types.ObjectId;
  windows: Array<{
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    timezone: string;
  }>;
  exceptions?: Array<{
    date: Date;
    isAvailable: boolean;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailability>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  windows: [{
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }],
  exceptions: [{
    date: {
      type: Date,
      required: true
    },
    isAvailable: {
      type: Boolean,
      required: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
availabilitySchema.index({ teacherId: 1 });
availabilitySchema.index({ 'exceptions.date': 1 });

// Virtual for teacher info
availabilitySchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true
});

// Method to check if teacher is available at specific time
availabilitySchema.methods.isAvailableAt = function(date: Date): boolean {
  const dayOfWeek = date.getDay();
  const timeString = date.toTimeString().slice(0, 5); // HH:MM format
  
  // Check for exceptions first
  const exception = this.exceptions?.find((ex: { date: Date; isAvailable: boolean; reason?: string }) => 
    ex.date.toDateString() === date.toDateString()
  );
  
  if (exception) {
    return exception.isAvailable;
  }
  
  // Check regular windows
  const window = this.windows.find((w: { dayOfWeek: number; startTime: string; endTime: string; timezone: string }) => w.dayOfWeek === dayOfWeek);
  if (!window) {
    return false;
  }
  
  return timeString >= window.startTime && timeString <= window.endTime;
};

// Method to get available time slots for a specific date
availabilitySchema.methods.getAvailableSlots = function(
  date: Date,
  durationMinutes: number = 30
): Array<{ start: string; end: string }> {
  const dayOfWeek = date.getDay();
  const window = this.windows.find((w: { dayOfWeek: number; startTime: string; endTime: string; timezone: string }) => w.dayOfWeek === dayOfWeek);
  
  if (!window) {
    return [];
  }
  
  // Check for exceptions
  const exception = this.exceptions?.find((ex: { date: Date; isAvailable: boolean; reason?: string }) => 
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
};

// Method to add exception
availabilitySchema.methods.addException = function(
  date: Date,
  isAvailable: boolean,
  reason?: string
) {
  if (!this.exceptions) {
    this.exceptions = [];
  }
  
  // Remove existing exception for the same date
  this.exceptions = this.exceptions.filter((ex: { date: Date; isAvailable: boolean; reason?: string }) => 
    ex.date.toDateString() !== date.toDateString()
  );
  
  // Add new exception
  this.exceptions.push({
    date,
    isAvailable,
    reason
  });
  
  return this.save();
};

// Method to remove exception
availabilitySchema.methods.removeException = function(date: Date) {
  if (!this.exceptions) {
    return this.save();
  }
  
  this.exceptions = this.exceptions.filter((ex: { date: Date; isAvailable: boolean; reason?: string }) => 
    ex.date.toDateString() !== date.toDateString()
  );
  
  return this.save();
};

// Static method to get availability for multiple teachers
availabilitySchema.statics.getMultipleAvailabilities = async function(
  teacherIds: string[],
  date?: Date
) {
  const availabilities = await this.find({
    teacherId: { $in: teacherIds }
  })
  .populate('teacher', 'name email avatar')
  .lean();
  
  if (date) {
    return availabilities.map((availability: any) => ({
      ...availability,
      isAvailable: availability.isAvailableAt ? availability.isAvailableAt(date) : false
    }));
  }
  
  return availabilities;
};

// Static method to get teachers available at specific time
availabilitySchema.statics.getAvailableTeachers = async function(
  date: Date,
  limit: number = 10
) {
  const dayOfWeek = date.getDay();
  const timeString = date.toTimeString().slice(0, 5);
  
  const availabilities = await this.find({
    'windows.dayOfWeek': dayOfWeek,
    'windows.startTime': { $lte: timeString },
    'windows.endTime': { $gte: timeString }
  })
  .populate('teacher', 'name email avatar')
  .limit(limit)
  .lean();
  
  // Filter out teachers with exceptions
const availableTeachers = [];

for (const availability of availabilities) {
  const exception = availability.exceptions?.find((ex: { date: Date; isAvailable: boolean; reason?: string }) => 
    ex.date.toDateString() === date.toDateString()
  );
  
  if (!exception || exception.isAvailable) {
    availableTeachers.push(availability);
  }
}
  
  return availableTeachers;
};

// Static method to get availability statistics
availabilitySchema.statics.getAvailabilityStats = async function(
  teacherId: string,
  dateRange?: { start: Date; end: Date }
) {
  const match: Record<string, any> = { teacherId: new mongoose.Types.ObjectId(teacherId) };
  
  if (dateRange) {
    match['exceptions.date'] = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  const pipeline = [
    { $match: match },
    {
      $project: {
        totalWindows: { $size: '$windows' },
        totalExceptions: { $size: { $ifNull: ['$exceptions', []] } },
        unavailableExceptions: {
          $size: {
            $filter: {
              input: { $ifNull: ['$exceptions', []] },
              cond: { $eq: ['$$this.isAvailable', false] }
            }
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalWindows: 0,
    totalExceptions: 0,
    unavailableExceptions: 0
  };
};

export const Availability = mongoose.model<IAvailability>('Availability', availabilitySchema);
