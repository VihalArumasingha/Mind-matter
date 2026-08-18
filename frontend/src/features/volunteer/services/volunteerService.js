import { API_BASE_URL } from '../../../config/api';

/**
 * Fetch volunteer dashboard data (stats, pending requests, upcoming sessions)
 */
export const getVolunteerDashboardData = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch dashboard data');
    }
    return data;
  } catch (error) {
    console.error('Error fetching volunteer dashboard data:', error);
    throw error;
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
    const response = await fetch(
      `${API_BASE_URL}/api/volunteer/requests/${requestId}/accept`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept request');
    }
    return data;
  } catch (error) {
    console.error('Error accepting request:', error);
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
