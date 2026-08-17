import { API_BASE_URL } from '../../../config/api'

export const getVolunteerDashboard = async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/dashboard`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to get volunteer dashboard')
    }

    return data
}

export const getVolunteerApplications = async (token, status = '') => {
    const url = status 
        ? `${API_BASE_URL}/api/volunteer/applications?status=${status}`
        : `${API_BASE_URL}/api/volunteer/applications`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to get volunteer applications')
    }

    return data
}

export const reviewApplication = async (token, applicationId, { status, rejectionReason = '' }) => {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/applications/${applicationId}/review`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            status,
            rejectionReason
        }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to review application')
    }

    return data
}

export const getVolunteerReports = async (token, status = '') => {
    const url = status 
        ? `${API_BASE_URL}/api/volunteer/reports?status=${status}`
        : `${API_BASE_URL}/api/volunteer/reports`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to get volunteer reports')
    }

    return data
}

export const updateReportStatus = async (token, reportId, { status, actionTaken = '' }) => {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            status,
            actionTaken
        }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update report status')
    }

    return data
}