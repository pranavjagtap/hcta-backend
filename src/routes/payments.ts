import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { idempotencyMiddleware } from '../middlewares/idempotency';

const router = Router();

// Webhook routes (no authentication required)
router.post('/webhook/:paymentMethod', paymentController.handlePaymentWebhook);

// User routes (require authentication)
router.use(authenticate);

// Payment processing
router.post('/intent', idempotencyMiddleware(), paymentController.createPaymentIntent);
router.post('/process', idempotencyMiddleware(), paymentController.processPayment);

// User payment management
router.get('/my', paymentController.getUserPayments);
router.get('/:paymentId', paymentController.getPaymentById);
router.get('/:paymentId/receipt', paymentController.getPaymentReceipt);

// Admin routes (require admin role)
router.use(authorize(['admin']));

router.get('/', paymentController.getPayments);
router.get('/stats', paymentController.getPaymentStats);
router.get('/transaction/:transactionId', paymentController.getPaymentByTransactionId);
router.get('/failed', paymentController.getFailedPayments);
router.post('/:paymentId/refund', paymentController.refundPayment);
router.post('/:paymentId/retry', paymentController.retryFailedPayment);

export default router;
