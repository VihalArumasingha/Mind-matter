import React, {useCallback, useState} from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import {
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {useAuth} from '../../../context/AuthContext'
import {
    getCircleById,
    getMyMemberships,
    requestToJoinCircle,
} from '../../organizer/services/supportCircleService'

const MemberCircleDetailScreen = () => {
    const navigation = useNavigation()
    const route = useRoute()

    const {token} = useAuth()
    const {circleId} = route.params || {}

    const [circle, setCircle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Current user's membership for this community
    const [membership, setMembership] = useState(null)

    // Loading state for the join request
    const [isJoining, setIsJoining] = useState(false)

    // ─────────────────────────────────────────────────────────────
    // Load community + current user's membership
    // ─────────────────────────────────────────────────────────────

    const loadDetail = useCallback(async () => {
        if (!token || !circleId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError('')

            const [{circle: circleData}, membershipData] =
                await Promise.all([
                    getCircleById(token, circleId),
                    getMyMemberships(token),
                ])

            setCircle(circleData)

            const memberships = membershipData.memberships ?? []

            const currentMembership = memberships.find(
                item =>
                    item.groupId?._id === circleId ||
                    item.groupId === circleId,
            )

            setMembership(currentMembership ?? null)
        } catch (err) {
            console.error('Failed to load community:', err)

            setError(
                err.message || 'Failed to load community',
            )
        } finally {
            setLoading(false)
        }
    }, [token, circleId])

    useFocusEffect(
        useCallback(() => {
            loadDetail()
        }, [loadDetail]),
    )

    // ─────────────────────────────────────────────────────────────
    // Request to join community
    // ─────────────────────────────────────────────────────────────

    const handleRequestToJoin = async () => {
        if (!token || !circleId || isJoining) {
            return
        }

        try {
            setIsJoining(true)

            const data = await requestToJoinCircle(
                token,
                circleId,
            )

            // Immediately update the UI with the new membership
            setMembership(data.membership)

            Alert.alert(
                'Request Sent',
                'Your request to join this community has been sent to the organizer.',
            )
        } catch (err) {
            console.error(
                'Failed to request to join community:',
                err,
            )

            Alert.alert(
                'Unable to Join',
                err.message ||
                    'Failed to request to join this community.',
            )
        } finally {
            setIsJoining(false)
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Loading state
    // ─────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#4E8C4A"
                    />

                    <Text style={styles.loadingText}>
                        Loading community...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    // ─────────────────────────────────────────────────────────────
    // Error state
    // ─────────────────────────────────────────────────────────────

    if (error || !circle) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorIcon}>!</Text>

                    <Text style={styles.errorTitle}>
                        Community unavailable
                    </Text>

                    <Text style={styles.errorText}>
                        {error ||
                            'We could not find this community.'}
                    </Text>

                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>
                            Go Back
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        )
    }

    // ─────────────────────────────────────────────────────────────
    // Render join section based on membership status
    // ─────────────────────────────────────────────────────────────

    const membershipStatus = membership?.status

    const renderJoinAction = () => {
        // User is already an approved member
        if (membershipStatus === 'approved') {
            return (
                <View style={styles.joinedButton}>
                    <Text style={styles.joinedButtonText}>
                        ✓ Joined Community
                    </Text>
                </View>
            )
        }

        // User has requested to join and is waiting
        if (membershipStatus === 'pending') {
            return (
                <View style={styles.pendingButton}>
                    <Text style={styles.pendingButtonText}>
                        Request Pending
                    </Text>
                </View>
            )
        }

        // Organizer rejected the request
        if (membershipStatus === 'rejected') {
            return (
                <View style={styles.rejectedButton}>
                    <Text style={styles.rejectedButtonText}>
                        Request Rejected
                    </Text>
                </View>
            )
        }

        // User has no membership yet
        return (
            <Pressable
                style={[
                    styles.joinButton,
                    isJoining && styles.joinButtonDisabled,
                ]}
                onPress={handleRequestToJoin}
                disabled={isJoining}>
                {isJoining ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.joinButtonText}>
                        Request to Join
                    </Text>
                )}
            </Pressable>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backIconButton}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>‹</Text>
                </Pressable>

                <Text style={styles.headerTitle}>
                    Community
                </Text>

                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}>
                {/* Hero */}
                <View style={styles.heroIcon}>
                    <Text style={styles.heroIconText}>♥</Text>
                </View>

                {/* Community title */}
                <Text style={styles.title}>
                    {circle.topic || 'Support Community'}
                </Text>

                {/* Category */}
                {circle.category ? (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                            {circle.category}
                        </Text>
                    </View>
                ) : null}

                {/* Description */}
                <Text style={styles.description}>
                    {circle.description ||
                        'A safe space where members can connect and support one another.'}
                </Text>

                {/* Stats */}
                <View style={styles.statsCard}>
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>
                            {circle.currentMemberCount || 0}
                        </Text>

                        <Text style={styles.statLabel}>
                            Members
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>
                            {circle.meetingTypes?.length || 0}
                        </Text>

                        <Text style={styles.statLabel}>
                            Meeting types
                        </Text>
                    </View>
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        About this community
                    </Text>

                    <Text style={styles.sectionText}>
                        This community provides a supportive
                        environment where people can connect,
                        share experiences and take part in
                        group activities.
                    </Text>
                </View>

                {/* Meeting options */}
                {circle.meetingTypes?.length ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Meeting options
                        </Text>

                        <View style={styles.badgesContainer}>
                            {circle.meetingTypes.map(type => (
                                <View
                                    key={type}
                                    style={styles.meetingBadge}>
                                    <Text
                                        style={
                                            styles.meetingBadgeText
                                        }>
                                        {type}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Join card */}
                <View style={styles.joinCard}>
                    <Text style={styles.joinTitle}>
                        {membershipStatus === 'approved'
                            ? 'You are a member'
                            : membershipStatus === 'pending'
                              ? 'Request under review'
                              : membershipStatus === 'rejected'
                                ? 'Join request rejected'
                                : 'Interested in joining?'}
                    </Text>

                    <Text style={styles.joinText}>
                        {membershipStatus === 'approved'
                            ? 'You have joined this community and can participate in its activities.'
                            : membershipStatus === 'pending'
                              ? 'Your request has been sent to the organizer. You will be able to join once it is approved.'
                              : membershipStatus === 'rejected'
                                ? 'Your previous request to join this community was rejected by the organizer.'
                                : 'Request to join this community and connect with other members.'}
                    </Text>

                    {renderJoinAction()}
                </View>
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
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E7ECE4',
        backgroundColor: '#F8FAF5',
    },

    backIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    backIcon: {
        fontSize: 34,
        lineHeight: 36,
        color: '#354335',
    },

    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '700',
        color: '#263526',
    },

    headerSpacer: {
        width: 40,
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 40,
    },

    heroIcon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#E5F2E2',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },

    heroIconText: {
        fontSize: 34,
        color: '#4E8C4A',
    },

    title: {
        marginTop: 18,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '700',
        color: '#263526',
        textAlign: 'center',
    },

    categoryBadge: {
        alignSelf: 'center',
        marginTop: 10,
        backgroundColor: '#EAF3E7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },

    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#557452',
    },

    description: {
        marginTop: 18,
        fontSize: 15,
        lineHeight: 23,
        color: '#687367',
        textAlign: 'center',
    },

    statsCard: {
        marginTop: 25,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5EAE2',
    },

    stat: {
        flex: 1,
        alignItems: 'center',
    },

    statNumber: {
        fontSize: 21,
        fontWeight: '700',
        color: '#4E8C4A',
    },

    statLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#778076',
    },

    divider: {
        width: 1,
        height: 35,
        backgroundColor: '#E2E7DF',
    },

    section: {
        marginTop: 28,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D392D',
        marginBottom: 9,
    },

    sectionText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6D766C',
    },

    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    meetingBadge: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DDE6D9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },

    meetingBadgeText: {
        fontSize: 13,
        color: '#557452',
        fontWeight: '600',
    },

    joinCard: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#EAF4E7',
        borderRadius: 20,
    },

    joinTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#314330',
    },

    joinText: {
        marginTop: 7,
        fontSize: 14,
        lineHeight: 21,
        color: '#667464',
    },

    // ─────────────────────────────────────────────
    // Join button
    // ─────────────────────────────────────────────

    joinButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
    },

    joinButtonDisabled: {
        opacity: 0.7,
    },

    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─────────────────────────────────────────────
    // Pending state
    // ─────────────────────────────────────────────

    pendingButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#EEF3EE',
        borderWidth: 1,
        borderColor: '#D7E2D4',
        alignItems: 'center',
        justifyContent: 'center',
    },

    pendingButtonText: {
        color: '#687168',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─────────────────────────────────────────────
    // Joined state
    // ─────────────────────────────────────────────

    joinedButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#DCEBD8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    joinedButtonText: {
        color: '#3F7540',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─────────────────────────────────────────────
    // Rejected state
    // ─────────────────────────────────────────────

    rejectedButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F1E7E5',
        borderWidth: 1,
        borderColor: '#E3D2CF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    rejectedButtonText: {
        color: '#8A5C56',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─────────────────────────────────────────────
    // Loading / error
    // ─────────────────────────────────────────────

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#71806F',
    },

    errorIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FCE9E7',
        color: '#C6534D',
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 25,
        fontWeight: '700',
    },

    errorTitle: {
        marginTop: 15,
        fontSize: 19,
        fontWeight: '700',
        color: '#354335',
    },

    errorText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: '#7A8477',
        textAlign: 'center',
    },

    backButton: {
        marginTop: 20,
        backgroundColor: '#4E8C4A',
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 12,
    },

    backButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
})

export default MemberCircleDetailScreen