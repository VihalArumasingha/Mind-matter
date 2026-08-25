import {API_BASE_URL} from '../../../config/api'

export const getSessionsForCircle = async (token, circleId) => {
    const response = await fetch(`${API_BASE_URL}/api/sessions/circle/${circleId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load sessions')
    }

    return data
}

export const createSession = async (token, circleId, sessionData) => {
    const response = await fetch(`${API_BASE_URL}/api/sessions/circle/${circleId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule session')
    }

    return data
}

export const updateSession = async (token, sessionId, sessionData) => {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update session')
    }

    return data
}

export const cancelSession = async (token, sessionId) => {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel session')
    }

    return data
}