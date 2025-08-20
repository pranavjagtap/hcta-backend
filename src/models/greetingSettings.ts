import mongoose, { Document, Schema } from 'mongoose';

export interface IGreetingSettings extends Document {
  userId: mongoose.Types.ObjectId;
  autoBirthdayGreetings: boolean;
  autoFestivalGreetings: boolean;
  birthdayTemplate: string;
  festivalTemplate: string;
  customTemplates: {
    [key: string]: string;
  };
  enabledFestivals: string[];
  greetingTime: string; // HH:mm format
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const greetingSettingsSchema = new Schema<IGreetingSettings>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  autoBirthdayGreetings: {
    type: Boolean,
    default: true
  },
  autoFestivalGreetings: {
    type: Boolean,
    default: true
  },
  birthdayTemplate: {
    type: String,
    default: "🎉 Happy Birthday {studentName}! 🎂\n\nWishing you a wonderful day filled with joy and success in your studies!\n\nBest regards,\n{teacherName}"
  },
  festivalTemplate: {
    type: String,
    default: "🎊 Happy {festivalName}! 🎊\n\nWishing you and your family a blessed and joyful celebration!\n\nBest regards,\n{teacherName}"
  },
  customTemplates: {
    type: Map,
    of: String,
    default: {}
  },
  enabledFestivals: [{
    type: String,
    enum: [
      'Diwali', 'Holi', 'Raksha Bandhan', 'Ganesh Chaturthi', 
      'Navratri', 'Dussehra', 'Guru Nanak Jayanti', 'Christmas',
      'Eid al-Fitr', 'Eid al-Adha', 'Makar Sankranti', 'Republic Day',
      'Independence Day', 'Gandhi Jayanti', 'Teachers Day'
    ]
  }],
  greetingTime: {
    type: String,
    default: '09:00',
    validate: {
      validator: function(v: string) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Greeting time must be in HH:mm format'
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

export const GreetingSettings = mongoose.model<IGreetingSettings>('GreetingSettings', greetingSettingsSchema);
