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
import {getMyCircles, getPendingRequests} from '../services/supportCircleService'

const OrganizerDashboardScreen = ({navigation}) => {
    const {token, user} = useAuth()

    const [circles, setCircles] = useState([])
    const [pendingCount, setPendingCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const loadDashboard = useCallback(async () => {
        try {
            setError('')

            const {circles: myCircles} = await getMyCircles(token)
            setCircles(myCircles)

            const activeCircles = myCircles.filter(circle => circle.status === 'active')

            const requestCounts = await Promise.all(
                activeCircles.map(circle =>
                    getPendingRequests(token, circle._id)
                        .then(res => res.requests.length)
                        .catch(() => 0),
                ),
            )

            setPendingCount(requestCounts.reduce((total, count) => total + count, 0))
        } catch (err) {
            setError(err.message || 'Failed to load dashboard')
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useFocusEffect(
        useCallback(() => {
            loadDashboard()
        }, [loadDashboard]),
    )

    const totalMembers = circles.reduce((total, circle) => total + circle.currentMemberCount, 0)

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4E8C4A" />
            </View>
        )
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back</Text>
                    <Text style={styles.title}>{user?.name ? `${user.name}'s circles` : 'Your circles'}</Text>
                </View>
                <Pressable style={styles.iconButton} onPress={() => navigation.navigate('OrganizerProfile')}>
                    <Text style={styles.iconButtonText}>⚙</Text>
                </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.statRow}>
                <View style={styles.statCard}>
                    <View style={styles.statIconCircle}>
                        <Text style={styles.statIconText}>👥</Text>
                    </View>
                    <Text style={styles.statNumber}>{totalMembers}</Text>
                    <Text style={styles.statLabel}>Total members</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statIconCircle}>
                        <Text style={styles.statIconText}>⏱</Text>
                    </View>
                    <Text style={styles.statNumber}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Pending requests</Text>
                </View>
            </View>

            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Your circles</Text>
            </View>

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
                                {circle.currentMemberCount} members · {circle.meetingType}
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
                onPress={() => navigation.navigate('CreateCircle')}>
                <Text style={styles.createButtonText}>+  Create a circle</Text>
            </Pressable>
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

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    greeting: {
        fontSize: 13,
        color: '#707770',
        marginBottom: 2,
    },

    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#252A25',
    },

    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconButtonText: {
        fontSize: 16,
        color: '#4E8C4A',
    },

    errorText: {
        fontSize: 13,
        color: '#B94A48',
        marginBottom: 12,
    },

    statRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 22,
    },

    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
    },

    statIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E2EEDB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },

    statIconText: {
        fontSize: 14,
    },

    statNumber: {
        fontSize: 22,
        fontWeight: '600',
        color: '#252A25',
    },

    statLabel: {
        fontSize: 12,
        color: '#707770',
        marginTop: 2,
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

    emptyState: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 20,
        alignItems: 'center',
        marginBottom: 22,
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
        marginTop: 14,
    },

    createButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    },
})

export default OrganizerDashboardScreen