import { Router } from 'express';
import { couponController } from '../controllers/couponController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// Public routes (no authentication required)
router.get('/active', couponController.getActiveCoupons);
router.get('/validate/:code', authenticate, couponController.validateCoupon);

// Admin routes (require authentication and admin role)
router.use(authenticate);
router.use(authorize(['admin']));

// Coupon CRUD operations
router.post('/', couponController.createCoupon);
router.get('/', couponController.getCoupons);
router.get('/stats', couponController.getCouponStats);
router.get('/:couponId', couponController.getCouponById);
router.put('/:couponId', couponController.updateCoupon);
router.delete('/:couponId', couponController.deleteCoupon);
router.patch('/:couponId/toggle-status', couponController.toggleCouponStatus);

export default router;
