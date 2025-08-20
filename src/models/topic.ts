import mongoose, { Document, Schema } from "mongoose";

export interface TopicBase {
  name: string;
  subjectId: string;
  board: string;
  classLevel: string;
  chapterNumber?: number;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedHours: number;
  difficultyLevel: "easy" | "medium" | "hard";
  bloomTaxonomyLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  keywords: string[];
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface TopicDocument extends Document, TopicBase {
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<TopicDocument>(
  {
    name: { 
      type: String, 
      required: true,
      index: true 
    },
    subjectId: { 
      type: Schema.Types.ObjectId as any, 
      ref: "Subject",
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
    chapterNumber: { 
      type: Number,
      min: 1,
      index: true 
    },
    learningObjectives: [{ 
      type: String,
      required: true 
    }],
    prerequisites: [{ 
      type: String 
    }],
    estimatedHours: { 
      type: Number,
      min: 0.5,
      max: 50,
      default: 2 
    },
    difficultyLevel: { 
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true 
    },
    bloomTaxonomyLevel: { 
      type: String,
      enum: ["remember", "understand", "apply", "analyze", "evaluate", "create"],
      default: "understand",
      index: true 
    },
    keywords: [{ 
      type: String 
    }],
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
topicSchema.index({ subjectId: 1, isDeleted: 1 });
topicSchema.index({ board: 1, classLevel: 1, isDeleted: 1 });
topicSchema.index({ subjectId: 1, chapterNumber: 1, isDeleted: 1 });
topicSchema.index({ difficultyLevel: 1, isDeleted: 1 });
topicSchema.index({ bloomTaxonomyLevel: 1, isDeleted: 1 });

export const Topic = mongoose.model<TopicDocument>("Topic", topicSchema);

