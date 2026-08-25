import {API_BASE_URL} from '../../../config/api'

const request = async (token, path, method = 'GET', body, isMultipart = false) => {
    const response = await fetch(`${API_BASE_URL}/api/user-posts${path}`, {
        method,
        headers: {
            ...(!isMultipart && body ? {'Content-Type': 'application/json'} : {}),
            Authorization: `Bearer ${token}`,
        },
        ...(body ? {body: isMultipart ? body : JSON.stringify(body)} : {}),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Post request failed')
    }

    return data
}

export const getFeedPosts = token => request(token, '/')

export const getMyPosts = token => request(token, '/mine')

export const createPost = (token, postData) =>
    request(token, '/', 'POST', postData, true)

export const updatePost = (token, postId, postData) =>
    request(token, `/${postId}`, 'PUT', postData, true)

export const deletePost = (token, postId) =>
    request(token, `/${postId}`, 'DELETE')

export const addComment = (token, postId, content) =>
    request(token, `/${postId}/comments`, 'POST', {content})

export const updateComment = (token, postId, commentId, content) =>
    request(token, `/${postId}/comments/${commentId}`, 'PUT', {content})

export const deleteComment = (token, postId, commentId) =>
    request(token, `/${postId}/comments/${commentId}`, 'DELETE')