# HCTA AI Integration Guide

This guide explains how to integrate the HCTA AI Microservice with the main HCTA backend application.

## 🔗 Overview

The AI microservice provides the following capabilities that can be integrated into the HCTA backend:

1. **OCR Processing**: Extract text from handwritten notes and images
2. **Content Generation**: Generate MCQs, assignments, and study materials
3. **Performance Analysis**: Analyze student performance and provide insights
4. **Attendance Prediction**: Predict student attendance patterns
5. **Assignment Grading**: Automatically grade assignments

## 🚀 Quick Start

### 1. Start the AI Microservice

```bash
# Navigate to AI service directory
cd hcta-ai-service

# Install dependencies
pip install -r requirements.txt

# Start the service
python start.py
```

The AI service will be available at `http://localhost:8000`

### 2. Update Backend Configuration

Add the following to your backend `.env` file:

```env
# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=30
AI_SERVICE_ENABLED=true
```

### 3. Create AI Service Client

Create a new file `src/services/aiService.ts`:

```typescript
import axios from 'axios';

interface AIServiceConfig {
  baseURL: string;
  timeout: number;
}

interface OCRRequest {
  file_url: string;
  language?: string;
  confidence_threshold?: number;
}

interface OCRResponse {
  text: string;
  confidence: number;
  language: string;
  processing_time: number;
  word_count: number;
  lines: string[];
  bounding_boxes: any[];
}

interface MCQRequest {
  topic: string;
  subject: string;
  grade_level: string;
  content_type: string;
  difficulty?: string;
  count?: number;
  language?: string;
}

interface MCQResponse {
  content: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: string;
    topic: string;
    bloom_taxonomy: string;
  }>;
  metadata: any;
  generation_time: number;
}

interface PerformanceAnalysisRequest {
  student_id: string;
  subject_id: string;
  time_period?: string;
  include_predictions?: boolean;
}

interface PerformanceAnalysisResponse {
  student_id: string;
  subject_id: string;
  metrics: {
    average_score: number;
    total_assignments: number;
    completed_assignments: number;
    improvement_rate: number;
    weak_areas: string[];
    strong_areas: string[];
    attendance_rate: number;
    predicted_score?: number;
  };
  trends: any;
  recommendations: string[];
  analysis_time: number;
}

class AIServiceClient {
  private config: AIServiceConfig;
  private client: any;

  constructor() {
    this.config = {
      baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '30') * 1000
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Extract text from image using OCR
   */
  async extractTextFromImage(request: OCRRequest): Promise<OCRResponse> {
    try {
      const response = await this.client.post('/ocr/extract-text', request);
      return response.data;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('OCR processing failed');
    }
  }

  /**
   * Generate MCQ questions
   */
  async generateMCQ(request: MCQRequest): Promise<MCQResponse> {
    try {
      const response = await this.client.post('/content/generate-mcq', request);
      return response.data;
    } catch (error) {
      console.error('MCQ generation failed:', error);
      throw new Error('MCQ generation failed');
    }
  }

  /**
   * Generate complete assignment
   */
  async generateAssignment(request: {
    topic: string;
    subject: string;
    grade_level: string;
    difficulty?: string;
    question_count?: number;
  }): Promise<any> {
    try {
      const formData = new FormData();
      Object.entries(request).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '');
      });

      const response = await this.client.post('/content/generate-assignment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Assignment generation failed:', error);
      throw new Error('Assignment generation failed');
    }
  }

  /**
   * Analyze student performance
   */
  async analyzePerformance(request: PerformanceAnalysisRequest): Promise<PerformanceAnalysisResponse> {
    try {
      const response = await this.client.post('/performance/analyze', request);
      return response.data;
    } catch (error) {
      console.error('Performance analysis failed:', error);
      throw new Error('Performance analysis failed');
    }
  }

  /**
   * Predict attendance
   */
  async predictAttendance(request: {
    student_id: string;
    batch_id: string;
    days_ahead?: number;
  }): Promise<any> {
    try {
      const response = await this.client.post('/attendance/predict', request);
      return response.data;
    } catch (error) {
      console.error('Attendance prediction failed:', error);
      throw new Error('Attendance prediction failed');
    }
  }

  /**
   * Grade assignment automatically
   */
  async gradeAssignment(request: {
    assignment_id: string;
    student_answers: string; // JSON string
  }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('assignment_id', request.assignment_id);
      formData.append('student_answers', request.student_answers);

      const response = await this.client.post('/content/grade-assignment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Assignment grading failed:', error);
      throw new Error('Assignment grading failed');
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<any> {
    try {
      const response = await this.client.get('/models/available');
      return response.data;
    } catch (error) {
      console.error('Failed to get available models:', error);
      throw new Error('Failed to get available models');
    }
  }

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
}

export const aiService = new AIServiceClient();
export default aiService;
```

