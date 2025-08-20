import { Router } from 'express';
import { subscriptionPlanController } from '../controllers/subscriptionPlanController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// Public routes (no authentication required)
router.get('/active', subscriptionPlanController.getActivePlans);
router.get('/popular', subscriptionPlanController.getPopularPlans);
router.get('/:planId', subscriptionPlanController.getPlanById);

// Admin routes (require authentication and admin role)
router.use(authenticate);
router.use(authorize(['admin']));

router.post('/', subscriptionPlanController.createPlan);
router.get('/', subscriptionPlanController.getPlans);
router.put('/:planId', subscriptionPlanController.updatePlan);
router.delete('/:planId', subscriptionPlanController.deletePlan);
router.patch('/:planId/toggle-status', subscriptionPlanController.togglePlanStatus);
router.patch('/:planId/popular', subscriptionPlanController.setPopularPlan);
router.patch('/:planId/sort-order', subscriptionPlanController.updatePlanSortOrder);

export default router;
