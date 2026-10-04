import React, {useEffect, useState} from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import {useAuth} from '../../../context/AuthContext'
import {getCircleById} from '../services/supportCircleService'
import {
    createSession,
    updateSession,
    cancelSession,
    getSessionsForCircle,
} from '../services/sessionService'

// ─── Helpers ────────────────────────────────────────────────────────────────

const pad = n => String(n).padStart(2, '0')

/** Format a JS Date → "YYYY-MM-DD" */
const toDateString = date =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Format a JS Date → "HH:MM" */
const toTimeString = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`

/** Parse "YYYY-MM-DD" + "HH:MM" → ISO string */
const buildISO = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = timeStr.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes).toISOString()
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120]

const isValidUrl = value => /^https?:\/\//i.test((value || '').trim())

// ─── Date / time helpers (no external lib) ───────────────────────────────────

const incrementDate = (dateStr, days) => {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return toDateString(d)
}

const incrementMinutes = (timeStr, minutes) => {
    const [h, m] = timeStr.split(':').map(Number)
    const total = h * 60 + m + minutes
    const newH = Math.floor(((total % 1440) + 1440) % 1440 / 60)
    const newM = ((total % 1440) + 1440) % 1440 % 60
    return `${pad(newH)}:${pad(newM)}`
}

// ─── Component ───────────────────────────────────────────────────────────────

const SessionFormScreen = ({navigation, route}) => {
    const {token} = useAuth()
    const {circleId, sessionId} = route.params ?? {}
    const isEditMode = Boolean(sessionId)

    // ── Form state ─────────────────────────────────────────────────────────
    const now = new Date()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dateStr, setDateStr] = useState(toDateString(now))
    const [timeStr, setTimeStr] = useState(toTimeString(now))
    const [duration, setDuration] = useState(60)
    const [meetingType, setMeetingType] = useState('online')
    const [scheduleLocation, setScheduleLocation] = useState('')
    const [meetingLink, setMeetingLink] = useState('')
    const [capacity, setCapacity] = useState('')
    const [circleMeetingTypes, setCircleMeetingTypes] = useState([])

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [error, setError] = useState('')

    // ── Load existing session (edit mode) ──────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                setError('')
                const circleData = await getCircleById(token, circleId)
                const circle = circleData.circle ?? circleData
                const allowedMeetingTypes = Array.isArray(circle.meetingTypes) && circle.meetingTypes.length
                    ? circle.meetingTypes
                    : ['online']

                setCircleMeetingTypes(allowedMeetingTypes)
                const defaultMeetingType = allowedMeetingTypes[0] || 'online'
                setMeetingType(defaultMeetingType)

                if (!isEditMode) {
                    setScheduleLocation('')
                    setMeetingLink('')
                    setCapacity('')
                    setIsLoading(false)
                    return
                }

                const data = await getSessionsForCircle(token, circleId)
                const session = (data.sessions ?? []).find(s => s._id === sessionId)

                if (!session) {
                    setError('Session not found')
                    return
                }

                const resolvedMeetingType = allowedMeetingTypes.includes(session.meetingType)
                    ? session.meetingType
                    : defaultMeetingType

                const scheduledDate = new Date(session.scheduledAt)
                setTitle(session.title ?? '')
                setDescription(session.description ?? '')
                setDateStr(toDateString(scheduledDate))
                setTimeStr(toTimeString(scheduledDate))
                setDuration(session.durationMinutes ?? 60)
                setMeetingType(resolvedMeetingType)
                setMeetingLink(session.meetingLink ?? '')
                setScheduleLocation(session.location ?? '')
                setCapacity(session.capacity ? String(session.capacity) : '')
            } catch (err) {
                setError(err.message || 'Failed to load session')
            } finally {
                setIsLoading(false)
            }
        }

        if (!circleId) {
            setError('Community ID is missing')
            setIsLoading(false)
            return
        }

        load()
    }, [circleId, isEditMode, sessionId, token])

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Session title is required')
            return
        }

        if (!dateStr || !timeStr) {
            setError('Date and time are required')
            return
        }

        const selectedMeetingType = circleMeetingTypes.length > 1 ? meetingType : circleMeetingTypes[0] || 'online'

        if (selectedMeetingType === 'online') {
            const cleanLink = meetingLink.trim()

            if (!cleanLink) {
                setError('Meeting link is required for online sessions')
                return
            }

            if (!isValidUrl(cleanLink)) {
                setError('Please enter a valid meeting link starting with http:// or https://')
                return
            }
        } else {
            if (!scheduleLocation.trim()) {
                setError('Physical location is required')
                return
            }

            const capacityNumber = Number(capacity)
            if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
                setError('Capacity must be a positive integer for physical sessions')
                return
            }
        }

        setError('')
        setIsSaving(true)

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                scheduledAt: buildISO(dateStr, timeStr),
                durationMinutes: duration,
                meetingType: selectedMeetingType,
                ...(selectedMeetingType === 'online'
                    ? {
                        meetingLink: meetingLink.trim(),
                        location: null,
                        capacity: null,
                    }
                    : {
                        meetingLink: null,
                        location: scheduleLocation.trim(),
                        capacity: Number(capacity),
                    }),
            }

            if (isEditMode) {
                await updateSession(token, sessionId, payload)
            } else {
                await createSession(token, circleId, payload)
            }

            navigation.goBack()
        } catch (err) {
            setError(err.message || 'Failed to save session')
        } finally {
            setIsSaving(false)
        }
    }

    // ── Cancel session ─────────────────────────────────────────────────────
    const handleCancelSession = () => {
        Alert.alert(
            'Cancel Session',
            'This will mark the session as cancelled. Members can see the updated status in the Announcements tab.',
            [
                {text: 'Keep Session', style: 'cancel'},
                {
                    text: 'Cancel Session',
                    style: 'destructive',
                    onPress: async () => {
                        setIsCancelling(true)
                        try {
                            await cancelSession(token, sessionId)
                            navigation.goBack()
                        } catch (err) {
                            Alert.alert('Error', err.message || 'Failed to cancel session')
                        } finally {
                            setIsCancelling(false)
                        }
                    },
                },
            ],
        )
    }

    // ── Loading ────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4E8C4A" />
                <Text style={styles.loadingText}>Loading session…</Text>
            </View>
        )
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <View style={styles.root}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={12}>
                    <Text style={styles.backArrow}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>
                    {isEditMode ? 'Edit Session' : 'Schedule Session'}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>

                {/* ── Error banner ── */}
                {error ? (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>⚠ {error}</Text>
                    </View>
                ) : null}

                {/* ══ SECTION 1: Details ══ */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeading}>SESSION DETAILS</Text>

                    <Text style={styles.fieldLabel}>TITLE *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Monthly Check-in"
                        placeholderTextColor="#B0B7B0"
                        returnKeyType="next"
                    />

                    <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What will this session cover?"
                        placeholderTextColor="#B0B7B0"
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* ══ SECTION 2: Date & Time ══ */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeading}>DATE & TIME</Text>

                    {/* Date picker row */}
                    <Text style={styles.fieldLabel}>DATE *</Text>
                    <View style={styles.dateTimeRow}>
                        <Pressable
                            style={styles.dateStepBtn}
                            onPress={() =>
                                setDateStr(prev => incrementDate(prev, -1))
                            }>
                            <Text style={styles.stepBtnText}>‹</Text>
                        </Pressable>

                        <TextInput
                            style={[styles.input, styles.dateInput]}
                            value={dateStr}
                            onChangeText={setDateStr}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#B0B7B0"
                            keyboardType="numbers-and-punctuation"
                        />

                        <Pressable
                            style={styles.dateStepBtn}
                            onPress={() =>
                                setDateStr(prev => incrementDate(prev, 1))
                            }>
                            <Text style={styles.stepBtnText}>›</Text>
                        </Pressable>
                    </View>

                    {/* Time picker row */}
                    <Text style={styles.fieldLabel}>TIME *</Text>
                    <View style={styles.dateTimeRow}>
                        <Pressable
                            style={styles.dateStepBtn}
                            onPress={() =>
                                setTimeStr(prev => incrementMinutes(prev, -15))
                            }>
                            <Text style={styles.stepBtnText}>‹</Text>
                        </Pressable>

                        <TextInput
                            style={[styles.input, styles.dateInput]}
                            value={timeStr}
                            onChangeText={setTimeStr}
                            placeholder="HH:MM"
                            placeholderTextColor="#B0B7B0"
                            keyboardType="numbers-and-punctuation"
                        />

                        <Pressable
                            style={styles.dateStepBtn}
                            onPress={() =>
                                setTimeStr(prev => incrementMinutes(prev, 15))
                            }>
                            <Text style={styles.stepBtnText}>›</Text>
                        </Pressable>
                    </View>
                </View>

                {/* ══ SECTION 3: Duration ══ */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeading}>DURATION</Text>
                    <View style={styles.durationRow}>
                        {DURATION_OPTIONS.map(opt => (
                            <Pressable
                                key={opt}
                                style={[
                                    styles.durationChip,
                                    duration === opt && styles.durationChipActive,
                                ]}
                                onPress={() => setDuration(opt)}>
                                <Text
                                    style={[
                                        styles.durationChipText,
                                        duration === opt && styles.durationChipTextActive,
                                    ]}>
                                    {opt < 60
                                        ? `${opt}m`
                                        : opt === 60
                                        ? '1h'
                                        : `${opt / 60}h`}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* ══ SECTION 4: Meeting details ══ */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeading}>MEETING DETAILS</Text>

                    {circleMeetingTypes.length > 1 ? (
                        <>
                            <Text style={styles.fieldLabel}>MEETING TYPE</Text>
                            <View style={styles.typeToggleRow}>
                                {circleMeetingTypes.map(type => (
                                    <Pressable
                                        key={type}
                                        style={[
                                            styles.typeToggle,
                                            meetingType === type && styles.typeToggleActive,
                                        ]}
                                        onPress={() => {
                                            setMeetingType(type)
                                            if (type === 'online') {
                                                setScheduleLocation('')
                                            } else {
                                                setMeetingLink('')
                                                setCapacity('')
                                            }
                                        }}>
                                        <Text
                                            style={[
                                                styles.typeToggleText,
                                                meetingType === type && styles.typeToggleTextActive,
                                            ]}>
                                            {type === 'online' ? 'Online' : 'Physical'}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    ) : (
                        <View style={styles.meetingTypeInfoCard}>
                            <Text style={styles.meetingTypeInfoTitle}>
                                {circleMeetingTypes[0] === 'online' ? 'Online session' : 'Physical session'}
                            </Text>
                            <Text style={styles.meetingTypeInfoSubtitle}>
                                {circleMeetingTypes[0] === 'online'
                                    ? 'This community supports online sessions only.'
                                    : 'This community supports physical sessions only.'}
                            </Text>
                        </View>
                    )}

                    {((circleMeetingTypes.length > 1 && meetingType === 'online') ||
                        (circleMeetingTypes.length === 1 && circleMeetingTypes[0] === 'online')) ? (
                        <>
                            <Text style={styles.fieldLabel}>MEETING LINK *</Text>
                            <TextInput
                                style={styles.input}
                                value={meetingLink}
                                onChangeText={setMeetingLink}
                                placeholder="https://meet.google.com/..."
                                placeholderTextColor="#B0B7B0"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </>
                    ) : (
                        <>
                            <Text style={styles.fieldLabel}>PHYSICAL LOCATION *</Text>
                            <TextInput
                                style={styles.input}
                                value={scheduleLocation}
                                onChangeText={setScheduleLocation}
                                placeholder="Community Hall / Room 4B"
                                placeholderTextColor="#B0B7B0"
                            />

                            <Text style={styles.fieldLabel}>MAXIMUM ATTENDEES *</Text>
                            <TextInput
                                style={styles.input}
                                value={capacity}
                                onChangeText={setCapacity}
                                placeholder="20"
                                placeholderTextColor="#B0B7B0"
                                keyboardType="number-pad"
                            />
                        </>
                    )}
                </View>

                {/* ── Preview pill ── */}
                {title.trim() && dateStr && timeStr ? (
                    <View style={styles.previewPill}>
                        <Text style={styles.previewIcon}>📅</Text>
                        <Text style={styles.previewText} numberOfLines={1}>
                            {title} · {dateStr} at {timeStr} ({duration}m)
                        </Text>
                    </View>
                ) : null}

                {/* ── Save button ── */}
                <Pressable
                    style={[
                        styles.submitBtn,
                        (isSaving || isCancelling) && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSaving || isCancelling}>
                    {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>
                            {isEditMode ? 'SAVE CHANGES' : 'SCHEDULE SESSION'}
                        </Text>
                    )}
                </Pressable>

                {/* ── Cancel session (edit mode only) ── */}
                {isEditMode ? (
                    <Pressable
                        style={[
                            styles.cancelSessionBtn,
                            (isSaving || isCancelling) && styles.submitBtnDisabled,
                        ]}
                        onPress={handleCancelSession}
                        disabled={isSaving || isCancelling}>
                        {isCancelling ? (
                            <ActivityIndicator color="#B94A48" />
                        ) : (
                            <Text style={styles.cancelSessionBtnText}>
                                Cancel This Session
                            </Text>
                        )}
                    </Pressable>
                ) : null}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    centeredContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7EF',
        gap: 12,
    },

    loadingText: {
        fontSize: 14,
        color: '#707770',
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAF0E6',
        gap: 12,
    },

    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F4F7EF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    backArrow: {
        fontSize: 20,
        color: '#4E8C4A',
        lineHeight: 22,
    },

    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#252A25',
    },

    headerSpacer: {
        width: 38,
    },

    // ── Content ──
    content: {
        padding: 16,
        paddingBottom: 20,
    },

    // ── Error banner ──
    errorBanner: {
        backgroundColor: '#FDF0F0',
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
        borderLeftWidth: 3,
        borderLeftColor: '#B94A48',
    },

    errorText: {
        fontSize: 13,
        color: '#B94A48',
    },

    // ── Section card ──
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#4E8C4A',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },

    sectionHeading: {
        fontSize: 11,
        fontWeight: '800',
        color: '#4E8C4A',
        letterSpacing: 0.8,
        marginBottom: 14,
    },

    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9DA89D',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginTop: 12,
    },

    // ── Input ──
    input: {
        backgroundColor: '#F8FAF7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DCE4DC',
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 14,
        color: '#252A25',
    },

    textArea: {
        minHeight: 90,
        textAlignVertical: 'top',
    },

    // ── Date / time row ──
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    typeToggleRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },

    typeToggle: {
        flex: 1,
        backgroundColor: '#F4F7EF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DCE4DC',
        paddingVertical: 12,
        alignItems: 'center',
    },

    typeToggleActive: {
        backgroundColor: '#4E8C4A',
        borderColor: '#4E8C4A',
    },

    typeToggleText: {
        color: '#666C66',
        fontSize: 13,
        fontWeight: '700',
    },

    typeToggleTextActive: {
        color: '#FFFFFF',
    },

    meetingTypeInfoCard: {
        backgroundColor: '#EEF5EB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D5E7D3',
        padding: 12,
        marginTop: 8,
    },

    meetingTypeInfoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#284D2A',
    },

    meetingTypeInfoSubtitle: {
        marginTop: 4,
        color: '#536057',
        fontSize: 12,
        lineHeight: 18,
    },

    dateStepBtn: {
        width: 40,
        height: 44,
        backgroundColor: '#E2EEDB',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    stepBtnText: {
        fontSize: 22,
        color: '#4E8C4A',
        fontWeight: '600',
        lineHeight: 26,
    },

    dateInput: {
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 15,
    },

    // ── Duration chips ──
    durationRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 4,
    },

    durationChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#DCE4DC',
        backgroundColor: '#FFFFFF',
    },

    durationChipActive: {
        backgroundColor: '#4E8C4A',
        borderColor: '#4E8C4A',
    },

    durationChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666C66',
    },

    durationChipTextActive: {
        color: '#FFFFFF',
    },

    // ── Preview pill ──
    previewPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E2EEDB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },

    previewIcon: {
        fontSize: 16,
    },

    previewText: {
        flex: 1,
        fontSize: 13,
        color: '#3F7540',
        fontWeight: '500',
    },

    // ── Buttons ──
    submitBtn: {
        backgroundColor: '#4E8C4A',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#4E8C4A',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },

    submitBtnDisabled: {
        opacity: 0.55,
    },

    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    cancelSessionBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#EAC4C4',
        marginBottom: 12,
    },

    cancelSessionBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#B94A48',
    },

    bottomSpacer: {
        height: 20,
    },
})

export default SessionFormScreen
