import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';

export default function UserNotificationsScreen({ navigation }) {
  const { token, authFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/users/notifications`);

      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await authFetch(`${API_BASE_URL}/api/users/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      // Refresh notifications
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      console.log('[Mark All Read] Starting...');
      const response = await authFetch(`${API_BASE_URL}/api/users/notifications/read-all`, {
        method: 'PUT',
      });
      
      console.log('[Mark All Read] Response status:', response.status);
      const data = await response.json();
      console.log('[Mark All Read] Response data:', data);
      
      if (response.ok) {
        // Refresh notifications
        loadNotifications();
      } else {
        console.error('[Mark All Read] Failed:', data.message);
        Alert.alert('Error', data.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('[Mark All Read] Error:', error.message);
      Alert.alert('Error', 'Failed to mark all as read. Please try again.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'zoom_link_sent':
        return 'videocam';
      case 'booking_approved':
        return 'checkmark-circle';
      case 'booking_declined':
        return 'close-circle';
      case 'booking':
        return 'calendar';
      case 'session_reminder':
        return 'time';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'zoom_link_sent':
        return '#0284C7';
      case 'booking_approved':
        return '#2F6B47';
      case 'booking_declined':
        return '#C0644A';
      case 'booking':
        return '#4E8C4A';
      case 'session_reminder':
        return '#F59E0B';
      default:
        return '#17231A';
    }
  };

  const extractZoomLink = (message) => {
    const zoomUrlRegex = /(https?:\/\/)?(?:www\.)?(zoom\.us\/j\/[^\s]+)/;
    const match = message.match(zoomUrlRegex);
    return match ? match[0] : null;
  };

  const parseZoomDetails = (zoomLink) => {
    if (!zoomLink) return null;
    
    // Ensure the link has a protocol
    let normalizedLink = zoomLink;
    if (!normalizedLink.startsWith('http')) {
      normalizedLink = 'https://' + normalizedLink;
    }
    
    // Extract meeting ID from URL (e.g., /j/75067347179)
    const meetingIdMatch = normalizedLink.match(/\/j\/(\d+)/);
    const meetingId = meetingIdMatch ? meetingIdMatch[1] : null;
    
    // Extract password from URL (e.g., pwd=...)
    const passwordMatch = normalizedLink.match(/[?&]pwd=([^&]+)/);
    const password = passwordMatch ? passwordMatch[1] : null;
    
    return {
      meetingId,
      password,
      fullLink: normalizedLink
    };
  };

  const openZoomLink = async (zoomLink) => {
    try {
      // Ensure the URL has a protocol
      let normalizedUrl = zoomLink;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Try to open in Zoom app first
      const zoomAppUrl = normalizedUrl.replace('https://', 'zoomus://').replace('http://', 'zoomus://');
      
      const supported = await Linking.canOpenURL(zoomAppUrl);
      if (supported) {
        await Linking.openURL(zoomAppUrl);
      } else {
        // Fallback to browser
        await Linking.openURL(normalizedUrl);
      }
    } catch (error) {
      console.error('Error opening Zoom link:', error);
      Alert.alert('Error', 'Could not open Zoom link. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7EF" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#17231A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={markAllAsRead}
            activeOpacity={0.7}
            disabled={isMarkingAll}
          >
            {isMarkingAll ? (
              <ActivityIndicator size={16} color="#4E8C4A" />
            ) : (
              <Text style={styles.markAllReadText}>Mark all read</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E8C4A" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#A0A0A0" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            You'll see booking updates and other notifications here
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadNotifications}
              colors={['#4E8C4A']}
              tintColor="#4E8C4A"
            />
          }
        >
          {notifications.map((notification) => {
            const zoomLink = notification.type === 'zoom_link_sent' ? extractZoomLink(notification.message) : null;
            const zoomDetails = zoomLink ? parseZoomDetails(zoomLink) : null;
            
            return (
              <View
                key={notification._id}
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.unreadNotification,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={24}
                    color={getNotificationColor(notification.type)}
                  />
                </View>
                <View style={styles.content}>
                  <Text style={styles.title}>{notification.title}</Text>
                  <Text style={styles.message}>{notification.message}</Text>
                  {zoomDetails && (
                    <View style={styles.zoomDetailsBox}>
                      <View style={styles.zoomDetailRow}>
                        <Text style={styles.zoomDetailLabel}>Meeting ID:</Text>
                        <Text style={styles.zoomDetailValue}>{zoomDetails.meetingId}</Text>
                      </View>
                      <View style={styles.zoomDetailRow}>
                        <Text style={styles.zoomDetailLabel}>Password:</Text>
                        <Text style={styles.zoomDetailValue}>{zoomDetails.password}</Text>
                      </View>
                      <View style={styles.zoomDetailRow}>
                        <Text style={styles.zoomDetailLabel}>Link:</Text>
                        <Text style={styles.zoomDetailLink}>
                          {zoomDetails.fullLink}
                        </Text>
                      </View>
                      <View style={styles.zoomLinkContainer}>
                        <TouchableOpacity
                          style={styles.zoomLinkButton}
                          onPress={() => openZoomLink(zoomLink)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="videocam" size={18} color="#0284C7" />
                          <Text style={styles.zoomLinkText}>Zoom App</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.zoomLinkButton}
                          onPress={() => {
                            const normalizedUrl = zoomLink.startsWith('http') ? zoomLink : 'https://' + zoomLink;
                            Linking.openURL(normalizedUrl);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="open-outline" size={18} color="#4E8C4A" />
                          <Text style={styles.zoomLinkText}>Browser</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {notification.type === 'session_reminder' && (
                    <View style={styles.reminderActionBox}>
                      <Text style={styles.reminderText}>🕐 Don't forget to join your session!</Text>
                    </View>
                  )}
                  <Text style={styles.time}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                </View>
                {!notification.isRead && (
                  <TouchableOpacity
                    style={styles.markReadButton}
                    onPress={() => markAsRead(notification._id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-done" size={20} color="#4E8C4A" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7EF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F4F7EF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#17231A',
  },
  placeholder: {
    width: 40,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EAF3ED',
    borderRadius: 16,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4E8C4A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F0F7F0',
    borderLeftWidth: 3,
    borderLeftColor: '#4E8C4A',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F7EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17231A',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  zoomLinkContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  zoomLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  zoomLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  zoomDetailsBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  zoomDetailRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  zoomDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
    width: 80,
    flexShrink: 0,
  },
  zoomDetailValue: {
    fontSize: 11,
    color: '#333',
    flex: 1,
  },
  zoomDetailLink: {
    fontSize: 10,
    color: '#666',
    flex: 1,
  },
  reminderActionBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  reminderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  markReadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
