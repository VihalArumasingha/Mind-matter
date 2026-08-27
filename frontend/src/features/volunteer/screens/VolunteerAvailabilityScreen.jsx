import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../styles/volunteerDashboardStyles';
import {
  saveVolunteerAvailabilitySchedule,
  getVolunteerAvailabilitySchedule,
  createVolunteerAvailabilitySlot,
  updateVolunteerAvailabilitySlot,
  deleteVolunteerAvailabilitySlot,
} from '../services/volunteerService';
import { useAuth } from '../../../context/AuthContext';
import AvailabilitySlotFormModal from '../components/AvailabilitySlotFormModal';
import { generateTimeSlots } from '../utils/slotGenerator';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEK_DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DEFAULT_WEEK_SLOT = {
  start: '9:00 AM',
  end: '10:00 AM',
  slotDuration: '1 hr',
  breakStart: '',
  breakEnd: '',
  breakDuration: '',
};

export default function VolunteerAvailabilityScreen({ navigation, onTabChange }) {
  const { token } = useAuth();

  // Current calendar view state (defaults to today's month/year)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Selected date ISO format helper (YYYY-MM-DD)
  const formatIsoDate = (y, m, d) => {
    const mm = (m + 1) < 10 ? `0${m + 1}` : `${m + 1}`;
    const dd = d < 10 ? `0${d}` : `${d}`;
    return `${y}-${mm}-${dd}`;
  };

  const todayStr = formatIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [editingSlotDateStr, setEditingSlotDateStr] = useState(null);

  const makeDefaultSlot = (dateStr) => ({
    ...DEFAULT_WEEK_SLOT,
    id: `s_${dateStr}_${Date.now()}`,
    date: dateStr,
  });

  // Calculate 7 days for the week containing the selected date (Monday to Sunday)
  const getWeekDatesContainingSelectedDate = (dateStr) => {
    const selected = new Date(`${dateStr}T00:00:00`);
    const day = selected.getDay();
    // Monday as start of week (Sunday = 0 -> -6, Monday = 1 -> 0, etc.)
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(selected);
    monday.setDate(selected.getDate() + diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const cellDateStr = formatIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
      const dayIndex = date.getDay();

      weekDates.push({
        dayIndex,
        dayName: WEEK_DAYS_FULL[dayIndex],
        date,
        dateStr: cellDateStr,
        isPast: cellDateStr < todayStr,
        isToday: cellDateStr === todayStr,
        isSelected: cellDateStr === dateStr,
      });
    }
    return weekDates;
  };

  const currentWeekDates = getWeekDatesContainingSelectedDate(selectedDateStr);

  // Expanded slot IDs state for viewing time slots
  const [expandedSlotIds, setExpandedSlotIds] = useState({});

  // Floating Toast notification state
  const [toastInfo, setToastInfo] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToastInfo({ visible: true, message, type });
    setTimeout(() => {
      setToastInfo((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  const toggleExpandSlot = (slotId) => {
    setExpandedSlotIds((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
  };

  // Time slot modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const applyScheduleFromDb = (data) => {
    setSlotsByDate(data?.slotsByDate && typeof data.slotsByDate === 'object' ? data.slotsByDate : {});
  };

  const loadScheduleFromDb = async () => {
    if (!token) return;
    try {
      const response = await getVolunteerAvailabilitySchedule(token);
      applyScheduleFromDb(response?.data);
    } catch (err) {
      console.log('Error loading availability from DB:', err);
    }
  };

  useEffect(() => {
    loadScheduleFromDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Calendar generation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar grid matrix for currentYear & currentMonth
  const getCalendarDays = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        inMonth: false,
        isPast: true,
        dateStr: '',
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatIsoDate(currentYear, currentMonth, d);
      const isPast = dateStr < todayStr;
      days.push({
        day: d,
        inMonth: true,
        isPast,
        dateStr,
      });
    }

    // Next month padding
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let j = 1; j <= remaining; j++) {
      days.push({
        day: j,
        inMonth: false,
        isPast: true,
        dateStr: '',
      });
    }

    return days;
  };

  const getSlotsForDate = (dateStr, slotsMap) => {
    if (!dateStr || !slotsMap || typeof slotsMap !== 'object') return [];
    return Array.isArray(slotsMap[dateStr]) ? slotsMap[dateStr] : [];
  };

  const calendarGrid = getCalendarDays();
  const currentSelectedSlots = getSlotsForDate(selectedDateStr, slotsByDate);

  // Slot handlers
  const openAddSlotModal = (targetDateStr = selectedDateStr) => {
    if (targetDateStr < todayStr) {
      showToast('Cannot add availability slots for past dates.', 'error');
      return;
    }
    setEditingSlot(null);
    setEditingSlotDateStr(targetDateStr);
    setModalVisible(true);
  };

  const openEditSlotModal = (slot, targetDateStr = selectedDateStr) => {
    const dStr = slot?.date || targetDateStr;
    if (dStr < todayStr) {
      showToast('Cannot edit availability slots for past dates.', 'error');
      return;
    }
    setEditingSlot(slot);
    setEditingSlotDateStr(dStr);
    setModalVisible(true);
  };

  const persistSchedule = async (nextSlotsByDate) => {
    if (!token) {
      Alert.alert('Authentication Required', 'Please log in to save availability to the database.');
      return false;
    }

    const response = await saveVolunteerAvailabilitySchedule({ slotsByDate: nextSlotsByDate }, token);
    applyScheduleFromDb(response?.data || { slotsByDate: nextSlotsByDate });
    return true;
  };

  const handleSaveSlotModal = async (slotData) => {
    if (!token) {
      Alert.alert('Authentication Required', 'Please log in to save availability to the database.');
      return;
    }

    try {
      const dateStr = editingSlotDateStr || selectedDateStr;
      const existingSlots = getSlotsForDate(dateStr, slotsByDate);
      const nextSlot = { ...slotData, date: dateStr, id: editingSlot?.id || `s_${dateStr}_${Date.now()}` };
      const nextSlots = editingSlot
        ? existingSlots.map((slot) => (slot.id === editingSlot.id ? nextSlot : slot))
        : [...existingSlots, nextSlot];

      setSlotsByDate((prev) => ({ ...prev, [dateStr]: nextSlots }));

      const mongoId = editingSlot?.id || editingSlot?._id;
      const isExisting = mongoId && /^[a-fA-F0-9]{24}$/.test(String(mongoId));

      if (isExisting) {
        await updateVolunteerAvailabilitySlot(mongoId, nextSlot, token);
      } else {
        await createVolunteerAvailabilitySlot(nextSlot, token);
      }

      await loadScheduleFromDb();
      showToast('✨ Time slot saved successfully!');
    } catch (err) {
      console.error('Failed to save slot to DB:', err);
      showToast('❌ Failed to save slot: ' + (err.message || ''), 'error');
    }
  };

  const handleDeleteSlot = (slotId, targetDateStr = selectedDateStr) => {
    if (targetDateStr < todayStr) {
      showToast('Cannot delete availability slots for past dates.', 'error');
      return;
    }
    Alert.alert('Delete Slot', 'Are you sure you want to delete this time slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            if (slotId && /^[a-fA-F0-9]{24}$/.test(String(slotId))) {
              await deleteVolunteerAvailabilitySlot(slotId, token);
            } else {
              setSlotsByDate((prev) => {
                const next = { ...prev };
                const remaining = getSlotsForDate(targetDateStr, next).filter((s) => s.id !== slotId);
                if (remaining.length === 0) {
                  delete next[targetDateStr];
                } else {
                  next[targetDateStr] = remaining;
                }
                return next;
              });
            }
            await loadScheduleFromDb();
            showToast('🗑️ Slot deleted successfully.');
          } catch (err) {
            console.error('Failed to delete slot from DB:', err);
            showToast('❌ Failed to delete slot from database.', 'error');
          }
        },
      },
    ]);
  };

  // On Save: Only ticked dates get marked as available
  const handleSaveAll = async () => {
    try {
      const weekDateSet = new Set(currentWeekDates.map((day) => day.dateStr));
      const nextSlotsByDate = { ...slotsByDate };

      // For dates in the current week, if unticked (0 slots), remove them
      currentWeekDates.forEach((day) => {
        const daySlots = getSlotsForDate(day.dateStr, nextSlotsByDate);
        if (daySlots.length === 0) {
          delete nextSlotsByDate[day.dateStr];
        }
      });

      // Filter out any empty arrays
      Object.keys(nextSlotsByDate).forEach((dateKey) => {
        if (weekDateSet.has(dateKey) && (!Array.isArray(nextSlotsByDate[dateKey]) || nextSlotsByDate[dateKey].length === 0)) {
          delete nextSlotsByDate[dateKey];
        }
      });

      await persistSchedule(nextSlotsByDate);
      showToast('✨ Availability saved for ticked days this week');
    } catch (err) {
      console.error('Failed to save availability schedule:', err);
      showToast('❌ Failed to save availability: ' + (err.message || ''), 'error');
    }
  };

  // Toggle day checkbox in weekly schedule (ticking assigns default slot without filling form)
  const toggleWeekDayAvailable = (dateStr, isPast) => {
    if (isPast) {
      showToast('Cannot mark past dates as available.', 'error');
      return;
    }

    setSlotsByDate((prev) => {
      const next = { ...prev };
      const existing = getSlotsForDate(dateStr, next);
      if (existing.length > 0) {
        delete next[dateStr];
      } else {
        next[dateStr] = [makeDefaultSlot(dateStr)];
      }
      return next;
    });
  };

  const clearThisWeek = () => {
    setSlotsByDate((prev) => {
      const next = { ...prev };
      currentWeekDates.forEach((day) => {
        if (!day.isPast) {
          delete next[day.dateStr];
        }
      });
      return next;
    });
    showToast('Cleared ticked days for this week');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS?.bg || '#F6F9F6'} />

      {/* Floating Toast Notification Banner */}
      {toastInfo.visible && (
        <TouchableOpacity
          style={[
            styles.creativeToastBanner,
            toastInfo.type === 'error' && styles.creativeToastErrorBanner,
          ]}
          onPress={() => setToastInfo({ ...toastInfo, visible: false })}
          activeOpacity={0.9}
        >
          <Ionicons
            name={toastInfo.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.creativeToastText}>{toastInfo.message}</Text>
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={TEXT_DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Availability</Text>
          </View>
          <Ionicons name="calendar-outline" size={20} color={GREEN} />
        </View>

        <Text style={styles.headerSubtitle}>
          Set the days and times you're open for volunteer sessions.
        </Text>

        {/* Dynamic Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={20} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>

        {/* Week Day Labels */}
        <View style={styles.weekRow}>
          {WEEK_DAYS.map((d, i) => (
            <Text key={`${d}-${i}`} style={styles.weekDayLabel}>
              {d}
            </Text>
          ))}
        </View>

        {/* Dynamic Month Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarGrid.map((cell, index) => {
            const isSelected = cell.inMonth && cell.dateStr === selectedDateStr;
            const cellSlots = cell.inMonth ? getSlotsForDate(cell.dateStr, slotsByDate) : [];
            const isPast = !cell.inMonth || cell.dateStr < todayStr;
            const hasSlots = cell.inMonth && !isPast && cellSlots.length > 0;

            return (
              <TouchableOpacity
                key={`${cell.dateStr}-${index}`}
                style={[
                  styles.dateCell,
                  hasSlots && !isSelected && styles.dateCellHasRecord,
                  isSelected && styles.dateCellSelected,
                ]}
                onPress={() => {
                  if (cell.inMonth) {
                    setSelectedDateStr(cell.dateStr);
                  }
                }}
                disabled={!cell.inMonth}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateCellText,
                    (!cell.inMonth || cell.isPast) && styles.dateCellTextDisabled,
                    hasSlots && !isSelected && styles.dateCellTextHasRecord,
                    isSelected && styles.dateCellTextSelected,
                  ]}
                >
                  {cell.day}
                </Text>
                {hasSlots && (
                  <View style={styles.hasRecordBadge}>
                    <View style={[styles.hasRecordDot, isSelected && styles.hasRecordDotSelected]} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Date Header */}
        <View style={styles.selectedDateRow}>
          <Text style={styles.selectedDateText}>
            Selected Date: {selectedDateStr}
          </Text>

          {selectedDateStr >= todayStr ? (
            <TouchableOpacity
              style={styles.addSlotChip}
              onPress={() => openAddSlotModal(selectedDateStr)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={GREEN} />
              <Text style={styles.addSlotChipText}>Add slot</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.pastDateBadgeText}>Past Date (Disabled)</Text>
          )}
        </View>

        {/* Time Slots List for Selected Date */}
        {currentSelectedSlots.length === 0 ? (
          <View style={styles.emptySlotCard}>
            <Ionicons name="time-outline" size={24} color={TEXT_MUTED} />
            <Text style={styles.emptySlotText}>No time slots added for {selectedDateStr}</Text>
          </View>
        ) : (
          currentSelectedSlots.map((slot) => {
            const isExpanded = !!expandedSlotIds[slot.id];
            const generatedSlots = generateTimeSlots({
              startTime: slot.start,
              endTime: slot.end,
              slotDuration: slot.slotDuration || '1 hr',
              breakStart: slot.breakStart || '',
              breakEnd: slot.breakEnd || '',
              breakDuration: slot.breakDuration || '',
            });
            const validSlotsCount = generatedSlots.filter((s) => !s.isBreak).length;

            return (
              <View key={slot.id} style={styles.slotCardContainer}>
                <View style={styles.slotCard}>
                  <View style={styles.slotLeft}>
                    <View style={styles.slotDot} />
                    <View>
                      <View style={styles.slotTimeRow}>
                        <Text style={styles.slotText}>
                          {slot.start} – {slot.end}
                        </Text>
                        {slot.slotDuration ? (
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationBadgeText}>{slot.slotDuration}</Text>
                          </View>
                        ) : null}
                      </View>
                      {slot.date ? (
                        <Text style={styles.slotDateText}>Date: {slot.date}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Edit & Delete Action Buttons */}
                  <View style={styles.slotActions}>
                    <TouchableOpacity onPress={() => openEditSlotModal(slot, selectedDateStr)} activeOpacity={0.7}>
                      <Ionicons name="pencil-outline" size={18} color={TEXT_MUTED} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSlot(slot.id, selectedDateStr)} activeOpacity={0.7}>
                      <Ionicons name="trash-outline" size={18} color="#C0644A" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* View Time Slots Button */}
                <TouchableOpacity
                  style={styles.viewTimeSlotsCardBtn}
                  onPress={() => toggleExpandSlot(slot.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="eye-outline" size={15} color={GREEN} />
                  <Text style={styles.viewTimeSlotsCardBtnText}>
                    {isExpanded ? 'Hide Time Slots' : 'View Time Slots'} ({validSlotsCount} available)
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={GREEN}
                  />
                </TouchableOpacity>

                {/* Expanded Time Slots List */}
                {isExpanded && (
                  <View style={styles.expandedSlotsList}>
                    <Text style={styles.expandedSlotsTitle}>
                      Available Time Slots ({slot.start} – {slot.end}):
                    </Text>
                    {generatedSlots.length === 0 ? (
                      <Text style={styles.noExpandedSlotsText}>No sub-slots generated.</Text>
                    ) : (
                      generatedSlots.map((item, idx) => (
                        <View
                          key={item.id || idx}
                          style={[
                            styles.expandedSlotRow,
                            item.isBreak && styles.expandedBreakRow,
                          ]}
                        >
                          <View style={styles.expandedSlotTimeCol}>
                            <Ionicons
                              name={item.isBreak ? 'cafe-outline' : 'time-outline'}
                              size={14}
                              color={item.isBreak ? '#C0644A' : GREEN}
                            />
                            <Text
                              style={[
                                styles.expandedSlotTimeText,
                                item.isBreak && styles.expandedBreakTimeText,
                              ]}
                            >
                              {item.start} – {item.end}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.expandedSlotBadge,
                              item.isBreak && styles.expandedBreakBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.expandedSlotBadgeText,
                                item.isBreak && styles.expandedBreakBadgeText,
                              ]}
                            >
                              {item.isBreak ? 'Break' : item.duration}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* Break details badge */}
                {(slot.breakStart || slot.breakDuration) ? (
                  <View style={styles.breakCardRow}>
                    <Ionicons name="cafe-outline" size={14} color="#C0644A" />
                    <Text style={styles.breakCardText}>
                      Break: {slot.breakStart && slot.breakEnd ? `${slot.breakStart} - ${slot.breakEnd}` : 'Scheduled Break'}
                      {slot.breakDuration ? ` (${slot.breakDuration})` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        {selectedDateStr >= todayStr && (
          <TouchableOpacity
            style={styles.addSlotDashed}
            onPress={() => openAddSlotModal(selectedDateStr)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={TEXT_MUTED} />
            <Text style={styles.addSlotDashedText}>Add time slot</Text>
          </TouchableOpacity>
        )}

        {/* Weekly Schedule Section — Scoped to the week containing the selected date */}
        <View style={styles.weeklyScheduleSection}>
          <View style={styles.weeklyScheduleHeader}>
            <View style={styles.weeklyScheduleTitleRow}>
              <Ionicons name="calendar-outline" size={20} color={GREEN} />
              <Text style={styles.weeklyScheduleTitle}>Weekly Schedule</Text>
            </View>
            <TouchableOpacity onPress={clearThisWeek} activeOpacity={0.7}>
              <Text style={{ fontSize: 12, color: '#C0644A', fontWeight: '600' }}>Clear Week</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weeklyScheduleContent}>
            {/* Week Range Header */}
            <View style={styles.weekRangeHeader}>
              <Text style={styles.weekRangeText}>
                Week of {MONTH_NAMES[currentWeekDates[0].date.getMonth()]} {currentWeekDates[0].date.getDate()} – {MONTH_NAMES[currentWeekDates[6].date.getMonth()]} {currentWeekDates[6].date.getDate()}, {currentWeekDates[0].date.getFullYear()}
              </Text>
              <Text style={styles.weekRangeHint}>
                Tick days to set availability. Default slots are applied automatically and can be edited.
              </Text>
            </View>

            {currentWeekDates.map((dayData) => {
              const daySlots = getSlotsForDate(dayData.dateStr, slotsByDate);
              const isTicked = daySlots.length > 0;
              const isSelectedDay = dayData.isSelected;

              return (
                <View key={dayData.dateStr} style={styles.weeklyDayContainer}>
                  <View style={[
                    styles.weeklyDayRow,
                    isTicked && styles.weeklyDayRowSelected,
                    dayData.isPast && styles.weeklyDayRowDisabled,
                  ]}>
                    <TouchableOpacity
                      style={styles.weeklyDayCheckTouchable}
                      onPress={() => toggleWeekDayAvailable(dayData.dateStr, dayData.isPast)}
                      activeOpacity={0.7}
                      disabled={dayData.isPast}
                    >
                      <Ionicons
                        name={isTicked ? "checkbox" : "square-outline"}
                        size={22}
                        color={isTicked ? GREEN : (dayData.isPast ? '#CBD5CD' : TEXT_MUTED)}
                      />
                      <View style={styles.weeklyDayInfo}>
                        <Text style={[
                          styles.weeklyDayName,
                          isTicked && styles.weeklyDayNameSelected,
                          dayData.isPast && styles.weeklyDayNameDisabled,
                        ]}>
                          {dayData.dayName}, {MONTH_NAMES[dayData.date.getMonth()]} {dayData.date.getDate()}
                          {dayData.isToday ? ' (Today)' : ''}
                          {isSelectedDay && !dayData.isToday ? ' (Selected)' : ''}
                        </Text>
                        {dayData.isPast && (
                          <Text style={styles.weeklyDayDisabledText}>Past date</Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {isTicked && (
                      <View style={styles.weeklyDayBadge}>
                        <Text style={styles.weeklyDayBadgeText}>{daySlots.length} slot(s)</Text>
                      </View>
                    )}
                  </View>

                  {/* Render configured slots for ticked day */}
                  {isTicked && (
                    <View style={styles.weeklyDaySlots}>
                      {daySlots.map((slot, slotIdx) => (
                        <View key={slot.id || slotIdx} style={styles.weeklySlotItem}>
                          <View style={styles.weeklySlotInfo}>
                            <View style={styles.weeklySlotDot} />
                            <Text style={styles.weeklySlotText}>
                              {slot.start} – {slot.end}
                            </Text>
                            {slot.slotDuration && (
                              <View style={styles.weeklyDurationBadge}>
                                <Text style={styles.weeklyDurationBadgeText}>{slot.slotDuration}</Text>
                              </View>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <TouchableOpacity
                              style={styles.weeklyDayActionBtn}
                              onPress={() => openEditSlotModal(slot, dayData.dateStr)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="pencil-outline" size={16} color={GREEN} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.weeklySlotDeleteBtn}
                              onPress={() => handleDeleteSlot(slot.id, dayData.dateStr)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="close-outline" size={16} color="#C0644A" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={styles.addSlotMiniBtn}
                        onPress={() => openAddSlotModal(dayData.dateStr)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add-circle-outline" size={16} color={GREEN} />
                        <Text style={styles.addSlotMiniText}>Add another slot for this day</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAll} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Save Availability</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Standalone Add/Edit Time Slot Form Modal Component */}
      <AvailabilitySlotFormModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingSlotDateStr(null);
        }}
        onSave={handleSaveSlotModal}
        editingSlot={editingSlot}
        selectedDateStr={editingSlotDateStr || selectedDateStr}
        isWeeklySchedule={false}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <NavItem
          icon="view-dashboard-outline"
          label="Dashboard"
          onPress={() => onTabChange?.('dashboard')}
        />
        <NavItem
          icon="clipboard-list-outline"
          label="Requests"
          onPress={() => onTabChange?.('requests')}
        />
        <NavItem
          icon="calendar-blank-outline"
          label="Availability"
          active
          onPress={() => onTabChange?.('availability')}
        />
        <NavItem
          icon="message-outline"
          label="Messages"
          onPress={() => onTabChange?.('messages')}
        />
        <NavItem
          icon="account-outline"
          label="Profile"
          onPress={() => onTabChange?.('profile')}
        />
      </View>
    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress }) {
  const color = active ? GREEN : TEXT_MUTED;
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.activeNavIndicator]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const GREEN = '#2F6B47';
const GREEN_BG = '#EAF3ED';
const TEXT_DARK = '#1B3A24';
const TEXT_MUTED = '#6B8072';
const BORDER = '#E1EAE3';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 14 : 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dateCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  dateCellHasRecord: {
    backgroundColor: '#EAF3ED',
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  dateCellSelected: {
    backgroundColor: GREEN,
  },
  dateCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  dateCellTextHasRecord: {
    color: GREEN,
    fontWeight: '800',
  },
  dateCellTextDisabled: {
    color: '#CBD5CD',
  },
  dateCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  hasRecordBadge: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hasRecordDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: GREEN,
  },
  hasRecordDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  selectedDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  addSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  addSlotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  pastDateBadgeText: {
    fontSize: 11,
    color: '#9EAAA0',
    fontStyle: 'italic',
  },
  emptySlotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptySlotText: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 6,
  },
  slotCardContainer: {
    marginBottom: 10,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  slotDateText: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: GREEN_BG,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: GREEN,
  },
  breakCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -2,
    borderWidth: 1,
    borderColor: '#F7D6CF',
    borderTopWidth: 0,
    gap: 6,
  },
  breakCardText: {
    fontSize: 11,
    color: '#A8432A',
    fontWeight: '600',
  },
  viewTimeSlotsCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF3ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -2,
    borderWidth: 1,
    borderColor: '#C3D4C8',
    borderTopWidth: 0,
  },
  viewTimeSlotsCardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
    flex: 1,
    marginLeft: 6,
  },
  expandedSlotsList: {
    backgroundColor: '#FAFAF9',
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    gap: 6,
  },
  expandedSlotsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  noExpandedSlotsText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  expandedSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1EAE3',
  },
  expandedBreakRow: {
    backgroundColor: '#FDF2F0',
    borderColor: '#F7D6CF',
  },
  expandedSlotTimeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedSlotTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  expandedBreakTimeText: {
    color: '#A8432A',
  },
  expandedSlotBadge: {
    backgroundColor: GREEN_BG,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expandedBreakBadge: {
    backgroundColor: '#F7D6CF',
  },
  expandedSlotBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: GREEN,
  },
  expandedBreakBadgeText: {
    color: '#A8432A',
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addSlotDashed: {
    borderWidth: 1,
    borderColor: '#C3D4C8',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  addSlotDashedText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  weeklyScheduleSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 16,
  },
  weeklyScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyScheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyScheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  weeklyScheduleContent: {
    gap: 8,
  },
  weekRangeHeader: {
    backgroundColor: GREEN_BG,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  weekRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN,
  },
  weekRangeHint: {
    fontSize: 11,
    color: GREEN,
    marginTop: 2,
    opacity: 0.85,
  },
  weeklyDayContainer: {
    gap: 6,
    marginBottom: 6,
  },
  weeklyDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAF9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  weeklyDayRowSelected: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN,
  },
  weeklyDayRowDisabled: {
    backgroundColor: '#F3F4F3',
    opacity: 0.6,
  },
  weeklyDayCheckTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  weeklyDayInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  weeklyDayName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  weeklyDayNameSelected: {
    color: GREEN,
  },
  weeklyDayNameDisabled: {
    color: '#9CA3AF',
  },
  weeklyDayDisabledText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  weeklyDayBadge: {
    backgroundColor: GREEN_BG,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weeklyDayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: GREEN,
  },
  weeklyDaySlots: {
    gap: 6,
    paddingLeft: 12,
    marginTop: 4,
  },
  weeklySlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1EAE3',
  },
  weeklySlotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklySlotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  weeklySlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  weeklyDurationBadge: {
    backgroundColor: GREEN_BG,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  weeklyDurationBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: GREEN,
  },
  weeklyDayActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklySlotDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDF2F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSlotMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  addSlotMiniText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  saveButton: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creativeToastBanner: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 14 : 10,
    left: 18,
    right: 18,
    zIndex: 9999,
    backgroundColor: '#1B3A24',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: GREEN,
  },
  creativeToastErrorBanner: {
    backgroundColor: '#991B1B',
    borderColor: '#F87171',
  },
  creativeToastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  activeNavIndicator: {
    backgroundColor: GREEN_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
});
