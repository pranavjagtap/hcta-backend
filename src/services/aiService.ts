import axios from 'axios';
import { AppError, createError } from '../utils/appError';

interface AIAnswerRequest {
  query: string;
  subject?: string;
  context?: {
    courseMaterials: string[];
    weakTopics: string[];
    recentChatContext?: string;
  };
}

interface AIAnswerResponse {
  answer: string;
  steps: string[];
  sources: Array<{
    contentId: string;
    title: string;
    section?: string;
    relevance: number;
  }>;
  followUps: string[];
  confidence: number;
}

export class AIService {
  private static readonly AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'http://localhost:8000';
  private static readonly AI_API_KEY = process.env.AI_API_KEY;

  /**
   * Generate AI answer for a doubt
   */
  static async generateAnswer(request: AIAnswerRequest): Promise<AIAnswerResponse> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/qa`,
        {
          query: request.query,
          subject: request.subject,
          context: {
            courseMaterials: request.context?.courseMaterials || [],
            weakTopics: request.context?.weakTopics || [],
            recentChatContext: request.context?.recentChatContext
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI API Error:', error);
      
      // Return a fallback response
      return {
        answer: 'I apologize, but I\'m having trouble processing your question right now. Please try again in a moment or rephrase your question.',
        steps: ['Please try rephrasing your question', 'Check your internet connection', 'Try again in a few moments'],
        sources: [],
        followUps: [
          'Can you rephrase your question?',
          'Would you like to try asking in a different way?',
          'Should I connect you with a teacher instead?'
        ],
        confidence: 0.1
      };
    }
  }

  /**
   * Generate lecture content
   */
  static async generateLecture(request: {
    topic: string;
    subject: string;
    classLevel: string;
    duration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    includeExamples?: boolean;
    includeExercises?: boolean;
  }): Promise<{
    title: string;
    content: string;
    summary: string;
    keyPoints: string[];
    examples: string[];
    exercises: string[];
    estimatedDuration: number;
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/lecture/generate`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Lecture Generation Error:', error);
      
