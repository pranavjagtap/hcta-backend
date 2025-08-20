import cron from 'node-cron';
import { CommunicationService } from './communication';
import { logger } from '../utils/logger';

export class CronService {
  private static isInitialized = false;

  /**
   * Initialize all cron jobs
   */
  static initialize(): void {
    if (this.isInitialized) {
      logger.warn('Cron service already initialized');
      return;
    }

    try {
      // Birthday greetings - run daily at 9:00 AM
      cron.schedule('0 9 * * *', async () => {
        logger.info('Running birthday greetings cron job');
        try {
          await CommunicationService.sendBirthdayGreetings();
          logger.info('Birthday greetings cron job completed successfully');
        } catch (error) {
          logger.error('Birthday greetings cron job failed', { error });
        }
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata' // Indian timezone
      });

      // Festival greetings - run daily at 8:00 AM
      cron.schedule('0 8 * * *', async () => {
        logger.info('Running festival greetings cron job');
        try {
          await this.sendFestivalGreetings();
          logger.info('Festival greetings cron job completed successfully');
        } catch (error) {
          logger.error('Festival greetings cron job failed', { error });
        }
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      });

      // Weekly performance reports - run every Sunday at 6:00 PM
      cron.schedule('0 18 * * 0', async () => {
        logger.info('Running weekly performance reports cron job');
        try {
          await this.generateWeeklyPerformanceReports();
          logger.info('Weekly performance reports cron job completed successfully');
        } catch (error) {
          logger.error('Weekly performance reports cron job failed', { error });
        }
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      });

      // Fee reminders - run every 1st and 15th of month at 10:00 AM
      cron.schedule('0 10 1,15 * *', async () => {
        logger.info('Running fee reminders cron job');
        try {
          await this.sendFeeReminders();
          logger.info('Fee reminders cron job completed successfully');
        } catch (error) {
          logger.error('Fee reminders cron job failed', { error });
        }
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      });

      // Clean up old communication logs - run weekly on Saturday at 2:00 AM
      cron.schedule('0 2 * * 6', async () => {
        logger.info('Running communication cleanup cron job');
        try {
          await this.cleanupOldCommunications();
          logger.info('Communication cleanup cron job completed successfully');
        } catch (error) {
          logger.error('Communication cleanup cron job failed', { error });
        }
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      });

      this.isInitialized = true;
      logger.info('Cron service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize cron service', { error });
      throw error;
    }
  }

  /**
   * Send festival greetings based on current date
   */
  private static async sendFestivalGreetings(): Promise<void> {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // Define festival dates (month, day)
      const festivals: { [key: string]: { month: number; day: number; name: string } } = {
        'republic_day': { month: 1, day: 26, name: 'Republic Day' },
        'independence_day': { month: 8, day: 15, name: 'Independence Day' },
        'gandhi_jayanti': { month: 10, day: 2, name: 'Gandhi Jayanti' },
        'teachers_day': { month: 9, day: 5, name: 'Teachers Day' },
        'childrens_day': { month: 11, day: 14, name: 'Children\'s Day' }
      };

      // Check if today is a festival
      const todayFestival = Object.values(festivals).find(
        festival => festival.month === month && festival.day === day
      );

      if (!todayFestival) {
        logger.info('No festival today');
        return;
      }

      // TODO: Implement festival greetings logic
      // This would involve:
      // 1. Getting all teachers with festival greetings enabled
      // 2. Getting all students
      // 3. Sending festival greetings to all students' guardians
      // 4. Logging the communications

      logger.info(`Today is ${todayFestival.name}, festival greetings would be sent`);
    } catch (error) {
      logger.error('Failed to send festival greetings', { error });
      throw error;
    }
  }

  /**
   * Generate weekly performance reports for all students
   */
  private static async generateWeeklyPerformanceReports(): Promise<void> {
    try {
      // TODO: Implement weekly performance reports logic
      // This would involve:
      // 1. Getting all active students
      // 2. Calculating date range for the past week
      // 3. Generating performance reports for each student
      // 4. Sending reports via WhatsApp to guardians

      logger.info('Weekly performance reports generation would be triggered');
    } catch (error) {
      logger.error('Failed to generate weekly performance reports', { error });
      throw error;
    }
  }

  /**
   * Send fee reminders to students with pending fees
   */
  private static async sendFeeReminders(): Promise<void> {
    try {
      // TODO: Implement fee reminders logic
      // This would involve:
      // 1. Getting students with pending fees
      // 2. Sending fee reminder messages to their guardians
      // 3. Logging the communications

      logger.info('Fee reminders would be sent to students with pending fees');
    } catch (error) {
      logger.error('Failed to send fee reminders', { error });
      throw error;
    }
  }

  /**
   * Clean up old communication logs (older than 1 year)
   */
  private static async cleanupOldCommunications(): Promise<void> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // TODO: Implement cleanup logic
      // This would involve:
      // 1. Finding communications older than 1 year
      // 2. Soft deleting them or archiving them
      // 3. Cleaning up associated files from S3 if needed

      logger.info('Old communication logs cleanup would be performed');
    } catch (error) {
      logger.error('Failed to cleanup old communications', { error });
      throw error;
    }
  }

  /**
   * Stop all cron jobs
   */
  static stop(): void {
    try {
      cron.getTasks().forEach((task: any) => task.stop());
      this.isInitialized = false;
      logger.info('All cron jobs stopped');
    } catch (error) {
      logger.error('Failed to stop cron jobs', { error });
    }
  }

  /**
   * Get status of cron jobs
   */
  static getStatus(): { isInitialized: boolean; activeJobs: number } {
    const tasks = cron.getTasks();
    return {
      isInitialized: this.isInitialized,
      activeJobs: tasks.size
    };
  }
}
