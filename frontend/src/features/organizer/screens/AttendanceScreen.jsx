import React, {useCallback, useState} from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useAuth} from '../../../context/AuthContext'
import {
    getAttendanceForSession,
    updateAttendanceStatus,
    registerAttendance,
} from '../services/attendanceService'

// ─── Helpers ────────────────────────────────────────────────────────────────

const getInitials = name =>
    name
        ? name
              .split(' ')
              .slice(0, 2)
              .map(w => w[0])
              .join('')
              .toUpperCase()
        : '?'

const AVATAR_COLORS = ['#4E8C4A', '#2E7D9A', '#7B5EA7', '#C0703A', '#B94A48', '#3A7D7B']
const avatarColor = name =>
    AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

const STATUS_CONFIG = {
    registered: {
        label: 'Registered',
        bg: '#EEF3EE',
        text: '#4E6B4D',
        icon: '⬜',
    },
    'checked-in': {
        label: 'Checked In',
        bg: '#E2EEDB',
        text: '#3F7540',
        icon: '✅',
    },
    absent: {
        label: 'Absent',
        bg: '#FDF0F0',
        text: '#B94A48',
        icon: '❌',
    },
    excused: {
        label: 'Excused',
        bg: '#FFF8E6',
        text: '#C8860A',
        icon: '⏺',
    },
}

const STATUS_ORDER = ['registered', 'checked-in', 'absent', 'excused']
const nextStatus = current => {
    const idx = STATUS_ORDER.indexOf(current)
    return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
}

// ─── Component ───────────────────────────────────────────────────────────────

