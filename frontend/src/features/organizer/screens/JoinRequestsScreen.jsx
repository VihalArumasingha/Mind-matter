import React, {useCallback, useState} from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useAuth} from '../../../context/AuthContext'
import {
    getPendingRequests,
    respondToRequest,
} from '../services/supportCircleService'

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

const AVATAR_COLORS = [
    '#4E8C4A',
    '#2E7D9A',
    '#7B5EA7',
    '#C0703A',
    '#B94A48',
    '#3A7D7B',
]

const avatarColor = name =>
    AVATAR_COLORS[
        (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
    ]

// ─── Component ───────────────────────────────────────────────────────────────

const JoinRequestsScreen = ({navigation, route}) => {
    const {token} = useAuth()
    const {circleId, circleTitle} = route.params ?? {}

    const [requests, setRequests] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // membershipId → 'approved' | 'rejected'
    const [responding, setResponding] = useState({})

    // Currently selected member for preview
    const [selectedRequest, setSelectedRequest] = useState(null)

    const load = useCallback(async () => {
        try {
            setError('')

            const data = await getPendingRequests(
                token,
                circleId,
            )

            setRequests(data.requests ?? [])
        } catch (err) {
            setError(
                err.message || 'Failed to load requests',
            )
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

    // ─────────────────────────────────────────────────────────────
    // Approve / reject request
    // ─────────────────────────────────────────────────────────────

    const handleRespond = async (
        membershipId,
        decision,
    ) => {
        setResponding(prev => ({
            ...prev,
            [membershipId]: decision,
        }))

        try {
            await respondToRequest(
                token,
                membershipId,
                decision,
            )

            // Close preview first
            setSelectedRequest(null)

            // Remove the processed request from the list
            setRequests(prev =>
                prev.filter(
                    request =>
                        request._id !== membershipId,
                ),
            )
        } catch (err) {
            Alert.alert(
                'Error',
                err.message || 'Failed to respond',
            )
        } finally {
            setResponding(prev => {
                const next = {...prev}
                delete next[membershipId]
                return next
            })
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Open member preview
    // ─────────────────────────────────────────────────────────────

    const openPreview = request => {
        setSelectedRequest(request)
    }

    const closePreview = () => {
        setSelectedRequest(null)
    }

    // ─────────────────────────────────────────────────────────────
    // Loading
    // ─────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator
                    size="large"
                    color="#4E8C4A"
                />

                <Text style={styles.loadingText}>
                    Loading requests…
                </Text>
            </View>
        )
    }

    // ─────────────────────────────────────────────────────────────
    // Selected member information
    // ─────────────────────────────────────────────────────────────

    const selectedApplicant =
        selectedRequest?.userId ?? {}

    const selectedName =
        selectedApplicant.name ?? 'Unknown'

    const selectedEmail =
        selectedApplicant.email ?? ''

    const selectedBio =
        selectedApplicant.bio ?? ''

    const selectedPhoto =
        selectedApplicant.profilePicture

    const selectedMembershipId =
        selectedRequest?._id

    const selectedDecision =
        selectedMembershipId
            ? responding[selectedMembershipId]
            : null

    const isPreviewBusy =
        selectedDecision === 'approved' ||
        selectedDecision === 'rejected'

    // ─────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            {/* ── Header ── */}

            <View style={styles.header}>
                <Pressable
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={12}>
                    <Text style={styles.backArrow}>
                        ←
                    </Text>
                </Pressable>

                <View style={styles.headerTextBlock}>
                    <Text style={styles.headerTitle}>
                        Join Requests
                    </Text>

                    {circleTitle ? (
                        <Text
                            style={styles.headerSub}
                            numberOfLines={1}>
                            {circleTitle}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.countPill}>
                    <Text style={styles.countPillText}>
                        {requests.length}
                    </Text>
                </View>
            </View>

            {/* ── Error banner ── */}

            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>
                        ⚠ {error}
                    </Text>
                </View>
            ) : null}

            {/* ── Empty state ── */}

            {requests.length === 0 && !error ? (
                <View style={styles.emptyWrapper}>
                    <View style={styles.emptyIconCircle}>
                        <Text style={styles.emptyIcon}>
                            ✉
                        </Text>
                    </View>

                    <Text style={styles.emptyTitle}>
                        All caught up
                    </Text>

                    <Text style={styles.emptyBody}>
                        No pending join requests for this
                        circle right now.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionLabel}>
                        PENDING REVIEW
                    </Text>

                    {requests.map((req, index) => {
                        const applicant =
                            req.userId ?? {}

                        const name =
                            applicant.name ??
                            'Unknown'

                        const bio =
                            applicant.bio ?? ''

                        const photo =
                            applicant.profilePicture

                        const isApproving =
                            responding[req._id] ===
                            'approved'

                        const isRejecting =
                            responding[req._id] ===
                            'rejected'

                        const isBusy =
                            isApproving ||
                            isRejecting

                        return (
                            <Pressable
                                key={req._id}
                                onPress={() =>
                                    openPreview(req)
                                }
                                disabled={isBusy}
                                style={({pressed}) => [
                                    styles.card,
                                    index === 0 &&
                                        styles.cardFirst,
                                    pressed &&
                                        styles.cardPressed,
                                ]}>
                                {/* ── Avatar + name ── */}

                                <View
                                    style={
                                        styles.cardTop
                                    }>
                                    {photo ? (
                                        <Image
                                            source={{
                                                uri: photo,
                                            }}
                                            style={
                                                styles.avatar
                                            }
                                        />
                                    ) : (
                                        <View
                                            style={[
                                                styles.avatarFallback,
                                                {
                                                    backgroundColor:
                                                        avatarColor(
                                                            name,
                                                        ),
                                                },
                                            ]}>
                                            <Text
                                                style={
                                                    styles.avatarInitials
                                                }>
                                                {getInitials(
                                                    name,
                                                )}
                                            </Text>
                                        </View>
                                    )}

                                    <View
                                        style={
                                            styles.cardNameBlock
                                        }>
                                        <Text
                                            style={
                                                styles.cardName
                                            }>
                                            {name}
                                        </Text>

                                        {applicant.email ? (
                                            <Text
                                                style={
                                                    styles.cardEmail
                                                }>
                                                {
                                                    applicant.email
                                                }
                                            </Text>
                                        ) : null}
                                    </View>

                                    {/* Pending badge */}

                                    <View
                                        style={
                                            styles.pendingBadge
                                        }>
                                        <View
                                            style={
                                                styles.pendingDot
                                            }
                                        />

                                        <Text
                                            style={
                                                styles.pendingBadgeText
                                            }>
                                            Pending
                                        </Text>
                                    </View>
                                </View>

                                {/* ── Bio preview ── */}

                                {bio ? (
                                    <View
                                        style={
                                            styles.bioBlock
                                        }>
                                        <Text
                                            style={
                                                styles.bioLabel
                                            }>
                                            ABOUT
                                        </Text>

                                        <Text
                                            style={
                                                styles.bioText
                                            }
                                            numberOfLines={
                                                2
                                            }>
                                            {bio}
                                        </Text>
                                    </View>
                                ) : (
                                    <View
                                        style={
                                            styles.bioBlock
                                        }>
                                        <Text
                                            style={
                                                styles.noBioText
                                            }>
                                            No bio provided.
                                        </Text>
                                    </View>
                                )}

                                {/* ── Tap hint ── */}

                                <View
                                    style={
                                        styles.previewHint
                                    }>
                                    <Text
                                        style={
                                            styles.previewHintText
                                        }>
                                        Tap to review member
                                    </Text>

                                    <Text
                                        style={
                                            styles.previewArrow
                                        }>
                                        ›
                                    </Text>
                                </View>

                                {/* ── Divider ── */}

                                <View
                                    style={styles.divider}
                                />

                                {/* ── Quick actions ── */}

                                <View
                                    style={
                                        styles.actionRow
                                    }>
                                    <Pressable
                                        style={[
                                            styles.actionBtn,
                                            styles.declineBtn,
                                            isBusy &&
                                                styles.btnDisabled,
                                        ]}
                                        disabled={isBusy}
                                        onPress={event => {
                                            event.stopPropagation()
                                            handleRespond(
                                                req._id,
                                                'rejected',
                                            )
                                        }}>
                                        {isRejecting ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#B94A48"
                                            />
                                        ) : (
                                            <Text
                                                style={
                                                    styles.declineBtnText
                                                }>
                                                ✕ Decline
                                            </Text>
                                        )}
                                    </Pressable>

                                    <Pressable
                                        style={[
                                            styles.actionBtn,
                                            styles.approveBtn,
                                            isBusy &&
                                                styles.btnDisabled,
                                        ]}
                                        disabled={isBusy}
                                        onPress={event => {
                                            event.stopPropagation()
                                            handleRespond(
                                                req._id,
                                                'approved',
                                            )
                                        }}>
                                        {isApproving ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#FFFFFF"
                                            />
                                        ) : (
                                            <Text
                                                style={
                                                    styles.approveBtnText
                                                }>
                                                ✓ Approve
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </Pressable>
                        )
                    })}

                    <View style={styles.listFooter} />
                </ScrollView>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                MEMBER PREVIEW MODAL
            ═══════════════════════════════════════════════════════════════ */}

            <Modal
                visible={!!selectedRequest}
                transparent
                animationType="fade"
                onRequestClose={closePreview}>
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={closePreview}
                    />

                    <View style={styles.modalCard}>
                        {/* Close button */}

                        <Pressable
                            style={styles.modalCloseButton}
                            onPress={closePreview}
                            hitSlop={10}
                            disabled={isPreviewBusy}>
                            <Text
                                style={
                                    styles.modalCloseText
                                }>
                                ×
                            </Text>
                        </Pressable>

                        {/* Member avatar */}

                        {selectedPhoto ? (
                            <Image
                                source={{
                                    uri: selectedPhoto,
                                }}
                                style={styles.modalAvatar}
                            />
                        ) : (
                            <View
                                style={[
                                    styles.modalAvatarFallback,
                                    {
                                        backgroundColor:
                                            avatarColor(
                                                selectedName,
                                            ),
                                    },
                                ]}>
                                <Text
                                    style={
                                        styles.modalAvatarInitials
                                    }>
                                    {getInitials(
                                        selectedName,
                                    )}
                                </Text>
                            </View>
                        )}

                        {/* Member name */}

                        <Text
                            style={styles.modalMemberName}>
                            {selectedName}
                        </Text>

                        {/* Email */}

                        {selectedEmail ? (
                            <Text
                                style={
                                    styles.modalMemberEmail
                                }>
                                {selectedEmail}
                            </Text>
                        ) : null}

                        {/* Pending badge */}

                        <View
                            style={
                                styles.modalPendingBadge
                            }>
                            <View
                                style={
                                    styles.modalPendingDot
                                }
                            />

                            <Text
                                style={
                                    styles.modalPendingText
                                }>
                                Pending request
                            </Text>
                        </View>

                        {/* About */}

                        <View
                            style={
                                styles.modalInfoSection
                            }>
                            <Text
                                style={
                                    styles.modalInfoLabel
                                }>
                                ABOUT THIS MEMBER
                            </Text>

                            <View
                                style={
                                    styles.modalBioBox
                                }>
                                <Text
                                    style={
                                        selectedBio
                                            ? styles.modalBioText
                                            : styles.modalNoBioText
                                    }>
                                    {selectedBio ||
                                        'This member has not added a bio yet.'}
                                </Text>
                            </View>
                        </View>

                        {/* Review text */}

                        <Text
                            style={
                                styles.modalReviewText
                            }>
                            Review this member before deciding
                            whether to approve their request to
                            join the community.
                        </Text>

                        {/* Actions */}

                        <View
                            style={
                                styles.modalActionRow
                            }>
                            <Pressable
                                style={[
                                    styles.modalActionButton,
                                    styles.modalRejectButton,
                                    isPreviewBusy &&
                                        styles.btnDisabled,
                                ]}
                                disabled={isPreviewBusy}
                                onPress={() =>
                                    handleRespond(
                                        selectedMembershipId,
                                        'rejected',
                                    )
                                }>
                                {selectedDecision ===
                                'rejected' ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#B94A48"
                                    />
                                ) : (
                                    <Text
                                        style={
                                            styles.modalRejectText
                                        }>
                                        Decline
                                    </Text>
                                )}
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.modalActionButton,
                                    styles.modalApproveButton,
                                    isPreviewBusy &&
                                        styles.btnDisabled,
                                ]}
                                disabled={isPreviewBusy}
                                onPress={() =>
                                    handleRespond(
                                        selectedMembershipId,
                                        'approved',
                                    )
                                }>
                                {selectedDecision ===
                                'approved' ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#FFFFFF"
                                    />
                                ) : (
                                    <Text
                                        style={
                                            styles.modalApproveText
                                        }>
                                        Approve
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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

    // ── Header ──────────────────────────────────────────────────────────────

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

    // ── Error ───────────────────────────────────────────────────────────────

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

    // ── Empty state ─────────────────────────────────────────────────────────

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
        fontSize: 30,
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

    // ── List ────────────────────────────────────────────────────────────────

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

    // ── Request card ────────────────────────────────────────────────────────

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#4E8C4A',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },

    cardFirst: {
        borderWidth: 1.5,
        borderColor: '#C8DFC6',
    },

    cardPressed: {
        opacity: 0.88,
        transform: [{scale: 0.99}],
    },

    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },

    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },

    avatarFallback: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarInitials: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    cardNameBlock: {
        flex: 1,
    },

    cardName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#252A25',
    },

    cardEmail: {
        fontSize: 12,
        color: '#707770',
        marginTop: 2,
    },

    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E6',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },

    pendingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#C8860A',
    },

    pendingBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#C8860A',
    },

    // ── Bio ─────────────────────────────────────────────────────────────────

    bioBlock: {
        backgroundColor: '#F8FAF7',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },

    bioLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9DA89D',
        letterSpacing: 0.6,
        marginBottom: 4,
    },

    bioText: {
        fontSize: 14,
        color: '#3A4039',
        lineHeight: 20,
    },

    noBioText: {
        fontSize: 13,
        color: '#A8ADA8',
        fontStyle: 'italic',
    },

    // ── Preview hint ────────────────────────────────────────────────────────

    previewHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingVertical: 4,
    },

    previewHintText: {
        fontSize: 12,
        color: '#4E8C4A',
        fontWeight: '600',
    },

    previewArrow: {
        fontSize: 20,
        color: '#4E8C4A',
        lineHeight: 20,
    },

    // ── Divider ─────────────────────────────────────────────────────────────

    divider: {
        height: 1,
        backgroundColor: '#EAF0E6',
        marginTop: 8,
        marginBottom: 14,
    },

    // ── Quick actions ───────────────────────────────────────────────────────

    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },

    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },

    declineBtn: {
        backgroundColor: '#FDF0F0',
        borderWidth: 1.5,
        borderColor: '#EAC4C4',
    },

    declineBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#B94A48',
    },

    approveBtn: {
        backgroundColor: '#4E8C4A',
    },

    approveBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    btnDisabled: {
        opacity: 0.55,
    },

    listFooter: {
        height: 20,
    },

    // ═════════════════════════════════════════════════════════════════════════
    // MEMBER PREVIEW MODAL
    // ═════════════════════════════════════════════════════════════════════════

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(24, 31, 24, 0.45)',
    },

    modalCard: {
        width: '100%',
        maxWidth: 390,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingTop: 28,
        paddingBottom: 22,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 12,
    },

    modalCloseButton: {
        position: 'absolute',
        top: 12,
        right: 14,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },

    modalCloseText: {
        fontSize: 30,
        lineHeight: 32,
        fontWeight: '300',
        color: '#333833',
    },

    // ── Modal avatar ────────────────────────────────────────────────────────

    modalAvatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        marginBottom: 12,
    },

    modalAvatarFallback: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    modalAvatarInitials: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // ── Modal member info ───────────────────────────────────────────────────

    modalMemberName: {
        fontSize: 21,
        fontWeight: '700',
        color: '#252A25',
        textAlign: 'center',
    },

    modalMemberEmail: {
        marginTop: 4,
        fontSize: 13,
        color: '#707770',
        textAlign: 'center',
    },

    modalPendingBadge: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E6',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 5,
    },

    modalPendingDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#C8860A',
    },

    modalPendingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#C8860A',
    },

    // ── Modal about ─────────────────────────────────────────────────────────

    modalInfoSection: {
        width: '100%',
        marginTop: 20,
    },

    modalInfoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9DA89D',
        letterSpacing: 0.8,
        marginBottom: 7,
    },

    modalBioBox: {
        width: '100%',
        backgroundColor: '#F8FAF7',
        borderRadius: 12,
        padding: 13,
        minHeight: 60,
    },

    modalBioText: {
        fontSize: 14,
        lineHeight: 21,
        color: '#3A4039',
    },

    modalNoBioText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#A8ADA8',
        fontStyle: 'italic',
    },

    // ── Modal explanation ───────────────────────────────────────────────────

    modalReviewText: {
        width: '100%',
        marginTop: 14,
        fontSize: 12,
        lineHeight: 18,
        color: '#777F76',
        textAlign: 'center',
    },

    // ── Modal buttons ───────────────────────────────────────────────────────

    modalActionRow: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },

    modalActionButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalRejectButton: {
        backgroundColor: '#FDF0F0',
        borderWidth: 1.5,
        borderColor: '#EAC4C4',
    },

    modalRejectText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#B94A48',
    },

    modalApproveButton: {
        backgroundColor: '#4E8C4A',
    },

    modalApproveText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
})

export default JoinRequestsScreen