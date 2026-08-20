import express from 'express'
import {
    createSupportCircle,
    updateSupportCircle,
    archiveSupportCircle,
    getMySupportCircles,
    getSupportCircleById,
    getPendingJoinRequests,
    respondToJoinRequest,
    getCircleMembers,
    removeMember,
    getDashboardStats
} from '../../../controllers/supportCircleOrganizer/supportCircle/supportCircleController.js'
import authMiddleware from '../../../middleware/authMiddleware.js'

const router = express.Router()

// FM-46
router.post('/', authMiddleware, createSupportCircle)

// FM-47
router.put('/:id', authMiddleware, updateSupportCircle)

// FM-49
router.patch('/:id/archive', authMiddleware, archiveSupportCircle)

// FM-70 / FM-71 — must come before /:id so Express doesn't treat
// "dashboard-stats" as a circle id
router.get('/dashboard-stats', authMiddleware, getDashboardStats)

router.get('/mine', authMiddleware, getMySupportCircles)
router.get('/:id', authMiddleware, getSupportCircleById)

// FM-50 / FM-51 / FM-52
router.get('/:id/requests', authMiddleware, getPendingJoinRequests)
router.patch('/requests/:membershipId', authMiddleware, respondToJoinRequest)

// FM-53
router.get('/:id/members', authMiddleware, getCircleMembers)

// FM-54
router.patch('/members/:membershipId/remove', authMiddleware, removeMember)

export default router