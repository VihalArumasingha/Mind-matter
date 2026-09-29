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

export const getAvailableSupportCircles = async token => {
    const url = `${API_BASE_URL}/api/support-circles`

    console.log('========================================')
    console.log('API_BASE_URL:', API_BASE_URL)
    console.log('COMMUNITIES REQUEST URL:', url)
    console.log('========================================')

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    console.log('COMMUNITIES STATUS:', response.status)
    console.log(
        'COMMUNITIES CONTENT TYPE:',
        response.headers.get('content-type'),
    )

    const rawText = await response.text()

    console.log('COMMUNITIES RAW RESPONSE:')
    console.log(rawText.substring(0, 500))

    let data

    try {
        data = JSON.parse(rawText)
    } catch (error) {
        throw new Error(
            `Server returned non-JSON response. Status: ${
                response.status
            }. Response starts with: ${rawText.substring(0, 100)}`,
        )
    }

    if (!response.ok) {
        throw new Error(
            data.message || 'Failed to load available support circles',
        )
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

export const getAllPendingRequests = async token => {
    const response = await fetch(`${API_BASE_URL}/api/support-circles/requests/all`, {
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

export const requestToJoinCircle = async (token, circleId) => {
    const response = await fetch(
        `${API_BASE_URL}/api/group-memberships/${circleId}/join`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(
            data.message || 'Failed to request to join the community',
        )
    }

    return data
}

export const getMyMemberships = async token => {
    const response = await fetch(
        `${API_BASE_URL}/api/group-memberships/mine`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(
            data.message || 'Failed to load your community memberships',
        )
    }

    return data
}

export const updateCircleImages = async (token, circleId, images) => {
    const formData = new FormData()

    if (images.coverImage?.uri) {
        formData.append('coverImage', {
            uri: images.coverImage.uri,
            type: images.coverImage.type || 'image/jpeg',
            name:
                images.coverImage.fileName ||
                `cover-${Date.now()}.jpg`,
        })
    }

    if (images.profileImage?.uri) {
        formData.append('profileImage', {
            uri: images.profileImage.uri,
            type: images.profileImage.type || 'image/jpeg',
            name:
                images.profileImage.fileName ||
                `profile-${Date.now()}.jpg`,
        })
    }

    const response = await fetch(
        `${API_BASE_URL}/api/support-circles/${circleId}/images`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(
            data.message || 'Failed to update circle images',
        )
    }

    return data
}