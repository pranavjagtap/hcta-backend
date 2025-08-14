import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user";
import { Role } from "../models/roles";
import { Batch } from "../models/batch";
import { Student } from "../models/student";
import { Subject } from "../models/subject";
import { Assignment } from "../models/assignment";
import { Submission } from "../models/submission";
import { Fee } from "../models/fee";
import { Note } from "../models/note";
import { Performance } from "../models/performance";
import { TeachingLog } from "../models/teachingLog";

dotenv.config();

const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/hcta";

// Test data arrays
const testUsers = [
  {
    uid: "admin_001",
    name: "Admin User",
    email: "admin@hcta.com",
    mobile: "+1234567890",
    role: "admin",
    preferredLanguage: "English",
    city: "New York",
    region: "NY",
    isActive: true,
  },
  {
    uid: "tutor_001",
    name: "John Smith",
    email: "john.smith@hcta.com",
    mobile: "+1234567891",
    role: "tutor",
    preferredLanguage: "English",
    city: "Boston",
    region: "MA",
    isActive: true,
  },
  {
    uid: "tutor_002",
    name: "Sarah Johnson",
    email: "sarah.johnson@hcta.com",
    mobile: "+1234567892",
    role: "tutor",
    preferredLanguage: "English",
    city: "Chicago",
    region: "IL",
    isActive: true,
  },
  {
    uid: "tutor_003",
    name: "Michael Brown",
    email: "michael.brown@hcta.com",
    mobile: "+1234567893",
    role: "tutor",
    preferredLanguage: "English",
    city: "Los Angeles",
    region: "CA",
    isActive: true,
  },
  {
    uid: "student_001",
    name: "Lisa Davis",
    email: "lisa.davis@hcta.com",
    mobile: "+1234567894",
    role: "student",
    preferredLanguage: "English",
    city: "Miami",
    region: "FL",
    isActive: true,
  },
];

const testSubjects = [
  { name: "Mathematics", code: "MATH", description: "Advanced Mathematics" },
  { name: "Physics", code: "PHY", description: "Physics Fundamentals" },
  { name: "Chemistry", code: "CHEM", description: "Chemistry Concepts" },
  { name: "Biology", code: "BIO", description: "Biology Studies" },
  { name: "English", code: "ENG", description: "English Literature" },
  { name: "History", code: "HIST", description: "World History" },
  { name: "Computer Science", code: "CS", description: "Programming and Algorithms" },
];

const testBatches = [
  {
    name: "Advanced Math Batch A",
    academicYear: "2024-2025",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2025-06-30"),
    classDays: ["Monday", "Wednesday", "Friday"],
    maxStudents: 15,
    location: "Main Campus - Room 101",
    isActive: true,
  },
  {
    name: "Physics Fundamentals",
    academicYear: "2024-2025",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2025-06-30"),
    classDays: ["Tuesday", "Thursday"],
    maxStudents: 12,
    location: "Main Campus - Room 102",
    isActive: true,
  },
  {
    name: "Chemistry Lab",
    academicYear: "2024-2025",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2025-06-30"),
    classDays: ["Monday", "Friday"],
    maxStudents: 10,
    location: "Lab Building - Room 201",
    isActive: true,
  },
  {
    name: "English Literature",
    academicYear: "2024-2025",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2025-06-30"),
    classDays: ["Wednesday", "Saturday"],
    maxStudents: 18,
    location: "Main Campus - Room 103",
    isActive: true,
  },
];

