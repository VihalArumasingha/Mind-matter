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

/**
 * Save volunteer availability settings (repeat weekly / status)
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


