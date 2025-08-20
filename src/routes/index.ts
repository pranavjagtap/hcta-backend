import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import batchRoutes from './batch';
import subjectRoutes from './subject';
import contentRoutes from './content';
import chatRoutes from './chat';
import callRoutes from './calls';
import doubtRoutes from './doubts';
import availabilityRoutes from './availability';
import notificationRoutes from './notifications';

// Module 7: Payment & Subscription Management
import subscriptionPlanRoutes from './subscriptionPlans';
import subscriptionRoutes from './subscriptions';
import paymentRoutes from './payments';
import couponRoutes from './coupons';
import analyticsRoutes from './analytics';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/batches', batchRoutes);
router.use('/subjects', subjectRoutes);
router.use('/content', contentRoutes);

// Module 6: Communication & Doubt-Solving
router.use('/chat', chatRoutes);
router.use('/calls', callRoutes);
router.use('/doubts', doubtRoutes);
router.use('/availability', availabilityRoutes);
router.use('/notifications', notificationRoutes);

// Module 7: Payment & Subscription Management
router.use('/subscription-plans', subscriptionPlanRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);
router.use('/coupons', couponRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
