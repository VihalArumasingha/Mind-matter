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
    TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { getProfessionalAvailability } from '../services/professionalService'
import { generateTimeSlots } from '../../volunteer/utils/slotGenerator'
import { useAuth } from '../../../context/AuthContext'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const ProfessionalAvailabilityBookingScreen = ({ route, navigation }) => {
    const { professional } = route.params || {}
    const { token } = useAuth()

    const today = new Date()
    const formatIsoDate = (y, m, d) => {
        const mm = (m + 1) < 10 ? `0${m + 1}` : `${m + 1}`
        const dd = d < 10 ? `0${d}` : `${d}`
        return `${y}-${mm}-${dd}`
    }

    const todayStr = formatIsoDate(today.getFullYear(), today.getMonth(), today.getDate())

    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [selectedDateStr, setSelectedDateStr] = useState(todayStr)
    const [dateSearchInput, setDateSearchInput] = useState('')

    const [isLoading, setIsLoading] = useState(true)
    const [availabilityData, setAvailabilityData] = useState({
        isAvailable: true,
        slotsByDate: {},
        availableDates: []
    })
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [toastMessage, setToastMessage] = useState(null)

    const fetchAvailability = async () => {
        if (!professional?._id) return
        try {
            setIsLoading(true)
            const res = await getProfessionalAvailability(token, professional._id)
            if (res.success && res.data) {
                setAvailabilityData(res.data)

                // If professional has available dates, select the earliest upcoming available date
                if (res.data.availableDates && res.data.availableDates.length > 0) {
                    const sortedDates = [...res.data.availableDates].sort()
                    const firstUpcoming = sortedDates.find(d => d >= todayStr) || sortedDates[0]
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
        } catch (err) {
            console.error('[ProfessionalAvailabilityBooking] Fetch Error:', err)
            Alert.alert('Error', 'Failed to load professional availability.')
        } finally {
            setIsLoading(false)
        }
    }


    useEffect(() => {
        fetchAvailability()
    }, [professional?._id, token])

    const showToast = (msg) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 3000)
    }

    // Calendar grid generation
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    const getCalendarDays = () => {
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

        const days = []

        // Prev month padding
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            days.push({
                day: daysInPrevMonth - i,
                inMonth: false,
                isPast: true,
                dateStr: ''
            })
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = formatIsoDate(currentYear, currentMonth, d)
            const isPast = dateStr < todayStr
            days.push({
                day: d,
                inMonth: true,
                isPast,
                dateStr
            })
        }

        // Next month padding
        const totalCells = Math.ceil(days.length / 7) * 7
        const remaining = totalCells - days.length
        for (let j = 1; j <= remaining; j++) {
            days.push({
                day: j,
                inMonth: false,
                isPast: true,
                dateStr: ''
            })
        }

        return days
    }

    const calendarGrid = getCalendarDays()

    // Slots for currently selected date
    const slotsForSelectedDate = availabilityData.slotsByDate[selectedDateStr] || []
    const hasSlotsForSelectedDate = slotsForSelectedDate.length > 0

    // Generate discrete time sub-slots from parent availability slots
    const generatedSubSlots = []
    if (hasSlotsForSelectedDate) {
        slotsForSelectedDate.forEach((parentSlot) => {
            const subSlots = generateTimeSlots({
                startTime: parentSlot.start,
                endTime: parentSlot.end,
                slotDuration: parentSlot.slotDuration || '1 hr',
                breakStart: parentSlot.breakStart || '',
                breakEnd: parentSlot.breakEnd || '',
                breakDuration: parentSlot.breakDuration || ''
            })

            subSlots.forEach((slot) => {
                if (!slot.isBreak) {
                    generatedSubSlots.push({
                        ...slot,
                        parentSlotId: parentSlot.id
                    })
                }
            })
        })
    }

    const handleDateSearch = () => {
        if (!dateSearchInput.trim()) return
        const trimmed = dateSearchInput.trim()
        // Accept YYYY-MM-DD or MM/DD/YYYY
        let targetDate = trimmed
        if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
            targetDate = trimmed
        } else {
            const parsed = new Date(trimmed)
            if (!isNaN(parsed.getTime())) {
                targetDate = formatIsoDate(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
            } else {
                Alert.alert('Invalid Date Format', 'Please enter date in YYYY-MM-DD format.')
                return
            }
        }

        const [y, m] = targetDate.split('-').map(Number)
        if (y && m) {
            setCurrentYear(y)
            setCurrentMonth(m - 1)
            setSelectedDateStr(targetDate)
            setSelectedSlot(null)
        }
    }

    const handleConfirmBooking = () => {
        if (!selectedSlot) {
            Alert.alert('Select Time Slot', 'Please select an available time slot before booking.')
            return
        }

        Alert.alert(
            'Confirm Session Booking',
            `Would you like to book a session with ${professional?.fullName || 'the professional'} on ${selectedDateStr} from ${selectedSlot.start} to ${selectedSlot.end}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Booking',
                    style: 'default',
                    onPress: () => {
                        showToast('🎉 Session successfully booked!')
                        setTimeout(() => {
                            navigation.goBack()
                        }, 1800)
                    }
                }
            ]
        )
    }

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
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
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

                {/* Calendar Section Header & Month Switcher */}
                <View style={styles.monthHeader}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                        <Icon name="chevron-left" size={24} color="#2D5A27" />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                        <Icon name="chevron-right" size={24} color="#2D5A27" />
                    </TouchableOpacity>
                </View>

                {/* Color Legend */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4E8C4A' }]} />
                        <Text style={styles.legendText}>Available</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.legendText}>Not Available / Unset</Text>
                    </View>
                </View>

                {/* Week Day Labels */}
                <View style={styles.weekRow}>
                    {WEEK_DAYS.map((day, idx) => (
                        <Text key={idx} style={styles.weekDayLabel}>
                            {day}
                        </Text>
                    ))}
                </View>

                {/* Calendar Grid Matrix */}
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
                                onPress={() => {
                                    setSelectedDateStr(cell.dateStr)
                                    setSelectedSlot(null)
                                }}
                            >
                                <Text
                                    style={[
                                        styles.dateCellText,
                                        isPast && styles.dateCellTextPast,
                                        hasAvailability && !isSelected && styles.dateCellTextAvailable,
                                        !hasAvailability && !isPast && !isSelected && styles.dateCellTextUnavailable,
                                        isSelected && styles.dateCellTextSelected,
                                    ]}
                                >
                                    {cell.day}
                                </Text>
                                {hasAvailability && !isPast && (
                                    <View style={styles.availDot} />
                                )}
                                {!hasAvailability && !isPast && (
                                    <View style={styles.unavailDot} />
                                )}
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* Selected Date Header Banner */}
                <View style={styles.selectedDateBanner}>
                    <Text style={styles.selectedDateTitle}>
                        Selected Date: {selectedDateStr}
                    </Text>
                    {hasSlotsForSelectedDate ? (
                        <View style={styles.availableBadge}>
                            <Icon name="check-circle" size={14} color="#4E8C4A" />
                            <Text style={styles.availableBadgeText}>Available ({generatedSubSlots.length} slot(s))</Text>
                        </View>
                    ) : (
                        <View style={styles.unavailableBadge}>
                            <Icon name="error-outline" size={14} color="#DC2626" />
                            <Text style={styles.unavailableBadgeText}>Not Available</Text>
                        </View>
                    )}
                </View>

                {/* Doctor Availability Slots Output Section */}
                <View style={styles.slotsSection}>
                    <Text style={styles.sectionHeaderTitle}>Doctor Availability Slots</Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#4E8C4A" />
                            <Text style={styles.loadingText}>Fetching slots...</Text>
                        </View>
                    ) : !hasSlotsForSelectedDate ? (
                        /* DIFFERENT COLOR NOTICE: Professional Not Available On That Date */
                        <View style={styles.unavailAlertBox}>
                            <Icon name="event-busy" size={32} color="#DC2626" style={{ marginBottom: 6 }} />
                            <Text style={styles.unavailAlertTitle}>Professional Not Available</Text>
                            <Text style={styles.unavailAlertSubtitle}>
                                {professional?.fullName || 'The professional'} has not set any availability slots for {selectedDateStr}.
                            </Text>
                            <Text style={styles.unavailAlertHint}>
                                Tip: Please pick a date highlighted in GREEN on the calendar above.
                            </Text>
                        </View>
                    ) : generatedSubSlots.length === 0 ? (
                        <View style={styles.unavailAlertBox}>
                            <Icon name="schedule" size={28} color="#D97706" />
                            <Text style={[styles.unavailAlertTitle, { color: '#B45309' }]}>No Open Time Windows</Text>
                            <Text style={styles.unavailAlertSubtitle}>
                                All slots for this date are unavailable or fully scheduled.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.slotGrid}>
                            {generatedSubSlots.map((slot, index) => {
                                const isSelected = selectedSlot?.id === slot.id
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.slotChip,
                                            isSelected && styles.slotChipSelected
                                        ]}
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
                                            isSelected && styles.slotChipTextSelected
                                        ]}>
                                            {slot.start} – {slot.end}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    )}
                </View>

                {/* Confirm Booking Button */}
                <TouchableOpacity
                    style={[
                        styles.bookConfirmBtn,
                        (!hasSlotsForSelectedDate || !selectedSlot) && styles.bookConfirmBtnDisabled
                    ]}
                    disabled={!hasSlotsForSelectedDate || !selectedSlot}
                    onPress={handleConfirmBooking}
                >
                    <Text style={styles.bookConfirmBtnText}>
                        {selectedSlot
                            ? `Book Session for ${selectedSlot.start}`
                            : 'Select a Time Slot to Book'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAF5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E8ECE6',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2D5A27',
        letterSpacing: -0.3,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 18,
        paddingBottom: 40,
    },
    profCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E8ECE6',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    profInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    profName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    profSpecialization: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4E8C4A',
        marginBottom: 2,
    },
    profSubDetail: {
        fontSize: 12,
        color: '#4B5563',
    },
    profMeta: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    searchDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8ECE6',
    },
    searchDateInput: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
    },
    searchDateBtn: {
        backgroundColor: '#4E8C4A',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    searchDateBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E8ECE6',
    },
    monthNavBtn: {
        padding: 4,
    },
    monthTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2D5A27',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 6,
    },
    weekDayLabel: {
        width: 40,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8ECE6',
    },
    dateCell: {
        width: '14.28%',
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginVertical: 2,
        position: 'relative',
    },
    dateCellOutside: {
        backgroundColor: 'transparent',
    },
    dateCellPast: {
        opacity: 0.3,
    },
    dateCellAvailable: {
        backgroundColor: '#E8F5E9',
    },
    dateCellUnavailable: {
        backgroundColor: '#FEF2F2',
    },
    dateCellSelected: {
        backgroundColor: '#2D5A27',
        borderWidth: 2,
        borderColor: '#1E3A1A',
    },
    dateCellText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    dateCellTextPast: {
        color: '#9CA3AF',
    },
    dateCellTextAvailable: {
        color: '#2E7D32',
        fontWeight: '700',
    },
    dateCellTextUnavailable: {
        color: '#DC2626',
    },
    dateCellTextSelected: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    availDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#2E7D32',
        position: 'absolute',
        bottom: 4,
    },
    unavailDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#EF4444',
        position: 'absolute',
        bottom: 4,
    },
    selectedDateBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8ECE6',
    },
    selectedDateTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    availableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    availableBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2E7D32',
    },
    unavailableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    unavailableBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#DC2626',
    },
    slotsSection: {
        marginBottom: 20,
    },
    sectionHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: {
        color: '#6B7280',
        fontSize: 14,
    },
    /* DIFFERENT COLOR NOTICE STYLES FOR UNAVAILABLE DATE */
    unavailAlertBox: {
        backgroundColor: '#FFF0F0',
        borderWidth: 1.5,
        borderColor: '#F87171',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unavailAlertTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#B91C1C',
        marginBottom: 4,
    },
    unavailAlertSubtitle: {
        fontSize: 13,
        color: '#7F1D1D',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 8,
    },
    unavailAlertHint: {
        fontSize: 12,
        color: '#991B1B',
        fontWeight: '600',
        textAlign: 'center',
    },
    slotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    slotChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#C8D5C2',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 4,
    },
    slotChipSelected: {
        backgroundColor: '#4E8C4A',
        borderColor: '#4E8C4A',
    },
    slotChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D5A27',
    },
    slotChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    bookConfirmBtn: {
        backgroundColor: '#4E8C4A',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4E8C4A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    bookConfirmBtnDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    bookConfirmBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    toastBanner: {
        position: 'absolute',
        top: 10,
        left: 20,
        right: 20,
        zIndex: 999,
        backgroundColor: '#2E7D32',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    toastText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
})

export default ProfessionalAvailabilityBookingScreen