const testStudents = [
  {
    name: "Emma Wilson",
    parentName: "Robert Wilson",
    parentPhone: "+1234567901",
    whatsappNumber: "+1234567901",
    schoolName: "Lincoln High School",
    board: "CBSE",
    classLevel: "11th Grade",
    weaknesses: ["Algebra", "Problem Solving"],
    rollNumber: "STU001",
    admissionDate: new Date("2024-08-15"),
  },
  {
    name: "James Anderson",
    parentName: "Mary Anderson",
    parentPhone: "+1234567902",
    whatsappNumber: "+1234567902",
    schoolName: "Roosevelt High School",
    board: "ICSE",
    classLevel: "12th Grade",
    weaknesses: ["Physics", "Calculus"],
    rollNumber: "STU002",
    admissionDate: new Date("2024-08-20"),
  },
  {
    name: "Sophia Martinez",
    parentName: "Carlos Martinez",
    parentPhone: "+1234567903",
    whatsappNumber: "+1234567903",
    schoolName: "Washington High School",
    board: "CBSE",
    classLevel: "10th Grade",
    weaknesses: ["Chemistry", "Biology"],
    rollNumber: "STU003",
    admissionDate: new Date("2024-08-25"),
  },
  {
    name: "David Thompson",
    parentName: "Jennifer Thompson",
    parentPhone: "+1234567904",
    whatsappNumber: "+1234567904",
    schoolName: "Jefferson High School",
    board: "ICSE",
    classLevel: "11th Grade",
    weaknesses: ["English", "History"],
    rollNumber: "STU004",
    admissionDate: new Date("2024-09-01"),
  },
  {
    name: "Olivia Garcia",
    parentName: "Miguel Garcia",
    parentPhone: "+1234567905",
    whatsappNumber: "+1234567905",
    schoolName: "Adams High School",
    board: "CBSE",
    classLevel: "12th Grade",
    weaknesses: ["Computer Science", "Mathematics"],
    rollNumber: "STU005",
    admissionDate: new Date("2024-09-05"),
  },
  {
    name: "William Lee",
    parentName: "Grace Lee",
    parentPhone: "+1234567906",
    whatsappNumber: "+1234567906",
    schoolName: "Madison High School",
    board: "ICSE",
    classLevel: "10th Grade",
    weaknesses: ["Physics", "Chemistry"],
    rollNumber: "STU006",
    admissionDate: new Date("2024-09-10"),
  },
];

const testAssignments = [
  {
    topic: "Algebra Fundamentals Quiz",
    type: "quiz",
    dueDate: new Date("2024-12-15"),
    maxMarks: 100,
    isOptional: false,
  },
  {
    topic: "Physics Lab Report",
    type: "test",
    dueDate: new Date("2024-12-20"),
    maxMarks: 50,
    isOptional: false,
  },
  {
    topic: "Chemistry Project",
    type: "homework",
    dueDate: new Date("2024-12-25"),
    maxMarks: 75,
    isOptional: false,
  },
  {
    topic: "English Essay",
    type: "practice",
    dueDate: new Date("2024-12-18"),
    maxMarks: 60,
    isOptional: false,
  },
];

const testFees = [
  {
    monthYear: "2024-12",
    amountDue: 500,
    amountPaid: 0,
    paymentStatus: "unpaid",
    paymentMode: "cash",
  },
  {
    monthYear: "2024-12",
    amountDue: 200,
    amountPaid: 200,
    paymentStatus: "paid",
    paymentMode: "online",
    paymentDate: new Date("2024-12-01"),
    receiptNumber: "RCP001",
  },
  {
    monthYear: "2024-12",
    amountDue: 150,
    amountPaid: 75,
    paymentStatus: "partial",
    paymentMode: "cash",
    paymentDate: new Date("2024-12-05"),
    receiptNumber: "RCP002",
  },
];

const testNotes = [
  {
    topic: "Important Announcement",
    noteType: "typed",
    isPublic: true,
    approved: true,
  },
  {
    topic: "Exam Schedule Update",
    noteType: "typed",
    isPublic: true,
    approved: true,
  },
  {
    topic: "Parent Meeting",
    noteType: "typed",
    isPublic: true,
    approved: true,
  },
];

const testPerformances = [
  {
    topic: "Mid-Term Examination",
    score: 85,
    maxScore: 100,
    assessmentType: "test",
    date: new Date("2024-11-15"),
    remarks: "Good performance, needs improvement in problem-solving",
  },
  {
    topic: "Weekly Quiz",
    score: 18,
    maxScore: 20,
    assessmentType: "test",
    date: new Date("2024-11-20"),
    remarks: "Excellent work, keep it up!",
  },
  {
    topic: "Final Project",
    score: 72,
    maxScore: 100,
    assessmentType: "project",
    date: new Date("2024-12-10"),
    remarks: "Satisfactory performance, focus on weak areas",
  },
];

const testTeachingLogs = [
  {
    topic: "Algebra basics and Linear equations",
    date: new Date("2024-12-01"),
    durationMinutes: 90,
    teachingMethod: "Lecture",
    status: "completed",
  },
  {
    topic: "Newton's laws and Force and motion",
    date: new Date("2024-12-02"),
    durationMinutes: 120,
    teachingMethod: "Practical",
    status: "completed",
  },
  {
    topic: "Chemical bonding and Molecular structure",
    date: new Date("2024-12-03"),
    durationMinutes: 60,
    teachingMethod: "Demonstration",
    status: "completed",
  },
];

