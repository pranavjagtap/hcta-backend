import { Request, Response } from 'express';
import { StudyPlanService } from '../services/studyPlan';
import { catchAsync } from '../utils/catchAsync';
import { validateRequest } from '../utils/validateRequest';
import {
  CreateStudyPlanSchema,
  UpdateStudyPlanSchema,
  StudyPlanQuerySchema,
  AIGenerateStudyPlanSchema,
  CreateStudyPlanProgressSchema,
  UpdateStudyPlanProgressSchema,
  StudyPlanProgressQuerySchema,
  StudyPlanAnalyticsQuerySchema,
  StudyPlanStatsQuerySchema
} from '../validators/studyPlan';

// AI Generation Controllers
export const generateStudyPlanWithAIController = catchAsync(async (req: Request, res: Response) => {
  const validatedData = validateRequest(req.body, AIGenerateStudyPlanSchema);
  const result = await StudyPlanService.generateStudyPlanWithAI(validatedData);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Study Plan CRUD Controllers
export const createStudyPlanController = catchAsync(async (req: Request, res: Response) => {
  const validatedData = validateRequest(req.body, CreateStudyPlanSchema);
  const userId = (req as any).user?._id as string;
  
  const studyPlan = await StudyPlanService.createStudyPlan(validatedData, userId);
  res.status(201).json({
    success: true,
    data: studyPlan
  });
});

export const getStudyPlansController = catchAsync(async (req: Request, res: Response) => {
  const validatedQuery = validateRequest(req.query, StudyPlanQuerySchema);
  const result = await StudyPlanService.getStudyPlans(validatedQuery as any);
  
  res.status(200).json(result);
});

export const getStudyPlanByIdController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const studyPlan = await StudyPlanService.getStudyPlanById(id);
  
  res.status(200).json({
    success: true,
    data: studyPlan
  });
});

export const updateStudyPlanController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = validateRequest(req.body, UpdateStudyPlanSchema);
  const userId = (req as any).user?._id as string;
  
  const studyPlan = await StudyPlanService.updateStudyPlan(id, validatedData, userId);
  res.status(200).json({
    success: true,
    data: studyPlan
  });
});

export const deleteStudyPlanController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await StudyPlanService.deleteStudyPlan(id);
  
  res.status(204).send();
});

// Study Plan Status Controllers
export const activateStudyPlanController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?._id as string;
  
  const studyPlan = await StudyPlanService.activateStudyPlan(id, userId);
  res.status(200).json({
    success: true,
    data: studyPlan
  });
});

export const pauseStudyPlanController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?._id as string;
  
  const studyPlan = await StudyPlanService.pauseStudyPlan(id, userId);
  res.status(200).json({
    success: true,
    data: studyPlan
  });
});

export const completeStudyPlanController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  
  const studyPlan = await StudyPlanService.completeStudyPlan(id, userId);
  res.status(200).json({
    success: true,
    data: studyPlan
  });
});

// Study Plan Progress Controllers
export const createStudyPlanProgressController = catchAsync(async (req: Request, res: Response) => {
  const validatedData = validateRequest(req.body, CreateStudyPlanProgressSchema);
  
  const progress = await StudyPlanService.createStudyPlanProgress(validatedData);
  res.status(201).json({
    success: true,
    data: progress
  });
});

export const getStudyPlanProgressController = catchAsync(async (req: Request, res: Response) => {
  const { studyPlanId } = req.params;
  const { date } = req.query;
  
  const progress = await StudyPlanService.getStudyPlanProgress(studyPlanId, date as string);
  res.status(200).json({
    success: true,
    data: progress
  });
});

export const updateStudyPlanProgressController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = validateRequest(req.body, UpdateStudyPlanProgressSchema);
  
  const progress = await StudyPlanService.updateStudyPlanProgress(id, validatedData);
  res.status(200).json({
    success: true,
    data: progress
  });
});

// Analytics Controllers
export const getStudyPlanAnalyticsController = catchAsync(async (req: Request, res: Response) => {
  const { studyPlanId } = req.params;
  const validatedQuery = validateRequest(req.query, StudyPlanAnalyticsQuerySchema);
  
  const analytics = await StudyPlanService.getStudyPlanAnalytics(studyPlanId, validatedQuery);
  res.status(200).json({
    success: true,
    data: analytics
  });
});

export const getStudyPlanStatsController = catchAsync(async (req: Request, res: Response) => {
  const validatedQuery = validateRequest(req.query, StudyPlanStatsQuerySchema);
  
  const stats = await StudyPlanService.getStudyPlanStats(validatedQuery);
  res.status(200).json({
    success: true,
    data: stats
  });
});

// Performance-based Update Controller
export const updateStudyPlanBasedOnPerformanceController = catchAsync(async (req: Request, res: Response) => {
  const { studyPlanId } = req.params;
  const performanceData = req.body;
  
  const updatedPlan = await StudyPlanService.updateStudyPlanBasedOnPerformance(studyPlanId, performanceData);
  res.status(200).json({
    success: true,
    data: updatedPlan
  });
});

// Student-specific Controllers
export const getStudentStudyPlansController = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const validatedQuery = validateRequest(req.query, StudyPlanQuerySchema);
  
  const query = { ...(validatedQuery as any), studentId } as any;
  const result = await StudyPlanService.getStudyPlans(query as any);
  
  res.status(200).json(result);
});

export const getActiveStudyPlanController = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  
  const query = { studentId, isActive: true, status: 'active' } as any;
  const result = await StudyPlanService.getStudyPlans(query as any);
  
  res.status(200).json(result);
});
