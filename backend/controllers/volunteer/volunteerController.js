import Availability from '../../models/Availability.js';
import AvailabilitySlot from '../../models/AvailabilitySlot.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import ProfessionalApplication from '../../models/ProfessionalApplication.js';
import Notification from '../../models/Notification.js';
import mongoose from 'mongoose';
import { createZoomMeeting, sendZoomLinkNotification } from '../../utils/zoomUtils.js';

const DB_COLLECTION = 'availabilityslots';

const toSlotPayload = (slot) => ({
  id: String(slot._id),
  date: slot.date,
  start: slot.start,
  end: slot.end,
  slotDuration: slot.slotDuration || '',
  breakStart: slot.breakStart || '',
  breakEnd: slot.breakEnd || '',
  breakDuration: slot.breakDuration || '',
});

const groupSlotsByDate = (slots) => {
  const slotsByDate = {};
  slots.forEach((slot) => {
    const payload = toSlotPayload(slot);
    if (!slotsByDate[payload.date]) {
      slotsByDate[payload.date] = [];
    }
    slotsByDate[payload.date].push(payload);
  });
  return slotsByDate;
};

const getOrCreateAvailability = async (userId) => {
  let availability = await Availability.findOne({ user: userId });
  if (!availability) {
    availability = await Availability.create({
      user: userId,
      isAvailable: true,
    });
  }
  return availability;
};

const loadUserSlots = async (userId) => {
  return AvailabilitySlot.find({ user: userId }).sort({ date: 1, createdAt: 1 });
};

const buildScheduleResponse = async (userId) => {
  const [availability, slots] = await Promise.all([
    getOrCreateAvailability(userId),
    loadUserSlots(userId),
  ]);

  // Convert Map to plain object for JSON serialization
  const weeklyScheduleObj = {};
  if (availability.weeklySchedule) {
    availability.weeklySchedule.forEach((value, key) => {
      weeklyScheduleObj[key] = value;
    });
  }

  return {
    collection: DB_COLLECTION,
    database: mongoose.connection.name,
    slotsByDate: groupSlotsByDate(slots),
    slots: slots.map(toSlotPayload),
    isAvailable: availability.isAvailable,
    weeklySchedule: weeklyScheduleObj,
  };
};

export const getAvailabilitySchedule = async (req, res) => {
  try {
    const data = await buildScheduleResponse(req.user._id);
    return res.status(200).json({
      success: true,
      collection: DB_COLLECTION,
      data,
    });
  } catch (error) {
    console.error('[Get Availability Schedule Error]', error);
    return res.status(500).json({
      message: 'Server error fetching availability schedule',
    });
  }
};

export const createAvailabilitySlot = async (req, res) => {
  try {
    const { date, start, end, slotDuration, breakStart, breakEnd, breakDuration } = req.body;

    if (!date || !start || !end) {
      return res.status(400).json({
        message: 'date, start, and end are required',
      });
    }

    const slot = await AvailabilitySlot.create({
      user: req.user._id,
      date,
      start,
      end,
      slotDuration: slotDuration || '',
      breakStart: breakStart || '',
      breakEnd: breakEnd || '',
      breakDuration: breakDuration || '',
    });

    console.log(
      `[Create Availability Slot] db=${mongoose.connection.name} collection=${DB_COLLECTION} id=${slot._id}`
    );

    return res.status(201).json({
      success: true,
      collection: DB_COLLECTION,
      message: `Slot saved in database ${mongoose.connection.name}, collection ${DB_COLLECTION}`,
      data: toSlotPayload(slot),
    });
  } catch (error) {
    console.error('[Create Availability Slot Error]', error);
    return res.status(500).json({
      message: 'Server error creating availability slot: ' + error.message,
    });
  }
};

