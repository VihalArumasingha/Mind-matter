import express from 'express'
import {
    registerAttendance,
    updateAttendanceStatus,
    getAttendanceForSession
} from '../../../controllers/supportCircleOrganizer/attendance/attendanceController.js'
import authMiddleware from '../../../middleware/authMiddleware.js'

const router = express.Router()

router.post('/session/:sessionId', authMiddleware, registerAttendance)
router.get('/session/:sessionId', authMiddleware, getAttendanceForSession)
router.patch('/:attendanceId', authMiddleware, updateAttendanceStatus)

export default router