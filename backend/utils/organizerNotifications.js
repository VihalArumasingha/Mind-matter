import Notification from '../models/Notification.js'

export const ORGANIZER_NOTIFICATION_TYPES = [
    'MEMBER_REQUEST',
    'POST_MODERATION',
    'SESSION_REGISTRATION',
]

export const createOrganizerNotification = async notification => {
    try {
        return await Notification.create({
            userId: notification.recipient,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            circleId: notification.circleId,
            sessionId: notification.sessionId,
            postId: notification.postId,
            membershipId: notification.membershipId,
            relatedUserId: notification.actorId,
            isRead: false,
        })
    } catch (error) {
        console.error('[Create Organizer Notification Error]', error)
        return null
    }
}