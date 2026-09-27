import express from 'express'
import {
    submitOnboarding,
    getOnboarding
} from '../../controllers/user/onboardingController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', authMiddleware, submitOnboarding)

router.get('/', authMiddleware, getOnboarding)

export default router