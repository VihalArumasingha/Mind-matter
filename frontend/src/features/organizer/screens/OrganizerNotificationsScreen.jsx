import React, {useCallback, useState} from 'react'
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {useFocusEffect} from '@react-navigation/native'
import {useAuth} from '../../../context/AuthContext'
import {
    getOrganizerNotifications,
    markAllOrganizerNotificationsRead,
    markOrganizerNotificationRead,
} from '../services/organizerNotificationService'

const FILTERS = [
    {key: 'all', label: 'All'},
    {key: 'MEMBER_REQUEST', label: 'Requests'},
    {key: 'POST_MODERATION', label: 'Moderation'},
    {key: 'SESSION_REGISTRATION', label: 'Sessions'},
]

const TYPE_CONFIG = {
    MEMBER_REQUEST: {icon: 'account-plus-outline', color: '#4E8C4A'},
    POST_MODERATION: {icon: 'shield-alert-outline', color: '#C0782C'},
    SESSION_REGISTRATION: {icon: 'calendar-check-outline', color: '#397A85'},
}

const relativeTime = value => {
    const elapsed = Math.max(0, Date.now() - new Date(value).getTime())
    const minutes = Math.floor(elapsed / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    const days = Math.floor(hours / 24)
    if (days < 2) return 'Yesterday'
    return `${days} days ago`
}

const OrganizerNotificationsScreen = ({navigation}) => {
    const {token} = useAuth()
    const [notifications, setNotifications] = useState([])
    const [activeFilter, setActiveFilter] = useState('all')
    const [isLoading, setIsLoading] = useState(true)
    const [isMarkingAll, setIsMarkingAll] = useState(false)
    const [error, setError] = useState('')

    const load = useCallback(async () => {
        try {
            setError('')
            const data = await getOrganizerNotifications(token)
            setNotifications(data.notifications ?? [])
        } catch (err) {
            setError(err.message || 'Failed to load notifications')
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useFocusEffect(useCallback(() => {
        setIsLoading(true)
        load()
    }, [load]))

    const unreadCount = notifications.filter(item => !item.isRead).length
    const visibleNotifications = activeFilter === 'all'
        ? notifications
        : notifications.filter(item => item.type === activeFilter)

    const markAllRead = async () => {
        if (!unreadCount || isMarkingAll) return
        setIsMarkingAll(true)
        try {
            await markAllOrganizerNotificationsRead(token)
            setNotifications(current => current.map(item => ({...item, isRead: true})))
        } catch (err) {
            setError(err.message || 'Failed to mark notifications as read')
        } finally {
            setIsMarkingAll(false)
        }
    }

    const openNotification = async notification => {
        if (!notification.isRead) {
            setNotifications(current => current.map(item =>
                item._id === notification._id ? {...item, isRead: true} : item,
            ))
            try {
                await markOrganizerNotificationRead(token, notification._id)
            } catch (err) {
                setNotifications(current => current.map(item =>
                    item._id === notification._id ? {...item, isRead: false} : item,
                ))
                setError(err.message || 'Failed to update notification')
                return
            }
        }

        const circleId = notification.circleId?._id ?? notification.circleId
        const circleTitle = notification.circleName || notification.circleId?.topic

        if (notification.type === 'MEMBER_REQUEST' || notification.action === 'join_request') {
            navigation.navigate('JoinRequests', {
                circleId,
                circleTitle,
            })
        } else if (notification.type === 'POST_MODERATION' || notification.action === 'moderation') {
            navigation.navigate('Moderation', {postId: notification.postId})
        } else if (notification.type === 'SESSION_REGISTRATION' || notification.action === 'attendance') {
            navigation.navigate('Attendance', {
                sessionId: notification.sessionId?._id ?? notification.sessionId,
                sessionTitle: notification.sessionTitle || notification.sessionId?.title,
                circleId,
            })
        }
    }

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#3F7540" />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.filterHeader}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                    {FILTERS.map(filter => (
                        <Pressable
                            key={filter.key}
                            style={[styles.filter, activeFilter === filter.key && styles.filterActive]}
                            onPress={() => setActiveFilter(filter.key)}>
                            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                                {filter.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
                <Pressable onPress={markAllRead} disabled={!unreadCount || isMarkingAll}>
                    <Text style={[styles.markAll, (!unreadCount || isMarkingAll) && styles.markAllDisabled]}>
                        {isMarkingAll ? 'Saving…' : 'Mark all as read'}
                    </Text>
                </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4E8C4A" />
                </View>
            ) : visibleNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="check-circle-outline" size={36} color="#4E8C4A" />
                    <Text style={styles.emptyTitle}>You’re all caught up</Text>
                    <Text style={styles.emptyBody}>New community activity will appear here.</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={load}
                            colors={['#4E8C4A']}
                            tintColor="#4E8C4A"
                        />
                    }
                >
                    {visibleNotifications.map(notification => {
                        const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.MEMBER_REQUEST
                        const session = notification.sessionId
                        return (
                            <Pressable
                                key={notification._id}
                                style={[styles.notificationCard, !notification.isRead && styles.notificationUnread]}
                                onPress={() => openNotification(notification)}>
                                <View style={[styles.iconWrap, {backgroundColor: `${config.color}18`}]}>
                                    <MaterialCommunityIcons name={config.icon} size={23} color={config.color} />
                                </View>
                                <View style={styles.notificationContent}>
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.notificationTitle, !notification.isRead && styles.notificationTitleUnread]} numberOfLines={2}>
                                            {notification.title}
                                        </Text>
                                        {!notification.isRead ? <View style={styles.unreadDot} /> : null}
                                    </View>
                                    <Text style={styles.message}>{notification.message}</Text>
                                    {notification.type === 'SESSION_REGISTRATION' && session?.title ? (
                                        <Text style={styles.sessionLine}>
                                            {session.title}{session.scheduledAt ? ` · ${new Date(session.scheduledAt).toLocaleString()}` : ''}
                                        </Text>
                                    ) : null}
                                    {notification.circleName || notification.circleId?.topic ? (
                                        <Text style={styles.circleName} numberOfLines={1}>{notification.circleName || notification.circleId?.topic}</Text>
                                    ) : null}
                                    <Text style={styles.timestamp}>{relativeTime(notification.createdAt)}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={22} color="#879187" />
                            </Pressable>
                        )
                    })}
                </ScrollView>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#F4F7EF'},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5EAE2'},
    backButton: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#F1F6EE'},
    headerTitle: {flex: 1, marginLeft: 12, fontSize: 19, fontWeight: '700', color: '#252A25'},
    headerSpacer: {width: 40},
    filterHeader: {paddingTop: 12, paddingBottom: 10},
    filters: {paddingHorizontal: 16, gap: 8},
    filter: {paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE4DC'},
    filterActive: {backgroundColor: '#4E8C4A', borderColor: '#4E8C4A'},
    filterText: {fontSize: 13, fontWeight: '600', color: '#5C655C'},
    filterTextActive: {color: '#FFFFFF'},
    markAll: {alignSelf: 'flex-end', marginTop: 10, marginRight: 17, color: '#3F7540', fontSize: 12, fontWeight: '700'},
    markAllDisabled: {color: '#9AA39A'},
    errorText: {marginHorizontal: 16, marginBottom: 8, color: '#B94A48', fontSize: 13},
    list: {paddingHorizontal: 16, paddingBottom: 28, gap: 10},
    notificationCard: {flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E1E7DE', backgroundColor: '#FFFFFF'},
    notificationUnread: {backgroundColor: '#F0F7EC', borderColor: '#D4E7CF'},
    iconWrap: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, marginRight: 12},
    notificationContent: {flex: 1, minWidth: 0},
    titleRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 7},
    notificationTitle: {flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20, color: '#303830'},
    notificationTitleUnread: {fontWeight: '800'},
    unreadDot: {width: 8, height: 8, marginTop: 6, borderRadius: 4, backgroundColor: '#D94B4B'},
    message: {marginTop: 5, color: '#5E675E', fontSize: 13, lineHeight: 18},
    sessionLine: {marginTop: 4, color: '#3F7540', fontSize: 12, fontWeight: '600', lineHeight: 17},
    circleName: {marginTop: 5, color: '#384A38', fontSize: 12, fontWeight: '700'},
    timestamp: {marginTop: 8, color: '#858D85', fontSize: 11},
    centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    emptyState: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32},
    emptyTitle: {marginTop: 12, fontSize: 16, fontWeight: '700', color: '#303830'},
    emptyBody: {marginTop: 5, fontSize: 13, textAlign: 'center', color: '#747D74'},
})

export default OrganizerNotificationsScreen