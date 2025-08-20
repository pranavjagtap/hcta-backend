import mongoose from 'mongoose';
import { Homework, HomeworkSubmission } from '../models/homework';
import { Student } from '../models/student';
import { User } from '../models/user';
import { Class } from '../models/class';
import { Batch } from '../models/batch';
import { AIService } from './aiService';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';

import {
  CreateHomeworkRequest,
  UpdateHomeworkRequest,
  HomeworkQuery,
  HomeworkResponse,
  HomeworkListResponse,
  CreateHomeworkSubmissionRequest,
  UpdateHomeworkSubmissionRequest,
  HomeworkSubmissionQuery,
  HomeworkSubmissionResponse,
  HomeworkSubmissionListResponse,
  AIGenerateHomeworkRequest,
  AIGenerateHomeworkResponse,
  AIRegenerateQuestionRequest,
  AIRegenerateQuestionResponse,
  ExportHomeworkRequest,
  ExportHomeworkResponse,
  HomeworkAnalytics,
  HomeworkStats
} from '../types/homework';

export class HomeworkService {
  /**
   * Generate homework using AI
   */
  static async generateHomeworkWithAI(request: AIGenerateHomeworkRequest): Promise<AIGenerateHomeworkResponse> {
    try {
      console.log('Generating homework with AI', { request });

      // Call AI service to generate questions
      const mapQuestionTypeToAI = (t: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false'): 'mcq' | 'short' | 'long' | 'numerical' => {
        switch (t) {
          case 'multiple_choice':
            return 'mcq';
          case 'short_answer':
            return 'short';
          case 'long_form':
            return 'long';
          case 'fill_blank':
            return 'short';
          case 'true_false':
            return 'mcq';
        }
      };

      const aiResponse = await AIService.generateHomework({
        topic: request.topic,
        subject: request.subject,
        classLevel: '10',
        difficulty: request.difficulty,
        questionCount: request.totalQuestions || 5,
        questionTypes: (request.questionTypes || []).map(mapQuestionTypeToAI)
      });

      // Calculate total marks and estimated time
      const totalMarks = aiResponse.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
      const estimatedTime = aiResponse.estimatedTime;

      const mapAITypeToQuestionType = (t: 'mcq' | 'short' | 'long' | 'numerical'): 'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false' => {
        switch (t) {
          case 'mcq':
            return 'multiple_choice';
          case 'short':
            return 'short_answer';
          case 'long':
            return 'long_form';
          case 'numerical':
            return 'short_answer';
        }
      };

      const transformedQuestions = aiResponse.questions.map((q: any) => ({
        questionText: String(q.question ?? ''),
        questionType: mapAITypeToQuestionType(q.type),
        options: q.options,
        correctAnswer: String(q.correctAnswer ?? ''),
        explanation: String(q.explanation ?? ''),
        difficulty: request.difficulty,
        topic: request.topic,
        marks: Number(q.marks ?? 1),
        timeEstimate: 1,
        aiGenerated: true,
      }));

      return {
        success: true,
        data: {
          questions: transformedQuestions,
          totalMarks,
          estimatedTime,
          generationTime: Date.now(),
          model: 'gpt-4',
          prompt: `Generate ${request.totalQuestions} questions on ${request.topic}`
        }
      };
    } catch (error) {
      console.log('Error generating homework with AI', { error, request });
      throw error;
    }
  }

