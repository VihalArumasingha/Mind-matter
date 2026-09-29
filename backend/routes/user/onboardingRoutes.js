import express from 'express'
import {
    getOnboardingStatus,
    submitOnboarding,
    getOnboarding
} from '../../controllers/user/onboardingController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

router.get('/status', authMiddleware, getOnboardingStatus)

router.post('/', authMiddleware, submitOnboarding)

router.get('/', authMiddleware, getOnboarding)

export default router