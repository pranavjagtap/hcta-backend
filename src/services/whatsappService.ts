import axios from 'axios';
import { WhatsAppMessage, WhatsAppResponse } from '../types/communication';
import { logger } from '../utils/logger';

export class WhatsAppService {
  private static readonly WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
  private static readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private static readonly ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  /**
   * Send a text message via WhatsApp
   */
  static async sendTextMessage(phoneNumber: string, message: string): Promise<WhatsAppResponse> {
    try {
      if (!this.PHONE_NUMBER_ID || !this.ACCESS_TOKEN) {
        throw new Error('WhatsApp configuration missing');
      }

      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`,
        whatsappMessage,
        {
          headers: {
            'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.info('WhatsApp message sent successfully', {
        phoneNumber,
        messageId: response.data.messages?.[0]?.id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send a document (PDF) via WhatsApp
   */
  static async sendDocument(phoneNumber: string, documentUrl: string, caption?: string, filename?: string): Promise<WhatsAppResponse> {
    try {
      if (!this.PHONE_NUMBER_ID || !this.ACCESS_TOKEN) {
        throw new Error('WhatsApp configuration missing');
      }

      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'document',
        document: {
          link: documentUrl,
          caption: caption,
          filename: filename || 'report.pdf'
        }
      };

      const response = await axios.post(
        `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`,
        whatsappMessage,
        {
          headers: {
            'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      logger.info('WhatsApp document sent successfully', {
        phoneNumber,
        documentUrl,
        messageId: response.data.messages?.[0]?.id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send WhatsApp document', {
        phoneNumber,
        documentUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send a template message via WhatsApp
   */
  static async sendTemplateMessage(phoneNumber: string, templateName: string, languageCode: string = 'en', components?: any[]): Promise<WhatsAppResponse> {
    try {
      if (!this.PHONE_NUMBER_ID || !this.ACCESS_TOKEN) {
        throw new Error('WhatsApp configuration missing');
      }

      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        }
      };

      const response = await axios.post(
        `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`,
        whatsappMessage,
        {
          headers: {
            'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.info('WhatsApp template message sent successfully', {
        phoneNumber,
        templateName,
        messageId: response.data.messages?.[0]?.id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send WhatsApp template message', {
        phoneNumber,
        templateName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove any non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it starts with + and has 10-15 digits, or just has 10-15 digits
    const phoneRegex = /^(\+?[1-9]\d{1,14})$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Format phone number for WhatsApp API
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Check if WhatsApp service is configured
   */
  static isConfigured(): boolean {
    return !!(this.PHONE_NUMBER_ID && this.ACCESS_TOKEN);
  }

  /**
   * Get webhook verification token
   */
  static getWebhookVerificationToken(): string {
    return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(signature: string, body: string): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      logger.warn('WhatsApp app secret not configured for webhook verification');
      return true; // Allow if not configured
    }

    // This is a simplified verification - in production, you should implement proper HMAC verification
    // For now, we'll just check if the signature is present
    return !!signature;
  }
}
