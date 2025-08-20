import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceModel extends Model<IAttendance> {
  getAttendanceByStudent(studentId: string, filters?: any): Promise<IAttendance[]>;
  getAttendanceByBatch(batchId: string, date?: Date): Promise<IAttendance[]>;
  getAttendanceStats(batchId: string, startDate: Date, endDate: Date): Promise<any>;
}

const attendanceSchema = new Schema<IAttendance>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true,
    default: 'present'
  },
  markedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique attendance per student per date per subject
attendanceSchema.index({ studentId: 1, date: 1, subjectId: 1 }, { unique: true });

// Index for batch attendance queries
attendanceSchema.index({ batchId: 1, date: 1 });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Virtual for status color
attendanceSchema.virtual('statusColor').get(function() {
  switch (this.status) {
    case 'present': return 'green';
    case 'absent': return 'red';
    case 'late': return 'orange';
    case 'excused': return 'blue';
    default: return 'gray';
  }
});

// Static method to get attendance by student
attendanceSchema.statics.getAttendanceByStudent = async function(studentId: string, filters: any = {}) {
  const query: any = { studentId };
  
  if (filters.startDate && filters.endDate) {
    query.date = { $gte: filters.startDate, $lte: filters.endDate };
  }
  if (filters.subjectId) query.subjectId = filters.subjectId;
  if (filters.status) query.status = filters.status;

  return await this.find(query)
    .populate('subjectId', 'name')
    .populate('markedBy', 'name')
    .sort({ date: -1 })
    .lean();
};

// Static method to get attendance by batch
attendanceSchema.statics.getAttendanceByBatch = async function(batchId: string, date?: Date) {
  const query: any = { batchId };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  return await this.find(query)
    .populate('studentId', 'name email')
    .populate('subjectId', 'name')
    .populate('markedBy', 'name')
    .sort({ date: -1 })
    .lean();
};

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = async function(batchId: string, startDate: Date, endDate: Date) {
  const pipeline = [
    {
      $match: {
        batchId: new mongoose.Types.ObjectId(batchId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          studentId: '$studentId',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.studentId',
        attendance: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        totalDays: { $sum: '$count' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $unwind: '$student'
    },
    {
      $project: {
        studentId: '$_id',
        studentName: '$student.name',
        studentEmail: '$student.email',
        attendance: 1,
        totalDays: 1,
        presentDays: {
          $reduce: {
            input: {
              $filter: {
                input: '$attendance',
                as: 'att',
                cond: { $eq: ['$$att.status', 'present'] }
              }
            },
            initialValue: 0,
            in: { $add: ['$$value', '$$this.count'] }
          }
        },
        attendanceRate: {
          $multiply: [
            {
              $divide: [
                {
                  $reduce: {
                    input: {
                      $filter: {
                        input: '$attendance',
                        as: 'att',
                        cond: { $eq: ['$$att.status', 'present'] }
                      }
                    },
                    initialValue: 0,
                    in: { $add: ['$$value', '$$this.count'] }
                  }
                },
                '$totalDays'
              ]
            },
            100
          ]
        }
      }
    }
  ];

  return await this.aggregate(pipeline);
};

export const Attendance = mongoose.model<IAttendance, IAttendanceModel>('Attendance', attendanceSchema);