      // Return a fallback response
      return {
        title: `Lecture on ${request.topic}`,
        content: `This is a placeholder lecture content for ${request.topic}. Please try again later or contact support.`,
        summary: `Basic overview of ${request.topic}`,
        keyPoints: [`Introduction to ${request.topic}`, 'Key concepts', 'Important definitions'],
        examples: ['Example 1', 'Example 2'],
        exercises: ['Exercise 1', 'Exercise 2'],
        estimatedDuration: request.duration
      };
    }
  }

  /**
   * Generate homework questions
   */
  static async generateHomework(request: {
    topic: string;
    subject: string;
    classLevel: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number;
    questionTypes: ('mcq' | 'short' | 'long' | 'numerical')[];
  }): Promise<{
    questions: Array<{
      id: string;
      type: 'mcq' | 'short' | 'long' | 'numerical';
      question: string;
      options?: string[];
      correctAnswer?: string;
      explanation?: string;
      marks: number;
    }>;
    totalMarks: number;
    estimatedTime: number;
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/homework/generate`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Homework Generation Error:', error);
      
      // Return a fallback response
      return {
        questions: [],
        totalMarks: 0,
        estimatedTime: 30
      };
    }
  }

  /**
   * Regenerate a specific question
   */
  static async regenerateQuestion(request: {
    questionId: string;
    newType?: 'mcq' | 'short' | 'long' | 'numerical';
    newDifficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<{
    question: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    marks: number;
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/homework/regenerate`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Question Regeneration Error:', error);
      throw createError('Failed to regenerate question', 500);
    }
  }

  /**
   * Grade an assignment
   */
  static async gradeAssignment(request: {
    assignmentId: string;
    studentAnswers: Array<{
      questionId: string;
      answer: string;
    }>;
    rubric?: any;
  }): Promise<{
    grades: Array<{
      questionId: string;
      score: number;
      maxScore: number;
      feedback: string;
      correctAnswer?: string;
    }>;
    totalScore: number;
    maxTotalScore: number;
    percentage: number;
    overallFeedback: string;
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/assignment/grade`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Assignment Grading Error:', error);
      throw createError('Failed to grade assignment', 500);
    }
  }



  /**
   * Convert speech to text
   */
  static async speechToText(audioUrl: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/qa/voice`,
        {
          audio_url: audioUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout for audio processing
        }
      );

      return response.data.transcript;
    } catch (error) {
      console.error('Speech-to-Text API Error:', error);
      throw createError('Failed to convert speech to text', 500);
    }
  }

  /**
   * Generate text-to-speech audio
   */
  static async generateTTS(text: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/tts`,
        {
          text: text,
          voice: 'en-US-Standard-A', // Default voice
          speed: 1.0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // The AI API should return an audio URL
      const audioUrl = response.data.audio_url;
      
      // If the AI API returns audio data directly, return the audio URL
      if (response.data.audio_data) {
        // For now, return the audio URL directly
        // In a real implementation, you would upload to S3 here
        return response.data.audio_url || 'audio_url_not_available';
      }

      return audioUrl;
    } catch (error) {
      console.error('Text-to-Speech API Error:', error);
      throw createError('Failed to generate speech audio', 500);
    }
  }

  /**
   * Get contextual recommendations
   */
  static async getContextualRecommendations(
    userId: string,
    currentSubject: string,
    recentDoubts: string[]
  ): Promise<{
    recommendedTopics: string[];
    suggestedContent: string[];
    learningPath: string[];
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/contextual-recommendation`,
        {
          user_id: userId,
          current_subject: currentSubject,
          recent_doubts: recentDoubts
        },
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Contextual Recommendation API Error:', error);
      
      // Return fallback recommendations
      return {
        recommendedTopics: ['Basic concepts', 'Practice problems', 'Review materials'],
        suggestedContent: [],
        learningPath: ['Start with fundamentals', 'Practice regularly', 'Seek help when needed']
      };
    }
  }

  /**
   * Analyze student performance and suggest improvements
   */
  static async analyzePerformance(
    userId: string,
    performanceData: {
      subjects: Array<{ name: string; score: number; totalQuestions: number }>;
      weakAreas: string[];
      recentActivity: any[];
    }
  ): Promise<{
    analysis: string;
    recommendations: string[];
    priorityAreas: string[];
    estimatedImprovement: number;
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/performance-analysis`,
        {
          user_id: userId,
          performance_data: performanceData
        },
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Performance Analysis API Error:', error);
      
      // Return fallback analysis
      return {
        analysis: 'Based on your recent performance, focus on practicing regularly and reviewing difficult concepts.',
        recommendations: [
          'Practice daily for at least 30 minutes',
          'Review previous mistakes',
          'Ask for help when stuck'
        ],
        priorityAreas: performanceData.weakAreas.slice(0, 3),
        estimatedImprovement: 15
      };
    }
  }

  /**
   * Generate personalized study plan
   */
  static async generateStudyPlan(
    userId: string,
    subjects: string[],
    availableTime: number, // in minutes per day
    targetDate: Date
  ): Promise<{
    plan: Array<{
      day: number;
      subject: string;
      topics: string[];
      duration: number;
      activities: string[];
    }>;
    estimatedCompletion: Date;
    confidence: number;
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/study-plan`,
        {
          user_id: userId,
          subjects: subjects,
          available_time: availableTime,
          target_date: targetDate.toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 25000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Study Plan API Error:', error);
      
      // Return fallback study plan
      const daysUntilTarget = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const subjectsPerDay = Math.ceil(subjects.length / Math.max(daysUntilTarget, 1));
      
      const plan = [];
      for (let day = 1; day <= Math.min(daysUntilTarget, 30); day++) {
        const subjectIndex = (day - 1) % subjects.length;
        plan.push({
          day: day,
          subject: subjects[subjectIndex],
          topics: ['Core concepts', 'Practice problems', 'Review'],
          duration: availableTime,
          activities: ['Read materials', 'Solve problems', 'Take notes']
        });
      }

      return {
        plan: plan,
        estimatedCompletion: new Date(Date.now() + daysUntilTarget * 24 * 60 * 60 * 1000),
        confidence: 0.6
      };
    }
  }

  /**
   * Check AI service health
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.AI_API_BASE_URL}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`
          },
          timeout: 5000
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error('AI Service Health Check Failed:', error);
      return false;
    }
  }

  /**
   * Predict student performance
   */
  static async predictPerformance(request: {
    studentId: string;
    subject: string;
    historicalData: Array<{
      testScore: number;
      date: Date;
      topic: string;
    }>;
    upcomingTopics: string[];
  }): Promise<{
    predictedScores: Array<{
      topic: string;
      predictedScore: number;
      confidence: number;
    }>;
    overallPrediction: number;
    recommendations: string[];
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/performance/predict`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Performance Prediction Error:', error);
      
      // Return fallback prediction
      return {
        predictedScores: request.upcomingTopics.map(topic => ({
          topic,
          predictedScore: 75,
          confidence: 0.6
        })),
        overallPrediction: 75,
        recommendations: ['Focus on weak areas', 'Practice regularly', 'Review previous topics']
      };
    }
  }

  /**
   * Generate learning recommendations
   */
  static async generateRecommendations(request: {
    studentId: string;
    weakTopics: string[];
    strongTopics: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic';
    availableTime: number;
  }): Promise<{
    recommendations: Array<{
      type: 'study' | 'practice' | 'review' | 'resource';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      estimatedTime: number;
      resources?: string[];
    }>;
    studyPlan: string;
  }> {
    try {
      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/recommendations/generate`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Recommendations Generation Error:', error);
      
      // Return fallback recommendations
      return {
        recommendations: [
          {
            type: 'study',
            title: 'Review Weak Topics',
            description: 'Focus on areas where you need improvement',
            priority: 'high',
            estimatedTime: 60,
            resources: ['Textbook', 'Online videos', 'Practice problems']
          }
        ],
        studyPlan: 'Focus on weak areas first, then practice regularly'
      };
    }
  }

  /**
   * Get AI service statistics
   */
  static async getServiceStats(): Promise<{
    uptime: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  }> {
    try {
      const response = await axios.get(
        `${this.AI_API_BASE_URL}/stats`,
        {
          headers: {
            'Authorization': `Bearer ${this.AI_API_KEY}`
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Service Stats Error:', error);
      
      return {
        uptime: 0,
        requestsPerMinute: 0,
        averageResponseTime: 0,
        errorRate: 1.0
      };
    }
  }

}
