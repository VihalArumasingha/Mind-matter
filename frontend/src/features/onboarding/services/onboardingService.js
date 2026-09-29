import {API_BASE_URL} from '../../../config/api'

export const getOnboardingStatus = async token => {
    const response = await fetch(
        `${API_BASE_URL}/api/users/onboarding/status`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(
            data.message || 'Failed to check onboarding status'
        )
    }

    return data
}

export const submitOnboarding = async (token, answers) => {
    const response = await fetch(
        `${API_BASE_URL}/api/users/onboarding`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(answers),
        }
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(
            data.message || 'Failed to save onboarding responses'
        )
    }

    return data
}

export const getOnboarding = async token => {
    const response = await fetch(
        `${API_BASE_URL}/api/users/onboarding`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(
            data.message || 'Failed to load onboarding'
        )
    }

    return data
}