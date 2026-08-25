import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import upload from '../middleware/uploadMiddleware.js'
import {
    addComment,
    createPost,
    deleteComment,
    deletePost,
    getFeedPosts,
    getMyPosts,
    updateComment,
    updatePost,
} from '../controllers/postController.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getFeedPosts)
router.get('/mine', getMyPosts)
router.post('/', upload.single('image'), createPost)
router.put('/:id', upload.single('image'), updatePost)
router.delete('/:id', deletePost)
router.post('/:id/comments', addComment)
router.put('/:id/comments/:commentId', updateComment)
router.delete('/:id/comments/:commentId', deleteComment)

export default router