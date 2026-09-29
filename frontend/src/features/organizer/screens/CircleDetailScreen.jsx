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
    archiveCircle,
    getCircleById,
} from '../services/supportCircleService'
import {getSessionsForCircle} from '../services/sessionService'

const initials = value =>
    value
        ? value
              .split(' ')
              .slice(0, 2)
              .map(value => value[0])
              .join('')
              .toUpperCase()
        : 'SC'

const meetingLabel = value =>
    value === 'online'
        ? 'Online'
        : value === 'physical'
          ? 'In person'
          : value

const CircleDetailScreen = ({navigation, route}) => {
    const {token} = useAuth()
    const {circleId} = route.params

    const [circle, setCircle] = useState(null)
    const [sessions, setSessions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const loadDetail = useCallback(async () => {
        try {
            setError('')

            const [
                {circle: circleData},
                {sessions: sessionData},
            ] = await Promise.all([
                getCircleById(token, circleId),
                getSessionsForCircle(token, circleId),
            ])

            setCircle(circleData)
            setSessions(sessionData)
        } catch (err) {
            setError(err.message || 'Failed to load circle')
        } finally {
            setIsLoading(false)
        }
    }, [circleId, token])

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true)
            loadDetail()
        }, [loadDetail]),
    )

    const handleArchive = () => {
        Alert.alert(
            'Archive this circle?',
            'Members will no longer see it as active. This can be reversed later by an admin.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Archive',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await archiveCircle(token, circleId)
                            loadDetail()
                        } catch (err) {
                            Alert.alert(
                                'Error',
                                err.message ||
                                    'Failed to archive circle',
                            )
                        }
                    },
                },
            ],
        )
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#4E8C4A"
                />
            </View>
        )
    }

    if (error || !circle) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>
                    {error || 'Circle not found'}
                </Text>
            </View>
        )
    }

    const meetingTypes = Array.isArray(circle.meetingTypes)
        ? circle.meetingTypes
        : []

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>

            {/* GROUP HEADER */}
            <View style={styles.hero}>

                {circle.coverImage ? (
                    <Image
                        source={{uri: circle.coverImage}}
                        style={styles.coverImage}
                    />
                ) : (
                    <View style={styles.coverPlaceholder}>
                        <Text style={styles.coverPlaceholderText}>
                            SUPPORT CIRCLE
                        </Text>
                    </View>
                )}

                <View style={styles.statusWrap}>
                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor:
                                    circle.status === 'active'
                                        ? '#E2EEDB'
                                        : '#E7ECE4',
                            },
                        ]}>

                        <Text
                            style={[
                                styles.statusBadgeText,
                                {
                                    color:
                                        circle.status === 'active'
                                            ? '#3F7540'
                                            : '#666C66',
                                },
                            ]}>
                            {circle.status === 'active'
                                ? 'Active'
                                : 'Archived'}
                        </Text>
                    </View>
                </View>

                {/* GROUP PROFILE IMAGE */}
                <View style={styles.avatarWrap}>
                    {circle.profileImage ? (
                        <Image
                            source={{uri: circle.profileImage}}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {initials(circle.topic)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* GROUP INFORMATION */}
            <View style={styles.titleBlock}>
                <Text style={styles.title}>
                    {circle.topic}
                </Text>

                {circle.category ? (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                            {circle.category}
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.description}>
                    {circle.description}
                </Text>

                <Text style={styles.meta}>
                    {circle.currentMemberCount} /{' '}
                    {circle.maxCapacity} members
                    {meetingTypes.length
                        ? ` · ${meetingTypes
                              .map(meetingLabel)
                              .join(' · ')}`
                        : ''}
                </Text>
            </View>

            {/* EDIT IMAGE / DETAILS BUTTON */}
            <Pressable
                style={styles.primaryButton}
                onPress={() =>
                    navigation.navigate('CircleForm', {
                        circleId,
                    })
                }>
                <Text style={styles.primaryButtonText}>
                    Edit group details & images
                </Text>
            </Pressable>

            {/* VIEW AS MEMBER */}
            <Pressable
                style={styles.memberViewButton}
                onPress={() =>
                    navigation.navigate('MemberCircleDetail', {
                        circleId,
                    })
                }>
                <Text style={styles.memberViewButtonText}>
                    View as Member
                </Text>
            </Pressable>

            {/* EXISTING ACTIONS */}
            <View style={styles.actionGrid}>

                <Pressable
                    style={styles.actionCard}
                    onPress={() =>
                        navigation.navigate('JoinRequests', {
                            circleId,
                            circleTitle: circle.topic,
                        })
                    }>
                    <Text style={styles.actionCardTitle}>
                        Join requests
                    </Text>
                    <Text style={styles.actionCardSubtitle}>
                        Review & approve
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.actionCard}
                    onPress={() =>
                        navigation.navigate('MemberList', {
                            circleId,
                            circleTitle: circle.topic,
                        })
                    }>
                    <Text style={styles.actionCardTitle}>
                        Members
                    </Text>
                    <Text style={styles.actionCardSubtitle}>
                        View & manage
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.actionCard}
                    onPress={() =>
                        navigation.navigate('CircleForm', {
                            circleId,
                        })
                    }>
                    <Text style={styles.actionCardTitle}>
                        Edit details
                    </Text>
                    <Text style={styles.actionCardSubtitle}>
                        Update circle info
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.actionCard}
                    onPress={handleArchive}>
                    <Text
                        style={[
                            styles.actionCardTitle,
                            {color: '#B94A48'},
                        ]}>
                        Archive
                    </Text>

                    <Text style={styles.actionCardSubtitle}>
                        Mark inactive
                    </Text>
                </Pressable>
            </View>

            {/* GROUP INFORMATION CARD */}
            <View style={styles.infoCard}>

                <Text style={styles.infoTitle}>
                    Why this group is being created
                </Text>

                <Text style={styles.infoBody}>
                    {circle.description ||
                        'No description provided.'}
                </Text>

                <Text style={styles.infoTitle}>
                    Rules & guidelines
                </Text>

                <Text style={styles.infoBody}>
                    {circle.rules ||
                        'No additional rules have been added.'}
                </Text>
            </View>

            {/* SESSIONS */}
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                    Sessions
                </Text>

                <Pressable
                    onPress={() =>
                        navigation.navigate('SessionForm', {
                            circleId,
                        })
                    }>
                    <Text style={styles.addLink}>
                        + Schedule
                    </Text>
                </Pressable>
            </View>

            {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateBody}>
                        No sessions scheduled yet.
                    </Text>
                </View>
            ) : (
                sessions.map(session => (
                    <View
                        key={session._id}
                        style={styles.sessionCard}>

                        <View style={styles.sessionInfo}>

                            <Text style={styles.sessionTitle}>
                                {session.title}
                            </Text>

                            <Text style={styles.sessionMeta}>
                                {new Date(
                                    session.scheduledAt,
                                ).toLocaleString()}{' '}
                                · {session.location}
                            </Text>

                            <View
                                style={
                                    styles.sessionLinkRow
                                }>

                                <Pressable
                                    onPress={() =>
                                        navigation.navigate(
                                            'SessionForm',
                                            {
                                                circleId,
                                                sessionId:
                                                    session._id,
                                            },
                                        )
                                    }>
                                    <Text
                                        style={
                                            styles.sessionLink
                                        }>
                                        Edit
                                    </Text>
                                </Pressable>

                                <Text
                                    style={
                                        styles.sessionLinkDot
                                    }>
                                    ·
                                </Text>

                                <Pressable
                                    onPress={() =>
                                        navigation.navigate(
                                            'Attendance',
                                            {
                                                sessionId:
                                                    session._id,
                                                sessionTitle:
                                                    session.title,
                                                circleId,
                                            },
                                        )
                                    }>
                                    <Text
                                        style={
                                            styles.sessionLink
                                        }>
                                        Attendance
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor:
                                        session.status ===
                                        'upcoming'
                                            ? '#E2EEDB'
                                            : '#E7ECE4',
                                },
                            ]}>

                            <Text
                                style={[
                                    styles.statusBadgeText,
                                    {
                                        color:
                                            session.status ===
                                            'upcoming'
                                                ? '#3F7540'
                                                : '#666C66',
                                    },
                                ]}>
                                {session.status}
                            </Text>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    content: {
        paddingBottom: 32,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7EF',
    },

    errorText: {
        fontSize: 14,
        color: '#B94A48',
        textAlign: 'center',
        paddingHorizontal: 24,
    },

    /* GROUP HERO */

    hero: {
        height: 205,
        position: 'relative',
        marginBottom: 52,
    },

    coverImage: {
        width: '100%',
        height: '100%',
    },

    coverPlaceholder: {
        flex: 1,
        backgroundColor: '#DDEBDD',
        alignItems: 'center',
        justifyContent: 'center',
    },

    coverPlaceholderText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
        color: '#5A7657',
    },

    statusWrap: {
        position: 'absolute',
        top: 14,
        right: 14,
    },

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 20,
    },

    statusBadgeText: {
        fontSize: 11,
        fontWeight: '500',
    },

    avatarWrap: {
        position: 'absolute',
        bottom: -42,
        left: 20,
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 4,
        borderColor: '#F4F7EF',
        overflow: 'hidden',
    },

    avatar: {
        width: '100%',
        height: '100%',
    },

    avatarPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4E8C4A',
    },

    avatarText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
    },

    /* GROUP INFO */

    titleBlock: {
        paddingHorizontal: 16,
    },

    title: {
        fontSize: 23,
        fontWeight: '800',
        color: '#252A25',
        marginBottom: 7,
    },

    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E2EEDB',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 9,
    },

    categoryText: {
        color: '#3F7540',
        fontSize: 11,
        fontWeight: '700',
    },

    description: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666C66',
        marginBottom: 7,
    },

    meta: {
        fontSize: 12,
        color: '#707770',
        marginBottom: 16,
    },

    /* EDIT BUTTON */

    primaryButton: {
        marginHorizontal: 16,
        backgroundColor: '#4E8C4A',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        marginBottom: 12,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    memberViewButton: {
    marginHorizontal: 16,
    backgroundColor: '#E5F2E2',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFD8B9',
    },

    memberViewButtonText: {
        color: '#3F7540',
        fontSize: 14,
        fontWeight: '700',
    },

    /* ACTIONS */

    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
    },

    actionCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 14,
    },

    actionCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#252A25',
        marginBottom: 2,
    },

    actionCardSubtitle: {
        fontSize: 12,
        color: '#707770',
    },

    /* INFO */

    infoCard: {
        marginHorizontal: 16,
        backgroundColor: '#E6F5EF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
    },

    infoTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#252A25',
        marginBottom: 5,
        marginTop: 2,
    },

    infoBody: {
        fontSize: 13,
        lineHeight: 19,
        color: '#5E6861',
        marginBottom: 12,
    },

    /* SESSIONS */

    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginBottom: 10,
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#252A25',
    },

    addLink: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4E8C4A',
    },

    emptyState: {
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 16,
        alignItems: 'center',
    },

    emptyStateBody: {
        fontSize: 13,
        color: '#707770',
    },

    sessionCard: {
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },

    sessionInfo: {
        flex: 1,
        marginRight: 8,
    },

    sessionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#252A25',
    },

    sessionMeta: {
        fontSize: 12,
        color: '#707770',
        marginTop: 2,
    },

    sessionLinkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },

    sessionLink: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4E8C4A',
    },

    sessionLinkDot: {
        fontSize: 12,
        color: '#9DA89D',
    },
})

export default CircleDetailScreen