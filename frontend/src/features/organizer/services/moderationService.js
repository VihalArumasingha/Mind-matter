import { API_BASE_URL } from '../../../config/api'

const request = async (
    token,
    path,
    method = 'GET',
    body = null,
) => {
    const response = await fetch(
        `${API_BASE_URL}/api/moderation${path}`,
        {
            method,
            headers: {
                ...(body && {
                    'Content-Type': 'application/json',
                }),
                Authorization: `Bearer ${token}`,
            },
            ...(body && {
                body: JSON.stringify(body),
            }),
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(
            data.message || 'Moderation request failed',
        )
    }

    return data
}

// Get posts waiting for organizer review
export const getPendingPosts = token =>
    request(token, '/posts/pending')

// Approve a pending post
export const approvePost = (token, postId) =>
    request(
        token,
        `/posts/${postId}/approve`,
        'PATCH',
    )

// Reject a pending post
export const rejectPost = (
    token,
    postId,
    reason,
) =>
    request(
        token,
        `/posts/${postId}/reject`,
        'PATCH',
        { reason },
    )

// Get comments that need moderation
export const getCommentsForModeration = token =>
    request(token, '/comments')

// Remove a comment
export const removeComment = (
    token,
    postId,
    commentId,
    reason,
) =>
    request(
        token,
        `/posts/${postId}/comments/${commentId}/remove`,
        'PATCH',
        { reason },
    )

// Remove an already-published post
export const removePost = (
    token,
    postId,
    reason,
) =>
    request(
        token,
        `/posts/${postId}/remove`,
        'PATCH',
        { reason },
    )

// Get previously removed content
export const getRemovedContent = token =>
    request(token, '/removed')