export const updateAvailabilitySlot = async (req, res) => {
  try {
    const { date, start, end, slotDuration, breakStart, breakEnd, breakDuration } = req.body;

    const slot = await AvailabilitySlot.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        date,
        start,
        end,
        slotDuration: slotDuration || '',
        breakStart: breakStart || '',
        breakEnd: breakEnd || '',
        breakDuration: breakDuration || '',
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!slot) {
      return res.status(404).json({ message: 'Availability slot not found' });
    }

    return res.status(200).json({
      success: true,
      collection: DB_COLLECTION,
      message: `Slot updated in collection ${DB_COLLECTION}`,
      data: toSlotPayload(slot),
    });
  } catch (error) {
    console.error('[Update Availability Slot Error]', error);
    return res.status(500).json({
      message: 'Server error updating availability slot: ' + error.message,
    });
  }
};

export const deleteAvailabilitySlot = async (req, res) => {
  try {
    const slot = await AvailabilitySlot.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!slot) {
      return res.status(404).json({ message: 'Availability slot not found' });
    }

    return res.status(200).json({
      success: true,
      collection: DB_COLLECTION,
      message: `Slot deleted from collection ${DB_COLLECTION}`,
    });
  } catch (error) {
    console.error('[Delete Availability Slot Error]', error);
    return res.status(500).json({
      message: 'Server error deleting availability slot: ' + error.message,
    });
  }
};

export const saveAvailabilitySchedule = async (req, res) => {
  try {
    const { slotsByDate, isAvailable, weeklySchedule } = req.body;
    const availability = await getOrCreateAvailability(req.user._id);

    if (isAvailable !== undefined) availability.isAvailable = isAvailable;
    if (weeklySchedule !== undefined && typeof weeklySchedule === 'object') {
      // Convert plain object to Map for Mongoose
      const weeklyScheduleMap = new Map();
      Object.entries(weeklySchedule).forEach(([key, value]) => {
        weeklyScheduleMap.set(key, value);
      });
      availability.weeklySchedule = weeklyScheduleMap;
    }
    await availability.save();

    if (slotsByDate && typeof slotsByDate === 'object') {
      const incoming = [];
      Object.entries(slotsByDate).forEach(([dateKey, list]) => {
        (Array.isArray(list) ? list : []).forEach((item) => {
          if (!item?.start || !item?.end) return;
          incoming.push({
            user: req.user._id,
            date: item.date || dateKey,
            start: item.start,
            end: item.end,
            slotDuration: item.slotDuration || '',
            breakStart: item.breakStart || '',
            breakEnd: item.breakEnd || '',
            breakDuration: item.breakDuration || '',
          });
        });
      });

      await AvailabilitySlot.deleteMany({ user: req.user._id });
      if (incoming.length > 0) {
        await AvailabilitySlot.insertMany(incoming);
      }

      console.log(
        `[Save Availability] db=test collection=${DB_COLLECTION} inserted=${incoming.length}`
      );
    }

    const data = await buildScheduleResponse(req.user._id);
    return res.status(200).json({
      success: true,
      collection: DB_COLLECTION,
      message: `Availability saved in collection ${DB_COLLECTION}`,
      data,
    });
  } catch (error) {
    console.error('[Save Availability Schedule Error]', error);
    return res.status(500).json({
      message: 'Server error saving availability schedule: ' + error.message,
    });
  }
};

export const updateAvailabilityStatus = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const availability = await getOrCreateAvailability(req.user._id);
    availability.isAvailable = isAvailable;
    const savedDoc = await availability.save();

    return res.status(200).json({
      success: true,
      collection: 'availabilities',
      message: 'Availability status updated',
      data: savedDoc,
    });
  } catch (error) {
    console.error('[Update Availability Status Error]', error);
    return res.status(500).json({
      message: 'Server error updating availability status',
    });
  }
};

