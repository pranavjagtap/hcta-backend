import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Dashboard and comprehensive metrics
router.get('/dashboard', analyticsController.getDashboardMetrics);
router.get('/export', analyticsController.exportAnalyticsData);

// Individual metric endpoints
router.get('/revenue', analyticsController.getRevenueMetrics);
router.get('/subscriptions', analyticsController.getSubscriptionMetrics);
router.get('/payments', analyticsController.getPaymentMetrics);
router.get('/plans', analyticsController.getPlanMetrics);
router.get('/coupons', analyticsController.getCouponMetrics);

// Specialized analysis endpoints
router.get('/churn', analyticsController.getChurnAnalysis);
router.get('/payment-success', analyticsController.getPaymentSuccessAnalysis);

export default router;
