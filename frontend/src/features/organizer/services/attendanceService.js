import {API_BASE_URL} from '../../../config/api'

export const getAttendanceForSession = async (token, sessionId) => {
    const response = await fetch(`${API_BASE_URL}/api/attendance/session/${sessionId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load attendance')
    }

    return data
}

export const registerAttendance = async (token, sessionId, userId) => {
    const response = await fetch(`${API_BASE_URL}/api/attendance/session/${sessionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({userId}),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to register attendance')
    }

    return data
}

export const updateAttendanceStatus = async (token, attendanceId, status) => {
    const response = await fetch(`${API_BASE_URL}/api/attendance/${attendanceId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({status}),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update attendance')
    }

    return data
}