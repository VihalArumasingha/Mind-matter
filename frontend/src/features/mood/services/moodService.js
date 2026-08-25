import {API_BASE_URL} from '../../../config/api'

const request = async (token, path, method = 'GET', body) => {
    const response = await fetch(`${API_BASE_URL}/api/users/moods${path}`, {
        method,
        headers: {
            ...(body ? {'Content-Type': 'application/json'} : {}),
            Authorization: `Bearer ${token}`
        },
        ...(body ? {body: JSON.stringify(body)} : {})
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Mood request failed')
    return data
}

export const getMoods = token => request(token, '/')

export const saveMood = (token, mood, intensity, note) =>
    request(token, '/', 'POST', {mood, intensity, note})
