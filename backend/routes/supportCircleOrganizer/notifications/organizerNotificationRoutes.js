import express from 'express'
import authMiddleware from '../../../middleware/authMiddleware.js'
import {
    getOrganizerNotifications,
    markAllOrganizerNotificationsRead,
    markOrganizerNotificationRead,
} from '../../../controllers/supportCircleOrganizer/notifications/organizerNotificationController.js'

const router = express.Router()

router.use(authMiddleware)
router.get('/', getOrganizerNotifications)
router.patch('/read-all', markAllOrganizerNotificationsRead)
router.patch('/:notificationId/read', markOrganizerNotificationRead)

export default router