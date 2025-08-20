import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Conversation routes
router.post('/conversations', authorize(['student', 'teacher', 'admin']), chatController.createDirectConversation);
router.post('/conversations/group', authorize(['teacher', 'admin']), chatController.createGroupConversation);
router.get('/conversations', authorize(['student', 'teacher', 'admin']), chatController.getUserConversations);
router.get('/conversations/:conversationId', authorize(['student', 'teacher', 'admin']), chatController.getConversationById);
// Delete conversation endpoint not implemented in controller currently

// Message routes
router.get('/conversations/:conversationId/messages', authorize(['student', 'teacher', 'admin']), chatController.getConversationMessages);
router.post('/conversations/:conversationId/messages', authorize(['student', 'teacher', 'admin']), chatController.sendMessage);
router.patch('/messages/:messageId', authorize(['student', 'teacher', 'admin']), chatController.updateMessage);
router.delete('/messages/:messageId', authorize(['student', 'teacher', 'admin']), chatController.deleteMessage);

// Read receipts
router.post('/reads', authorize(['student', 'teacher', 'admin']), chatController.markMessagesAsRead);

// Search routes
router.get('/search', authorize(['student', 'teacher', 'admin']), chatController.searchMessages);
// Use getUserConversations with filters for conversation search for now
router.get('/search/conversations', authorize(['student', 'teacher', 'admin']), chatController.getUserConversations);

export default router;
