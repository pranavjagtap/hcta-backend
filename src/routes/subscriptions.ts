import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// User routes (require authentication)
router.use(authenticate);

// User subscription management
router.post('/', subscriptionController.createSubscription);
router.get('/my/active', subscriptionController.getUserActiveSubscription);
router.get('/my/history', subscriptionController.getUserSubscriptionHistory);
router.get('/my/access', subscriptionController.getUserSubscriptionAccess);
router.get('/feature/:feature/access', subscriptionController.checkFeatureAccess);

// Subscription actions
router.post('/:subscriptionId/cancel', subscriptionController.cancelSubscription);
router.post('/:subscriptionId/reactivate', subscriptionController.reactivateSubscription);
router.post('/:subscriptionId/change', subscriptionController.changeSubscription);

// Admin routes (require admin role)
router.use(authorize(['admin']));

router.get('/', subscriptionController.getSubscriptions);
router.get('/stats', subscriptionController.getSubscriptionStats);
router.get('/:subscriptionId', subscriptionController.getSubscriptionById);
router.put('/:subscriptionId', subscriptionController.updateSubscription);

export default router;
