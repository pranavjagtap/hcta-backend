import mongoose, { Document, Schema } from "mongoose";

export interface CurriculumBase {
  name: string;
  board: string;
  classLevel: string;
  academicYear: string;
  description?: string;
  totalHours: number;
  totalTopics: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface CurriculumDocument extends Document, CurriculumBase {
  createdAt: Date;
  updatedAt: Date;
}

const curriculumSchema = new Schema<CurriculumDocument>(
  {
    name: { 
      type: String, 
      required: true,
      index: true 
    },
    board: { 
      type: String,
      required: true,
      index: true 
    },
    classLevel: { 
      type: String,
      required: true,
      index: true 
    },
    academicYear: { 
      type: String,
      required: true,
      index: true 
    },
    description: { 
      type: String 
    },
    totalHours: { 
      type: Number,
      min: 1,
      default: 0 
    },
    totalTopics: { 
      type: Number,
      min: 0,
      default: 0 
    },
    isActive: { 
      type: Boolean, 
      default: true,
      index: true 
    },
    isDeleted: { 
      type: Boolean, 
      default: false,
      index: true 
    },
    createdBy: { 
      type: Schema.Types.ObjectId as any, 
      ref: "User",
      required: true
    },
    updatedBy: { 
      type: Schema.Types.ObjectId as any, 
      ref: "User",
      required: true
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
curriculumSchema.index({ board: 1, classLevel: 1, isDeleted: 1 });
curriculumSchema.index({ board: 1, classLevel: 1, academicYear: 1, isDeleted: 1 });
curriculumSchema.index({ isActive: 1, isDeleted: 1 });

export const Curriculum = mongoose.model<CurriculumDocument>("Curriculum", curriculumSchema);