export const getVolunteerDashboard = async (req, res) => {
  try {
    const availability = await Availability.findOne({ user: req.user._id });
    
    // Get all possible professional IDs for this user (both User ID and ProfessionalApplication ID)
    const profApp = await ProfessionalApplication.findOne({ userId: req.user._id });
    const professionalIds = [req.user._id.toString()];
    if (profApp) {
      professionalIds.push(profApp._id.toString());
    }
    
    console.log(`[Volunteer Dashboard] Professional IDs for user ${req.user._id}:`, professionalIds);
    
    // Get all bookings for this volunteer to calculate stats
    const allBookings = await Booking.find({ 
      professional: { $in: professionalIds },
      status: { $in: ['pending', 'confirmed', 'approved', 'completed'] }
    }).limit(100);
    
    // Calculate stats from actual database data
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    const totalSessions = completedBookings.length;
    
    // Calculate completed hours (assuming each session is 1 hour)
    const completedHours = totalSessions;
    
    // Calculate average rating (if rating field exists)
    const ratedBookings = completedBookings.filter(b => b.rating);
    const rating = ratedBookings.length > 0 
      ? ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBookings.length
      : 0;
    
    // Get pending bookings for this volunteer (using either ID)
    const pendingBookings = allBookings.filter(b => b.status === 'pending');
    
    // Get upcoming confirmed sessions
    const upcomingSessions = allBookings.filter(b => b.status === 'confirmed' || b.status === 'approved');
    
    console.log(`[Volunteer Dashboard] Found ${pendingBookings.length} pending bookings, ${upcomingSessions.length} upcoming sessions`);
    
    // Transform bookings to match the frontend format
    const transformedRequests = pendingBookings.map(booking => {
      const initials = booking.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      
      // Generate colors based on name
      const colors = ['#FCE7D6', '#E0F2FE', '#EAF3ED', '#F3E8FF'];
      const textColors = ['#B45309', '#0369A1', '#2F6B47', '#7C3AED'];
      const colorIndex = booking.fullName.length % colors.length;
      
      return {
        id: booking._id.toString(),
        name: booking.fullName,
        initials: initials,
        category: booking.profession,
        date: new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: `${booking.startTime} - ${booking.endTime}`,
        note: booking.reason,
        avatarBg: colors[colorIndex],
        avatarColor: textColors[colorIndex],
        status: 'pending',
        bookingId: booking._id.toString(),
        zoomMeetingLink: booking.zoomMeetingLink || '',
        zoomLinkSent: booking.zoomLinkSent || false,
      };
    });
    
    const transformedSessions = upcomingSessions
      .sort((a, b) => new Date(a.date) - new Date(b.date) || a.startTime.localeCompare(b.startTime))
      .map(booking => {
      const initials = booking.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      
      return {
        id: booking._id.toString(),
        name: booking.fullName,
        category: booking.profession,
        date: new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: `${booking.startTime} - ${booking.endTime}`,
        day: new Date(booking.date).getDate(),
        month: new Date(booking.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        initials: initials,
        zoomMeetingLink: booking.zoomMeetingLink || '',
        zoomLinkSent: booking.zoomLinkSent || false,
      };
    });
    
    return res.status(200).json({
      stats: {
        completedHours,
        totalSessions,
        rating: rating.toFixed(1),
      },
      isAvailable: availability ? availability.isAvailable : true,
      pendingRequests: transformedRequests,
      upcomingSessions: transformedSessions,
    });
  } catch (error) {
    console.error('[Get Volunteer Dashboard Error]', error);
    return res.status(500).json({
      message: 'Server error fetching volunteer dashboard data',
    });
  }
};

export const getVolunteerRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    // Get all possible professional IDs for this user
    const profApp = await ProfessionalApplication.findOne({ userId: req.user._id });
    const professionalIds = [req.user._id.toString()];
    if (profApp) {
      professionalIds.push(profApp._id.toString());
    }
    
    let filter = { professional: { $in: professionalIds } };
    if (status !== 'all') {
      filter.status = status;
    }
    
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    
    const transformedRequests = bookings.map(booking => {
      const initials = booking.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      
      const colors = ['#FCE7D6', '#E0F2FE', '#EAF3ED', '#F3E8FF'];
      const textColors = ['#B45309', '#0369A1', '#2F6B47', '#7C3AED'];
      const colorIndex = booking.fullName.length % colors.length;
      
      return {
        id: booking._id.toString(),
        userId: booking.user ? booking.user.toString() : null,
        name: booking.fullName,
        initials: initials,
        category: booking.profession,
        date: new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: `${booking.startTime} - ${booking.endTime}`,
        note: booking.reason,
        avatarBg: colors[colorIndex],
        avatarColor: textColors[colorIndex],
        status: booking.status,
        bookingId: booking._id.toString(),
        zoomMeetingLink: booking.zoomMeetingLink || '',
        zoomLinkSent: booking.zoomLinkSent || false,
      };
    });
    
    return res.status(200).json({
      success: true,
      requests: transformedRequests
    });
  } catch (error) {
    console.error('[Get Volunteer Requests Error]', error);
    return res.status(500).json({
      message: 'Server error fetching volunteer requests',
    });
  }
};

