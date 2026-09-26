import mongoose from 'mongoose'
import Notification from '../../../models/Notification.js'
import { ORGANIZER_NOTIFICATION_TYPES } from '../../../utils/organizerNotifications.js'

const organizerNotifications = userId => ({
    userId,
    type: { $in: ORGANIZER_NOTIFICATION_TYPES },
})

export const getOrganizerNotifications = async (req, res) => {
    try {
        const query = organizerNotifications(req.user._id)
        const [notifications, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(100)
                .populate('circleId', 'topic')
                .populate('sessionId', 'title scheduledAt')
                .populate('relatedUserId', 'name'),
            Notification.countDocuments({ ...query, isRead: false }),
        ])

        res.status(200).json({ notifications, unreadCount })
    } catch (error) {
        console.error('[Get Organizer Notifications Error]', error)
        res.status(500).json({ message: 'Server error while fetching notifications' })
    }
}

export const markOrganizerNotificationRead = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.notificationId)) {
            return res.status(400).json({ message: 'Invalid notification id' })
        }

        const notification = await Notification.findOne({
            _id: req.params.notificationId,
            ...organizerNotifications(req.user._id),
        })

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' })
        }

        notification.isRead = true
        await notification.save()
        res.status(200).json({ notification })
    } catch (error) {
        console.error('[Mark Organizer Notification Read Error]', error)
        res.status(500).json({ message: 'Server error while updating notification' })
    }
}

export const markAllOrganizerNotificationsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { ...organizerNotifications(req.user._id), isRead: false },
            { $set: { isRead: true } },
        )

        res.status(200).json({ modifiedCount: result.modifiedCount })
    } catch (error) {
        console.error('[Mark All Organizer Notifications Read Error]', error)
        res.status(500).json({ message: 'Server error while updating notifications' })
    }
}