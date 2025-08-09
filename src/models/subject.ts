import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: { type: String, index: true },
  board: String,
  classLevel: String,
  topics: [String],
  syllabusCode: String,
  isElective: Boolean,
});

export default mongoose.model("Subject", subjectSchema);