## 🔧 Integration Examples

### 1. OCR Integration with Note Upload

Update the note service to include OCR processing:

```typescript
// src/services/note.ts

import aiService from './aiService';

export const createNote = async (noteData: any) => {
  try {
    // If note has a file URL, extract text using OCR
    if (noteData.fileUrl) {
      try {
        const ocrResult = await aiService.extractTextFromImage({
          file_url: noteData.fileUrl,
          language: 'en',
          confidence_threshold: 0.8
        });

        // Add extracted text to note data
        noteData.extractedText = ocrResult.text;
        noteData.ocrConfidence = ocrResult.confidence;
        noteData.wordCount = ocrResult.word_count;
      } catch (ocrError) {
        console.warn('OCR processing failed, continuing without extracted text:', ocrError);
      }
    }

    // Create note with extracted text
    const note = new Note(noteData);
    const savedNote = await note.save();
    
    return await savedNote.populate([
      { path: "batchId", select: "name" },
      { path: "subjectId", select: "name" },
      { path: "uploadedBy", select: "name email" },
    ]);
  } catch (error) {
    throw error;
  }
};
```

### 2. MCQ Generation Integration

Add MCQ generation to assignment service:

```typescript
// src/services/assignment.ts

import aiService from './aiService';

export const generateMCQAssignment = async (request: {
  topic: string;
  subject: string;
  grade_level: string;
  batch_id: string;
  count?: number;
  difficulty?: string;
}) => {
  try {
    // Generate MCQs using AI service
    const mcqResponse = await aiService.generateMCQ({
      topic: request.topic,
      subject: request.subject,
      grade_level: request.grade_level,
      content_type: 'mcq',
      difficulty: request.difficulty || 'medium',
      count: request.count || 10,
      language: 'en'
    });

    // Create assignment with generated MCQs
    const assignment = new Assignment({
      title: `${request.topic} MCQ Assignment`,
      description: `AI-generated MCQ assignment on ${request.topic}`,
      batchId: request.batch_id,
      subjectId: request.subject_id,
      questions: mcqResponse.content.map((q, index) => ({
        questionNumber: index + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        marks: 2
      })),
      totalMarks: mcqResponse.content.length * 2,
      type: 'mcq',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    const savedAssignment = await assignment.save();
    return await savedAssignment.populate([
      { path: "batchId", select: "name" },
      { path: "subjectId", select: "name" },
    ]);
  } catch (error) {
    throw error;
  }
};
```

### 3. Performance Analysis Integration

Add AI-powered performance analysis to dashboard:

```typescript
// src/services/dashboard.ts

import aiService from './aiService';

export const getEnhancedTeacherDashboard = async (tutorId: string) => {
  try {
    // Get basic dashboard data
    const basicData = await generateTeacherDashboardData(tutorId);
    
    // Get AI-enhanced performance insights
    const aiInsights = await getAIPerformanceInsights(tutorId);
    
    return {
      ...basicData,
      aiInsights
    };
  } catch (error) {
    throw error;
  }
};

const getAIPerformanceInsights = async (tutorId: string) => {
  try {
    // Get all students for the tutor
    const batches = await Batch.find({ tutorId, isDeleted: false });
    const batchIds = batches.map(batch => batch._id);
    const students = await Student.find({ 
      batchIds: { $in: batchIds }, 
      isDeleted: false 
    });

    const insights = [];

    // Analyze performance for each student
    for (const student of students) {
      try {
        const analysis = await aiService.analyzePerformance({
          student_id: student._id.toString(),
          subject_id: student.subjects[0]?.toString() || '',
          time_period: 'monthly',
          include_predictions: true
        });

        insights.push({
          student_id: student._id,
          student_name: student.name,
          analysis
        });
      } catch (error) {
        console.warn(`Failed to analyze performance for student ${student._id}:`, error);
      }
    }

    return insights;
  } catch (error) {
    console.error('AI performance analysis failed:', error);
    return [];
  }
};
```

### 4. Attendance Prediction Integration

Add attendance prediction to teaching log:

```typescript
// src/services/teachingLog.ts

import aiService from './aiService';

export const getAttendancePredictions = async (batchId: string, date: Date) => {
  try {
    const batch = await Batch.findById(batchId).populate('studentIds');
    if (!batch) throw new Error('Batch not found');

    const predictions = [];

    for (const student of batch.studentIds) {
      try {
        const prediction = await aiService.predictAttendance({
          student_id: student._id.toString(),
          batch_id: batchId,
          days_ahead: 7
        });

        predictions.push({
          student_id: student._id,
          student_name: student.name,
          predictions: prediction.predictions,
          confidence: prediction.confidence
        });
      } catch (error) {
        console.warn(`Failed to predict attendance for student ${student._id}:`, error);
      }
    }

    return predictions;
  } catch (error) {
    throw error;
  }
};
```

