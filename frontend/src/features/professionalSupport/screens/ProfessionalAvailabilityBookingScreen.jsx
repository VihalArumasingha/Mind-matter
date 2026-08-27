import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { getProfessionalAvailability, createProfessionalBooking } from '../services/professionalService'
import { generateTimeSlots } from '../../volunteer/utils/slotGenerator'
import { useAuth } from '../../../context/AuthContext'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Format: "Wed, 27 Aug"
const formatDisplayDate = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const dayName = DAY_NAMES_SHORT[date.getDay()]
    return `${dayName}, ${d} ${MONTH_NAMES_SHORT[m - 1]}`
}

const ProfessionalAvailabilityBookingScreen = ({ route, navigation }) => {
    const { professional } = route.params || {}
    const { token, user } = useAuth()

    const today = new Date()
    const formatIsoDate = (y, m, d) => {
        const mm = (m + 1) < 10 ? `0${m + 1}` : `${m + 1}`
        const dd = d < 10 ? `0${d}` : `${d}`
        return `${y}-${mm}-${dd}`
    }

    const todayStr = formatIsoDate(today.getFullYear(), today.getMonth(), today.getDate())

    // Calendar state
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [selectedDateStr, setSelectedDateStr] = useState(todayStr)
    const [dateSearchInput, setDateSearchInput] = useState('')

    // Availability state
    const [isLoading, setIsLoading] = useState(true)
    const [availabilityData, setAvailabilityData] = useState({
        isAvailable: true,
        slotsByDate: {},
        availableDates: [],
        bookedTimeRanges: [],
    })
    const [selectedSlot, setSelectedSlot] = useState(null)

    // Booking form state (step 2)
    const [showBookingForm, setShowBookingForm] = useState(false)
    const [formFullName, setFormFullName] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formReason, setFormReason] = useState('')
    const [formNotes, setFormNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toastMessage, setToastMessage] = useState(null)

    // Prefill name from logged-in user
    useEffect(() => {
        if (user?.name) setFormFullName(user.name)
    }, [user])

    const fetchAvailability = async () => {
        if (!professional?._id) return
        try {
            setIsLoading(true)
            console.log('[Availability] Fetching for professional ID:', professional._id)
            const res = await getProfessionalAvailability(token, professional._id)
            console.log('[Availability] Response:', res)
            console.log('[Availability] Booked time ranges:', res.data?.bookedTimeRanges)
            if (res.success && res.data) {
                setAvailabilityData(res.data)
                // Keep the currently selected date if it's still valid
                if (res.data.availableDates && res.data.availableDates.length > 0) {
                    // Only change date if current selection is no longer available
                    if (!res.data.slotsByDate[selectedDateStr] || res.data.slotsByDate[selectedDateStr].length === 0) {
                        const sorted = [...res.data.availableDates].sort()
                        const firstUpcoming = sorted.find(d => d >= todayStr) || sorted[0]
                        if (firstUpcoming) {
                            setSelectedDateStr(firstUpcoming)
                            const [y, m] = firstUpcoming.split('-').map(Number)
                            if (y && m) {
                                setCurrentYear(y)
                                setCurrentMonth(m - 1)
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[ProfessionalAvailabilityBooking] Fetch Error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAvailability()
    }, [professional?._id, token])

    const showToast = (msg) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 3200)
    }

    // Calendar helpers
    const handlePrevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1) }
        else setCurrentMonth(currentMonth - 1)
    }

    const handleNextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1) }
        else setCurrentMonth(currentMonth + 1)
    }

    const getCalendarDays = () => {
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()
        const days = []

        for (let i = firstDayIndex - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, inMonth: false, isPast: true, dateStr: '' })
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = formatIsoDate(currentYear, currentMonth, d)
            days.push({ day: d, inMonth: true, isPast: dateStr < todayStr, dateStr })
        }
        const totalCells = Math.ceil(days.length / 7) * 7
        for (let j = 1; j <= totalCells - days.length; j++) {
            days.push({ day: j, inMonth: false, isPast: true, dateStr: '' })
        }
        return days
    }

    const calendarGrid = getCalendarDays()
    const slotsForSelectedDate = availabilityData.slotsByDate[selectedDateStr] || []
    const hasSlotsForSelectedDate = slotsForSelectedDate.length > 0

    const generatedSubSlots = []
    const bookedSubSlots = []
    
    if (hasSlotsForSelectedDate) {
        console.log('[Slot Generation] Generating slots for date:', selectedDateStr)
        console.log('[Slot Generation] Booked time ranges:', availabilityData.bookedTimeRanges)
        
        slotsForSelectedDate.forEach((parentSlot) => {
            const subSlots = generateTimeSlots({
                startTime: parentSlot.start,
                endTime: parentSlot.end,
                slotDuration: parentSlot.slotDuration || '1 hr',
                breakStart: parentSlot.breakStart || '',
                breakEnd: parentSlot.breakEnd || '',
                breakDuration: parentSlot.breakDuration || '',
            })
            
            console.log('[Slot Generation] Parent slot:', parentSlot.start, '-', parentSlot.end, 'Generated sub-slots:', subSlots.length)
            
            subSlots.forEach(slot => {
                if (!slot.isBreak) {
                    // Check if this sub-slot is already booked
                    const isBooked = availabilityData.bookedTimeRanges?.some(bookedRange => 
                        bookedRange.date === selectedDateStr &&
                        slot.start < bookedRange.endTime && 
                        slot.end > bookedRange.startTime
                    )
                    
                    const slotWithMeta = { ...slot, parentSlotId: parentSlot.id, isBooked }
                    
                    if (isBooked) {
                        bookedSubSlots.push(slotWithMeta)
                        console.log(`[Slot Filter] Marked as booked: ${selectedDateStr} ${slot.start}-${slot.end}`)
                    } else {
                        generatedSubSlots.push(slotWithMeta)
                        console.log(`[Slot Filter] Available: ${selectedDateStr} ${slot.start}-${slot.end}`)
                    }
                }
            })
        })
        
        console.log('[Slot Generation] Total available slots:', generatedSubSlots.length, 'Booked slots:', bookedSubSlots.length)
    }

    const handleDateSearch = () => {
        if (!dateSearchInput.trim()) return
        const trimmed = dateSearchInput.trim()
        let targetDate = trimmed
        if (!trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const parsed = new Date(trimmed)
            if (!isNaN(parsed.getTime())) {
                targetDate = formatIsoDate(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
            } else {
                Alert.alert('Invalid Date', 'Please enter date in YYYY-MM-DD format.')
                return
            }
        }
        const [y, m] = targetDate.split('-').map(Number)
        if (y && m) {
            setCurrentYear(y); setCurrentMonth(m - 1)
            setSelectedDateStr(targetDate); setSelectedSlot(null)
        }
    }

    // Opens booking form step
    const handleOpenBookingForm = () => {
        if (!selectedSlot) {
            Alert.alert('Select Time Slot', 'Please select an available time slot first.')
            return
        }
        setShowBookingForm(true)
    }

    // Submit booking to backend
    const handleSubmitBooking = async () => {
        if (!formFullName.trim()) {
            Alert.alert('Full Name Required', 'Please enter your full name.')
            return
        }
        if (!formPhone.trim()) {
            Alert.alert('Phone Required', 'Please enter your phone number.')
            return
        }
        if (!formReason.trim()) {
            Alert.alert('Reason Required', 'Please enter a reason for the session.')
            return
        }

        try {
            setIsSubmitting(true)
            console.log('[Booking] Submitting booking for professional:', professional._id, 'slot:', selectedDateStr, selectedSlot.start, '-', selectedSlot.end)
            await createProfessionalBooking(token, {
                professionalId: professional._id,
                professionalName: professional.fullName,
                profession: professional.profession,
                date: selectedDateStr,
                startTime: selectedSlot.start,
                endTime: selectedSlot.end,
                fullName: formFullName.trim(),
                phone: formPhone.trim(),
                reason: formReason.trim(),
                notes: formNotes.trim(),
            })
            console.log('[Booking] Booking successful, refreshing availability...')
            // Refresh availability to remove the booked slot
            await fetchAvailability()
            setShowBookingForm(false)
            setSelectedSlot(null)
            showToast('🎉 Booking submitted! You will be notified once approved.')
            // Navigate back to the previous screen
            navigation.goBack()
        } catch (err) {
            console.error('[Submit Booking Error]', err)
            Alert.alert('Booking Failed', err.message || 'Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── BOOKING FORM VIEW (Step 2) ──────────────────────────────────────────
    if (showBookingForm && selectedSlot) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8FAF5" />
                {toastMessage && (
                    <View style={styles.toastBanner}>
                        <Icon name="check-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </View>
                )}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowBookingForm(false)} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#4E8C4A" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Booking Details</Text>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        style={styles.container}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Green Summary Card — matches screenshot */}
                        <View style={styles.bookingSummaryCard}>
                            <Text style={styles.bookingSummaryName}>{professional?.fullName}</Text>
                            <Text style={styles.bookingSummaryProfession}>{professional?.profession}</Text>
                            <Text style={styles.bookingSummarySlot}>
                                {formatDisplayDate(selectedDateStr)} · {selectedSlot.start} - {selectedSlot.end}
                            </Text>
                        </View>

                        {/* Full Name */}
                        <Text style={styles.fieldLabel}>Full name</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="Your full name"
                            placeholderTextColor="#9CA3AF"
                            value={formFullName}
                            onChangeText={setFormFullName}
                            returnKeyType="next"
                        />

                        {/* Phone Number */}
                        <Text style={styles.fieldLabel}>Phone number</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="e.g. 077 123 4567"
                            placeholderTextColor="#9CA3AF"
                            value={formPhone}
                            onChangeText={setFormPhone}
                            keyboardType="phone-pad"
                            returnKeyType="next"
                        />

                        {/* Reason for Session */}
                        <Text style={styles.fieldLabel}>Reason for session</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="e.g. Anxiety, stress management"
                            placeholderTextColor="#9CA3AF"
                            value={formReason}
                            onChangeText={setFormReason}
                            returnKeyType="next"
                        />

                        {/* Additional Notes */}
                        <Text style={styles.fieldLabel}>
                            Additional notes <Text style={styles.fieldLabelOptional}>(optional)</Text>
                        </Text>
                        <TextInput
                            style={[styles.fieldInput, styles.fieldInputMultiline]}
                            placeholder="Anything else the professional should know"
                            placeholderTextColor="#9CA3AF"
                            value={formNotes}
                            onChangeText={setFormNotes}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        {/* Confirm Booking Button */}
                        <TouchableOpacity
                            style={[styles.bookConfirmBtn, isSubmitting && styles.bookConfirmBtnDisabled]}
                            onPress={handleSubmitBooking}
                            disabled={isSubmitting}
                            activeOpacity={0.85}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.bookConfirmBtnText}>Confirm Booking</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        )
    }

    // ── CALENDAR + SLOT VIEW (Step 1) ─────────────────────────────────────
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAF5" />

            {toastMessage && (
                <View style={styles.toastBanner}>
                    <Icon name="check-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </View>
            )}

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#4E8C4A" />
                </TouchableOpacity>
                <Text style={styles.title}>Book Appointment</Text>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Professional Summary Card */}
                {professional && (
                    <View style={styles.profCard}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{professional.fullName?.charAt(0) || 'P'}</Text>
                        </View>
                        <View style={styles.profInfo}>
                            <Text style={styles.profName}>{professional.fullName}</Text>
                            <Text style={styles.profSpecialization}>{professional.profession}</Text>
                            <Text style={styles.profSubDetail}>{professional.specialization}</Text>
                            <Text style={styles.profMeta}>
                                {professional.expYears} yrs experience • License {professional.licenseNum}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Search Date Bar */}
                <View style={styles.searchDateRow}>
                    <Icon name="event" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchDateInput}
                        placeholder="Search Date (YYYY-MM-DD)"
                        placeholderTextColor="#9CA3AF"
                        value={dateSearchInput}
                        onChangeText={setDateSearchInput}
                        onSubmitEditing={handleDateSearch}
                    />
                    <TouchableOpacity style={styles.searchDateBtn} onPress={handleDateSearch}>
                        <Text style={styles.searchDateBtnText}>Go</Text>
                    </TouchableOpacity>
                </View>

                {/* Month Navigation */}
                <View style={styles.monthHeader}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                        <Icon name="chevron-left" size={24} color="#2D5A27" />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                        <Icon name="chevron-right" size={24} color="#2D5A27" />
                    </TouchableOpacity>
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4E8C4A' }]} />
                        <Text style={styles.legendText}>Available</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.legendText}>Not Available</Text>
                    </View>
                </View>

                {/* Week Labels */}
                <View style={styles.weekRow}>
                    {WEEK_DAYS.map((day, idx) => (
                        <Text key={idx} style={styles.weekDayLabel}>{day}</Text>
                    ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                    {calendarGrid.map((cell, index) => {
                        if (!cell.inMonth) {
                            return <View key={index} style={[styles.dateCell, styles.dateCellOutside]} />
                        }
                        const cellSlots = availabilityData.slotsByDate[cell.dateStr] || []
                        const hasAvailability = cellSlots.length > 0
                        const isSelected = cell.dateStr === selectedDateStr
                        const isPast = cell.isPast

                        return (
                            <TouchableOpacity
                                key={index}
                                disabled={isPast}
                                style={[
                                    styles.dateCell,
                                    isPast && styles.dateCellPast,
                                    hasAvailability && !isSelected && styles.dateCellAvailable,
                                    !hasAvailability && !isPast && !isSelected && styles.dateCellUnavailable,
                                    isSelected && styles.dateCellSelected,
                                ]}
                                onPress={() => { setSelectedDateStr(cell.dateStr); setSelectedSlot(null) }}
                            >
                                <Text style={[
                                    styles.dateCellText,
                                    isPast && styles.dateCellTextPast,
                                    hasAvailability && !isSelected && styles.dateCellTextAvailable,
                                    !hasAvailability && !isPast && !isSelected && styles.dateCellTextUnavailable,
                                    isSelected && styles.dateCellTextSelected,
                                ]}>
                                    {cell.day}
                                </Text>
                                {hasAvailability && !isPast && <View style={styles.availDot} />}
                                {!hasAvailability && !isPast && <View style={styles.unavailDot} />}
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* Selected Date Banner */}
                <View style={styles.selectedDateBanner}>
                    <Text style={styles.selectedDateTitle}>
                        {formatDisplayDate(selectedDateStr)}
                    </Text>
                    {hasSlotsForSelectedDate ? (
                        <View style={styles.availableBadge}>
                            <Icon name="check-circle" size={14} color="#4E8C4A" />
                            <Text style={styles.availableBadgeText}>
                                {generatedSubSlots.length} available, {bookedSubSlots.length} booked
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.unavailableBadge}>
                            <Icon name="error-outline" size={14} color="#DC2626" />
                            <Text style={styles.unavailableBadgeText}>Not Available</Text>
                        </View>
                    )}
                </View>

                {/* Slots Section */}
                <View style={styles.slotsSection}>
                    <Text style={styles.sectionHeaderTitle}>Available Time Slots</Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#4E8C4A" />
                            <Text style={styles.loadingText}>Loading slots...</Text>
                        </View>
                    ) : !hasSlotsForSelectedDate ? (
                        <View style={styles.unavailAlertBox}>
                            <Icon name="event-busy" size={32} color="#DC2626" style={{ marginBottom: 6 }} />
                            <Text style={styles.unavailAlertTitle}>Professional Not Available</Text>
                            <Text style={styles.unavailAlertSubtitle}>
                                {professional?.fullName || 'This professional'} has not set any availability for {selectedDateStr}.
                            </Text>
                            <Text style={styles.unavailAlertHint}>
                                Tip: Pick a date highlighted in GREEN on the calendar.
                            </Text>
                        </View>
                    ) : (generatedSubSlots.length === 0 && bookedSubSlots.length === 0) ? (
                        <View style={styles.unavailAlertBox}>
                            <Icon name="schedule" size={28} color="#D97706" />
                            <Text style={[styles.unavailAlertTitle, { color: '#B45309' }]}>No Open Slots</Text>
                            <Text style={styles.unavailAlertSubtitle}>
                                All slots for this date are unavailable.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.slotGrid}>
                            {/* Available slots */}
                            {generatedSubSlots.map((slot, index) => {
                                const isSelected = selectedSlot?.id === slot.id
                                return (
                                    <TouchableOpacity
                                        key={`available-${index}`}
                                        style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                                        onPress={() => setSelectedSlot(slot)}
                                    >
                                        <Icon
                                            name={isSelected ? 'check-circle' : 'schedule'}
                                            size={18}
                                            color={isSelected ? '#FFFFFF' : '#4E8C4A'}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={[
                                            styles.slotChipText,
                                            isSelected && styles.slotChipTextSelected,
                                        ]}>
                                            {slot.start} – {slot.end}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                            
                            {/* Booked slots - visually different and not clickable */}
                            {bookedSubSlots.map((slot, index) => (
                                <TouchableOpacity
                                    key={`booked-${index}`}
                                    style={[styles.slotChip, styles.slotChipBooked]}
                                    onPress={() => {
                                        Alert.alert('Slot Already Booked', 'This time slot is already booked. Please select a different time.')
                                    }}
                                    activeOpacity={1}
                                >
                                    <Icon
                                        name="block"
                                        size={18}
                                        color="#9CA3AF"
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={styles.slotChipTextBooked}>
                                        {slot.start} – {slot.end}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Book Session Button → opens form */}
                <TouchableOpacity
                    style={[
                        styles.bookConfirmBtn,
                        (!hasSlotsForSelectedDate || !selectedSlot) && styles.bookConfirmBtnDisabled,
                    ]}
                    disabled={!hasSlotsForSelectedDate || !selectedSlot}
                    onPress={handleOpenBookingForm}
                >
                    <Text style={styles.bookConfirmBtnText}>
                        {selectedSlot ? `Book Session · ${selectedSlot.start}` : 'Select a Time Slot'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAF5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E8ECE6',
        backgroundColor: '#FFFFFF',
    },
    backButton: { marginRight: 12, padding: 4 },
    title: { fontSize: 22, fontWeight: '800', color: '#2D5A27', letterSpacing: -0.3 },
    container: { flex: 1 },
    scrollContent: { padding: 18, paddingBottom: 48 },

    // ── Professional card ──
    profCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E8ECE6',
    },
    avatar: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#4E8C4A',
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    avatarText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    profInfo: { flex: 1, justifyContent: 'center' },
    profName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
    profSpecialization: { fontSize: 14, fontWeight: '600', color: '#4E8C4A', marginBottom: 2 },
    profSubDetail: { fontSize: 12, color: '#4B5563' },
    profMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },

    // ── Date search ──
    searchDateRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
        marginBottom: 16, borderWidth: 1, borderColor: '#E8ECE6',
    },
    searchDateInput: { flex: 1, fontSize: 14, color: '#1F2937' },
    searchDateBtn: {
        backgroundColor: '#4E8C4A', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 6,
    },
    searchDateBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

    // ── Calendar ──
    monthHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12,
        backgroundColor: '#FFFFFF', borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 10,
        borderWidth: 1, borderColor: '#E8ECE6',
    },
    monthNavBtn: { padding: 4 },
    monthTitle: { fontSize: 17, fontWeight: '700', color: '#2D5A27' },
    legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    legendText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
    weekDayLabel: { width: 40, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#6B7280' },
    calendarGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        backgroundColor: '#FFFFFF', borderRadius: 16,
        padding: 8, marginBottom: 16,
        borderWidth: 1, borderColor: '#E8ECE6',
    },
    dateCell: {
        width: '14.28%', height: 48,
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, marginVertical: 2, position: 'relative',
    },
    dateCellOutside: { backgroundColor: 'transparent' },
    dateCellPast: { opacity: 0.3 },
    dateCellAvailable: { backgroundColor: '#E8F5E9' },
    dateCellUnavailable: { backgroundColor: '#FEF2F2' },
    dateCellSelected: { backgroundColor: '#2D5A27', borderWidth: 2, borderColor: '#1E3A1A' },
    dateCellText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    dateCellTextPast: { color: '#9CA3AF' },
    dateCellTextAvailable: { color: '#2E7D32', fontWeight: '700' },
    dateCellTextUnavailable: { color: '#DC2626' },
    dateCellTextSelected: { color: '#FFFFFF', fontWeight: '800' },
    availDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#2E7D32', position: 'absolute', bottom: 4 },
    unavailDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444', position: 'absolute', bottom: 4 },

    // ── Date banner ──
    selectedDateBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
        marginBottom: 16, borderWidth: 1, borderColor: '#E8ECE6',
    },
    selectedDateTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    availableBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    availableBadgeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
    unavailableBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    unavailableBadgeText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },

    // ── Slots ──
    slotsSection: { marginBottom: 20 },
    sectionHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
    loadingContainer: { paddingVertical: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    loadingText: { color: '#6B7280', fontSize: 14 },
    unavailAlertBox: {
        backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: '#F87171',
        borderRadius: 16, padding: 20, alignItems: 'center',
    },
    unavailAlertTitle: { fontSize: 17, fontWeight: '800', color: '#B91C1C', marginBottom: 4 },
    unavailAlertSubtitle: { fontSize: 13, color: '#7F1D1D', textAlign: 'center', lineHeight: 18, marginBottom: 8 },
    unavailAlertHint: { fontSize: 12, color: '#991B1B', fontWeight: '600', textAlign: 'center' },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C8D5C2',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4,
    },
    slotChipSelected: { backgroundColor: '#4E8C4A', borderColor: '#4E8C4A' },
    slotChipBooked: {
        backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#D1D5DB',
        opacity: 0.6,
    },
    slotChipText: { fontSize: 14, fontWeight: '600', color: '#2D5A27' },
    slotChipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
    slotChipTextBooked: { fontSize: 14, fontWeight: '500', color: '#9CA3AF', textDecorationLine: 'line-through' },

    // ── Main confirm button ──
    bookConfirmBtn: {
        backgroundColor: '#4E8C4A', borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#4E8C4A', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
    },
    bookConfirmBtnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0, elevation: 0 },
    bookConfirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    // ── Toast ──
    toastBanner: {
        position: 'absolute', top: 10, left: 20, right: 20, zIndex: 999,
        backgroundColor: '#2E7D32', paddingVertical: 12, paddingHorizontal: 16,
        borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
    },
    toastText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    // ── Booking form (Step 2) ──
    bookingSummaryCard: {
        backgroundColor: '#D4EDDA',
        borderRadius: 14,
        padding: 18,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#A8D5B3',
    },
    bookingSummaryName: { fontSize: 18, fontWeight: '800', color: '#1A3C1E', marginBottom: 2 },
    bookingSummaryProfession: { fontSize: 14, fontWeight: '600', color: '#2D6A35', marginBottom: 6 },
    bookingSummarySlot: { fontSize: 13, color: '#2D5A27', fontWeight: '500' },

    fieldLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
    fieldLabelOptional: { fontWeight: '400', color: '#6B7280' },
    fieldInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#111827',
        marginBottom: 20,
    },
    fieldInputMultiline: {
        height: 110,
        paddingTop: 14,
    },
})

export default ProfessionalAvailabilityBookingScreen