export const seedTestData = async () => {
  try {
    await mongoose.connect(dbUri);
    console.log("✅ MongoDB connected for test data seeding");

    // Clear existing test data (optional - comment out if you want to keep existing data)
    console.log("🧹 Clearing existing test data...");
    await User.deleteMany({ uid: { $in: testUsers.map(u => u.uid) } });
    await Batch.deleteMany({ name: { $in: testBatches.map(b => b.name) } });
    await Student.deleteMany({ rollNumber: { $in: testStudents.map(s => s.rollNumber) } });
    await Subject.deleteMany({ code: { $in: testSubjects.map(s => s.code) } });
    await Assignment.deleteMany({ topic: { $in: testAssignments.map(a => a.topic) } });
    await Fee.deleteMany({});
    await Note.deleteMany({ topic: { $in: testNotes.map(n => n.topic) } });
    await Performance.deleteMany({});
    await TeachingLog.deleteMany({});

    // Step 1: Get roles
    console.log("📋 Getting roles...");
    const adminRole = await Role.findOne({ code: "admin" });
    const tutorRole = await Role.findOne({ code: "tutor" });
    const studentRole = await Role.findOne({ code: "student" });

    if (!adminRole || !tutorRole || !studentRole) {
      throw new Error("Required roles not found. Please run seedRolesAndPermissions first.");
    }

    // Step 2: Create users
    console.log("👥 Creating users...");
    const createdUsers = [];
         for (const userData of testUsers) {
       const role = userData.role === "admin" ? adminRole : 
                    userData.role === "tutor" ? tutorRole : studentRole;
      
      const user = await User.create({
        ...userData,
        role: role._id,
        createdBy: adminRole._id,
        updatedBy: adminRole._id,
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name}`);
    }

    // Step 3: Create subjects
    console.log("📚 Creating subjects...");
    const createdSubjects = [];
    for (const subjectData of testSubjects) {
      const subject = await Subject.create({
        ...subjectData,
        createdBy: createdUsers[0]._id,
        updatedBy: createdUsers[0]._id,
      });
      createdSubjects.push(subject);
      console.log(`✅ Created subject: ${subject.name}`);
    }

    // Step 4: Create batches
    console.log("👨‍🏫 Creating batches...");
    const createdBatches = [];
    for (let i = 0; i < testBatches.length; i++) {
      const batchData = testBatches[i];
      const tutor = createdUsers[i + 1]; // Skip admin, use tutors
      
      const batch = await Batch.create({
        ...batchData,
        tutorId: tutor._id,
        subjectIds: [createdSubjects[i % createdSubjects.length]._id],
        createdBy: createdUsers[0]._id,
        updatedBy: createdUsers[0]._id,
      });
      createdBatches.push(batch);
      console.log(`✅ Created batch: ${batch.name}`);
    }

    // Step 5: Create students
    console.log("👨‍🎓 Creating students...");
    const createdStudents = [];
    for (let i = 0; i < testStudents.length; i++) {
      const studentData = testStudents[i];
      const batch = createdBatches[i % createdBatches.length];
      
      const student = await Student.create({
        ...studentData,
        batchId: batch._id,
      });
      createdStudents.push(student);
      console.log(`✅ Created student: ${student.name}`);
    }

    // Update batches with student IDs
    for (let i = 0; i < createdBatches.length; i++) {
      const batchStudents = createdStudents.filter((_, index) => index % createdBatches.length === i);
      await Batch.findByIdAndUpdate(createdBatches[i]._id, {
        studentIds: batchStudents.map(s => s._id)
      });
    }

    // Step 6: Create assignments
    console.log("📝 Creating assignments...");
    const createdAssignments = [];
    for (let i = 0; i < testAssignments.length; i++) {
      const assignmentData = testAssignments[i];
      const batch = createdBatches[i % createdBatches.length];
      const subject = createdSubjects[i % createdSubjects.length];
      
             const assignment = await Assignment.create({
         ...assignmentData,
         batchId: batch._id,
         subjectId: subject._id,
         assignedBy: batch.tutorId,
         createdBy: batch.tutorId,
         updatedBy: batch.tutorId,
       });
       createdAssignments.push(assignment);
       console.log(`✅ Created assignment: ${assignment.topic}`);
    }

    // Step 7: Create fees
    console.log("💰 Creating fees...");
    for (let i = 0; i < testFees.length; i++) {
      const feeData = testFees[i];
      const student = createdStudents[i % createdStudents.length];
      const batch = createdBatches[i % createdBatches.length];
      
      await Fee.create({
        ...feeData,
        studentId: student._id,
        batchId: batch._id,
        createdBy: createdUsers[0]._id,
        updatedBy: createdUsers[0]._id,
      });
      console.log(`✅ Created fee for student: ${student.name}`);
    }

         // Step 8: Create notes
     console.log("📌 Creating notes...");
     for (let i = 0; i < testNotes.length; i++) {
       const noteData = testNotes[i];
       const batch = createdBatches[i % createdBatches.length];
       const subject = createdSubjects[i % createdSubjects.length];
       
       const note = await Note.create({
         ...noteData,
         batchId: batch._id,
         subjectId: subject._id,
         uploadedBy: batch.tutorId,
         createdBy: batch.tutorId,
         updatedBy: batch.tutorId,
       });
       console.log(`✅ Created note: ${note.topic}`);
     }

         // Step 9: Create performances
     console.log("📊 Creating performances...");
     for (let i = 0; i < testPerformances.length; i++) {
       const performanceData = testPerformances[i];
       const student = createdStudents[i % createdStudents.length];
       const subject = createdSubjects[i % createdSubjects.length];
       const batch = createdBatches[i % createdBatches.length];
       
       await Performance.create({
         ...performanceData,
         studentId: student._id,
         subjectId: subject._id,
         createdBy: batch.tutorId,
         updatedBy: batch.tutorId,
       });
       console.log(`✅ Created performance record for: ${student.name}`);
     }

         // Step 10: Create teaching logs
     console.log("📖 Creating teaching logs...");
     for (let i = 0; i < testTeachingLogs.length; i++) {
       const logData = testTeachingLogs[i];
       const batch = createdBatches[i % createdBatches.length];
       const subject = createdSubjects[i % createdSubjects.length];
       
       await TeachingLog.create({
         ...logData,
         batchId: batch._id,
         subjectId: subject._id,
         tutorId: batch.tutorId,
         createdBy: batch.tutorId,
         updatedBy: batch.tutorId,
       });
       console.log(`✅ Created teaching log for batch: ${batch.name}`);
     }

    // Step 11: Create some submissions
    console.log("📤 Creating submissions...");
    for (let i = 0; i < createdAssignments.length; i++) {
      const assignment = createdAssignments[i];
      const batch = await Batch.findById(assignment.batchId);
      
             if (batch && batch.studentIds && batch.studentIds.length > 0) {
         // Create submissions for first 2 students in each batch
         for (let j = 0; j < Math.min(2, batch.studentIds.length); j++) {
           const studentId = batch.studentIds[j];
           const student = await Student.findById(studentId);
           
           await Submission.create({
             assignmentId: assignment._id,
             studentId: studentId,
             submittedAt: new Date(),
             status: j === 0 ? "submitted" : "submitted",
             marksAwarded: j === 0 ? Math.floor(Math.random() * 20) + 70 : null,
             remarks: j === 0 ? "Good work, keep it up!" : null,
             createdBy: studentId,
             updatedBy: studentId,
           });
           console.log(`✅ Created submission for ${student?.name} - ${assignment.topic}`);
         }
       }
    }

    console.log("🎉 Test data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Subjects: ${createdSubjects.length}`);
    console.log(`- Batches: ${createdBatches.length}`);
    console.log(`- Students: ${createdStudents.length}`);
    console.log(`- Assignments: ${createdAssignments.length}`);
    console.log(`- Fees: ${testFees.length}`);
    console.log(`- Notes: ${testNotes.length}`);
    console.log(`- Performances: ${testPerformances.length}`);
    console.log(`- Teaching Logs: ${testTeachingLogs.length}`);
    
         console.log("\n🔑 Test Login Credentials:");
     console.log("Admin: admin@hcta.com");
     console.log("Tutor: john.smith@hcta.com");
     console.log("Student: lisa.davis@hcta.com");

    process.exit(0);
  } catch (err) {
    console.error("❌ Test data seeding failed:", err);
    process.exit(1);
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedTestData();
}
