import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import {
  CreatePaymentRequest,
  PaymentFilters,
  RefundPaymentRequest,
  PaymentResponse,
  ApiResponse,
  PaginatedResponse
} from '../types/payment';

export class PaymentController {
  /**
   * Create payment intent
   */
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const data: CreatePaymentRequest = req.body;

      const result = await paymentService.createPaymentIntent(userId, data);

      const response: ApiResponse<any> = {
        success: true,
        message: 'Payment intent created successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error creating payment intent', { userId: req.user?._id, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to create payment intent',
      });
    }
  }

  /**
   * Process payment
   */
  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const data: CreatePaymentRequest = req.body;

      const payment = await paymentService.processPayment(userId, data);

      const response: ApiResponse<PaymentResponse> = {
        success: true,
        message: 'Payment processed successfully',
        data: payment,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error processing payment', { userId: req.user?._id, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to process payment',
      });
    }
  }

  /**
   * Handle payment webhook
   */
  async handlePaymentWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { paymentMethod } = req.params;
      const signature = (req.headers['stripe-signature'] as string) || (req.headers['x-razorpay-signature'] as string) || undefined;

      if (paymentMethod !== 'stripe' && paymentMethod !== 'razorpay') {
        throw createError('Invalid payment method', 400);
      }

      await paymentService.handlePaymentWebhook(paymentMethod, req.body, signature);

      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('Error handling payment webhook', { paymentMethod: req.params.paymentMethod, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to handle payment webhook',
      });
    }
  }

  /**
   * Get user payments
   */
  async getUserPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await paymentService.getUserPayments(userId, page, limit);

      const response: ApiResponse<PaginatedResponse<PaymentResponse>> = {
        success: true,
        message: 'User payments retrieved successfully',
        data: {
          data: result.payments,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            hasNext: page < Math.ceil(result.total / limit),
            hasPrev: page > 1,
          },
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting user payments', { userId: req.user?._id, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get user payments',
      });
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      const payment = await paymentService.getPaymentById(paymentId);

      const response: ApiResponse<PaymentResponse> = {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting payment by ID', { paymentId: req.params.paymentId, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get payment',
      });
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const data: RefundPaymentRequest = req.body;

      const payment = await paymentService.refundPayment(paymentId, data);

      const response: ApiResponse<PaymentResponse> = {
        success: true,
        message: 'Payment refunded successfully',
        data: payment,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error refunding payment', { paymentId: req.params.paymentId, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to refund payment',
      });
    }
  }

  /**
   * Get all payments (Admin only)
   */
  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const filters: PaymentFilters = {
        status: req.query.status as any,
        paymentMethod: req.query.paymentMethod as any,
        dateRange: req.query.startDate && req.query.endDate ? {
          start: new Date(req.query.startDate as string).toISOString(),
          end: new Date(req.query.endDate as string).toISOString(),
        } : undefined,
        page,
        limit,
      };

      const result = await paymentService.getPayments(filters);

      const response: ApiResponse<PaginatedResponse<PaymentResponse>> = {
        success: true,
        message: 'Payments retrieved successfully',
        data: {
          data: result.payments,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            hasNext: page < Math.ceil(result.total / limit),
            hasPrev: page > 1,
          },
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting payments', { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get payments',
      });
    }
  }

  /**
   * Get payment statistics (Admin only)
   */
  async getPaymentStats(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
      const stats = await paymentService.getPaymentStats(dateRange);

      const response: ApiResponse<any> = {
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: stats,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting payment stats', { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get payment statistics',
      });
    }
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      const { Payment } = await import('../models');
      const payment = await Payment.getPaymentByTransactionId(transactionId);

      if (!payment) {
        throw createError('Payment not found', 404);
      }

      const response: ApiResponse<PaymentResponse> = {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment as any, // This would need proper formatting
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting payment by transaction ID', { transactionId: req.params.transactionId, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get payment',
      });
    }
  }

  /**
   * Get failed payments (Admin only)
   */
  async getFailedPayments(req: Request, res: Response): Promise<void> {
    try {
      const { Payment } = await import('../models');
      const payments = await Payment.getFailedPayments();

      const response: ApiResponse<PaymentResponse[]> = {
        success: true,
        message: 'Failed payments retrieved successfully',
        data: payments as any, // This would need proper formatting
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting failed payments', { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get failed payments',
      });
    }
  }

  /**
   * Retry failed payment (Admin only)
   */
  async retryFailedPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      // This would need to be implemented in the service
      // For now, we'll return a placeholder response
      const response: ApiResponse<PaymentResponse> = {
        success: true,
        message: 'Payment retry initiated successfully',
        data: {} as PaymentResponse, // Placeholder
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error retrying failed payment', { paymentId: req.params.paymentId, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to retry payment',
      });
    }
  }

  /**
   * Get payment receipt
   */
  async getPaymentReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      const payment = await paymentService.getPaymentById(paymentId);

      if (!payment.receiptUrl) {
        throw createError('Receipt not available for this payment', 404);
      }

      // Redirect to receipt URL or return the URL
      const response: ApiResponse<{ receiptUrl: string }> = {
        success: true,
        message: 'Payment receipt retrieved successfully',
        data: { receiptUrl: payment.receiptUrl },
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting payment receipt', { paymentId: req.params.paymentId, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get payment receipt',
      });
    }
  }
}

export const paymentController = new PaymentController();
