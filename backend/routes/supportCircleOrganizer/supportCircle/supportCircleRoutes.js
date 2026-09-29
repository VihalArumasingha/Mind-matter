import express from 'express'
import {
    createSupportCircle,
    updateSupportCircle,
    archiveSupportCircle,
    getMySupportCircles,
    getSupportCircleById,
    getPendingJoinRequests,
    getAllPendingJoinRequests,
    respondToJoinRequest,
    getCircleMembers,
    removeMember,
    getDashboardStats,
} from '../../../controllers/supportCircleOrganizer/supportCircle/supportCircleController.js'
import {updateCircleImages} from '../../../controllers/supportCircleOrganizer/supportCircle/circleImageController.js'
import authMiddleware from '../../../middleware/authMiddleware.js'
import {uploadCircleImages} from '../../../middleware/circleImageUploadMiddleware.js'

const router = express.Router()

router.post('/', authMiddleware, createSupportCircle)
router.put('/:id', authMiddleware, updateSupportCircle)
router.patch('/:id/images', authMiddleware, uploadCircleImages, updateCircleImages)
router.patch('/:id/archive', authMiddleware, archiveSupportCircle)
router.get('/dashboard-stats', authMiddleware, getDashboardStats)
router.get('/requests/all', authMiddleware, getAllPendingJoinRequests)
router.get('/mine', authMiddleware, getMySupportCircles)
router.get('/:id', authMiddleware, getSupportCircleById)
router.get('/:id/requests', authMiddleware, getPendingJoinRequests)
router.patch('/requests/:membershipId', authMiddleware, respondToJoinRequest)
router.get('/:id/members', authMiddleware, getCircleMembers)
router.patch('/members/:membershipId/remove', authMiddleware, removeMember)

export default router
