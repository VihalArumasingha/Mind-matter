import express from 'express'
import {
    addComment,
    createPost,
    deleteComment,
    deletePost,
    getFeedPosts,
    getMyPosts,
    getPost,
    updateComment,
    updatePost
} from '../controllers/postController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import {uploadPostImage} from '../middleware/postUploadMiddleware.js'

const router = express.Router()

router.use(authMiddleware)
router.get('/', getFeedPosts)
router.get('/mine', getMyPosts)
router.get('/:id', getPost)
router.post('/', uploadPostImage, createPost)
router.put('/:id', uploadPostImage, updatePost)
router.delete('/:id', deletePost)
router.post('/:id/comments', addComment)
router.put('/:id/comments/:commentId', updateComment)
router.delete('/:id/comments/:commentId', deleteComment)

export default router