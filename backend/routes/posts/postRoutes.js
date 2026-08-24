import express from 'express';
import {
  createProfessionalPost,
  getPosts,
  likePost,
  getMyPosts,
  updatePost,
  deletePost,
  addComment,
  getNotifications,
  markNotificationAsRead
} from '../../controllers/posts/postController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Create professional post
router.post('/professional', authMiddleware, createProfessionalPost);

// Get all posts
router.get('/', getPosts);

// Get my posts
router.get('/my-posts', authMiddleware, getMyPosts);

// Update post
router.put('/:postId', authMiddleware, updatePost);

// Delete post
router.delete('/:postId', authMiddleware, deletePost);

// Like post
router.post('/:postId/like', authMiddleware, likePost);

// Add comment
router.post('/:postId/comment', authMiddleware, addComment);

// Get notifications
router.get('/notifications', authMiddleware, getNotifications);

// Mark notification as read
router.put('/notifications/:notificationId/read', authMiddleware, markNotificationAsRead);

export default router;