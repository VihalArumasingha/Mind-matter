import express from 'express'
import {
    getCurrentUser,
    updateProfile,
    deleteAccount,
    getApprovedProfessionals
} from '../../controllers/user/userController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

router.get('/me', authMiddleware, getCurrentUser)

router.put('/me', authMiddleware, updateProfile)

router.delete('/me', authMiddleware, deleteAccount)

router.get('/professionals', getApprovedProfessionals)

export default router