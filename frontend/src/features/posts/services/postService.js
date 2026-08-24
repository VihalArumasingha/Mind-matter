import {API_BASE_URL} from '../../../config/api'

const request = async (token, path, method = 'GET', body) => {
    const response = await fetch(`${API_BASE_URL}/api/posts${path}`, {
        method,
        headers: {
            ...(body ? {'Content-Type': 'application/json'} : {}),
            Authorization: `Bearer ${token}`,
        },
        ...(body ? {body: JSON.stringify(body)} : {}),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Post request failed')
    }

    return data
}

export const getFeedPosts = token => request(token, '/')

export const createPost = (token, content) =>
    request(token, '/', 'POST', {content})

export const updatePost = (token, postId, content) =>
    request(token, `/${postId}`, 'PUT', {content})

export const deletePost = (token, postId) =>
    request(token, `/${postId}`, 'DELETE')

export const addComment = (token, postId, content) =>
    request(token, `/${postId}/comments`, 'POST', {content})

export const updateComment = (token, postId, commentId, content) =>
    request(token, `/${postId}/comments/${commentId}`, 'PUT', {content})

export const deleteComment = (token, postId, commentId) =>
    request(token, `/${postId}/comments/${commentId}`, 'DELETE')