import { Router } from 'express';
import * as callController from '../controllers/callController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Call management routes
router.post('/initiate', authorize(['student', 'teacher', 'admin']), callController.initiateCall);
router.post('/accept', authorize(['student', 'teacher', 'admin']), callController.acceptCall);
router.post('/reject', authorize(['student', 'teacher', 'admin']), callController.rejectCall);
router.post('/end', authorize(['student', 'teacher', 'admin']), callController.endCall);

// Call history and details
router.get('/history', authorize(['student', 'teacher', 'admin']), callController.getCallHistory);
router.get('/:callId', authorize(['student', 'teacher', 'admin']), callController.getCallById);
// Participants endpoint not implemented in controller; remove or add when ready

// Call recording
// Recording completion endpoint not implemented; using setRecordingUrl as available method
router.post('/:callId/recording/complete', authorize(['teacher', 'admin']), callController.setRecordingUrl);
// No getRecordingUrl in controller; remove for now
// router.get('/:callId/recording', authorize(['student', 'teacher', 'admin']), callController.getRecordingUrl);

// Call statistics
router.get('/stats/summary', authorize(['student', 'teacher', 'admin']), callController.getCallStats);
// No detailed call stats controller export; remove for now
// router.get('/stats/detailed', authorize(['teacher', 'admin']), callController.getDetailedCallStats);

export default router;
