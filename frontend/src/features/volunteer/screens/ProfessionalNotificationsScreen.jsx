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

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/posts/notifications`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      try {
        await fetch(`${API_BASE_URL}/api/posts/notifications/${notification._id}/read`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Update local state
        setNotifications(notifications.map(notif =>
          notif._id === notification._id ? { ...notif, isRead: true } : notif
        ));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to related post if available
    if (notification.relatedPostId) {
      // For now, just show an alert - you could navigate to the post
      Alert.alert('Notification', notification.message);
    }
  };

  const renderNotification = (notification) => {
    const iconMap = {
      'comment': 'chatbubble-outline',
      'like': 'heart-outline',
      'booking': 'calendar-outline',
      'system': 'information-circle-outline',
    };

    const iconColorMap = {
      'comment': '#4E8C4A',
      'like': '#DC2626',
      'booking': '#3B82F6',
      'system': '#6B7280',
    };

    return (
      <TouchableOpacity
        key={notification._id}
        style={[
          styles.notificationCard,
          !notification.isRead && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIcon}>
          <Ionicons
            name={iconMap[notification.type] || 'information-circle-outline'}
            size={24}
            color={iconColorMap[notification.type] || '#6B7280'}
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationTime}>
              {new Date(notification.createdAt).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2D5A27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4E8C4A" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>You'll see comments and likes here</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECE6',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D5A27',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8ECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F0FDF4',
    borderColor: '#4E8C4A',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4E8C4A',
  },
});