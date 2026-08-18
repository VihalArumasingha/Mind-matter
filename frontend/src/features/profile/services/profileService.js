import {API_BASE_URL} from '../../../config/api'

export const getProfile = async token => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load profile')
    }

    return data
}

export const updateProfile = async (token, profileData) => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
    }

    return data
}

export const deleteAccount = async token => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account')
    }

    return data
}