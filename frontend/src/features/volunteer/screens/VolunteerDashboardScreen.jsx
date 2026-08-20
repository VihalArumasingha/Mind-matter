import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';
import styles, { COLORS } from '../styles/volunteerDashboardStyles';
import VolunteerRequestCard from '../components/VolunteerRequestCard';
import VolunteerSessionCard from '../components/VolunteerSessionCard';
import { updateAvailabilityStatus } from '../services/volunteerService';

// ---- Sample data (fallback when API is connecting) ----
const initialPendingRequests = [
  {
    id: '1',
    name: 'Ravindu K.',
    initials: 'RK',
    category: 'Emotional support',
    time: 'Sat, 3:00 PM',
    avatarBg: '#FCE7D6',
    avatarColor: '#B45309',
  },
  {
    id: '2',
    name: 'Nimasha F.',
    initials: 'NF',
    category: 'Peer support',
    time: 'Sun, 10:30 AM',
    avatarBg: '#E0F2FE',
    avatarColor: '#0369A1',
  },
];

const initialUpcomingSessions = [
  {
    id: '1',
    name: 'Chamodi P.',
    category: 'Student support',
    time: '4:00 PM',
    day: '18',
    month: 'MAY',
  },
  {
    id: '2',
    name: 'Isuru M.',
    category: 'Listening session',
    time: '6:30 PM',
    day: '21',
    month: 'MAY',
  },
];

function NavItem({ icon, label, active, onPress }) {
  const color = active ? COLORS.green : COLORS.navInactive;
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

export default function VolunteerDashboardScreen({ navigation, onTabChange }) {
  const { user, token } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [pendingRequests] = useState(initialPendingRequests);
  const [upcomingSessions] = useState(initialUpcomingSessions);

  // Dynamic user name and initials
  const displayName = user?.fullName || user?.name || 'Dewmini Costa';
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'DC';

  const handleToggleAvailability = async (value) => {
    setIsAvailable(value);
    try {
      if (token) {
        await updateAvailabilityStatus(value, token);
      }
    } catch (err) {
      console.log('Availability status update (local fallback):', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.nameText}>{displayName}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconCircle} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.green} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
              <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => onTabChange?.('profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Availability toggle card */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityLeft}>
            <Text style={styles.availabilityLabel}>Availability status</Text>
            <View style={styles.availabilityStatusRow}>
              {isAvailable && <View style={styles.statusIndicatorDot} />}
              <Text style={styles.availabilityValue}>
                {isAvailable ? 'Open for sessions' : 'Not available'}
              </Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: COLORS.switchInactive, true: COLORS.greenLight }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.greenLight}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statNumber}>{pendingRequests.length}</Text>
              <View style={[styles.statIconBox, { backgroundColor: '#FCE7D6' }]}>
                <Ionicons name="people-outline" size={16} color="#B45309" />
              </View>
            </View>
            <Text style={styles.statLabel}>Pending requests</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statNumber}>{upcomingSessions.length}</Text>
              <View style={[styles.statIconBox, { backgroundColor: COLORS.greenBg }]}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.green} />
              </View>
            </View>
            <Text style={styles.statLabel}>Upcoming sessions</Text>
          </View>
        </View>

        {/* Pending requests */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Pending requests</Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{pendingRequests.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.sectionLinkContainer}
            onPress={() => onTabChange?.('requests')}
          >
            <Text style={styles.sectionLink}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.green} />
          </TouchableOpacity>
        </View>

        {pendingRequests.map((req) => (
          <VolunteerRequestCard
            key={req.id}
            request={req}
            onPress={() => onTabChange?.('requests')}
          />
        ))}

        {/* Upcoming sessions */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Upcoming sessions</Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{upcomingSessions.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.sectionLinkContainer}
            onPress={() => onTabChange?.('requests')}
          >
            <Text style={styles.sectionLink}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.green} />
          </TouchableOpacity>
        </View>

        {upcomingSessions.map((session) => (
          <VolunteerSessionCard
            key={session.id}
            session={session}
            onPress={() => onTabChange?.('requests')}
          />
        ))}
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <NavItem
          icon="view-dashboard-outline"
          label="Dashboard"
          active
          onPress={() => onTabChange?.('dashboard')}
        />
        <NavItem
          icon="clipboard-list-outline"
          label="Requests"
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
