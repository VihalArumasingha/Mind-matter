import {API_BASE_URL} from '../../../config/api'

export const getApprovedProfessionals = async (token, search = '', specialization = '') => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (specialization) params.append('specialization', specialization)

    const response = await fetch(`${API_BASE_URL}/api/users/professionals?${params.toString()}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load professionals')
    }

    return data
}