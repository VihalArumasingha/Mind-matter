import { API_BASE_URL } from '../../../config/api';

/**
 * Fetch volunteer dashboard data (stats, pending requests, upcoming sessions)
 */
export const getVolunteerDashboardData = async (token) => {
  try {
    if (!token) {
      console.error('[getVolunteerDashboardData] No token provided')
      return {
        stats: {
          completedHours: 0,
          totalSessions: 0,
          rating: 0,
        },
        isAvailable: true,
        pendingRequests: [],
        upcomingSessions: [],
      }
    }

    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/volunteer/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('[getVolunteerDashboardData] Received non-JSON response:', text.substring(0, 100))
      return {
        stats: {
          completedHours: 0,
          totalSessions: 0,
          rating: 0,
        },
        isAvailable: true,
        pendingRequests: [],
        upcomingSessions: [],
      }
    }

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        console.error('[getVolunteerDashboardData] Unauthorized - token may be invalid')
      }
      throw new Error(data.message || 'Failed to fetch dashboard data');
    }
    return data;
  } catch (error) {
    console.error('Error fetching volunteer dashboard data:', error);
    if (error.name === 'AbortError') {
      console.error('[getVolunteerDashboardData] Request timed out after 15 seconds')
    }
    // Return empty data on error instead of throwing
    return {
      stats: {
        completedHours: 0,
        totalSessions: 0,
        rating: 0,
      },
      isAvailable: true,
      pendingRequests: [],
      upcomingSessions: [],
    }
  }
};

/**
 * Update volunteer availability status
 */
export const updateAvailabilityStatus = async (isAvailable, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isAvailable }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update availability');
    }
    return data;
  } catch (error) {
    console.error('Error updating availability status:', error);
    throw error;
  }
};

/**
 * Accept a pending volunteer request
 */
export const acceptVolunteerRequest = async (requestId, token) => {
  try {
    const url = `${API_BASE_URL}/api/volunteer/requests/${requestId}/accept`;
    console.log('[acceptVolunteerRequest] Request URL:', url);
    console.log('[acceptVolunteerRequest] Request ID:', requestId);
    console.log('[acceptVolunteerRequest] Token exists:', !!token);
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('[acceptVolunteerRequest] Response status:', response.status);
    console.log('[acceptVolunteerRequest] Response statusText:', response.statusText);
    
    const contentType = response.headers.get('content-type');
    console.log('[acceptVolunteerRequest] Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[acceptVolunteerRequest] Received non-JSON response:', text.substring(0, 500));
      console.error('[acceptVolunteerRequest] Full response text length:', text.length);
      throw new Error('Server returned non-JSON response. Please try again.');
    }

    const data = await response.json();
    console.log('[acceptVolunteerRequest] Parsed JSON data:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept request');
    }
    return data;
  } catch (error) {
    console.error('[acceptVolunteerRequest] Error:', error);
    console.error('[acceptVolunteerRequest] Error name:', error.name);
    console.error('[acceptVolunteerRequest] Error message:', error.message);
    throw error;
  }
};

/**
 * Decline a pending volunteer request
 */
export const declineVolunteerRequest = async (requestId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/volunteer/requests/${requestId}/decline`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[declineVolunteerRequest] Received non-JSON response:', text.substring(0, 200));
      console.error('[declineVolunteerRequest] Response status:', response.status);
      throw new Error('Server returned non-JSON response. Please try again.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to decline request');
    }
    return data;
  } catch (error) {
    console.error('Error declining request:', error);
    throw error;
  }
};

/**
 * Get volunteer requests from backend
 */
export const getVolunteerRequests = async (token, status = 'pending') => {
  try {
    if (!token) {
      console.error('[getVolunteerRequests] No token provided')
      return {
        success: true,
        requests: []
      }
    }

    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const response = await fetch(
      `${API_BASE_URL}/api/volunteer/requests?status=${status}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('[getVolunteerRequests] Received non-JSON response:', text.substring(0, 200))
      console.error('[getVolunteerRequests] Response status:', response.status)
      console.error('[getVolunteerRequests] Response statusText:', response.statusText)
      return {
        success: true,
        requests: []
      }
    }

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        console.error('[getVolunteerRequests] Unauthorized - token may be invalid')
      }
      throw new Error(data.message || 'Failed to fetch requests');
    }
    return data;
  } catch (error) {
    console.error('Error fetching volunteer requests:', error);
    if (error.name === 'AbortError') {
      console.error('[getVolunteerRequests] Request timed out after 15 seconds')
    }
    // Return empty requests on error instead of throwing
    return {
      success: true,
      requests: []
    }
  }
};

/**
 * Save volunteer availability settings (including weekly schedule)
 */
export const saveVolunteerAvailabilitySchedule = async (scheduleData, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/volunteer/availability/schedule`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(scheduleData),
      }
    );

    return parseJsonResponse(response);
  } catch (error) {
    console.error('Error saving availability schedule:', error);
    throw error;
  }
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      'Backend did not return JSON. Restart the backend (npm start in backend) and try again.'
    );
  }
  if (!response.ok) {
    throw new Error(data.message || 'Availability request failed');
  }
  return data;
};

/**
 * Insert one availability slot into MongoDB collection `availabilityslots`
 */
export const createVolunteerAvailabilitySlot = async (slotData, token) => {
  const response = await fetch(`${API_BASE_URL}/api/volunteer/availability/slots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(slotData),
  });
  return parseJsonResponse(response);
};

/**
 * Update one availability slot document in `availabilityslots`
 */
export const updateVolunteerAvailabilitySlot = async (slotId, slotData, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/volunteer/availability/slots/${slotId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(slotData),
    }
  );
  return parseJsonResponse(response);
};

/**
 * Delete one availability slot document from `availabilityslots`
 */
export const deleteVolunteerAvailabilitySlot = async (slotId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/volunteer/availability/slots/${slotId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return parseJsonResponse(response);
};

/**
 * Get volunteer availability schedule (slots & recurring settings)
 */
export const getVolunteerAvailabilitySchedule = async (token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/volunteer/availability/schedule`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch schedule');
    }
    return data;
  } catch (error) {
    console.error('Error fetching availability schedule:', error);
    throw error;
  }
};


