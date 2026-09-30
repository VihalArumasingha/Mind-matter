import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';

export default function ProfessionalNotificationsScreen({ navigation }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/posts/notifications`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
      } else {
        throw new Error(data.message || 'Failed to load notifications');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_BASE_URL}/api/posts/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    const isExpanding = expandedId !== notification._id;
    setExpandedId(isExpanding ? notification._id : null);
    if (!notification.isRead) markAsRead(notification._id);
  };

  const iconMap = {
    comment: 'chatbubble-ellipses-outline',
    like: 'heart-outline',
    booking: 'calendar-outline',
    system: 'notifications-outline',
    broadcast: 'megaphone-outline',
    report: 'warning-outline',
    follow: 'person-add-outline',
    approval: 'checkmark-circle-outline',
  };

  const renderNotification = (notification) => {
    const isExpanded = expandedId === notification._id;
    const type = notification.type || 'system';

    return (
      <TouchableOpacity
        key={notification._id}
        style={[
          styles.card,
          !notification.isRead && styles.cardUnread,
          isExpanded && styles.cardExpanded,
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.85}
      >
        <View style={styles.row}>
          {!notification.isRead && <View style={styles.unreadBar} />}

          <View style={styles.iconWrap}>
            <Ionicons
              name={iconMap[type] || 'notifications-outline'}
              size={19}
              color="#6B7280"
            />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaTime}>
                {new Date(notification.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.trailing}>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#9CA3AF"
            />
          </View>
        </View>
        {isExpanded && (
          <View style={styles.detailPanel}>
            <View style={styles.divider} />
            <Text style={styles.detailMessage}>{notification.message}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Received</Text>
              <Text style={styles.detailVal}>
                {new Date(notification.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            </View>

            {notification.relatedPostId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Linked</Text>
                <Text style={styles.detailVal}>Related post available</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#2D5A27" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {notifications.length} total
            {unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4E8C4A" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={56} color="#9CA3AF" />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>You'll see updates and alerts here</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map(renderNotification)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF5',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECE6',
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D5A27',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
    fontWeight: '500',
  },

  /* ── List ── */
  container: { flex: 1 },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 8,
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5ECE2',
    overflow: 'hidden',
    shadowColor: '#1A241A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: '#F2FBF0',
    borderColor: '#CDE5C9',
  },
  cardExpanded: {
    borderColor: '#4E8C4A',
    shadowOpacity: 0.08,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 54,
  },

  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#4E8C4A',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },

  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  textWrap: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A241A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },

  detailPanel: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FAFCF8',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2EBE0',
    marginBottom: 10,
  },
  detailMessage: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  detailKey: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '600',
  },

  /* ── Empty / Loading ── */
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 12.5,
    color: '#9CA3AF',
  },
});