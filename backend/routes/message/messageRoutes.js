import express from 'express';
import {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  updateMessage,
  deleteMessage,
} from '../../controllers/message/messageController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Send a message
router.post('/', authMiddleware, sendMessage);

// Get all conversations for current user
router.get('/conversations', authMiddleware, getConversations);

// Get conversation with specific user
router.get('/conversation/:userId', authMiddleware, getConversation);

// Mark messages from specific user as read
router.put('/read/:userId', authMiddleware, markAsRead);

// Update/edit a message
router.put('/:id', authMiddleware, updateMessage);

// Delete a message
router.delete('/:id', authMiddleware, deleteMessage);

export default router;
