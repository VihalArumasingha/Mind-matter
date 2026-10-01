import express from 'express'

import {
    createSupportCircle,
    updateSupportCircle,
    archiveSupportCircle,
    getMySupportCircles,
    getAvailableSupportCircles,
    getSupportCircleById,
    getPendingJoinRequests,
    getAllPendingJoinRequests,
    respondToJoinRequest,
    getCircleMembers,
    removeMember,
    getDashboardStats,
    getOrganizerNotifications,
} from '../../../controllers/supportCircleOrganizer/supportCircle/supportCircleController.js'

import { updateCircleImages } from '../../../controllers/supportCircleOrganizer/supportCircle/circleImageController.js'
import authMiddleware from '../../../middleware/authMiddleware.js'
import { uploadCircleImages } from '../../../middleware/circleImageUploadMiddleware.js'

const router = express.Router()

// Create a support circle
router.post('/', authMiddleware, createSupportCircle)

// Update a support circle
router.put('/:id', authMiddleware, updateSupportCircle)

// Update circle images
router.patch(
    '/:id/images',
    authMiddleware,
    uploadCircleImages,
    updateCircleImages
)

// Archive a support circle
router.patch('/:id/archive', authMiddleware, archiveSupportCircle)

// Dashboard statistics
router.get('/dashboard-stats', authMiddleware, getDashboardStats)

// Derived attention items for the organizer dashboard and notification screen
router.get('/organizer/notifications', authMiddleware, getOrganizerNotifications)

// Get all pending join requests
router.get('/requests/all', authMiddleware, getAllPendingJoinRequests)

// Get circles belonging to the logged-in organizer
router.get('/mine', authMiddleware, getMySupportCircles)

// ⭐ Get available support circles for users
router.get('/', authMiddleware, getAvailableSupportCircles)

// Get a specific support circle
router.get('/:id', authMiddleware, getSupportCircleById)

// Get pending requests for a specific circle
router.get('/:id/requests', authMiddleware, getPendingJoinRequests)

// Respond to a join request
router.patch(
    '/requests/:membershipId',
    authMiddleware,
    respondToJoinRequest
)

// Get circle members
router.get('/:id/members', authMiddleware, getCircleMembers)

// Remove a member
router.patch(
    '/members/:membershipId/remove',
    authMiddleware,
    removeMember
)

export default router