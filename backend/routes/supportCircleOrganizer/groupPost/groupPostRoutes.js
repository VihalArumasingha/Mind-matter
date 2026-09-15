import express from 'express'
import {
    createGroupPost,
    getGroupPosts,
    getMyGroupPosts
} from '../../../controllers/supportCircleOrganizer/groupPost/groupPostController.js'
import authMiddleware from '../../../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

// Member creates a post inside a support circle.
// The post is stored as pending until organizer review.
router.post('/circle/:circleId', createGroupPost)

// Member views published posts in a circle.
router.get('/circle/:circleId', getGroupPosts)

// Member views their own posts in a circle,
// including pending/rejected/removed status.
router.get('/circle/:circleId/mine', getMyGroupPosts)

export default router
