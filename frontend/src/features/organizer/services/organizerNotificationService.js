import {API_BASE_URL} from '../../../config/api'

const request = async (token, path, method = 'GET') => {
    const response = await fetch(`${API_BASE_URL}/api/organizer/notifications${path}`, {
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

export const getOrganizerNotifications = token => request(token, '')

export const markOrganizerNotificationRead = (token, notificationId) =>
    request(token, `/${notificationId}/read`, 'PATCH')

export const markAllOrganizerNotificationsRead = token =>
    request(token, '/read-all', 'PATCH')