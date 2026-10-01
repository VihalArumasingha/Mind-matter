import {API_BASE_URL} from '../../../config/api'

const request = async (token, path, method = 'GET') => {
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Notification request failed')
    }

    return data
}

export const countPendingOrganizerNotifications = notifications => {
    if (!Array.isArray(notifications)) {
        return 0
    }

    return notifications.filter(item => {
        if (typeof item?.isRead === 'boolean') {
            return !item.isRead
        }

        return true
    }).length
}

export const getOrganizerNotifications = token =>
    request(token, '/api/support-circles/organizer/notifications')

export const markOrganizerNotificationRead = (token, notificationId) =>
    request(token, `/api/organizer/notifications/${notificationId}/read`, 'PATCH')

export const markAllOrganizerNotificationsRead = token =>
    request(token, '/api/organizer/notifications/read-all', 'PATCH')