const AttendanceScreen = ({navigation, route}) => {
    const {token} = useAuth()
    const {sessionId, sessionTitle, circleId} = route.params ?? {}

    const [attendance, setAttendance] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [updating, setUpdating] = useState(null) // attendanceId being updated
    const [activeFilter, setActiveFilter] = useState('all')

    const load = useCallback(async () => {
        try {
            setError('')
            const data = await getAttendanceForSession(token, sessionId)
            setAttendance(data.attendance ?? [])
        } catch (err) {
            setError(err.message || 'Failed to load attendance')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, token])

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true)
            load()
        }, [load]),
    )

    // ── Cycle status on tap ──────────────────────────────────────────────────
    const handleStatusChange = async (attendanceId, currentStatus) => {
        const newStatus = nextStatus(currentStatus)
        setUpdating(attendanceId)
        try {
            await updateAttendanceStatus(token, attendanceId, newStatus)
            setAttendance(prev =>
                prev.map(a =>
                    a._id === attendanceId ? {...a, status: newStatus} : a,
                ),
            )
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to update status')
        } finally {
            setUpdating(null)
        }
    }

    // ── Summary counts ───────────────────────────────────────────────────────
    const counts = attendance.reduce(
        (acc, a) => {
            acc[a.status] = (acc[a.status] ?? 0) + 1
            return acc
        },
        {registered: 0, 'checked-in': 0, absent: 0, excused: 0},
    )

    // ── Filter ───────────────────────────────────────────────────────────────
    const filtered =
        activeFilter === 'all'
            ? attendance
            : attendance.filter(a => a.status === activeFilter)

    const FILTER_TABS = [
        {key: 'all', label: `All (${attendance.length})`},
        {key: 'checked-in', label: `✓ ${counts['checked-in']}`},
        {key: 'registered', label: `⬜ ${counts['registered']}`},
        {key: 'absent', label: `✕ ${counts['absent']}`},
        {key: 'excused', label: `⏺ ${counts['excused']}`},
    ]

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4E8C4A" />
                <Text style={styles.loadingText}>Loading attendance…</Text>
            </View>
        )
    }

    // ── Render ───────────────────────────────────────────────────────────────
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
                <View style={styles.headerTextBlock}>
                    <Text style={styles.headerTitle}>Attendance</Text>
                    {sessionTitle ? (
                        <Text style={styles.headerSub} numberOfLines={1}>
                            {sessionTitle}
                        </Text>
                    ) : null}
                </View>
            </View>

            {/* ── Summary bar ── */}
            <View style={styles.summaryBar}>
                {[
                    {key: 'checked-in', label: 'Checked In', color: '#4E8C4A'},
                    {key: 'registered', label: 'Registered', color: '#666C66'},
                    {key: 'absent', label: 'Absent', color: '#B94A48'},
                    {key: 'excused', label: 'Excused', color: '#C8860A'},
                ].map(item => (
                    <View key={item.key} style={styles.summaryItem}>
                        <Text
                            style={[styles.summaryNumber, {color: item.color}]}>
                            {counts[item.key]}
                        </Text>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                    </View>
                ))}
            </View>

            {/* ── Tip banner ── */}
            <View style={styles.tipBanner}>
                <Text style={styles.tipText}>
                    💡 Tap a member's status badge to cycle through statuses
                </Text>
            </View>

            {/* ── Error ── */}
            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
            ) : null}

            {/* ── Filter tabs ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}>
                {FILTER_TABS.map(tab => (
                    <Pressable
                        key={tab.key}
                        style={[
                            styles.filterTab,
                            activeFilter === tab.key && styles.filterTabActive,
                        ]}
                        onPress={() => setActiveFilter(tab.key)}>
                        <Text
                            style={[
                                styles.filterTabText,
                                activeFilter === tab.key &&
                                    styles.filterTabTextActive,
                            ]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* ── Empty ── */}
            {filtered.length === 0 ? (
                <View style={styles.emptyWrapper}>
                    <View style={styles.emptyIconCircle}>
                        <Text style={styles.emptyIcon}>📋</Text>
                    </View>
                    <Text style={styles.emptyTitle}>
                        {attendance.length === 0
                            ? 'No registrations yet'
                            : 'No matches'}
                    </Text>
                    <Text style={styles.emptyBody}>
                        {attendance.length === 0
                            ? 'Members registered for this session will appear here.'
                            : 'Try a different filter.'}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionLabel}>
                        {filtered.length} ATTENDEE{filtered.length !== 1 ? 'S' : ''}
                    </Text>

                    {filtered.map(record => {
                        const user = record.userId ?? {}
                        const name = user.name ?? 'Unknown'
                        const photo = user.profilePicture
                        const status = record.status ?? 'registered'
                        const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.registered
                        const isBusy = updating === record._id

                        return (
                            <View key={record._id} style={styles.card}>
                                {/* ── Avatar ── */}
                                {photo ? (
                                    <Image
                                        source={{uri: photo}}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View
                                        style={[
                                            styles.avatarFallback,
                                            {backgroundColor: avatarColor(name)},
                                        ]}>
                                        <Text style={styles.avatarInitials}>
                                            {getInitials(name)}
                                        </Text>
                                    </View>
                                )}

                                {/* ── Info ── */}
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{name}</Text>
                                    {user.email ? (
                                        <Text style={styles.memberEmail}>
                                            {user.email}
                                        </Text>
                                    ) : null}
                                    {record.checkedInAt && status === 'checked-in' ? (
                                        <Text style={styles.checkedInTime}>
                                            ⏰{' '}
                                            {new Date(
                                                record.checkedInAt,
                                            ).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* ── Status badge (tappable) ── */}
                                <Pressable
                                    style={[
                                        styles.statusBadge,
                                        {backgroundColor: cfg.bg},
                                        isBusy && styles.statusBadgeBusy,
                                    ]}
                                    onPress={() =>
                                        handleStatusChange(record._id, status)
                                    }
                                    disabled={isBusy}>
                                    {isBusy ? (
                                        <ActivityIndicator
                                            size="small"
                                            color={cfg.text}
                                        />
                                    ) : (
                                        <>
                                            <Text style={styles.statusIcon}>
                                                {cfg.icon}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.statusBadgeText,
                                                    {color: cfg.text},
                                                ]}>
                                                {cfg.label}
                                            </Text>
                                        </>
                                    )}
                                </Pressable>
                            </View>
                        )
                    })}

                    <View style={styles.listFooter} />
                </ScrollView>
            )}
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

    headerTextBlock: {
        flex: 1,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#252A25',
    },

    headerSub: {
        fontSize: 12,
        color: '#707770',
        marginTop: 1,
    },

    // ── Summary bar ──
    summaryBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAF0E6',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },

    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },

    summaryNumber: {
        fontSize: 22,
        fontWeight: '700',
    },

    summaryLabel: {
        fontSize: 10,
        color: '#9DA89D',
        marginTop: 2,
        fontWeight: '600',
    },

    // ── Tip banner ──
    tipBanner: {
        backgroundColor: '#F0F8FF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#D6EAF8',
    },

    tipText: {
        fontSize: 12,
        color: '#2E7D9A',
        fontWeight: '500',
    },

    // ── Error ──
    errorBanner: {
        margin: 16,
        backgroundColor: '#FDF0F0',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#B94A48',
    },

    errorText: {
        fontSize: 13,
        color: '#B94A48',
    },

    // ── Filter tabs ──
    filterScroll: {
        maxHeight: 50,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAF0E6',
    },

    filterContent: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 8,
        alignItems: 'center',
    },

    filterTab: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DCE4DC',
        backgroundColor: '#FFFFFF',
    },

    filterTabActive: {
        backgroundColor: '#4E8C4A',
        borderColor: '#4E8C4A',
    },

    filterTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666C66',
    },

    filterTabTextActive: {
        color: '#FFFFFF',
    },

    // ── Empty ──
    emptyWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },

    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E2EEDB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyIcon: {
        fontSize: 28,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#252A25',
    },

    emptyBody: {
        fontSize: 14,
        color: '#707770',
        textAlign: 'center',
        lineHeight: 20,
    },

    // ── List ──
    list: {
        padding: 16,
        paddingBottom: 40,
    },

    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9DA89D',
        letterSpacing: 0.8,
        marginBottom: 12,
        marginLeft: 4,
    },

    // ── Card ──
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        gap: 12,
        shadowColor: '#4E8C4A',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },

    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },

    avatarFallback: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarInitials: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    memberInfo: {
        flex: 1,
    },

    memberName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#252A25',
    },

    memberEmail: {
        fontSize: 12,
        color: '#707770',
        marginTop: 2,
    },

    checkedInTime: {
        fontSize: 11,
        color: '#4E8C4A',
        marginTop: 3,
        fontWeight: '500',
    },

    // ── Status badge ──
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        minWidth: 95,
        justifyContent: 'center',
    },

    statusBadgeBusy: {
        opacity: 0.6,
    },

    statusIcon: {
        fontSize: 12,
    },

    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },

    listFooter: {
        height: 20,
    },
})

export default AttendanceScreen
