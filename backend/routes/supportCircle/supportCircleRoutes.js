import express from 'express'
import {
    createSupportCircle,
    updateSupportCircle,
    archiveSupportCircle,
    getMySupportCircles,
    getSupportCircleById,
    getPendingJoinRequests,
    respondToJoinRequest
} from '../../controllers/supportCircle/supportCircleController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

// FM-46
router.post('/', authMiddleware, createSupportCircle)

// FM-47
router.put('/:id', authMiddleware, updateSupportCircle)

// FM-49
router.patch('/:id/archive', authMiddleware, archiveSupportCircle)

router.get('/mine', authMiddleware, getMySupportCircles)
router.get('/:id', authMiddleware, getSupportCircleById)

// FM-52
router.get('/:id/requests', authMiddleware, getPendingJoinRequests)
router.patch('/requests/:membershipId', authMiddleware, respondToJoinRequest)

export default router