  /**
   * Regenerate a specific question using AI
   */
  static async regenerateQuestionWithAI(request: AIRegenerateQuestionRequest): Promise<AIRegenerateQuestionResponse> {
    try {
      console.log('Regenerating question with AI', { request });

      // Call AI service to regenerate question
      const mapQuestionTypeToAI = (t: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false'): 'mcq' | 'short' | 'long' | 'numerical' => {
        switch (t) {
          case 'multiple_choice':
            return 'mcq';
          case 'short_answer':
            return 'short';
          case 'long_form':
            return 'long';
          case 'fill_blank':
            return 'short';
          case 'true_false':
            return 'mcq';
        }
      };

      const regenerated = await AIService.regenerateQuestion({
        questionId: 'unknown',
        newType: mapQuestionTypeToAI(request.questionType),
        newDifficulty: request.difficulty,
      });

      const dataQuestion = {
        questionText: String(regenerated.question ?? ''),
        questionType: request.questionType,
        options: regenerated.options,
        correctAnswer: String(regenerated.correctAnswer ?? ''),
        explanation: String(regenerated.explanation ?? ''),
        difficulty: request.difficulty,
        topic: request.topic,
        marks: Number(regenerated.marks ?? 1),
        timeEstimate: 1,
        aiGenerated: true,
      } as const;

      return {
        success: true,
        data: dataQuestion
      };
    } catch (error) {
      console.log('Error regenerating question with AI', { error, request });
      throw error;
    }
  }

  /**
   * Create a new homework assignment
   */
  static async createHomework(data: CreateHomeworkRequest, userId: string): Promise<HomeworkResponse> {
    try {
      console.log('Creating homework', { data, userId });

      let questions: any[] = [];
      let aiGenerationData;

      // If AI generation is requested
      if (data.aiGenerationRequest) {
        const aiRequest: AIGenerateHomeworkRequest = {
          subject: data.subject,
          topic: data.topic,
          difficulty: data.difficulty,
          questionTypes: data.questionTypes,
          totalQuestions: data.totalQuestions,
          personalizationFactors: data.aiGenerationRequest.personalizationFactors,
          customPrompt: data.aiGenerationRequest.prompt
        };

        const aiResponse = await this.generateHomeworkWithAI(aiRequest);
        questions = aiResponse.data.questions;
        aiGenerationData = {
          prompt: aiResponse.data.prompt,
          model: aiResponse.data.model,
          generationTime: aiResponse.data.generationTime,
          personalizationFactors: data.aiGenerationRequest.personalizationFactors
        };
      }

      // Calculate totals
      const totalMarks = questions.reduce((sum: number, q: any) => sum + q.marks, 0);
      const estimatedTime = questions.reduce((sum: number, q: any) => sum + (q.timeEstimate || 1), 0);

      // Create homework document
      const homework = new Homework({
        ...data,
        questions,
        totalMarks,
        estimatedTime,
        aiGenerationData,
        createdBy: userId,
        updatedBy: userId
      });

      await homework.save();

      // Format response
      const response = await this.formatHomeworkResponse(homework);
      console.log('Homework created successfully', { homeworkId: homework._id });

      return response;
    } catch (error) {
      console.log('Error creating homework', { error, data, userId });
      throw error;
    }
  }