export const acceptVolunteerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Accept Volunteer Request] Attempting to accept booking ${id} for user ${req.user._id}`);
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[Accept Volunteer Request] Invalid booking ID: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    // Get all possible professional IDs for this user
    const profApp = await ProfessionalApplication.findOne({ userId: req.user._id });
    const professionalIds = [req.user._id.toString()];
    if (profApp) {
      professionalIds.push(profApp._id.toString());
    }
    console.log(`[Accept Volunteer Request] Professional IDs:`, professionalIds);
    
    const booking = await Booking.findById(id);
    if (!booking) {
      console.log(`[Accept Volunteer Request] Booking ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const professionalIdStrings = professionalIds.map(p => p.toString());
    if (!professionalIdStrings.includes(booking.professional.toString())) {
      console.log(`[Accept Volunteer Request] Unauthorized access to booking ${id}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to accept this booking request'
      });
    }

    if (booking.status === 'confirmed' || booking.status === 'approved') {
      return res.status(200).json({
        success: true,
        message: 'Request already accepted',
        booking: {
          id: booking._id.toString(),
          status: booking.status,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime
        }
      });
    }

    booking.status = 'confirmed';
    await booking.save();
    
    console.log(`[Accept Volunteer Request] Booking found and updated:`, booking._id);
    
    // Create notification for the user
    if (booking.user) {
      try {
        const formattedDate = !isNaN(new Date(booking.date))
          ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : booking.date;

        await Notification.create({
          userId: booking.user,
          type: 'booking_approved',
          title: 'Booking Approved',
          message: `Your session with ${booking.professionalName} on ${formattedDate} at ${booking.startTime} has been approved.`,
          relatedUserId: req.user._id,
          relatedUserName: booking.professionalName,
          relatedBookingId: booking._id,
          isRead: false,
        });
        console.log(`[Accept Volunteer Request] Created notification for user ${booking.user}`);
      } catch (notifError) {
        console.error('[Accept Volunteer Request] Failed to create notification:', notifError);
        // Continue anyway - notification failure shouldn't block the acceptance
      }
    }
    
    const response = {
      success: true,
      message: 'Request accepted successfully',
      booking: {
        id: booking._id ? booking._id.toString() : id,
        status: booking.status,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime
      }
    };
    
    console.log(`[Accept Volunteer Request] Sending response:`, JSON.stringify(response));
    return res.status(200).json(response);
  } catch (error) {
    console.error('[Accept Volunteer Request Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error accepting request: ' + error.message,
    });
  }
};

export const declineVolunteerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { declineMessage } = req.body;
    console.log(`[Decline Volunteer Request] Attempting to decline booking ${id} for user ${req.user._id}`);
    console.log(`[Decline Volunteer Request] Decline message:`, declineMessage);
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[Decline Volunteer Request] Invalid booking ID: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    // Get all possible professional IDs for this user
    const profApp = await ProfessionalApplication.findOne({ userId: req.user._id });
    const professionalIds = [req.user._id.toString()];
    if (profApp) {
      professionalIds.push(profApp._id.toString());
    }
    console.log(`[Decline Volunteer Request] Professional IDs:`, professionalIds);
    
    const booking = await Booking.findById(id);
    if (!booking) {
      console.log(`[Decline Volunteer Request] Booking ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const professionalIdStrings = professionalIds.map(p => p.toString());
    if (!professionalIdStrings.includes(booking.professional.toString())) {
      console.log(`[Decline Volunteer Request] Unauthorized access to booking ${id}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to decline this booking request'
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'declined') {
      return res.status(200).json({
        success: true,
        message: 'Request already declined',
        booking: {
          id: booking._id.toString(),
          status: booking.status,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime
        }
      });
    }

    booking.status = 'cancelled';
    if (declineMessage) {
      booking.notes = declineMessage;
    }
    await booking.save();
    
    console.log(`[Decline Volunteer Request] Booking found and updated:`, booking._id);
    
    // Create notification for the user
    if (booking.user) {
      try {
        const formattedDate = !isNaN(new Date(booking.date))
          ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : booking.date;

        // Use custom decline message if provided, otherwise use default
        const notificationMessage = declineMessage 
          ? `${declineMessage} - Please try another slot for your session with ${booking.professionalName}.`
          : `Currently unable to book. Please try another slot for your session with ${booking.professionalName}.`;

        await Notification.create({
          userId: booking.user,
          type: 'booking_declined',
          title: 'Booking Declined',
          message: notificationMessage,
          relatedUserId: req.user._id,
          relatedUserName: booking.professionalName,
          relatedBookingId: booking._id,
          isRead: false,
        });
        console.log(`[Decline Volunteer Request] Created notification for user ${booking.user}`);
      } catch (notifError) {
        console.error('[Decline Volunteer Request] Failed to create notification:', notifError);
        // Continue anyway - notification failure shouldn't block the decline
      }
    }
    
    const response = {
      success: true,
      message: 'Request declined successfully',
      booking: {
        id: booking._id ? booking._id.toString() : id,
        status: booking.status,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime
      }
    };
    
    console.log(`[Decline Volunteer Request] Sending response:`, JSON.stringify(response));
    return res.status(200).json(response);
  } catch (error) {
    console.error('[Decline Volunteer Request Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error declining request: ' + error.message,
    });
  }
};

export const sendZoomLink = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Send Zoom Link] Attempting to send Zoom link for booking ${id} for user ${req.user._id}`);
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[Send Zoom Link] Invalid booking ID: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    // Get all possible professional IDs for this user
    const profApp = await ProfessionalApplication.findOne({ userId: req.user._id });
    const professionalIds = [req.user._id.toString()];
    if (profApp) {
      professionalIds.push(profApp._id.toString());
    }
    console.log(`[Send Zoom Link] Professional IDs:`, professionalIds);
    
    const booking = await Booking.findById(id);
    if (!booking) {
      console.log(`[Send Zoom Link] Booking ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const professionalIdStrings = professionalIds.map(p => p.toString());
    if (!professionalIdStrings.includes(booking.professional.toString())) {
      console.log(`[Send Zoom Link] Unauthorized access to booking ${id}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to send Zoom link for this booking'
      });
    }

    // Check if booking is confirmed/approved
    if (booking.status !== 'confirmed' && booking.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Zoom link can only be sent for confirmed bookings'
      });
    }

    // Check if Zoom link already sent
    if (booking.zoomLinkSent) {
      return res.status(200).json({
        success: true,
        message: 'Zoom link already sent',
        zoomMeetingLink: booking.zoomMeetingLink,
      });
    }

    // Helper to parse 12-hour or 24-hour time strings
    const parseTimeString = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return null;
      const str = timeStr.trim().toUpperCase();

      // 12-hour format e.g. "9:00 AM", "09:30 PM", "2:00 PM", "2 PM"
      const match12 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
      if (match12) {
        let hours = parseInt(match12[1], 10);
        const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
        const period = match12[3].toUpperCase();

        if (hours === 12) {
          hours = period === 'AM' ? 0 : 12;
        } else if (period === 'PM') {
          hours += 12;
        }

        return { hours, minutes, totalMinutes: hours * 60 + minutes };
      }

      // 24-hour format e.g. "09:00", "14:30", "9:00"
      const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
      if (match24) {
        const hours = parseInt(match24[1], 10);
        const minutes = parseInt(match24[2], 10);
        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          return { hours, minutes, totalMinutes: hours * 60 + minutes };
        }
      }

      return null;
    };

    // Parse start and end times
    const parsedStart = parseTimeString(booking.startTime);
    const parsedEnd = parseTimeString(booking.endTime);

    // Calculate duration in minutes (fallback to 60)
    let duration = 60;
    if (parsedStart && parsedEnd && parsedEnd.totalMinutes > parsedStart.totalMinutes) {
      duration = parsedEnd.totalMinutes - parsedStart.totalMinutes;
    }

    const startHour = parsedStart ? parsedStart.hours : 9;
    const startMin = parsedStart ? parsedStart.minutes : 0;

    // Create Zoom meeting - handle date parsing
    let meetingDateTime;
    try {
      if (booking.date && typeof booking.date === 'string') {
        const dateStr = booking.date.trim();
        // Check if YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          meetingDateTime = new Date(year, month - 1, day, startHour, startMin, 0, 0);
        } else {
          let candidate = new Date(dateStr);
          if (isNaN(candidate.getTime())) {
            candidate = new Date(`${dateStr}, ${new Date().getFullYear()}`);
          }
          if (isNaN(candidate.getTime())) {
            console.log(`[Send Zoom Link] Invalid date format "${booking.date}", using current date`);
            meetingDateTime = new Date();
          } else {
            meetingDateTime = candidate;
          }
          meetingDateTime.setHours(startHour, startMin, 0, 0);
        }
      } else if (booking.date instanceof Date && !isNaN(booking.date.getTime())) {
        meetingDateTime = new Date(booking.date);
        meetingDateTime.setHours(startHour, startMin, 0, 0);
      } else {
        meetingDateTime = new Date();
        meetingDateTime.setHours(startHour, startMin, 0, 0);
      }

      // Fallback if invalid
      if (isNaN(meetingDateTime.getTime())) {
        meetingDateTime = new Date();
        meetingDateTime.setHours(startHour, startMin, 0, 0);
      }

      // Ensure the meeting time is in the future
      const now = new Date();
      if (meetingDateTime < now) {
        console.log(`[Send Zoom Link] Meeting time is in the past, setting to tomorrow`);
        meetingDateTime.setDate(meetingDateTime.getDate() + 1);
      }

      console.log(`[Send Zoom Link] Meeting datetime: ${meetingDateTime.toISOString()}`);
    } catch (dateError) {
      console.error('[Send Zoom Link] Date parsing error:', dateError);
      meetingDateTime = new Date();
      meetingDateTime.setHours(startHour, startMin, 0, 0);
      meetingDateTime.setDate(meetingDateTime.getDate() + 1); // Set to tomorrow
    }

    const zoomMeeting = await createZoomMeeting(
      meetingDateTime,
      duration,
      `Counseling Session with ${booking.professionalName}`
    );

    // Update booking with Zoom link
    booking.zoomMeetingLink = zoomMeeting.joinUrl;
    booking.zoomLinkSent = true;
    await booking.save();

    // Format display date for notification
    let formattedDate = booking.date;
    try {
      if (booking.date) {
        let d = new Date(booking.date);
        if (isNaN(d.getTime())) {
          d = new Date(`${booking.date}, ${new Date().getFullYear()}`);
        }
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
      }
    } catch {
      formattedDate = booking.date;
    }

    // Send notification to user
    await sendZoomLinkNotification(
      booking.user,
      zoomMeeting.joinUrl,
      formattedDate,
      booking.startTime,
      booking.professionalName,
      booking._id
    );

    console.log(`[Send Zoom Link] Zoom link sent successfully for booking ${id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Zoom link sent successfully',
      zoomMeetingLink: zoomMeeting.joinUrl,
    });
  } catch (error) {
    console.error('[Send Zoom Link Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending Zoom link: ' + error.message,
    });
  }
};
