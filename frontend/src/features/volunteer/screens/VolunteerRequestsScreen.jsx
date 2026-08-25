import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../styles/volunteerDashboardStyles';
import { acceptVolunteerRequest, declineVolunteerRequest } from '../services/volunteerService';
import { useAuth } from '../../../context/AuthContext';

const initialRequests = [
  {
    id: 'req_1',
    name: 'Ravindu K.',
    initials: 'RK',
    category: 'Emotional support',
    date: 'Sat, May 24',
    time: '3:00 PM - 4:00 PM',
    note: 'Feeling overwhelmed with upcoming exams. Looking for an empathetic listener to chat for a bit.',
    avatarBg: '#FCE7D6',
    avatarColor: '#B45309',
    status: 'pending',
  },
  {
    id: 'req_2',
    name: 'Nimasha F.',
    initials: 'NF',
    category: 'Peer support',
    date: 'Sun, May 25',
    time: '10:30 AM - 11:30 AM',
    note: 'Would like advice and peer support regarding university stress and balancing study routines.',
    avatarBg: '#E0F2FE',
    avatarColor: '#0369A1',
    status: 'pending',
  },
  {
    id: 'req_3',
    name: 'Chamodi P.',
    initials: 'CP',
    category: 'Student support',
    date: 'Mon, May 26',
    time: '4:00 PM - 5:00 PM',
    note: 'Confirmed support session for exam preparation and stress management guidance.',
    avatarBg: '#EAF3ED',
    avatarColor: '#2F6B47',
    status: 'accepted',
  },
  {
    id: 'req_4',
    name: 'Isuru M.',
    initials: 'IM',
    category: 'Listening session',
    date: 'Wed, May 28',
    time: '6:30 PM - 7:30 PM',
    note: 'General listening session regarding career and life transition anxiety.',
    avatarBg: '#F3E8FF',
    avatarColor: '#7C3AED',
    status: 'accepted',
  },
];

export default function VolunteerRequestsScreen({ navigation, onTabChange }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'history'
  const [requestsList, setRequestsList] = useState(initialRequests);

  const filteredRequests = requestsList.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'accepted') return r.status === 'accepted';
    return r.status === 'completed' || r.status === 'declined';
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
                await acceptVolunteerRequest(requestId, token);
              }
            } catch (err) {
              console.log('Accept request fallback:', err.message);
            }
            setRequestsList((prev) =>
              prev.map((r) => (r.id === requestId ? { ...r, status: 'accepted' } : r))
            );
            Alert.alert('Accepted', `Session with ${name} confirmed!`);
          },
        },
      ]
    );
  };

  const handleDecline = (requestId, name) => {
    Alert.alert(
      'Decline Request',
      `Decline session request from ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              if (token) {
                await declineVolunteerRequest(requestId, token);
              }
            } catch (err) {
              console.log('Decline request fallback:', err.message);
            }
            setRequestsList((prev) =>
              prev.map((r) => (r.id === requestId ? { ...r, status: 'declined' } : r))
            );
            Alert.alert('Declined', `Request from ${name} declined.`);
          },
        },
      ]
    );
  };

  const pendingCount = requestsList.filter((r) => r.status === 'pending').length;
  const acceptedCount = requestsList.filter((r) => r.status === 'accepted').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS?.bg || '#F6F9F6'} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
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
        {filteredRequests.length === 0 ? (
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
                {req.status === 'accepted' && (
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
                    style={styles.acceptButton}
                    onPress={() => handleAccept(req.id, req.name)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.acceptText}>Accept Session</Text>
                  </TouchableOpacity>
                </View>
              )}

              {req.status === 'accepted' && (
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
