import express from 'express'
import { getCurrentUser } from '../../controllers/user/userController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

router.get('/me', authMiddleware, getCurrentUser)

export default router