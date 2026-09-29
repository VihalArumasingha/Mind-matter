import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  BackHandler,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../styles/volunteerDashboardStyles';
import { acceptVolunteerRequest, declineVolunteerRequest, getVolunteerDashboardData, getVolunteerRequests } from '../services/volunteerService';
import { useAuth } from '../../../context/AuthContext';

export default function VolunteerRequestsScreen({ navigation, onTabChange }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'history'
  const [requestsList, setRequestsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineMessage, setDeclineMessage] = useState('');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Load requests from backend using the same endpoint as dashboard
  const loadRequests = async () => {
    try {
      setIsLoading(true);
      
      // Load all requests for proper tab filtering
      const allRequestsData = await getVolunteerRequests(token, 'all');
      console.log('[Load Requests] All requests data:', allRequestsData);
      
      if (allRequestsData.success && allRequestsData.requests) {
        const allRequests = allRequestsData.requests.map(r => ({ 
          ...r, 
          tabCategory: r.status === 'confirmed' ? 'accepted' : r.status 
        }));
        console.log('[Load Requests] All requests:', allRequests);
        console.log('[Load Requests] Pending count:', allRequests.filter(r => r.status === 'pending').length);
        console.log('[Load Requests] Accepted count:', allRequests.filter(r => r.status === 'confirmed').length);
        console.log('[Load Requests] History count:', allRequests.filter(r => ['cancelled', 'declined', 'completed'].includes(r.status)).length);
        
        setRequestsList(allRequests);
      } else {
        // Fallback to dashboard data if all requests fail
        const data = await getVolunteerDashboardData(token);
        console.log('[Load Requests] Fallback to dashboard data:', data);
        
        const allRequests = [
          ...(data.pendingRequests || []).map(r => ({ ...r, tabCategory: 'pending' })),
          ...(data.upcomingSessions || []).map(r => ({ ...r, tabCategory: 'accepted', status: 'confirmed' }))
        ];
        
        setRequestsList(allRequests);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      // Use empty array if API fails
      setRequestsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [token, activeTab]);

  const filteredRequests = requestsList.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending' || r.tabCategory === 'pending';
    if (activeTab === 'accepted') return r.status === 'confirmed' || r.status === 'accepted' || r.tabCategory === 'accepted';
    return r.status === 'completed' || r.status === 'declined' || r.status === 'cancelled';
  });

  const handleAccept = async (requestId, name) => {
    Alert.alert(
      'Accept Request',
      `Accept session request from ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              if (token) {
                const result = await acceptVolunteerRequest(requestId, token);
                console.log('[Handle Accept] Result:', result);
                // Reload requests after acceptance
                await loadRequests();
              }
              Alert.alert('Accepted', `Session with ${name} confirmed! A notification has been sent to the user.`);
            } catch (err) {
              console.log('Accept request error:', err.message);
              Alert.alert('Error', `Failed to accept request: ${err.message}. Please try again.`);
            }
          },
        },
      ]
    );
  };

  const handleDecline = (requestId, name) => {
    setSelectedRequest({ id: requestId, name });
    setDeclineMessage('');
    setDeclineModalVisible(true);
  };

  const submitDecline = async () => {
    try {
      if (token && selectedRequest) {
        await declineVolunteerRequest(selectedRequest.id, token, declineMessage);
        await loadRequests();
        setDeclineModalVisible(false);
        Alert.alert('Declined', `Request from ${selectedRequest.name} declined. The user will be notified to try another time slot.`);
      }
    } catch (err) {
      console.log('Decline request error:', err.message);
      Alert.alert('Error', `Failed to decline request: ${err.message}. Please try again.`);
    }
  };

  const handleSeeOptions = (request) => {
    setSelectedRequest(request);
    setDetailsModalVisible(true);
  };

  const pendingCount = requestsList.filter((r) => r.status === 'pending' || r.tabCategory === 'pending').length;
  const acceptedCount = requestsList.filter((r) => r.status === 'confirmed' || r.status === 'accepted' || r.tabCategory === 'accepted').length;

  const handleGoBack = () => {
    if (onTabChange) {
      onTabChange('dashboard');
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('VolunteerDashboard');
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [onTabChange, navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS?.bg || '#F6F9F6'} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleGoBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session Requests</Text>
        </View>
        <Ionicons name="options-outline" size={20} color={GREEN} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'accepted' && styles.tabButtonActive]}
          onPress={() => setActiveTab('accepted')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}>
            Accepted ({acceptedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.emptyStateContainer}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={styles.emptyTitle}>Loading requests...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="clipboard-outline" size={48} color={TEXT_MUTED} />
            <Text style={styles.emptyTitle}>No {activeTab} requests</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'pending'
                ? "You're all caught up! New requests from users will appear here."
                : `No ${activeTab} session requests found.`}
            </Text>
          </View>
        ) : (
          filteredRequests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              {/* Top User Info */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: req.avatarBg }]}>
                  <Text style={[styles.avatarText, { color: req.avatarColor }]}>
                    {req.initials}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{req.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{req.category}</Text>
                  </View>
                </View>
                {(req.status === 'accepted' || req.status === 'confirmed') && (
                  <View style={styles.acceptedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={GREEN} />
                    <Text style={styles.acceptedBadgeText}>Accepted</Text>
                  </View>
                )}
              </View>

              {/* Time Details */}
              <View style={styles.timeDetailsBox}>
                <Ionicons name="calendar-outline" size={16} color={GREEN} />
                <Text style={styles.timeDetailsText}>
                  {req.date} · {req.time}
                </Text>
              </View>

              {/* User Note */}
              {req.note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>User note:</Text>
                  <Text style={styles.noteText}>"{req.note}"</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              {req.status === 'pending' && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDecline(req.id, req.name)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#C0644A" />
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.seeOptionsButton}
                    onPress={() => handleSeeOptions(req)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={18} color={GREEN} />
                    <Text style={styles.seeOptionsText}>See Options</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(req.id, req.name)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.acceptText}>Accept Session</Text>
                  </TouchableOpacity>
                </View>
              )}

              {(req.status === 'accepted' || req.status === 'confirmed') && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => onTabChange?.('messages')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={GREEN} />
                    <Text style={styles.messageText}>Message User</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <NavItem
          icon="view-dashboard-outline"
          label="Dashboard"
          onPress={() => onTabChange?.('dashboard')}
        />
        <NavItem
          icon="clipboard-list-outline"
          label="Requests"
          active
          onPress={() => onTabChange?.('requests')}
        />
        <NavItem
          icon="calendar-blank-outline"
          label="Availability"
          onPress={() => onTabChange?.('availability')}
        />
        <NavItem
          icon="message-outline"
          label="Messages"
          onPress={() => onTabChange?.('messages')}
        />
        <NavItem
          icon="account-outline"
          label="Profile"
          onPress={() => onTabChange?.('profile')}
        />
      </View>

      {/* Decline Message Modal */}
      <Modal
        visible={declineModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDeclineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Decline Request</Text>
              <TouchableOpacity onPress={() => setDeclineModalVisible(false)}>
                <Ionicons name="close" size={24} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Add an optional message for {selectedRequest?.name || 'the user'}
            </Text>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Enter decline message (optional)"
              placeholderTextColor={TEXT_MUTED}
              value={declineMessage}
              onChangeText={setDeclineMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeclineModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={submitDecline}
              >
                <Text style={styles.modalConfirmText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* See Options Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>
            
            {selectedRequest && (
              <ScrollView style={styles.detailsScroll}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.category}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.time}</Text>
                </View>
                {selectedRequest.note && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Note:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.note}</Text>
                  </View>
                )}
              </ScrollView>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { flex: 1 }]}
                onPress={() => {
                  setDetailsModalVisible(false);
                  handleDecline(selectedRequest.id, selectedRequest.name);
                }}
              >
                <Ionicons name="close-circle-outline" size={18} color="#C0644A" />
                <Text style={styles.modalCancelText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { flex: 1 }]}
                onPress={() => {
                  setDetailsModalVisible(false);
                  handleAccept(selectedRequest.id, selectedRequest.name);
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.modalConfirmText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress }) {
  const color = active ? GREEN : TEXT_MUTED;
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.activeNavIndicator]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const GREEN = '#2F6B47';
const GREEN_BG = '#EAF3ED';
const TEXT_DARK = '#1B3A24';
const TEXT_MUTED = '#6B8072';
const BORDER = '#E1EAE3';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#EBEFEA',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: GREEN,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: GREEN_BG,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GREEN_BG,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  timeDetailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7FAF7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFF5F0',
  },
  timeDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  noteBox: {
    backgroundColor: '#FAFAF9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8D7DA',
    backgroundColor: '#FFF8F8',
  },
  declineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C0644A',
  },
  acceptButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: GREEN,
  },
  acceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: GREEN_BG,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN,
  },
  seeOptionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: TEXT_MUTED,
  },
  seeOptionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  modalSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 15,
  },
  messageInput: {
    backgroundColor: '#F7FAF7',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 20,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EBEFEA',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#C0644A',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsScroll: {
    maxHeight: 200,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: TEXT_DARK,
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  activeNavIndicator: {
    backgroundColor: GREEN_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
});
