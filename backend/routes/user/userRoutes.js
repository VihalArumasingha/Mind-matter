import express from 'express'
import {
    getCurrentUser,
    updateProfile,
    deleteAccount,
    getApprovedProfessionals,
    getProfessionCategories,
    getProfessionalAvailability,
    createBooking,
    getUserBookings
} from '../../controllers/user/userController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

router.get('/me', authMiddleware, getCurrentUser)

router.put('/me', authMiddleware, updateProfile)

router.delete('/me', authMiddleware, deleteAccount)

router.get('/professionals', getApprovedProfessionals)

router.get('/profession-categories', getProfessionCategories)

router.get('/professionals/:id/availability', getProfessionalAvailability)

router.post('/bookings', authMiddleware, createBooking)

router.get('/bookings', authMiddleware, getUserBookings)

export default router