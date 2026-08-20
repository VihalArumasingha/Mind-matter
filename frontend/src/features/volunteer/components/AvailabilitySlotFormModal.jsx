import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { generateTimeSlots } from '../utils/slotGenerator';

const GREEN = '#2F6B47';
const TEXT_DARK = '#1B3A24';
const TEXT_MUTED = '#6B8072';
const BORDER = '#E1EAE3';

const PRESET_SLOTS = [
  { start: '9:00 AM', end: '10:00 AM', duration: '1 hr' },
  { start: '10:30 AM', end: '12:00 PM', duration: '1.5 hrs' },
  { start: '1:00 PM', end: '2:30 PM', duration: '1.5 hrs' },
  { start: '2:30 PM', end: '4:00 PM', duration: '1.5 hrs' },
  { start: '4:00 PM', end: '5:30 PM', duration: '1.5 hrs' },
  { start: '6:00 PM', end: '7:30 PM', duration: '1.5 hrs' },
];

export default function AvailabilitySlotFormModal({
  visible,
  onClose,
  onSave,
  editingSlot,
  selectedDateStr,
}) {
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('9:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [slotDuration, setSlotDuration] = useState('1 hr');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [breakDuration, setBreakDuration] = useState('');
  const [showPreviewSlots, setShowPreviewSlots] = useState(true);

  const previewSlots = generateTimeSlots({
    startTime,
    endTime,
    slotDuration,
    breakStart,
    breakEnd,
    breakDuration,
  });

  useEffect(() => {
    if (editingSlot) {
      setSlotDate(editingSlot.date || selectedDateStr || '');
      setStartTime(editingSlot.start || '9:00 AM');
      setEndTime(editingSlot.end || '10:00 AM');
      setSlotDuration(editingSlot.slotDuration || '');
      setBreakStart(editingSlot.breakStart || '');
      setBreakEnd(editingSlot.breakEnd || '');
      setBreakDuration(editingSlot.breakDuration || '');
    } else {
      setSlotDate(selectedDateStr || '');
      setStartTime('9:00 AM');
      setEndTime('10:00 AM');
      setSlotDuration('1 hr');
      setBreakStart('');
      setBreakEnd('');
      setBreakDuration('');
    }
  }, [editingSlot, selectedDateStr, visible]);

  const handleSelectPresetSlot = (preset) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
    if (preset.duration) {
      setSlotDuration(preset.duration);
    }
  };

  const handleSave = () => {
    if (!startTime.trim() || !endTime.trim()) {
      Alert.alert('Required', 'Please specify both start and end times.');
      return;
    }

    const slotPayload = {
      id: editingSlot ? editingSlot.id : `s_${Date.now()}`,
      date: slotDate.trim() || selectedDateStr,
      start: startTime.trim(),
      end: endTime.trim(),
      slotDuration: slotDuration.trim(),
      breakStart: breakStart.trim(),
      breakEnd: breakEnd.trim(),
      breakDuration: breakDuration.trim(),
    };

    onSave(slotPayload);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
              </Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {/* Date Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available Date</Text>
              <TextInput
                style={styles.textInput}
                value={slotDate}
                onChangeText={setSlotDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={TEXT_MUTED}
              />
            </View>

            {/* Presets */}
            <Text style={styles.inputLabel}>Presets</Text>
            <View style={styles.presetsGrid}>
              {PRESET_SLOTS.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.presetChip,
                    startTime === p.start && endTime === p.end && styles.presetChipActive,
                  ]}
                  onPress={() => handleSelectPresetSlot(p)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      startTime === p.start && endTime === p.end && styles.presetChipTextActive,
                    ]}
                  >
                    {p.start} - {p.end}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Start & End Times */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="e.g. 9:00 AM"
                  placeholderTextColor={TEXT_MUTED}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="e.g. 10:30 AM"
                  placeholderTextColor={TEXT_MUTED}
                />
              </View>
            </View>

            {/* Slot Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Slot Duration</Text>
              <TextInput
                style={styles.textInput}
                value={slotDuration}
                onChangeText={setSlotDuration}
                placeholder="e.g. 1 hr 30 mins"
                placeholderTextColor={TEXT_MUTED}
              />
            </View>

            {/* Break Time Section */}
            <Text style={[styles.inputLabel, { marginTop: 4, fontWeight: '700', color: TEXT_DARK }]}>
              Break Time (Optional)
            </Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Break Start</Text>
                <TextInput
                  style={styles.textInput}
                  value={breakStart}
                  onChangeText={setBreakStart}
                  placeholder="e.g. 10:00 AM"
                  placeholderTextColor={TEXT_MUTED}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.inputLabel}>Break End</Text>
                <TextInput
                  style={styles.textInput}
                  value={breakEnd}
                  onChangeText={setBreakEnd}
                  placeholder="e.g. 10:15 AM"
                  placeholderTextColor={TEXT_MUTED}
                />
              </View>
            </View>

            {/* Break Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Break Duration</Text>
              <TextInput
                style={styles.textInput}
                value={breakDuration}
                onChangeText={setBreakDuration}
                placeholder="e.g. 15 mins"
                placeholderTextColor={TEXT_MUTED}
              />
            </View>

            {/* View Generated Time Slots Toggle Button */}
            <TouchableOpacity
              style={styles.viewSlotsToggleBtn}
              onPress={() => setShowPreviewSlots(!showPreviewSlots)}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={16} color={GREEN} />
              <Text style={styles.viewSlotsToggleText}>
                {showPreviewSlots ? 'Hide Generated Time Slots' : 'View Generated Time Slots'} ({previewSlots.filter(s => !s.isBreak).length} available)
              </Text>
              <Ionicons
                name={showPreviewSlots ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={GREEN}
              />
            </TouchableOpacity>

            {/* Live Generated Slots Preview Container */}
            {showPreviewSlots && previewSlots.length > 0 && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>All Available Time Slots ({startTime} - {endTime}):</Text>
                <View style={styles.previewGrid}>
                  {previewSlots.map((s, idx) => (
                    <View
                      key={s.id || idx}
                      style={[
                        styles.previewSlotChip,
                        s.isBreak && styles.previewBreakChip,
                      ]}
                    >
                      <Ionicons
                        name={s.isBreak ? 'cafe-outline' : 'checkmark-circle-outline'}
                        size={13}
                        color={s.isBreak ? '#C0644A' : GREEN}
                      />
                      <Text
                        style={[
                          styles.previewSlotText,
                          s.isBreak && styles.previewBreakText,
                        ]}
                      >
                        {s.isBreak ? `Break: ${s.start} - ${s.end}` : `${s.start} - ${s.end} (${s.duration})`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Save Slot</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT_DARK,
    backgroundColor: '#F9FAF9',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#F0F6F1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  presetChipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  presetChipText: {
    fontSize: 11,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  viewSlotsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF3ED',
    borderWidth: 1,
    borderColor: '#C3D4C8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  viewSlotsToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
    flex: 1,
    marginLeft: 8,
  },
  previewContainer: {
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  previewGrid: {
    flexDirection: 'column',
    gap: 6,
  },
  previewSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4E3D8',
    gap: 8,
  },
  previewBreakChip: {
    backgroundColor: '#FDF2F0',
    borderColor: '#F7D6CF',
  },
  previewSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  previewBreakText: {
    color: '#A8432A',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: GREEN,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
