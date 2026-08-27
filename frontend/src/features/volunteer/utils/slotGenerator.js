/**
 * Utility functions for parsing time/duration strings and generating discrete time slots.
 */

/**
 * Converts a time string (e.g. "9:00 AM", "09:00", "5:30 PM", "14:00") to minutes from midnight.
 * @param {string} timeStr
 * @returns {number|null} Minutes past midnight (0 - 1439) or null if invalid
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const str = timeStr.trim().toUpperCase();

  // Match 12-hour format e.g. "9:00 AM", "09:30PM", "9 AM", "12:15 PM"
  const match12 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3];

    if (hours === 12) {
      hours = period === 'AM' ? 0 : 12;
    } else if (period === 'PM') {
      hours += 12;
    }

    return hours * 60 + minutes;
  }

  // Match 24-hour format e.g. "09:00", "14:30", "9:00"
  const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  return null;
}

/**
 * Formats minutes past midnight into a 12-hour time string (e.g. "9:00 AM", "12:30 PM").
 * @param {number} totalMinutes
 * @returns {string}
 */
export function formatMinutesToTime(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return '';

  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${mm} ${period}`;
}

/**
 * Parses duration text into numeric minutes.
 * Examples: "30 mins" -> 30, "1 hr" -> 60, "1.5 hrs" -> 90, "1 hr 30 mins" -> 90, "45" -> 45.
 * @param {string|number} durationInput
 * @returns {number} Duration in minutes (defaults to 60 if parsing fails)
 */
export function parseDurationToMinutes(durationInput) {
  if (typeof durationInput === 'number' && durationInput > 0) return durationInput;
  if (!durationInput || typeof durationInput !== 'string') return 60;

  const str = durationInput.trim().toLowerCase();

  // Match e.g. "1 hr 30 mins" or "1 hour 30 min"
  const matchCombined = str.match(/(\d+(?:\.\d+)?)\s*(?:hr|hrs|hour|hours)\s*(\d+)?\s*(?:min|mins|minutes)?/);
  if (matchCombined) {
    const hrs = parseFloat(matchCombined[1]) || 0;
    const mins = matchCombined[2] ? parseInt(matchCombined[2], 10) : 0;
    const total = Math.round(hrs * 60 + mins);
    if (total > 0) return total;
  }

  // Match e.g. "30 mins", "45 min"
  const matchMins = str.match(/(\d+)\s*(?:min|mins|minutes)?/);
  if (matchMins) {
    const val = parseInt(matchMins[1], 10);
    if (val > 0) return val;
  }

  return 60; // Default fallback: 1 hour
}

/**
 * Formats duration in minutes to a friendly string (e.g. 30 -> "30 mins", 60 -> "1 hr", 90 -> "1.5 hrs").
 * @param {number} minutes
 * @returns {string}
 */
export function formatDurationFromMinutes(minutes) {
  if (!minutes || minutes <= 0) return '';
  if (minutes < 60) return `${minutes} mins`;
  if (minutes === 60) return `1 hr`;
  if (minutes % 60 === 0) return `${minutes / 60} hrs`;
  const hrs = minutes / 60;
  return `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)} hrs`;
}

/**
 * Generates all discrete time slots and break items between startTime and endTime.
 * @param {Object} params
 * @param {string} params.startTime - e.g. "9:00 AM"
 * @param {string} params.endTime - e.g. "5:00 PM"
 * @param {string|number} [params.slotDuration] - e.g. "1 hr" or 60
 * @param {string} [params.breakStart] - e.g. "12:00 PM"
 * @param {string} [params.breakEnd] - e.g. "1:00 PM"
 * @param {string|number} [params.breakDuration] - e.g. "1 hr" or 60
 * @returns {Array<{ id: string, start: string, end: string, duration: string, isBreak: boolean }>}
 */
export function generateTimeSlots({
  startTime,
  endTime,
  slotDuration = '1 hr',
  breakStart = '',
  breakEnd = '',
  breakDuration = '',
}) {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  if (startMin === null || endMin === null || startMin >= endMin) {
    return [];
  }

  const durationMin = parseDurationToMinutes(slotDuration);
  if (durationMin <= 0) return [];

  // Parse break window if specified
  let bStartMin = parseTimeToMinutes(breakStart);
  let bEndMin = parseTimeToMinutes(breakEnd);

  if (bStartMin !== null && (bEndMin === null || bEndMin <= bStartMin)) {
    const bDurMin = parseDurationToMinutes(breakDuration);
    if (bDurMin > 0) {
      bEndMin = bStartMin + bDurMin;
    }
  }

  const hasBreak = bStartMin !== null && bEndMin !== null && bEndMin > bStartMin;

  const slots = [];
  let curr = startMin;
  let slotIndex = 1;

  while (curr + durationMin <= endMin) {
    const nextSlotEnd = curr + durationMin;

    // Check if curr is inside break window
    if (hasBreak && curr >= bStartMin && curr < bEndMin) {
      // Add break entry if not added yet
      const lastItem = slots[slots.length - 1];
      if (!lastItem || !lastItem.isBreak) {
        slots.push({
          id: `break_${bStartMin}_${bEndMin}`,
          start: formatMinutesToTime(bStartMin),
          end: formatMinutesToTime(bEndMin),
          duration: formatDurationFromMinutes(bEndMin - bStartMin),
          isBreak: true,
        });
      }
      curr = bEndMin;
      continue;
    }

    // Check if slot overlaps break start
    if (hasBreak && curr < bStartMin && nextSlotEnd > bStartMin) {
      // Add break entry
      slots.push({
        id: `break_${bStartMin}_${bEndMin}`,
        start: formatMinutesToTime(bStartMin),
        end: formatMinutesToTime(bEndMin),
        duration: formatDurationFromMinutes(bEndMin - bStartMin),
        isBreak: true,
      });
      curr = bEndMin;
      continue;
    }

    // Valid slot
    slots.push({
      id: `slot_${curr}_${nextSlotEnd}_${slotIndex++}`,
      start: formatMinutesToTime(curr),
      end: formatMinutesToTime(nextSlotEnd),
      duration: formatDurationFromMinutes(durationMin),
      isBreak: false,
    });

    curr = nextSlotEnd;
  }

  // If there's remaining break after the last slot
  if (hasBreak && curr < bEndMin && bStartMin < endMin) {
    const lastItem = slots[slots.length - 1];
    if (!lastItem || !lastItem.isBreak) {
      slots.push({
        id: `break_${bStartMin}_${bEndMin}`,
        start: formatMinutesToTime(bStartMin),
        end: formatMinutesToTime(bEndMin),
        duration: formatDurationFromMinutes(bEndMin - bStartMin),
        isBreak: true,
      });
    }
  }

  return slots;
}
