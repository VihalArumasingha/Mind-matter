import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';
import styles, { COLORS } from '../styles/volunteerDashboardStyles';
import VolunteerRequestCard from '../components/VolunteerRequestCard';
import VolunteerSessionCard from '../components/VolunteerSessionCard';
import { updateAvailabilityStatus, getVolunteerDashboardData } from '../services/volunteerService';

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

export default function VolunteerDashboardScreen({ navigation, route, onTabChange }) {
  const { user, token } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic user name and initials
  const displayName = user?.fullName || user?.name || 'Dewmini Costa';
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'DC';

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await getVolunteerDashboardData(token);
      setPendingRequests(data.pendingRequests || []);
      setUpcomingSessions(data.upcomingSessions || []);
      setIsAvailable(data.isAvailable !== undefined ? data.isAvailable : true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Use empty arrays if API fails
      setPendingRequests([]);
      setUpcomingSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

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
            <TouchableOpacity 
              style={styles.iconCircle} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProfessionalNotifications')}
            >
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
              <Text style={styles.statNumber}>{isLoading ? '...' : pendingRequests.length}</Text>
              <View style={[styles.statIconBox, { backgroundColor: '#FCE7D6' }]}>
                <Ionicons name="people-outline" size={16} color="#B45309" />
              </View>
            </View>
            <Text style={styles.statLabel}>Pending requests</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statNumber}>{isLoading ? '...' : upcomingSessions.length}</Text>
              <View style={[styles.statIconBox, { backgroundColor: COLORS.greenBg }]}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.green} />
              </View>
            </View>
            <Text style={styles.statLabel}>Upcoming sessions</Text>
          </View>
        </View>

        {/* Professional Post Button */}
        <TouchableOpacity
          style={styles.professionalPostButton}
          onPress={() => navigation.navigate('ProfessionalPostForm')}
          activeOpacity={0.8}
        >
          <View style={styles.professionalPostContent}>
            <View style={styles.professionalPostIcon}>
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.professionalPostText}>
              <Text style={styles.professionalPostTitle}>Create Professional Post</Text>
              <Text style={styles.professionalPostSubtitle}>Share expertise with the community</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4E8C4A" />
          </View>
        </TouchableOpacity>

        {/* View Posts Button */}
        <TouchableOpacity
          style={styles.viewPostsButton}
          onPress={() => navigation.navigate('ViewProfessionalPosts')}
          activeOpacity={0.8}
        >
          <View style={styles.professionalPostContent}>
            <View style={styles.professionalPostIcon}>
              <Ionicons name="list-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.professionalPostText}>
              <Text style={styles.professionalPostTitle}>View My Posts</Text>
              <Text style={styles.professionalPostSubtitle}>Manage your professional posts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4E8C4A" />
          </View>
        </TouchableOpacity>

        {/* Pending requests */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Pending requests</Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{isLoading ? '...' : pendingRequests.length}</Text>
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

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.green} />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : pendingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        ) : (
          pendingRequests.map((req) => (
            <VolunteerRequestCard
              key={req.id}
              request={req}
              onPress={() => onTabChange?.('requests')}
            />
          ))
        )}

        {/* Upcoming sessions */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Upcoming sessions</Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{isLoading ? '...' : upcomingSessions.length}</Text>
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

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.green} />
            <Text style={styles.loadingText}>Loading sessions...</Text>
          </View>
        ) : upcomingSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming sessions</Text>
          </View>
        ) : (
          upcomingSessions.map((session) => (
            <VolunteerSessionCard
              key={session.id}
              session={session}
              onPress={() => onTabChange?.('requests')}
            />
          ))
        )}
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
