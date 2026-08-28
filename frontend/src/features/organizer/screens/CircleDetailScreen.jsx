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
import {useFocusEffect} from '@react-navigation/native'
import {useAuth} from '../../../context/AuthContext'
import {
    archiveCircle,
    getCircleById,
} from '../services/supportCircleService'
import {getSessionsForCircle} from '../services/sessionService'

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
            const [{circle: circleData}, {sessions: sessionData}] = await Promise.all([
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
            loadDetail()
        }, [loadDetail]),
    )

    const handleArchive = () => {
        Alert.alert(
            'Archive this circle?',
            'Members will no longer see it as active. This can be reversed later by an admin.',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Archive',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await archiveCircle(token, circleId)
                            loadDetail()
                        } catch (err) {
                            Alert.alert('Error', err.message || 'Failed to archive circle')
                        }
                    },
                },
            ],
        )
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4E8C4A" />
            </View>
        )
    }

    if (error || !circle) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>{error || 'Circle not found'}</Text>
            </View>
        )
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>{circle.topic}</Text>
                <View
                    style={[
                        styles.statusBadge,
                        {backgroundColor: circle.status === 'active' ? '#E2EEDB' : '#E7ECE4'},
                    ]}>
                    <Text
                        style={[
                            styles.statusBadgeText,
                            {color: circle.status === 'active' ? '#3F7540' : '#666C66'},
                        ]}>
                        {circle.status === 'active' ? 'Active' : 'Archived'}
                    </Text>
                </View>
            </View>

            <Text style={styles.description}>{circle.description}</Text>
            <Text style={styles.meta}>
                {circle.currentMemberCount} / {circle.maxCapacity} members · {circle.meetingType}
            </Text>

            <View style={styles.actionGrid}>
                <Pressable
                    style={styles.actionCard}
                    onPress={() =>
                        navigation.navigate('JoinRequests', {
                            circleId,
                            circleTitle: circle.topic,
                        })
                    }>
                    <Text style={styles.actionCardTitle}>Join requests</Text>
                    <Text style={styles.actionCardSubtitle}>Review & approve</Text>
                </Pressable>

                <Pressable
                    style={styles.actionCard}
                    onPress={() =>
                        navigation.navigate('MemberList', {
                            circleId,
                            circleTitle: circle.topic,
                        })
                    }>
                    <Text style={styles.actionCardTitle}>Members</Text>
                    <Text style={styles.actionCardSubtitle}>View & manage</Text>
                </Pressable>

                <Pressable
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('CircleForm', {circleId})}>
                    <Text style={styles.actionCardTitle}>Edit details</Text>
                    <Text style={styles.actionCardSubtitle}>Update circle info</Text>
                </Pressable>

                <Pressable style={styles.actionCard} onPress={handleArchive}>
                    <Text style={[styles.actionCardTitle, {color: '#B94A48'}]}>Archive</Text>
                    <Text style={styles.actionCardSubtitle}>Mark inactive</Text>
                </Pressable>
            </View>

            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Sessions</Text>
                <Pressable onPress={() => navigation.navigate('SessionForm', {circleId})}>
                    <Text style={styles.addLink}>+ Schedule</Text>
                </Pressable>
            </View>

            {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateBody}>No sessions scheduled yet.</Text>
                </View>
            ) : (
                sessions.map(session => (
                    <View key={session._id} style={styles.sessionCard}>
                        <View style={styles.sessionInfo}>
                            <Text style={styles.sessionTitle}>{session.title}</Text>
                            <Text style={styles.sessionMeta}>
                                {new Date(session.scheduledAt).toLocaleString()} · {session.location}
                            </Text>
                            {/* ── Quick links ── */}
                            <View style={styles.sessionLinkRow}>
                                <Pressable
                                    onPress={() =>
                                        navigation.navigate('SessionForm', {
                                            circleId,
                                            sessionId: session._id,
                                        })
                                    }>
                                    <Text style={styles.sessionLink}>Edit</Text>
                                </Pressable>
                                <Text style={styles.sessionLinkDot}>·</Text>
                                <Pressable
                                    onPress={() =>
                                        navigation.navigate('Attendance', {
                                            sessionId: session._id,
                                            sessionTitle: session.title,
                                            circleId,
                                        })
                                    }>
                                    <Text style={styles.sessionLink}>Attendance</Text>
                                </Pressable>
                            </View>
                        </View>
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor:
                                        session.status === 'upcoming' ? '#E2EEDB' : '#E7ECE4',
                                },
                            ]}>
                            <Text
                                style={[
                                    styles.statusBadgeText,
                                    {
                                        color:
                                            session.status === 'upcoming' ? '#3F7540' : '#666C66',
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
        padding: 16,
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
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },

    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#252A25',
        flex: 1,
        marginRight: 8,
    },

    description: {
        fontSize: 14,
        color: '#666C66',
        marginBottom: 6,
    },

    meta: {
        fontSize: 12,
        color: '#707770',
        marginBottom: 20,
    },

    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
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

    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 20,
    },

    statusBadgeText: {
        fontSize: 11,
        fontWeight: '500',
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