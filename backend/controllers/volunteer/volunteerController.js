import Availability from '../../models/Availability.js';
import AvailabilitySlot from '../../models/AvailabilitySlot.js';
import mongoose from 'mongoose';

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
      repeatWeekly: false,
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

  return {
    collection: DB_COLLECTION,
    database: mongoose.connection.name,
    slotsByDate: groupSlotsByDate(slots),
    slots: slots.map(toSlotPayload),
    repeatWeekly: availability.repeatWeekly,
    isAvailable: availability.isAvailable,
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
    const { slotsByDate, repeatWeekly, isAvailable } = req.body;
    const availability = await getOrCreateAvailability(req.user._id);

    if (repeatWeekly !== undefined) availability.repeatWeekly = repeatWeekly;
    if (isAvailable !== undefined) availability.isAvailable = isAvailable;
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
    return res.status(200).json({
      stats: {
        completedHours: 24,
        totalSessions: 12,
        rating: 4.9,
      },
      isAvailable: availability ? availability.isAvailable : true,
      pendingRequests: [],
      upcomingSessions: [],
    });
  } catch (error) {
    console.error('[Get Volunteer Dashboard Error]', error);
    return res.status(500).json({
      message: 'Server error fetching volunteer dashboard data',
    });
  }
};
