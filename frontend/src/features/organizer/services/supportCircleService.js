import {API_BASE_URL} from '../../../config/api'

export const getMyCircles = async token => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/mine`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load your circles')
    }

    return data
}

export const getCircleById = async (token, circleId) => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/${circleId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load circle')
    }

    return data
}

export const createCircle = async (token, circleData) => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(circleData),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create circle')
    }

    return data
}

export const updateCircle = async (token, circleId, circleData) => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/${circleId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(circleData),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update circle')
    }

    return data
}

export const archiveCircle = async (token, circleId) => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/${circleId}/archive`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to archive circle')
    }

    return data
}

export const getPendingRequests = async (token, circleId) => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/${circleId}/requests`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load join requests')
    }

    return data
}

export const respondToRequest = async (token, membershipId, decision) => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/requests/${membershipId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({decision}),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to respond to request')
    }

    return data
}

export const getCircleMembers = async (token, circleId) => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/${circleId}/members`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load members')
    }

    return data
}

export const removeMember = async (token, membershipId) => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/members/${membershipId}/remove`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to remove member')
    }

    return data
}

export const getDashboardStats = async token => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/dashboard-stats`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load dashboard stats')
    }

    return data
}