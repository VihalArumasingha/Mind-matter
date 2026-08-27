import React, {useCallback, useState} from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useAuth} from '../../../context/AuthContext'
import {
    getMyCircles,
    getAllPendingRequests,
    getDashboardStats,
    respondToRequest,
} from '../services/supportCircleService'

const TABS = ['Overview', 'My Circles', 'Request']

const OrganizerDashboardScreen = ({navigation}) => {
    const {token, user} = useAuth()

    const [activeTab, setActiveTab] = useState('Overview')
    const [stats, setStats] = useState(null)
    const [circles, setCircles] = useState([])
    const [requests, setRequests] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const loadAll = useCallback(async () => {
        try {
            setError('')
            const [statsData, circlesData, requestsData] = await Promise.all([
                getDashboardStats(token),
                getMyCircles(token),
                getAllPendingRequests(token),
            ])
            setStats(statsData)
            setCircles(circlesData.circles)
            setRequests(requestsData.requests)
        } catch (err) {
            setError(err.message || 'Failed to load dashboard')
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useFocusEffect(
        useCallback(() => {
            loadAll()
        }, [loadAll]),
    )

    const handleRespond = async (membershipId, decision) => {
        try {
            await respondToRequest(token, membershipId, decision)
            loadAll()
        } catch (err) {
            setError(err.message || 'Failed to respond to request')
        }
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4E8C4A" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.brand}>MindMatter</Text>
                <Text style={styles.bellIcon}>🔔</Text>
            </View>

            <View style={styles.tabRow}>
                {TABS.map(tab => (
                    <Pressable
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}>
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {activeTab === 'Overview' && (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.statRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats?.totalCircles ?? 0}</Text>
                            <Text style={styles.statLabel}>Total Circles</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats?.pendingRequests ?? 0}</Text>
                            <Text style={styles.statLabel}>Pending Requests</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats?.upcomingSessionsCount ?? 0}</Text>
                            <Text style={styles.statLabel}>Upcoming Sessions</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>RECENT ACTIVITIES</Text>

                    {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateBody}>
                                Nothing yet — activity will show up here as your circles grow.
                            </Text>
                        </View>
                    ) : (
                        stats.recentActivity.map((activity, index) => (
                            <View key={index} style={styles.activityCard}>
                                <Text style={styles.activityText}>{activity.message}</Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {activeTab === 'My Circles' && (
                <ScrollView contentContainerStyle={styles.content}>
                    {circles.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateTitle}>Start your first circle</Text>
                            <Text style={styles.emptyStateBody}>
                                Create a support circle to bring your community together.
                            </Text>
                        </View>
                    ) : (
                        circles.map(circle => (
                            <Pressable
                                key={circle._id}
                                style={styles.circleCard}
                                onPress={() => navigation.navigate('CircleDetail', {circleId: circle._id})}>
                                <View
                                    style={[
                                        styles.circleAvatar,
                                        {borderColor: circle.status === 'active' ? '#4E8C4A' : '#A1A8A1'},
                                    ]}>
                                    <Text style={styles.circleAvatarText}>👥</Text>
                                </View>
                                <View style={styles.circleInfo}>
                                    <Text style={styles.circleName}>{circle.topic}</Text>
                                    <Text style={styles.circleMeta}>
                                        {circle.currentMemberCount} members ·{' '}
                                        {circle.meetingTypes?.join(' & ')}
                                    </Text>
                                </View>
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
                            </Pressable>
                        ))
                    )}

                    <Pressable
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CircleForm')}>
                        <Text style={styles.createButtonText}>+  Create a circle</Text>
                    </Pressable>
                </ScrollView>
            )}

            {activeTab === 'Request' && (
                <ScrollView contentContainerStyle={styles.content}>
                    {requests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateBody}>No pending join requests right now.</Text>
                        </View>
                    ) : (
                        requests.map(request => (
                            <View key={request._id} style={styles.requestCard}>
                                <View style={styles.requestInfo}>
                                    <Text style={styles.requestName}>{request.userId?.name}</Text>
                                    <Text style={styles.requestMeta}>
                                        wants to join {request.groupId?.topic}
                                    </Text>
                                </View>
                                <View style={styles.requestActions}>
                                    <Pressable
                                        style={[styles.requestButton, styles.approveButton]}
                                        onPress={() => handleRespond(request._id, 'approved')}>
                                        <Text style={styles.requestButtonTextLight}>Approve</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.requestButton, styles.rejectButton]}
                                        onPress={() => handleRespond(request._id, 'rejected')}>
                                        <Text style={styles.requestButtonTextLight}>Reject</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7EF',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },

    brand: {
        fontSize: 18,
        fontWeight: '700',
        color: '#252A25',
    },

    bellIcon: {
        fontSize: 18,
    },

    tabRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 16,
        padding: 4,
        marginBottom: 8,
    },

    tab: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 20,
        alignItems: 'center',
    },

    tabActive: {
        backgroundColor: '#4E8C4A',
    },

    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666C66',
    },

    tabTextActive: {
        color: '#FFFFFF',
    },

    errorText: {
        fontSize: 13,
        color: '#B94A48',
        marginHorizontal: 16,
        marginBottom: 8,
    },

    content: {
        padding: 16,
        paddingBottom: 32,
    },

    statRow: {
        flexDirection: 'row',
        backgroundColor: '#E2EEDB',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },

    statCard: {
        flex: 1,
        alignItems: 'flex-start',
    },

    statNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: '#252A25',
    },

    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3F7540',
        marginTop: 2,
    },

    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#252A25',
        letterSpacing: 0.3,
        marginBottom: 10,
    },

    emptyState: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 20,
        alignItems: 'center',
    },

    emptyStateTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#252A25',
        marginBottom: 4,
    },

    emptyStateBody: {
        fontSize: 13,
        color: '#707770',
        textAlign: 'center',
    },

    activityCard: {
        backgroundColor: '#4E8C4A',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },

    activityText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '500',
    },

    circleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },

    circleAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },

    circleAvatarText: {
        fontSize: 15,
    },

    circleInfo: {
        flex: 1,
    },

    circleName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#252A25',
    },

    circleMeta: {
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

    createButton: {
        backgroundColor: '#4E8C4A',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },

    createButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    },

    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 14,
        marginBottom: 10,
    },

    requestInfo: {
        marginBottom: 10,
    },

    requestName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#252A25',
    },

    requestMeta: {
        fontSize: 12,
        color: '#707770',
        marginTop: 2,
    },

    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },

    requestButton: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 20,
        alignItems: 'center',
    },

    approveButton: {
        backgroundColor: '#4E8C4A',
    },

    rejectButton: {
        backgroundColor: '#B94A48',
    },

    requestButtonTextLight: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
})

export default OrganizerDashboardScreen