import {API_BASE_URL} from '../../../config/api'

export const createGroupPost = async (token, circleId, postData) => {
    const response = await fetch(
        `${API_BASE_URL}/api/group-posts/${circleId}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: postData,
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create group post')
    }

    return data
}

export const getGroupPosts = async (token, circleId) => {
    const response = await fetch(
        `${API_BASE_URL}/api/group-posts/${circleId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load group posts')
    }

    return data
}

export const getMyGroupPosts = async (token, circleId) => {
    const response = await fetch(
        `${API_BASE_URL}/api/group-posts/${circleId}/mine`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load your group posts')
    }

    return data
}