## 🧪 Testing Integration

### 1. Test AI Service Connection

```typescript
// Test script
import aiService from './services/aiService';

async function testAIIntegration() {
  try {
    // Test health check
    const isHealthy = await aiService.checkHealth();
    console.log('AI Service Health:', isHealthy);

    // Test OCR
    const ocrResult = await aiService.extractTextFromImage({
      file_url: 'https://example.com/test.jpg',
      language: 'en'
    });
    console.log('OCR Result:', ocrResult);

    // Test MCQ generation
    const mcqResult = await aiService.generateMCQ({
      topic: 'Algebra',
      subject: 'Mathematics',
      grade_level: 'class_10',
      content_type: 'mcq',
      count: 3
    });
    console.log('MCQ Result:', mcqResult);

  } catch (error) {
    console.error('AI Integration Test Failed:', error);
  }
}

testAIIntegration();
```

### 2. Add AI Service Health Check

```typescript
// src/routes/index.ts

import aiService from '../services/aiService';

// Add AI service health check endpoint
router.get("/ai-health", async (req: express.Request, res: express.Response) => {
  try {
    const isHealthy = await aiService.checkHealth();
    const models = await aiService.getAvailableModels();
    
    res.json({
      success: true,
      ai_service: {
        healthy: isHealthy,
        available_models: models
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "AI service health check failed"
    });
  }
});
```

## 🔒 Error Handling

### 1. Graceful Degradation

```typescript
// Example: OCR with fallback
export const createNoteWithOCR = async (noteData: any) => {
  try {
    // Try OCR processing
    if (noteData.fileUrl && process.env.AI_SERVICE_ENABLED === 'true') {
      try {
        const ocrResult = await aiService.extractTextFromImage({
          file_url: noteData.fileUrl,
          language: 'en'
        });
        noteData.extractedText = ocrResult.text;
      } catch (ocrError) {
        console.warn('OCR failed, continuing without extracted text:', ocrError);
        // Continue without OCR - don't fail the entire operation
      }
    }

    // Create note regardless of OCR success
    const note = new Note(noteData);
    return await note.save();
  } catch (error) {
    throw error;
  }
};
```

### 2. Retry Logic

```typescript
// Add retry logic for AI service calls
const retryAICall = async (aiCall: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await aiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`AI call failed, retrying (${i + 1}/${maxRetries}):`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
};
```

## 📊 Monitoring

### 1. Add AI Service Metrics

```typescript
// Track AI service usage
const trackAIServiceUsage = (endpoint: string, success: boolean, duration: number) => {
  // Log metrics for monitoring
  console.log(`AI Service Usage: ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'} - ${duration}ms`);
  
  // In production, send to monitoring service
  // metrics.increment(`ai_service.${endpoint}.${success ? 'success' : 'failure'}`);
  // metrics.timing(`ai_service.${endpoint}.duration`, duration);
};
```

### 2. Health Monitoring

```typescript
// Periodic health check
setInterval(async () => {
  try {
    const isHealthy = await aiService.checkHealth();
    if (!isHealthy) {
      console.error('AI service is not healthy');
      // Send alert to monitoring system
    }
  } catch (error) {
    console.error('AI service health check failed:', error);
  }
}, 5 * 60 * 1000); // Check every 5 minutes
```

## 🚀 Production Deployment

### 1. Environment Configuration

```env
# Production AI Service Configuration
AI_SERVICE_URL=https://ai-service.yourdomain.com
AI_SERVICE_TIMEOUT=60
AI_SERVICE_ENABLED=true
AI_SERVICE_RETRY_ATTEMPTS=3
AI_SERVICE_RETRY_DELAY=1000
```

### 2. Load Balancing

Consider deploying multiple AI service instances behind a load balancer for high availability.

### 3. Caching

Implement caching for AI service responses to reduce API calls:

```typescript
import NodeCache from 'node-cache';

const aiCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export const getCachedMCQ = async (request: MCQRequest) => {
  const cacheKey = `mcq_${JSON.stringify(request)}`;
  
  // Check cache first
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;
  
  // Generate new MCQs
  const result = await aiService.generateMCQ(request);
  
  // Cache the result
  aiCache.set(cacheKey, result);
  
  return result;
};
```

## 📝 Best Practices

1. **Always handle AI service failures gracefully**
2. **Implement proper error logging and monitoring**
3. **Use caching for expensive AI operations**
4. **Set appropriate timeouts for AI service calls**
5. **Implement retry logic with exponential backoff**
6. **Monitor AI service usage and costs**
7. **Keep AI service credentials secure**
8. **Test AI integration thoroughly before deployment**

---

**Last Updated**: January 2024
**Version**: 1.0.0


