import mongoose from 'mongoose';
import { StudyPlan, StudyPlanProgress, IStudyPlan, IStudyPlanProgress } from '../models/studyPlan';
import { AIService } from './aiService';
import { createError } from '../utils/appError';
import {
  CreateStudyPlanRequest,
  UpdateStudyPlanRequest,
  StudyPlanQuery,
  StudyPlanResponse,
  StudyPlanListResponse,
  AIGenerateStudyPlanRequest,
  AIGenerateStudyPlanResponse,
  CreateStudyPlanProgressRequest,
  UpdateStudyPlanProgressRequest,
  StudyPlanProgressResponse,
  StudyPlanAnalyticsResponse,
  StudyPlanStatsResponse
} from '../types/studyPlan';

export class StudyPlanService {
  /**
   * Generate study plan with AI
   */
  static async generateStudyPlanWithAI(request: AIGenerateStudyPlanRequest): Promise<AIGenerateStudyPlanResponse> {
    try {
      console.log('Generating study plan with AI for student:', request.studentId);
      
      const subjectNames = request.subjects.map(subject => subject.name);
      const aiResponse = await AIService.generateStudyPlan(
        request.studentId,
        subjectNames,
        request.preferredStudyHoursPerDay * 60, // Convert hours to minutes
        new Date(request.endDate)
      );
      
      return {
        success: true,
        data: {
          weeks: aiResponse.plan.map(day => ({
            weekNumber: Math.ceil(day.day / 7),
            startDate: new Date(Date.now() + (day.day - 1) * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + day.day * 24 * 60 * 60 * 1000).toISOString(),
            totalStudyTime: day.duration,
            days: [{
              date: new Date(Date.now() + (day.day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              dayOfWeek: new Date(Date.now() + (day.day - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
              totalStudyTime: day.duration,
              tasks: day.topics.map(topic => ({
                id: `${day.day}-${topic}`,
                subject: day.subject,
                topic: topic,
                duration: day.duration / day.topics.length,
                priority: 'medium' as const,
                type: 'learning' as const,
                estimatedDifficulty: 'medium' as const,
                learningObjectives: [topic],
                resources: [],
                notes: ''
              })),
              breaks: 2,
              isCompleted: false,
              completionPercentage: 0
            }],
            weeklyGoals: day.activities,
            isCompleted: false,
            completionPercentage: 0
          })),
          totalStudyHours: aiResponse.plan.reduce((total, day) => total + day.duration, 0) / 60,
          totalTopics: aiResponse.plan.reduce((total, day) => total + day.topics.length, 0),
          model: 'AI Study Plan Generator',
          prompt: `Generate study plan for ${request.studentId}`,
          generationTime: Date.now(),
          personalizationFactors: request.personalizationFactors || {
            weakTopicsWeight: 0.3,
            strongTopicsWeight: 0.2,
            learningStyleWeight: 0.3,
            timeConstraintWeight: 0.2
          },
          recommendations: ['Follow the daily schedule', 'Review completed topics', 'Take regular breaks']
        }
      };
    } catch (error) {
      console.log('Error in generateStudyPlanWithAI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate study plan'
      };
    }
  }

  /**
   * Create study plan
   */
  static async createStudyPlan(data: CreateStudyPlanRequest, userId: string): Promise<StudyPlanResponse> {
    try {
      const studyPlanData: any = {
        studentId: new mongoose.Types.ObjectId(data.studentId),
        title: data.title,
        description: data.description,
        planType: data.planType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        targetExamDate: data.targetExamDate ? new Date(data.targetExamDate) : undefined,
        syllabusDeadline: data.syllabusDeadline ? new Date(data.syllabusDeadline) : undefined,
        preferredStudyHoursPerDay: data.preferredStudyHoursPerDay,
        preferredStudyDays: data.preferredStudyDays,
        learningStyle: data.learningStyle,
        availableTimeSlots: data.availableTimeSlots,
        subjects: data.subjects,
        createdBy: new mongoose.Types.ObjectId(userId),
        updatedBy: new mongoose.Types.ObjectId(userId)
      };

      // If AI generation is requested
      if (data.useAI) {
        const aiRequest: AIGenerateStudyPlanRequest = {
          studentId: data.studentId,
          studentName: '', // Will be populated from student data
          grade: '', // Will be populated from student data
          subjects: data.subjects,
          preferredStudyHoursPerDay: data.preferredStudyHoursPerDay,
          preferredStudyDays: data.preferredStudyDays,
          learningStyle: data.learningStyle,
          availableTimeSlots: data.availableTimeSlots,
          startDate: data.startDate,
          endDate: data.endDate,
          targetExamDate: data.targetExamDate,
          syllabusDeadline: data.syllabusDeadline,
          planType: data.planType,
          personalizationFactors: data.personalizationFactors
        };

        const aiResponse = await this.generateStudyPlanWithAI(aiRequest);
        
        if (aiResponse.success && aiResponse.data) {
          studyPlanData.weeks = aiResponse.data.weeks;
          studyPlanData.totalStudyHours = aiResponse.data.totalStudyHours;
          studyPlanData.totalTopics = aiResponse.data.totalTopics;
          studyPlanData.aiGenerationData = {
            model: aiResponse.data.model,
            prompt: aiResponse.data.prompt,
            generationTime: aiResponse.data.generationTime,
            personalizationFactors: aiResponse.data.personalizationFactors,
            recommendations: aiResponse.data.recommendations
          };
        }
      }

      const studyPlan = new StudyPlan(studyPlanData);
      await studyPlan.save();

      return await this.formatStudyPlanResponse(studyPlan);
    } catch (error) {
      console.log('Error in createStudyPlan:', error);
      throw createError('Failed to create study plan', 500);
    }
  }

  /**
   * Get study plan by ID
   */
  static async getStudyPlanById(id: string): Promise<StudyPlanResponse> {
    try {
      const studyPlan = await StudyPlan.findById(id)
        .populate('studentId', 'name email')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name');

      if (!studyPlan) {
        throw createError('Study plan not found', 404);
      }

      return await this.formatStudyPlanResponse(studyPlan);
    } catch (error) {
      console.log('Error in getStudyPlanById:', error);
      throw error;
    }
  }

  /**
   * Get study plans with filtering and pagination
   */
  static async getStudyPlans(query: StudyPlanQuery): Promise<StudyPlanListResponse> {
    try {
      const {
        studentId,
        status,
        planType,
        isActive,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const filter: any = {};

      if (studentId) filter.studentId = new mongoose.Types.ObjectId(studentId.toString());
      if (status) filter.status = status;
      if (planType) filter.planType = planType;
      if (isActive !== undefined) filter.isActive = isActive;
      if (startDate) filter.startDate = { $gte: new Date(startDate) };
      if (endDate) filter.endDate = { $lte: new Date(endDate) };

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [studyPlans, total] = await Promise.all([
        StudyPlan.find(filter)
          .populate('studentId', 'name email')
          .populate('createdBy', 'name')
          .populate('updatedBy', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        StudyPlan.countDocuments(filter)
      ]);

      const formattedStudyPlans = await Promise.all(
        studyPlans.map(plan => this.formatStudyPlanResponse(plan))
      );

      return {
        success: true,
        data: {
          studyPlans: formattedStudyPlans,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.log('Error in getStudyPlans:', error);
      throw createError('Failed to fetch study plans', 500);
    }
  }

  /**
   * Update study plan
   */
  static async updateStudyPlan(id: string, data: UpdateStudyPlanRequest, userId: string): Promise<StudyPlanResponse> {
    try {
      const updateData: any = {
        ...data,
        updatedBy: new mongoose.Types.ObjectId(userId)
      };

      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);
      if (data.targetExamDate) updateData.targetExamDate = new Date(data.targetExamDate);
      if (data.syllabusDeadline) updateData.syllabusDeadline = new Date(data.syllabusDeadline);

      const studyPlan = await StudyPlan.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('studentId', 'name email')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name');

      if (!studyPlan) {
        throw createError('Study plan not found', 404);
      }

      return await this.formatStudyPlanResponse(studyPlan);
    } catch (error) {
      console.log('Error in updateStudyPlan:', error);
      throw error;
    }
  }

  /**
   * Delete study plan
   */
  static async deleteStudyPlan(id: string): Promise<void> {
    try {
      const studyPlan = await StudyPlan.findByIdAndDelete(id);
      
      if (!studyPlan) {
        throw createError('Study plan not found', 404);
      }

      // Also delete associated progress records
      await StudyPlanProgress.deleteMany({ studyPlanId: id });
    } catch (error) {
      console.log('Error in deleteStudyPlan:', error);
      throw error;
    }
  }

  /**
   * Activate study plan
   */
  static async activateStudyPlan(id: string, userId: string): Promise<StudyPlanResponse> {
    try {
      const studyPlan = await StudyPlan.findByIdAndUpdate(
        id,
        { 
          status: 'active', 
          isActive: true,
          updatedBy: new mongoose.Types.ObjectId(userId)
        },
        { new: true, runValidators: true }
      )
        .populate('studentId', 'name email')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name');

      if (!studyPlan) {
        throw createError('Study plan not found', 404);
      }

      return await this.formatStudyPlanResponse(studyPlan);
    } catch (error) {
      console.log('Error in activateStudyPlan:', error);
      throw error;
    }
  }

  /**
   * Pause study plan
   */
  static async pauseStudyPlan(id: string, userId: string): Promise<StudyPlanResponse> {
    try {
      const studyPlan = await StudyPlan.findByIdAndUpdate(
        id,
        { 
          status: 'paused', 
          isActive: false,
          updatedBy: new mongoose.Types.ObjectId(userId)
        },
        { new: true, runValidators: true }
      )
        .populate('studentId', 'name email')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name');

      if (!studyPlan) {
        throw createError('Study plan not found', 404);
      }

      return await this.formatStudyPlanResponse(studyPlan);
    } catch (error) {
      console.log('Error in pauseStudyPlan:', error);
      throw error;
    }
  }

  /**
   * Complete study plan
   */
  static async completeStudyPlan(id: string, userId: string): Promise<StudyPlanResponse> {
    try {
      const studyPlan = await StudyPlan.findByIdAndUpdate(
        id,
        { 
          status: 'completed', 
          isActive: false,
          updatedBy: new mongoose.Types.ObjectId(userId)
        },
        { new: true, runValidators: true }
      )
        .populate('studentId', 'name email')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name');

      if (!studyPlan) {
        throw createError('Study plan not found', 404);
      }

      return await this.formatStudyPlanResponse(studyPlan);
    } catch (error) {
      console.log('Error in completeStudyPlan:', error);
      throw error;
    }
  }

  /**
   * Create study plan progress
   */
  static async createStudyPlanProgress(data: CreateStudyPlanProgressRequest): Promise<StudyPlanProgressResponse> {
    try {
      const progressData: any = {
        studyPlanId: new mongoose.Types.ObjectId(data.studyPlanId),
        date: new Date(data.date),
        plannedTasks: data.plannedTasks,
        completedTasks: data.completedTasks,
        plannedStudyTime: data.plannedStudyTime,
        actualStudyTime: data.actualStudyTime,
        taskProgress: data.taskProgress,
        performanceMetrics: data.performanceMetrics,
        obstacles: data.obstacles || []
      };

      const progress = new StudyPlanProgress(progressData);
      await progress.save();

      return await this.formatStudyPlanProgressResponse(progress);
    } catch (error) {
      console.log('Error in createStudyPlanProgress:', error);
      throw createError('Failed to create study plan progress', 500);
    }
  }

  /**
   * Get study plan progress
   */
  static async getStudyPlanProgress(studyPlanId: string, date?: string): Promise<StudyPlanProgressResponse[]> {
    try {
      const filter: any = { studyPlanId: new mongoose.Types.ObjectId(studyPlanId) };
      
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        filter.date = {
          $gte: targetDate,
          $lt: nextDay
        };
      }

      const progress = await StudyPlanProgress.find(filter).sort({ date: -1 });
      
      return await Promise.all(progress.map(p => this.formatStudyPlanProgressResponse(p)));
    } catch (error) {
      console.log('Error in getStudyPlanProgress:', error);
      throw createError('Failed to fetch study plan progress', 500);
    }
  }

  /**
   * Update study plan progress
   */
  static async updateStudyPlanProgress(id: string, data: UpdateStudyPlanProgressRequest): Promise<StudyPlanProgressResponse> {
    try {
      const progress = await StudyPlanProgress.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      );

      if (!progress) {
        throw createError('Study plan progress not found', 404);
      }

      return await this.formatStudyPlanProgressResponse(progress);
    } catch (error) {
      console.log('Error in updateStudyPlanProgress:', error);
      throw error;
    }
  }

  /**
   * Get study plan analytics
   */
  static async getStudyPlanAnalytics(studyPlanId: string, query: any): Promise<StudyPlanAnalyticsResponse> {
    try {
      // Mock analytics for now - in real implementation, this would calculate from progress data
      const analytics: StudyPlanAnalyticsResponse = {
        studyPlanId,
        overallProgress: 75,
        totalStudyHours: 120,
        completedStudyHours: 90,
        totalTopics: 45,
        completedTopics: 34,
        averageDailyCompletion: 85,
        subjectsProgress: [
          { subject: 'Mathematics', progress: 80, completedTopics: 16, totalTopics: 20 },
          { subject: 'Science', progress: 70, completedTopics: 14, totalTopics: 20 },
          { subject: 'English', progress: 75, completedTopics: 15, totalTopics: 20 }
        ],
        weeklyProgress: [
          { weekNumber: 1, progress: 80, studyHours: 12, completedTopics: 8 },
          { weekNumber: 2, progress: 75, studyHours: 10, completedTopics: 6 }
        ],
        dailyProgress: [
          { date: '2025-01-01', progress: 100, studyHours: 2, completedTasks: 4 },
          { date: '2025-01-02', progress: 80, studyHours: 1.5, completedTasks: 3 }
        ],
        performanceTrends: {
          focusScore: 8,
          understandingScore: 7,
          retentionScore: 8,
          overallScore: 7.7
        },
        recommendations: [
          'Focus more on Science topics',
          'Increase daily study time',
          'Review completed topics regularly'
        ]
      };

      return analytics;
    } catch (error) {
      console.log('Error in getStudyPlanAnalytics:', error);
      throw createError('Failed to fetch study plan analytics', 500);
    }
  }

  /**
   * Get study plan stats
   */
  static async getStudyPlanStats(query: any): Promise<StudyPlanStatsResponse> {
    try {
      // Mock stats for now - in real implementation, this would calculate from database
      const stats: StudyPlanStatsResponse = {
        totalStudyPlans: 25,
        activeStudyPlans: 15,
        completedStudyPlans: 8,
        averageCompletionRate: 78,
        totalStudyHours: 1800,
        averageStudyHoursPerDay: 2.5,
        mostStudiedSubjects: [
          { subject: 'Mathematics', hours: 600, percentage: 33 },
          { subject: 'Science', hours: 450, percentage: 25 },
          { subject: 'English', hours: 360, percentage: 20 }
        ],
        weeklyTrends: [
          { week: 'Week 1', studyHours: 15, completionRate: 85 },
          { week: 'Week 2', studyHours: 12, completionRate: 75 }
        ]
      };

      return stats;
    } catch (error) {
      console.log('Error in getStudyPlanStats:', error);
      throw createError('Failed to fetch study plan stats', 500);
    }
  }

  /**
   * Update study plan based on performance
   */
  static async updateStudyPlanBasedOnPerformance(studyPlanId: string, performanceData: any): Promise<StudyPlanResponse> {
    try {
      // Mock implementation - in real app, this would call AI service to update the plan
      const studyPlan = await StudyPlan.findById(studyPlanId)
        .populate('studentId', 'name email')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name');

      if (!studyPlan) {
        throw createError('Study plan not found', 404);
      }

      // Here you would call the AI service to update the plan based on performance
      // For now, just return the existing plan
      return await this.formatStudyPlanResponse(studyPlan);
    } catch (error) {
      console.log('Error in updateStudyPlanBasedOnPerformance:', error);
      throw error;
    }
  }

  /**
   * Format study plan progress response
   */
  private static async formatStudyPlanProgressResponse(progress: IStudyPlanProgress): Promise<StudyPlanProgressResponse> {
    return {
      id: (progress._id as any).toString(),
      studyPlanId: progress.studyPlanId.toString(),
      studentId: progress.studentId.toString(),
      date: progress.date.toISOString(),
      plannedTasks: progress.plannedTasks,
      completedTasks: progress.completedTasks,
      plannedStudyTime: progress.plannedStudyTime,
      actualStudyTime: progress.actualStudyTime,
      completionRate: progress.completionRate,
      taskProgress: progress.taskProgress,
      performanceMetrics: progress.performanceMetrics,
      obstacles: progress.obstacles,
      aiFeedback: progress.aiFeedback,
      createdAt: progress.createdAt.toISOString(),
      updatedAt: progress.updatedAt.toISOString()
    };
  }

  /**
   * Format study plan response
   */
  private static async formatStudyPlanResponse(studyPlan: IStudyPlan): Promise<StudyPlanResponse> {
    return {
      id: (studyPlan._id as any).toString(),
      studentId: studyPlan.studentId.toString(),
      title: studyPlan.title,
      description: studyPlan.description,
      planType: studyPlan.planType,
      startDate: studyPlan.startDate.toISOString(),
      endDate: studyPlan.endDate.toISOString(),
      targetExamDate: studyPlan.targetExamDate?.toISOString(),
      syllabusDeadline: studyPlan.syllabusDeadline?.toISOString(),
      preferredStudyHoursPerDay: studyPlan.preferredStudyHoursPerDay,
      preferredStudyDays: studyPlan.preferredStudyDays,
      learningStyle: studyPlan.learningStyle,
      availableTimeSlots: studyPlan.availableTimeSlots,
      subjects: studyPlan.subjects,
      weeks: studyPlan.weeks,
      totalStudyHours: studyPlan.totalStudyHours,
      totalTopics: studyPlan.totalTopics,
      aiGenerationData: studyPlan.aiGenerationData,
      status: studyPlan.status,
      isActive: studyPlan.isActive,
      currentWeek: studyPlan.currentWeek,
      currentDay: studyPlan.currentDay,
      overallProgress: studyPlan.overallProgress,
      subjectsProgress: studyPlan.subjectsProgress,
      createdAt: studyPlan.createdAt.toISOString(),
      updatedAt: studyPlan.updatedAt.toISOString(),
      createdBy: {
        id: (studyPlan as any).createdBy?._id?.toString() || studyPlan.createdBy.toString(),
        name: (studyPlan as any).createdBy?.name || 'Unknown'
      },
      updatedBy: {
        id: (studyPlan as any).updatedBy?._id?.toString() || studyPlan.updatedBy.toString(),
        name: (studyPlan as any).updatedBy?.name || 'Unknown'
      }
    };
  }
}
