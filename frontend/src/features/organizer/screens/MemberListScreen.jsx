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
import {getCircleMembers, removeMember} from '../services/supportCircleService'

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

const ROLE_CONFIG = {
    owner: {label: 'Owner', bg: '#E2EEDB', text: '#3F7540'},
    'co-facilitator': {label: 'Co-facilitator', bg: '#EBE6F5', text: '#7B5EA7'},
    member: {label: 'Member', bg: '#EEF3EE', text: '#666C66'},
}

// ─── Component ───────────────────────────────────────────────────────────────

const MemberListScreen = ({navigation, route}) => {
    const {token} = useAuth()
    const {circleId, circleTitle} = route.params ?? {}

    const [members, setMembers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [removing, setRemoving] = useState(null) // membershipId being removed
    const [search, setSearch] = useState('')

    const load = useCallback(async () => {
        try {
            setError('')
            const data = await getCircleMembers(token, circleId)
            setMembers(data.members ?? [])
        } catch (err) {
            setError(err.message || 'Failed to load members')
        } finally {
            setIsLoading(false)
        }
    }, [circleId, token])

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true)
            load()
        }, [load]),
    )

    const handleRemove = membershipId => {
        const member = members.find(m => m._id === membershipId)
        const name = member?.userId?.name ?? 'this member'

        Alert.alert(
            'Remove Member',
            `Remove ${name} from the circle? They can request to rejoin later.`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setRemoving(membershipId)
                        try {
                            await removeMember(token, membershipId)
                            setMembers(prev =>
                                prev.filter(m => m._id !== membershipId),
                            )
                        } catch (err) {
                            Alert.alert('Error', err.message || 'Failed to remove member')
                        } finally {
                            setRemoving(null)
                        }
                    },
                },
            ],
        )
    }

    // ── Filter ───────────────────────────────────────────────────────────────

    const displayed = search.trim()
        ? members.filter(m =>
              m.userId?.name?.toLowerCase().includes(search.toLowerCase()),
          )
        : members

    // ── Sections: owner first, then co-facilitators, then members ──
    const sortedMembers = [...displayed].sort((a, b) => {
        const order = {owner: 0, 'co-facilitator': 1, member: 2}
        return (order[a.role] ?? 9) - (order[b.role] ?? 9)
    })

    // ── Loading ──────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4E8C4A" />
                <Text style={styles.loadingText}>Loading members…</Text>
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
                    <Text style={styles.headerTitle}>Members</Text>
                    {circleTitle ? (
                        <Text style={styles.headerSub} numberOfLines={1}>
                            {circleTitle}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.countPill}>
                    <Text style={styles.countPillText}>{members.length}</Text>
                </View>
            </View>

            {/* ── Stats bar ── */}
            <View style={styles.statsBar}>
                {[
                    {label: 'Total', value: members.length, color: '#4E8C4A'},
                    {
                        label: 'Co-facilitators',
                        value: members.filter(m => m.role === 'co-facilitator').length,
                        color: '#7B5EA7',
                    },
                    {
                        label: 'Members',
                        value: members.filter(m => m.role === 'member').length,
                        color: '#666C66',
                    },
                ].map(stat => (
                    <View key={stat.label} style={styles.statItem}>
                        <Text style={[styles.statNumber, {color: stat.color}]}>
                            {stat.value}
                        </Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            {/* ── Error banner ── */}
            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>⚠ {error}</Text>
                </View>
            ) : null}

            {/* ── Empty state ── */}
            {sortedMembers.length === 0 && !error ? (
                <View style={styles.emptyWrapper}>
                    <View style={styles.emptyIconCircle}>
                        <Text style={styles.emptyIcon}>👥</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No members yet</Text>
                    <Text style={styles.emptyBody}>
                        Approve join requests to start building your circle.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionLabel}>
                        {sortedMembers.length} MEMBER{sortedMembers.length !== 1 ? 'S' : ''}
                    </Text>

                    {sortedMembers.map((membership, index) => {
                        const user = membership.userId ?? {}
                        const name = user.name ?? 'Unknown'
                        const photo = user.profilePicture
                        const role = membership.role ?? 'member'
                        const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.member
                        const isOwner = role === 'owner'
                        const isBeingRemoved = removing === membership._id

                        return (
                            <View key={membership._id} style={styles.card}>
                                {/* ── Avatar ── */}
                                {photo ? (
                                    <Image source={{uri: photo}} style={styles.avatar} />
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
                                    <View style={styles.memberNameRow}>
                                        <Text style={styles.memberName}>{name}</Text>
                                        <View
                                            style={[
                                                styles.roleBadge,
                                                {backgroundColor: roleConfig.bg},
                                            ]}>
                                            <Text
                                                style={[
                                                    styles.roleBadgeText,
                                                    {color: roleConfig.text},
                                                ]}>
                                                {roleConfig.label}
                                            </Text>
                                        </View>
                                    </View>
                                    {user.email ? (
                                        <Text style={styles.memberEmail}>{user.email}</Text>
                                    ) : null}

                                    {/* ── Joined date ── */}
                                    {membership.createdAt ? (
                                        <Text style={styles.joinedDate}>
                                            Joined{' '}
                                            {new Date(membership.createdAt).toLocaleDateString(
                                                'en-US',
                                                {month: 'short', day: 'numeric', year: 'numeric'},
                                            )}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* ── Remove button ── */}
                                {!isOwner ? (
                                    <Pressable
                                        style={[
                                            styles.removeBtn,
                                            isBeingRemoved && styles.removeBtnBusy,
                                        ]}
                                        disabled={isBeingRemoved}
                                        onPress={() => handleRemove(membership._id)}
                                        hitSlop={8}>
                                        {isBeingRemoved ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#B94A48"
                                            />
                                        ) : (
                                            <Text style={styles.removeBtnText}>✕</Text>
                                        )}
                                    </Pressable>
                                ) : (
                                    /* placeholder so layout stays consistent */
                                    <View style={styles.removeBtn} />
                                )}
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

    countPill: {
        backgroundColor: '#E2EEDB',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 30,
        alignItems: 'center',
    },

    countPillText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3F7540',
    },

    // ── Stats bar ──
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAF0E6',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },

    statItem: {
        flex: 1,
        alignItems: 'center',
    },

    statNumber: {
        fontSize: 20,
        fontWeight: '700',
    },

    statLabel: {
        fontSize: 11,
        color: '#9DA89D',
        marginTop: 2,
        fontWeight: '500',
    },

    // ── Error banner ──
    errorBanner: {
        margin: 16,
        backgroundColor: '#FDF0F0',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#B94A48',
    },

    errorBannerText: {
        fontSize: 13,
        color: '#B94A48',
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

    memberNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },

    memberName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#252A25',
    },

    roleBadge: {
        borderRadius: 20,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },

    roleBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },

    memberEmail: {
        fontSize: 12,
        color: '#707770',
        marginTop: 2,
    },

    joinedDate: {
        fontSize: 11,
        color: '#9DA89D',
        marginTop: 3,
    },

    removeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FDF0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },

    removeBtnBusy: {
        opacity: 0.5,
    },

    removeBtnText: {
        fontSize: 13,
        color: '#B94A48',
        fontWeight: '600',
    },

    listFooter: {
        height: 20,
    },
})

export default MemberListScreen
