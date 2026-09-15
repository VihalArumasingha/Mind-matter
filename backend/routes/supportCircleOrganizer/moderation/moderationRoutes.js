import express from 'express'
import {
    getPendingPosts,
    approvePost,
    rejectPost,
    removePost,
    getCommentsForModeration,
    removeComment,
    getRemovedContent
} from '../../../controllers/supportCircleOrganizer/moderation/moderationController.js'
import authMiddleware from '../../../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

// FM-62
router.get('/posts/pending', getPendingPosts)

// FM-63
router.patch('/posts/:postId/approve', approvePost)
router.patch('/posts/:postId/reject', rejectPost)

// FM-65
router.get('/comments', getCommentsForModeration)
router.patch('/posts/:postId/comments/:commentId/remove', removeComment)

// FM-66
router.patch('/posts/:postId/remove', removePost)
router.get('/removed', getRemovedContent)

export default router
