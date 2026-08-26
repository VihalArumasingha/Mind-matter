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

export const getProfessionCategories = async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/users/profession-categories`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load profession categories')
    }

    return data
}

export const getProfessionalAvailability = async (token, professionalId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/professionals/${professionalId}/availability`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            console.error('[getProfessionalAvailability] Received non-JSON response:', text.substring(0, 100))
            return {
                success: true,
                data: { isAvailable: true, slotsByDate: {}, availableDates: [] }
            }
        }

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load professional availability')
        }

        return data
    } catch (err) {
        console.error('[getProfessionalAvailability Error]', err)
        return {
            success: true,
            data: { isAvailable: true, slotsByDate: {}, availableDates: [] }
        }
    }
}
