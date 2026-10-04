import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';

/**
 * Session Reminder Scheduler
 * Runs every 5 minutes to check for upcoming sessions and send reminders
 */
const REMINDER_MINUTES_BEFORE = 15; // Send reminder 15 minutes before session

const parseMeetingDateTime = (dateStr, timeStr) => {
  try {
    let meetingDate;
    
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      meetingDate = new Date(year, month - 1, day);
    } else {
      // Handle other date formats
      meetingDate = new Date(dateStr);
      if (isNaN(meetingDate.getTime())) {
        meetingDate = new Date(`${dateStr}, ${new Date().getFullYear()}`);
      }
    }

    if (isNaN(meetingDate.getTime())) {
      return null;
    }

    // Parse time (e.g., "14:00" or "2:00 PM")
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const meridiem = timeMatch[3]?.toUpperCase();

      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }

      meetingDate.setHours(hours, minutes, 0, 0);
    }

    return meetingDate;
  } catch (error) {
    console.error('[Session Reminder] Date parsing error:', error);
    return null;
  }
};

const checkAndSendReminders = async () => {
  try {
    console.log('[Session Reminder] Checking for upcoming sessions...');

    const now = new Date();
    const reminderTime = new Date(now.getTime() + REMINDER_MINUTES_BEFORE * 60 * 1000);

    // Find confirmed bookings with Zoom links that haven't had reminders sent
    const upcomingBookings = await Booking.find({
      status: 'confirmed',
      zoomLinkSent: true,
      reminderSent: { $ne: true }
    });

    console.log(`[Session Reminder] Found ${upcomingBookings.length} bookings to check`);

    for (const booking of upcomingBookings) {
      const meetingDateTime = parseMeetingDateTime(booking.date, booking.startTime);
      
      if (!meetingDateTime) {
        console.log(`[Session Reminder] Could not parse date/time for booking ${booking._id}`);
        continue;
      }

      // Check if the meeting is within the reminder window (±5 minutes)
      const timeDiff = Math.abs(meetingDateTime - reminderTime);
      const fiveMinutesInMs = 5 * 60 * 1000;

      if (timeDiff <= fiveMinutesInMs && meetingDateTime > now) {
        // Send reminder notification
        await Notification.create({
          userId: booking.user,
          type: 'session_reminder',
          title: 'Session Starting Soon',
          message: `Your counseling session with ${booking.professionalName} starts in ${REMINDER_MINUTES_BEFORE} minutes. Join the meeting now!`,
          relatedBookingId: booking._id,
          isRead: false,
        });

        // Mark reminder as sent
        booking.reminderSent = true;
        await booking.save();

        console.log(`[Session Reminder] Sent reminder for booking ${booking._id} with user ${booking.user}`);
      }
    }

    console.log('[Session Reminder] Check completed');
  } catch (error) {
    console.error('[Session Reminder Error]', error);
  }
};

/**
 * Start the session reminder scheduler
 * Runs every 5 minutes
 */
export const startSessionReminderScheduler = () => {
  // Run every 5 minutes: "*/5 * * * *"
  cron.schedule('*/5 * * * *', checkAndSendReminders);
  console.log('[Session Reminder] Scheduler started - runs every 5 minutes');
  
  // Run once on startup
  checkAndSendReminders();
};

export default startSessionReminderScheduler;
