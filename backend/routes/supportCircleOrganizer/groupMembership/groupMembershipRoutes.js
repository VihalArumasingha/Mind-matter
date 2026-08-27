import express from 'express'
import { requestToJoinCircle, getMyMemberships } from '../../../controllers/supportCircleOrganizer/groupMembership/groupMembershipController.js'
import authMiddleware from '../../../middleware/authMiddleware.js'

const router = express.Router()

router.post('/:circleId/join', authMiddleware, requestToJoinCircle)
router.get('/mine', authMiddleware, getMyMemberships)

export default router