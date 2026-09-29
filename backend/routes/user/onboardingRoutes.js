import express from 'express'
import {
    getOnboardingStatus,
    submitOnboarding,
    getOnboarding,
    getRecommendedCommunities
} from '../../controllers/user/onboardingController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

router.get('/status', authMiddleware, getOnboardingStatus)
router.get('/recommendations', authMiddleware, getRecommendedCommunities)

router.post('/', authMiddleware, submitOnboarding)

router.get('/', authMiddleware, getOnboarding)

export default router