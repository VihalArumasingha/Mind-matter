import {API_BASE_URL} from '../../../config/api'

export const createGroupPost = async (token, circleId, postData) => {
    const isMultipart = postData instanceof FormData
    const response = await fetch(
        `${API_BASE_URL}/api/group-posts/circle/${circleId}`,
        {
            method: 'POST',
            headers: {
                ...(!isMultipart && {'Content-Type': 'application/json'}),
                Authorization: `Bearer ${token}`,
            },
            body: isMultipart ? postData : JSON.stringify(postData),
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
        `${API_BASE_URL}/api/group-posts/circle/${circleId}`,
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
        `${API_BASE_URL}/api/group-posts/circle/${circleId}/mine`,
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

export const getCircleMessages = async (token, circleId) => {
    const response = await fetch(
        `${API_BASE_URL}/api/group-chat/circle/${circleId}`,
        {headers: {Authorization: `Bearer ${token}`}},
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load community messages')
    }

    return data
}

export const sendCircleMessage = async (token, circleId, content) => {
    const response = await fetch(
        `${API_BASE_URL}/api/group-chat/circle/${circleId}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({content}),
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to send community message')
    }

    return data
}