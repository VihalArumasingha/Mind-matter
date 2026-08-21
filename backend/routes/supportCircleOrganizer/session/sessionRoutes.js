import express from 'express'
import {
    createSession,
    getSessionsForCircle,
    updateSession,
    cancelSession
} from '../../../controllers/supportCircleOrganizer/session/sessionController.js'
import authMiddleware from '../../../middleware/authMiddleware.js'

const router = express.Router()

// FM-57
router.post('/circle/:circleId', authMiddleware, createSession)
router.get('/circle/:circleId', authMiddleware, getSessionsForCircle)

// FM-58
router.put('/:id', authMiddleware, updateSession)
router.patch('/:id/cancel', authMiddleware, cancelSession)

export default router