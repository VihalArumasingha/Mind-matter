import axios from 'axios';

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Get OAuth Access Token using Zoom Server-to-Server OAuth
 */
const getZoomAccessToken = async () => {
  // Return cached token if still valid (with 60-second buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const accountId = (process.env.ZOOM_ACCOUNT_ID || '').replace(/\.+$/, '').trim();
  const clientId = (process.env.ZOOM_CLIENT_ID || '').trim();
  const clientSecret = (process.env.ZOOM_CLIENT_SECRET || '').trim();

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      'Zoom Server-to-Server OAuth credentials not configured. Please ensure ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET are set in the backend .env file.'
    );
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
      {},
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = response.data;
    cachedAccessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in || 3600) * 1000;

    console.log('[Zoom Utils] Successfully retrieved Zoom OAuth access token');
    return access_token;
  } catch (error) {
    console.error('[Zoom OAuth Error]', error.response?.data || error.message);
    const detail = error.response?.data?.message || error.response?.data?.error || error.message;
    throw new Error(`Failed to authenticate with Zoom API: ${detail}`);
  }
};

/**
 * Create a Zoom meeting
 * @param {Date} startTime - Meeting start time
 * @param {Number} duration - Meeting duration in minutes
 * @param {String} topic - Meeting topic/title
 * @returns {Object} Zoom meeting data
 */
export const createZoomMeeting = async (startTime, duration, topic = 'Counseling Session') => {
  try {
    const ZOOM_USER_ID = process.env.ZOOM_USER_ID || 'me';
    const token = await getZoomAccessToken();

    // Format start time for Zoom API (ISO 8601 format) safely
    let meetingDate = startTime instanceof Date ? new Date(startTime.getTime()) : new Date(startTime);
    if (isNaN(meetingDate.getTime())) {
      console.warn('[Zoom Utils] Invalid startTime passed to createZoomMeeting, falling back to 1 hour from now:', startTime);
      meetingDate = new Date();
      meetingDate.setHours(meetingDate.getHours() + 1);
    }
    const formattedStartTime = meetingDate.toISOString();
    const meetingDuration = (typeof duration === 'number' && !isNaN(duration) && duration > 0) ? Math.round(duration) : 60;

    const meetingData = {
      topic: topic,
      type: 2, // Scheduled meeting
      start_time: formattedStartTime,
      duration: meetingDuration,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        watermark: false,
        use_pmi: false,
        approval_type: 2,
        audio: 'both',
        auto_recording: 'none',
        waiting_room: true,
      },
    };

    const response = await axios.post(
      `https://api.zoom.us/v2/users/${ZOOM_USER_ID}/meetings`,
      meetingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[Zoom Meeting Created]', response.data);
    return {
      success: true,
      meetingId: response.data.id,
      joinUrl: response.data.join_url,
      startUrl: response.data.start_url,
      password: response.data.password,
    };
  } catch (error) {
    console.error('[Create Zoom Meeting Error]', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting: ' + (error.response?.data?.message || error.message));
  }
};

/**
 * Send Zoom meeting link notification to user
 * @param {String} userId - User ID to send notification to
 * @param {String} meetingLink - Zoom meeting join URL
 * @param {String} meetingDate - Meeting date
 * @param {String} meetingTime - Meeting time
 * @param {String} professionalName - Professional's name
 * @param {String} bookingId - Optional booking ID
 */
export const sendZoomLinkNotification = async (userId, meetingLink, meetingDate, meetingTime, professionalName, bookingId) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    
    await Notification.create({
      userId: userId,
      type: 'zoom_link_sent',
      title: 'Zoom Meeting Link',
      message: `Your counseling session with ${professionalName} on ${meetingDate} at ${meetingTime} is scheduled. Join the meeting here: ${meetingLink}`,
      relatedBookingId: bookingId || undefined,
      isRead: false,
    });

    console.log('[Zoom Link Notification Sent] to user:', userId);
    return { success: true };
  } catch (error) {
    console.error('[Send Zoom Link Notification Error]', error);
    return { success: false, error: error.message };
  }
};
