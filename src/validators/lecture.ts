import { z } from 'zod';

export const createLectureSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic too long'),
  language: z.enum(['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja', 'ko'], {
    errorMap: () => ({ message: 'Invalid language selection' })
  }),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(120, 'Duration cannot exceed 120 minutes'),
  voice: z.enum(['male', 'female', 'neutral'], {
    errorMap: () => ({ message: 'Invalid voice selection' })
  })
});

export const updateLectureSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long').optional(),
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic too long').optional(),
  language: z.enum(['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja', 'ko']).optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(120, 'Duration cannot exceed 120 minutes').optional(),
  voice: z.enum(['male', 'female', 'neutral']).optional(),
  script: z.string().optional(),
  audioUrl: z.string().url('Invalid audio URL').optional(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
  errorMessage: z.string().optional()
});

export const lectureQuerySchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  subject: z.string().optional(),
  topic: z.string().optional(),
  language: z.enum(['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja', 'ko']).optional(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
  sortBy: z.enum(['createdAt', 'subject', 'topic', 'duration']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const lectureIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lecture ID')
});

export const generateLectureSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic too long'),
  language: z.enum(['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja', 'ko'], {
    errorMap: () => ({ message: 'Invalid language selection' })
  }),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(120, 'Duration cannot exceed 120 minutes'),
  voice: z.enum(['male', 'female', 'neutral'], {
    errorMap: () => ({ message: 'Invalid voice selection' })
  })
});
