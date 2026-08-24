import express from 'express';
import {
  createProfessionalPost,
  getPosts,
  likePost
} from '../../controllers/posts/postController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Create professional post
router.post('/professional', authMiddleware, createProfessionalPost);

// Get all posts
router.get('/', getPosts);

// Like post
router.post('/:postId/like', authMiddleware, likePost);

export default router;