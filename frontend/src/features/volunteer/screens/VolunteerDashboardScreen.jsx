import React, { useEffect, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { getVolunteerDashboard as getVolunteerDashboardAPI } from '../services/volunteerService'
import { useAuth } from '../../context/AuthContext'

const VolunteerDashboardScreen = ({ navigation }) => {
    const { token } = useAuth()
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchDashboardData = async () => {
        try {
            const response = await getVolunteerDashboardAPI(token)
            setDashboardData(response)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            // Fallback to mock data if API fails
            setDashboardData({
                volunteer: {
                    id: '1',
                    name: 'Volunteer User',
                    email: 'volunteer@example.com',
                    role: 'volunteer',
                    profilePicture: '',
                    bio: 'Passionate about helping others',
                    createdAt: new Date().toISOString()
                },
                statistics: {
                    pendingApplications: 5,
                    openReports: 12,
                    totalReports: 8
                },
                professionalApplication: null,
                recentActivity: []
            })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const onRefresh = () => {
        setRefreshing(true)
        fetchDashboardData()
    }

    const StatCard = ({ icon, title, value, color, onPress }) => (
        <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: color }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.statIconContainer}>
                <Icon name={icon} size={24} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </TouchableOpacity>
    )

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userName}>{dashboardData.volunteer.name}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Icon name="person" size={24} color="#4E8C4A" />
                    </TouchableOpacity>
                </View>

                {/* Statistics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.statsContainer}>
                        <StatCard
                            icon="description"
                            title="Pending Applications"
                            value={dashboardData.statistics.pendingApplications}
                            color="#FF6B6B"
                            onPress={() => navigation.navigate('VolunteerApplications')}
                        />
                        <StatCard
                            icon="report"
                            title="Open Reports"
                            value={dashboardData.statistics.openReports}
                            color="#4E8C4A"
                            onPress={() => navigation.navigate('VolunteerReports')}
                        />
                        <StatCard
                            icon="assignment"
                            title="Your Reports"
                            value={dashboardData.statistics.totalReports}
                            color="#5C9EAD"
                        />
                    </View>
                </View>

                {/* Professional Application Status */}
                {dashboardData.professionalApplication && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Application</Text>
                        <View style={styles.applicationCard}>
                            <View style={styles.applicationHeader}>
                                <Text style={styles.applicationTitle}>
                                    {dashboardData.professionalApplication.profession}
                                </Text>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(dashboardData.professionalApplication.status) }
                                ]}>
                                    <Text style={styles.statusText}>
                                        {dashboardData.professionalApplication.status}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.applicationDetails}>
                                Applied: {new Date(dashboardData.professionalApplication.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('VolunteerApplications')}
                        >
                            <Icon name="fact_check" size={28} color="#4E8C4A" />
                            <Text style={styles.actionButtonText}>Review Applications</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('VolunteerReports')}
                        >
                            <Icon name="policy" size={28} color="#4E8C4A" />
                            <Text style={styles.actionButtonText}>Manage Reports</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Activity */}
                {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        {dashboardData.recentActivity.map((activity, index) => (
                            <View key={index} style={styles.activityItem}>
                                <Icon name="history" size={20} color="#687068" />
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle}>
                                        Report on {activity.targetType}
                                    </Text>
                                    <Text style={styles.activityDate}>
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const getStatusColor = (status) => {
    switch (status) {
        case 'pending':
            return '#FFA500'
        case 'approved':
            return '#4E8C4A'
        case 'rejected':
            return '#FF6B6B'
        default:
            return '#687068'
    }
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#687068',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 14,
        color: '#687068',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3748',
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statIconContainer: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2D3748',
    },
    statTitle: {
        fontSize: 12,
        color: '#687068',
        marginTop: 4,
    },
    applicationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    applicationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    applicationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    applicationDetails: {
        fontSize: 14,
        color: '#687068',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginTop: 8,
    },
    activityItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activityContent: {
        marginLeft: 12,
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
    },
    activityDate: {
        fontSize: 12,
        color: '#687068',
        marginTop: 4,
    },
})

export default VolunteerDashboardScreen