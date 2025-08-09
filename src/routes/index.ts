import express from "express";
import userRoutes from "./user";
// import batchRoutes from "./batch";
// import studentRoutes from "./student";
// import subjectRoutes from "./subject";
// import teachingLogRoutes from "./teachingLog";
// import assignmentRoutes from "./assignment";
// import submissionRoutes from "./submission";
// import noteRoutes from "./note";
// import performanceRoutes from "./performance";
// import feeRoutes from "./fee";
import authRoutes from "./auth";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
// router.use("/batches", batchRoutes);
// router.use("/students", studentRoutes);
// router.use("/subjects", subjectRoutes);
// router.use("/teaching-logs", teachingLogRoutes);
// router.use("/assignments", assignmentRoutes);
// router.use("/submissions", submissionRoutes);
// router.use("/notes", noteRoutes);
// router.use("/performance", performanceRoutes);
// router.use("/fees", feeRoutes);

export default router;
