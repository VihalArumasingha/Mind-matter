import express from 'express'
import {
    getCurrentUser,
    updateProfile,
    deleteAccount,
    getApprovedProfessionals,
    getProfessionCategories
} from '../../controllers/user/userController.js'
import authMiddleware from '../../middleware/authMiddleware.js'
import {uploadSingleProfilePicture} from '../../middleware/uploadMiddleware.js'

const router = express.Router()

router.get('/me', authMiddleware, getCurrentUser)

router.put('/me', authMiddleware, uploadSingleProfilePicture, updateProfile)

router.delete('/me', authMiddleware, deleteAccount)

router.get('/professionals', getApprovedProfessionals)

router.get('/profession-categories', getProfessionCategories)

export default router