  /**
   * Get homework by ID
   */
  static async getHomeworkById(id: string): Promise<HomeworkResponse> {
    try {
      const homework = await Homework.findById(id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('targetStudents', 'name rollNumber')
        .populate('targetClass', 'name')
        .populate('targetBatch', 'name');

      if (!homework) {
        throw createError('Homework not found', 404);
      }

      return await this.formatHomeworkResponse(homework);
    } catch (error) {
      console.log('Error getting homework by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get homework list with filters
   */
  static async getHomeworks(query: HomeworkQuery): Promise<HomeworkListResponse> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;

      // Build filter object
      const filterObj: any = {};
      if (filters.subject) filterObj.subject = new RegExp(filters.subject, 'i');
      if (filters.topic) filterObj.topic = new RegExp(filters.topic, 'i');
      if (filters.difficulty) filterObj.difficulty = filters.difficulty;
      if (filters.targetAudience) filterObj.targetAudience = filters.targetAudience;
      if (filters.targetClass) filterObj.targetClass = filters.targetClass;
      if (filters.targetBatch) filterObj.targetBatch = filters.targetBatch;
      if (filters.targetStudent) filterObj.targetStudents = filters.targetStudent;
      if (filters.isPublished !== undefined) filterObj.isPublished = filters.isPublished;
      if (filters.isPersonalized !== undefined) filterObj.isPersonalized = filters.isPersonalized;
      if (filters.createdBy) filterObj.createdBy = filters.createdBy;

      // Date range filters
      if (filters.dueDateFrom || filters.dueDateTo) {
        filterObj.dueDate = {};
        if (filters.dueDateFrom) filterObj.dueDate.$gte = new Date(filters.dueDateFrom);
        if (filters.dueDateTo) filterObj.dueDate.$lte = new Date(filters.dueDateTo);
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const homeworks = await Homework.find(filterObj)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('targetStudents', 'name rollNumber')
        .populate('targetClass', 'name')
        .populate('targetBatch', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      const total = await Homework.countDocuments(filterObj);

      // Format responses
      const formattedHomeworks = await Promise.all(
        homeworks.map(homework => this.formatHomeworkResponse(homework))
      );

      return {
        homeworks: formattedHomeworks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting homeworks', { error, query });
      throw error;
    }
  }

  /**
   * Update homework
   */
  static async updateHomework(id: string, data: UpdateHomeworkRequest, userId: string): Promise<HomeworkResponse> {
    try {
      console.log('Updating homework', { id, data, userId });

      const homework = await Homework.findById(id);
      if (!homework) {
        throw createError('Homework not found', 404);
      }

      // Update fields
      Object.assign(homework, data, { updatedBy: userId });
      await homework.save();

      // Format response
      const response = await this.formatHomeworkResponse(homework);
      console.log('Homework updated successfully', { homeworkId: id });

      return response;
    } catch (error) {
      console.log('Error updating homework', { error, id, data, userId });
      throw error;
    }
  }

  /**
   * Delete homework
   */
  static async deleteHomework(id: string): Promise<void> {
    try {
      console.log('Deleting homework', { id });

      const homework = await Homework.findById(id);
      if (!homework) {
        throw createError('Homework not found', 404);
      }

      // Check if homework has submissions
      const submissionCount = await HomeworkSubmission.countDocuments({ homeworkId: id });
      if (submissionCount > 0) {
        throw createError('Cannot delete homework with existing submissions', 400);
      }

      await Homework.findByIdAndDelete(id);
      console.log('Homework deleted successfully', { homeworkId: id });
    } catch (error) {
      console.log('Error deleting homework', { error, id });
      throw error;
    }
  }

  /**
   * Publish homework
   */
  static async publishHomework(id: string, userId: string): Promise<HomeworkResponse> {
    try {
      console.log('Publishing homework', { id, userId });

      const homework = await Homework.findById(id);
      if (!homework) {
        throw createError('Homework not found', 404);
      }

      homework.isPublished = true;
      homework.updatedBy = new mongoose.Types.ObjectId(userId);
      await homework.save();

      const response = await this.formatHomeworkResponse(homework);
      console.log('Homework published successfully', { homeworkId: id });

      return response;
    } catch (error) {
      console.log('Error publishing homework', { error, id, userId });
      throw error;
    }
  }

  /**
   * Unpublish homework
   */
  static async unpublishHomework(id: string, userId: string): Promise<HomeworkResponse> {
    try {
      console.log('Unpublishing homework', { id, userId });

      const homework = await Homework.findById(id);
      if (!homework) {
        throw createError('Homework not found', 404);
      }

      homework.isPublished = false;
      homework.updatedBy = new mongoose.Types.ObjectId(userId);
      await homework.save();

      const response = await this.formatHomeworkResponse(homework);
      console.log('Homework unpublished successfully', { homeworkId: id });

      return response;
    } catch (error) {
      console.log('Error unpublishing homework', { error, id, userId });
      throw error;
    }
  }

  /**
   * Create homework submission
   */
  static async createHomeworkSubmission(data: CreateHomeworkSubmissionRequest, userId: string): Promise<HomeworkSubmissionResponse> {
    try {
      console.log('Creating homework submission', { data, userId });

      // Check if homework exists and is published
      const homework = await Homework.findById(data.homeworkId);
      if (!homework) {
        throw createError('Homework not found', 404);
      }
      if (!homework.isPublished) {
        throw createError('Homework is not published', 400);
      }

      // Check if submission already exists
      const existingSubmission = await HomeworkSubmission.findOne({
        homeworkId: data.homeworkId,
        studentId: data.studentId
      });
      if (existingSubmission) {
        throw createError('Submission already exists for this homework', 400);
      }

      // Process answers and calculate scores
      const processedAnswers = data.answers.map((answer, index) => {
        const question = homework.questions[index];
        const isCorrect = this.checkAnswer(answer.answer, question);
        const score = isCorrect ? question.marks : 0;
        
        return {
          questionIndex: answer.questionIndex,
          answer: answer.answer,
          isCorrect,
          score,
          timeSpent: answer.timeSpent,
          submittedAt: new Date()
        };
      });

      const totalScore = processedAnswers.reduce((sum, answer) => sum + answer.score, 0);
      const maxScore = homework.totalMarks;
      const percentage = (totalScore / maxScore) * 100;
      const totalTimeSpent = processedAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0);

      // Create submission
      const submission = new HomeworkSubmission({
        homeworkId: data.homeworkId,
        studentId: data.studentId,
        answers: processedAnswers,
        totalScore,
        maxScore,
        percentage,
        timeSpent: totalTimeSpent,
        status: 'submitted',
        submittedAt: new Date()
      });

      await submission.save();

      // Update homework analytics
      await this.updateHomeworkAnalytics(data.homeworkId);

      const response = await this.formatHomeworkSubmissionResponse(submission);
      console.log('Homework submission created successfully', { submissionId: submission._id });

      return response;
    } catch (error) {
      console.log('Error creating homework submission', { error, data, userId });
      throw error;
    }
  }

  /**
   * Get homework submissions
   */
  static async getHomeworkSubmissions(query: HomeworkSubmissionQuery): Promise<HomeworkSubmissionListResponse> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;

      // Build filter object
      const filterObj: any = {};
      if (filters.homeworkId) filterObj.homeworkId = filters.homeworkId;
      if (filters.studentId) filterObj.studentId = filters.studentId;
      if (filters.status) filterObj.status = filters.status;

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const submissions = await HomeworkSubmission.find(filterObj)
        .populate('homeworkId', 'title subject topic')
        .populate('studentId', 'name rollNumber')
        .populate('gradedBy', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      const total = await HomeworkSubmission.countDocuments(filterObj);

      // Format responses
      const formattedSubmissions = await Promise.all(
        submissions.map(submission => this.formatHomeworkSubmissionResponse(submission))
      );

      return {
        submissions: formattedSubmissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.log('Error getting homework submissions', { error, query });
      throw error;
    }
  }

  /**
   * Get homework submission by ID
   */
  static async getHomeworkSubmissionById(id: string): Promise<HomeworkSubmissionResponse> {
    try {
      const submission = await HomeworkSubmission.findById(id)
        .populate('homeworkId', 'title subject topic questions')
        .populate('studentId', 'name rollNumber')
        .populate('gradedBy', 'name');

      if (!submission) {
        throw createError('Homework submission not found', 404);
      }

      return await this.formatHomeworkSubmissionResponse(submission);
    } catch (error) {
      console.log('Error getting homework submission by ID', { error, id });
      throw error;
    }
  }

  /**
   * Update homework submission
   */
  static async updateHomeworkSubmission(id: string, data: UpdateHomeworkSubmissionRequest, userId: string): Promise<HomeworkSubmissionResponse> {
    try {
      console.log('Updating homework submission', { id, data, userId });

      const submission = await HomeworkSubmission.findById(id);
      if (!submission) {
        throw createError('Homework submission not found', 404);
      }

      // Update fields
      Object.assign(submission, data, { updatedBy: userId });
      await submission.save();

      const response = await this.formatHomeworkSubmissionResponse(submission);
      console.log('Homework submission updated successfully', { submissionId: id });

      return response;
    } catch (error) {
      console.log('Error updating homework submission', { error, id, data, userId });
      throw error;
    }
  }

  /**
   * Delete homework submission
   */
  static async deleteHomeworkSubmission(id: string): Promise<void> {
    try {
      console.log('Deleting homework submission', { id });

      const submission = await HomeworkSubmission.findById(id);
      if (!submission) {
        throw createError('Homework submission not found', 404);
      }

      await HomeworkSubmission.findByIdAndDelete(id);
      console.log('Homework submission deleted successfully', { submissionId: id });
    } catch (error) {
      console.log('Error deleting homework submission', { error, id });
      throw error;
    }
  }

  /**
   * Grade homework submission
   */
  static async gradeHomeworkSubmission(id: string, gradingData: { feedback?: string; scores?: number[] }, userId: string): Promise<HomeworkSubmissionResponse> {
    try {
      console.log('Grading homework submission', { id, gradingData, userId });

      const submission = await HomeworkSubmission.findById(id)
        .populate('homeworkId', 'questions');
      
      if (!submission) {
        throw createError('Homework submission not found', 404);
      }

      // Update scores if provided
      if (gradingData.scores) {
        submission.answers = submission.answers.map((answer, index) => ({
          ...answer,
          score: gradingData.scores![index] || 0,
          isCorrect: gradingData.scores![index] === ((submission.homeworkId as any).questions[index]?.marks || 0)
        }));
      }

      // Update totals
      submission.totalScore = submission.answers.reduce((sum, answer) => sum + answer.score, 0);
      submission.percentage = (submission.totalScore / submission.maxScore) * 100;
      submission.status = 'graded';
      submission.gradedAt = new Date();
      submission.gradedBy = new mongoose.Types.ObjectId(userId);
      submission.feedback = gradingData.feedback;

      await submission.save();

      const response = await this.formatHomeworkSubmissionResponse(submission);
      console.log('Homework submission graded successfully', { submissionId: id });

      return response;
    } catch (error) {
      console.log('Error grading homework submission', { error, id, gradingData, userId });
      throw error;
    }
  }

  /**
   * Auto-grade homework submission using AI
   */
  static async autoGradeHomeworkSubmission(id: string, userId: string): Promise<HomeworkSubmissionResponse> {
    try {
      console.log('Auto-grading homework submission', { id, userId });

      const submission = await HomeworkSubmission.findById(id)
        .populate('homeworkId', 'questions');
      
      if (!submission) {
        throw createError('Homework submission not found', 404);
      }

      // Call AI service for auto-grading
      const aiGradingRequest = {
        assignmentId: (submission.homeworkId as any)._id.toString(),
        studentAnswers: submission.answers.map((a: any, index: number) => ({ questionId: String(index), answer: a.answer }))
      };

      const aiResponse = await AIService.gradeAssignment(aiGradingRequest);

      // Update submission with AI grading results
      submission.answers = submission.answers.map((answer: any, index: number) => ({
        ...answer,
        score: aiResponse.grades[index]?.score || 0,
        isCorrect: (aiResponse.grades[index]?.score || 0) === (aiResponse.grades[index]?.maxScore || 0)
      }));

      submission.totalScore = aiResponse.totalScore;
      submission.percentage = aiResponse.percentage;
      submission.status = 'graded';
      submission.gradedAt = new Date();
      submission.gradedBy = new mongoose.Types.ObjectId(userId);
      submission.aiFeedback = {
        overallFeedback: aiResponse.overallFeedback,
        improvementSuggestions: [],
        strengths: [],
        weaknesses: []
      };

      await submission.save();

      const response = await this.formatHomeworkSubmissionResponse(submission);
      console.log('Homework submission auto-graded successfully', { submissionId: id });

      return response;
    } catch (error) {
      console.log('Error auto-grading homework submission', { error, id, userId });
      throw error;
    }
  }

  /**
   * Export homework
   */
  static async exportHomework(request: ExportHomeworkRequest): Promise<ExportHomeworkResponse> {
    try {
      console.log('Exporting homework', { request });

      const homework = await Homework.findById(request.homeworkId)
        .populate('createdBy', 'name')
        .populate('targetStudents', 'name rollNumber')
        .populate('targetClass', 'name')
        .populate('targetBatch', 'name');

      if (!homework) {
        throw createError('Homework not found', 404);
      }

      // Generate export content based on format
      let exportContent: string;
      let fileName: string;

      if (request.format === 'pdf') {
        exportContent = this.generatePDFContent(homework);
        fileName = `${homework.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      } else {
        exportContent = this.generateWordContent(homework);
        fileName = `${homework.title.replace(/\s+/g, '_')}_${Date.now()}.docx`;
      }

      return {
        success: true,
        data: {
          downloadUrl: `/api/homework/export/download/${fileName}`,
          fileName,
          fileSize: exportContent.length,
          format: request.format,
        }
      };
    } catch (error) {
      console.log('Error exporting homework', { error, request });
      throw error;
    }
  }

  /**
   * Get homework analytics
   */
  static async getHomeworkAnalytics(id: string): Promise<HomeworkAnalytics> {
    try {
      console.log('Getting homework analytics', { id });

      const homework = await Homework.findById(id);
      if (!homework) {
        throw createError('Homework not found', 404);
      }

      const submissions = await HomeworkSubmission.find({ homeworkId: id });

      const totalSubmissions = submissions.length;
      const averageScore = totalSubmissions > 0 ? submissions.reduce((sum, s: any) => sum + (s.percentage || 0), 0) / totalSubmissions : 0;
      const averageTimeSpent = totalSubmissions > 0 ? submissions.reduce((sum, s: any) => sum + (s.timeSpent || 0), 0) / totalSubmissions : 0;

      const subjectBreakdown = [
        { subject: homework.subject, count: 1, averageScore }
      ];

      const difficultyBreakdown = [
        { difficulty: homework.difficulty, count: 1, averageScore }
      ];

      const recentActivity = [
        { date: new Date().toISOString().slice(0, 10), homeworksCreated: 0, submissionsReceived: totalSubmissions }
      ];

      return {
        totalHomeworks: 1,
        totalSubmissions,
        averageCompletionRate: 0,
        averageScore,
        averageTimeSpent,
        subjectBreakdown,
        difficultyBreakdown,
        recentActivity,
      };
    } catch (error) {
      console.log('Error getting homework analytics', { error, id });
      throw error;
    }
  }

  /**
   * Get homework stats
   */
  static async getHomeworkStats(userId: string): Promise<HomeworkStats> {
    try {
      console.log('Getting homework stats', { userId });

      const totalHomeworks = await Homework.countDocuments({ createdBy: userId });
      const publishedHomeworks = await Homework.countDocuments({ createdBy: userId, isPublished: true });
      const totalSubmissions = await HomeworkSubmission.countDocuments({
        homeworkId: { $in: await Homework.find({ createdBy: userId }).distinct('_id') }
      });

      const averageCompletionRate = totalHomeworks > 0 ? (publishedHomeworks / totalHomeworks) * 100 : 0;

      return {
        totalHomeworks,
        publishedHomeworks,
        totalSubmissions,
        averageCompletionRate,
        averageScore: 0,
        overdueHomeworks: 0,
        pendingSubmissions: 0,
      };
    } catch (error) {
      console.log('Error getting homework stats', { error, userId });
      throw error;
    }
  }

  /**
   * Get student homeworks
   */
  static async getStudentHomeworks(studentId: string, query: HomeworkQuery): Promise<HomeworkListResponse> {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw createError('Student not found', 404);
      }

      // Get homeworks assigned to this student
      const filterObj: any = {
        $or: [
          { targetStudents: studentId },
          { targetClass: (student as any).classId },
          { targetBatch: (student as any).batchId }
        ],
        isPublished: true
      };

      // Apply additional filters
      if (query.subject) filterObj.subject = new RegExp(query.subject, 'i');
      if (query.topic) filterObj.topic = new RegExp(query.topic, 'i');
      if (query.difficulty) filterObj.difficulty = query.difficulty;

      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      const homeworks = await Homework.find(filterObj)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('targetStudents', 'name rollNumber')
        .populate('targetClass', 'name')
        .populate('targetBatch', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      const total = await Homework.countDocuments(filterObj);

      const formattedHomeworks = await Promise.all(
        homeworks.map(homework => this.formatHomeworkResponse(homework))
      );

      return {
        homeworks: formattedHomeworks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.log('Error getting student homeworks', { error, studentId, query });
      throw error;
    }
  }

  /**
   * Get class homeworks
   */
  static async getClassHomeworks(classId: string, query: HomeworkQuery): Promise<HomeworkListResponse> {
    try {
      const filterObj: any = { targetClass: classId };
      
      if (query.subject) filterObj.subject = new RegExp(query.subject, 'i');
      if (query.topic) filterObj.topic = new RegExp(query.topic, 'i');
      if (query.difficulty) filterObj.difficulty = query.difficulty;
      if (query.isPublished !== undefined) filterObj.isPublished = query.isPublished;

      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      const homeworks = await Homework.find(filterObj)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('targetStudents', 'name rollNumber')
        .populate('targetClass', 'name')
        .populate('targetBatch', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      const total = await Homework.countDocuments(filterObj);

      const formattedHomeworks = await Promise.all(
        homeworks.map(homework => this.formatHomeworkResponse(homework))
      );

      return {
        homeworks: formattedHomeworks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.log('Error getting class homeworks', { error, classId, query });
      throw error;
    }
  }

  /**
   * Get batch homeworks
   */
  static async getBatchHomeworks(batchId: string, query: HomeworkQuery): Promise<HomeworkListResponse> {
    try {
      const filterObj: any = { targetBatch: batchId };
      
      if (query.subject) filterObj.subject = new RegExp(query.subject, 'i');
      if (query.topic) filterObj.topic = new RegExp(query.topic, 'i');
      if (query.difficulty) filterObj.difficulty = query.difficulty;
      if (query.isPublished !== undefined) filterObj.isPublished = query.isPublished;

      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      const homeworks = await Homework.find(filterObj)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('targetStudents', 'name rollNumber')
        .populate('targetClass', 'name')
        .populate('targetBatch', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      const total = await Homework.countDocuments(filterObj);

      const formattedHomeworks = await Promise.all(
        homeworks.map(homework => this.formatHomeworkResponse(homework))
      );

      return {
        homeworks: formattedHomeworks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.log('Error getting batch homeworks', { error, batchId, query });
      throw error;
    }
  }

  /**
   * Update homework analytics
   */
  private static async updateHomeworkAnalytics(homeworkId: string): Promise<void> {
    try {
      const submissionCount = await HomeworkSubmission.countDocuments({ homeworkId });
      
      await Homework.findByIdAndUpdate(homeworkId, {
        'analytics.totalSubmitted': submissionCount
      });
    } catch (error) {
      console.log('Error updating homework analytics', { error, homeworkId });
    }
  }

  /**
   * Generate PDF content
   */
  private static generatePDFContent(homework: any): string {
    // This would integrate with a PDF generation library like puppeteer or jsPDF
    // For now, return a simple HTML template
    return `
      <html>
        <head>
          <title>${homework.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .question { margin-bottom: 20px; }
            .options { margin-left: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${homework.title}</h1>
            <p><strong>Subject:</strong> ${homework.subject}</p>
            <p><strong>Topic:</strong> ${homework.topic}</p>
            <p><strong>Difficulty:</strong> ${homework.difficulty}</p>
            <p><strong>Total Marks:</strong> ${homework.totalMarks}</p>
            <p><strong>Estimated Time:</strong> ${homework.estimatedTime} minutes</p>
          </div>
          
          ${homework.questions.map((q: any, index: number) => `
            <div class="question">
              <h3>Question ${index + 1} (${q.marks} marks)</h3>
              <p>${q.question}</p>
              ${q.options ? `
                <div class="options">
                  ${q.options.map((opt: string, optIndex: number) => `
                    <p>${String.fromCharCode(65 + optIndex)}. ${opt}</p>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }

  /**
   * Generate Word content
   */
  private static generateWordContent(homework: any): string {
    // This would integrate with a Word document generation library
    // For now, return a simple text format
    return `
      ${homework.title}
      
      Subject: ${homework.subject}
      Topic: ${homework.topic}
      Difficulty: ${homework.difficulty}
      Total Marks: ${homework.totalMarks}
      Estimated Time: ${homework.estimatedTime} minutes
      
      ${homework.questions.map((q: any, index: number) => `
        Question ${index + 1} (${q.marks} marks)
        ${q.question}
        ${q.options ? q.options.map((opt: string, optIndex: number) => 
          `${String.fromCharCode(65 + optIndex)}. ${opt}`
        ).join('\n') : ''}
      `).join('\n\n')}
    `;
  }

  /**
   * Format homework response
   */
  private static async formatHomeworkResponse(homework: any): Promise<HomeworkResponse> {
    return {
      id: homework._id.toString(),
      title: homework.title,
      description: homework.description,
      subject: homework.subject,
      topic: homework.topic,
      difficulty: homework.difficulty,
      questionTypes: homework.questionTypes,
      totalQuestions: homework.totalQuestions,
      totalMarks: homework.totalMarks,
      estimatedTime: homework.estimatedTime,
      dueDate: homework.dueDate,
      isPublished: homework.isPublished,
      isPersonalized: homework.isPersonalized,
      targetAudience: homework.targetAudience,
      targetStudents: homework.targetStudents?.map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        rollNumber: s.rollNumber
      })),
      targetClass: homework.targetClass ? {
        id: homework.targetClass._id.toString(),
        name: homework.targetClass.name
      } : undefined,
      targetBatch: homework.targetBatch ? {
        id: homework.targetBatch._id.toString(),
        name: homework.targetBatch.name
      } : undefined,
      questions: homework.questions.map((q: any, index: number) => ({
        ...q.toObject(),
        id: index.toString()
      })),
      aiGenerationData: homework.aiGenerationData,
      analytics: homework.analytics,
      createdBy: {
        id: homework.createdBy._id.toString(),
        name: homework.createdBy.name
      },
      updatedBy: {
        id: homework.updatedBy._id.toString(),
        name: homework.updatedBy.name
      },
      createdAt: homework.createdAt,
      updatedAt: homework.updatedAt
    };
  }

  /**
   * Format homework submission response
   */
  private static async formatHomeworkSubmissionResponse(submission: any): Promise<HomeworkSubmissionResponse> {
    return {
      id: submission._id.toString(),
      homeworkId: (submission.homeworkId as any)._id?.toString?.() || String(submission.homeworkId),
      studentId: (submission.studentId as any)._id?.toString?.() || String(submission.studentId),
      answers: submission.answers.map((a: any) => ({
        questionIndex: a.questionIndex,
        answer: a.answer,
        isCorrect: a.isCorrect,
        score: a.score,
        timeSpent: a.timeSpent,
        submittedAt: a.submittedAt
      })),
      totalScore: submission.totalScore,
      maxScore: submission.maxScore,
      percentage: submission.percentage,
      timeSpent: submission.timeSpent,
      status: submission.status,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt,
      gradedBy: submission.gradedBy ? {
        id: submission.gradedBy._id.toString(),
        name: submission.gradedBy.name
      } : undefined,
      feedback: submission.feedback,
      aiFeedback: submission.aiFeedback,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    };
  }

  // Helper methods

  /**
   * Check if answer is correct
   */
  private static checkAnswer(studentAnswer: string, question: any): boolean {
    const correctAnswer = question.correctAnswer.toLowerCase().trim();
    const answer = studentAnswer.toLowerCase().trim();

    // For multiple choice, check exact match
    if (question.questionType === 'multiple_choice') {
      return answer === correctAnswer;
    }

    // For other types, allow partial matching
    return answer.includes(correctAnswer) || correctAnswer.includes(answer);
  }
}
