import express from 'express'
import {
    getVolunteerDashboard,
    getVolunteerApplications,
    reviewApplication,
    getVolunteerReports,
    updateReportStatus
} from '../../controllers/volunteer/volunteerController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

// Volunteer dashboard
router.get('/dashboard', authMiddleware, getVolunteerDashboard)

// Professional applications management
router.get('/applications', authMiddleware, getVolunteerApplications)
router.put('/applications/:applicationId/review', authMiddleware, reviewApplication)

// Reports management
router.get('/reports', authMiddleware, getVolunteerReports)
router.put('/reports/:reportId/status', authMiddleware, updateReportStatus)

export default router