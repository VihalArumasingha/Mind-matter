import { buildOrganizerNotifications } from '../../../controllers/supportCircleOrganizer/supportCircle/supportCircleController.js'

export const getOrganizerNotifications = async (req, res) => {
    try {
        const data = await buildOrganizerNotifications(req.user._id)

        res.status(200).json({
            notifications: data.notifications,
            total: data.notifications.length,
            unreadCount: data.notifications.length,
        })
    } catch (error) {
        console.error('[Get Organizer Notifications Error]', error)
        res.status(500).json({ message: 'Server error while fetching organizer attention items' })
    }
}

export const markOrganizerNotificationRead = async (req, res) => {
    res.status(200).json({
        notification: {
            _id: req.params.notificationId,
            isRead: true,
        },
        modifiedCount: 0,
    })
}

export const markAllOrganizerNotificationsRead = async (req, res) => {
    res.status(200).json({ modifiedCount: 0 })
}