import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminStyles, COLORS } from '../../admin/styles/adminStyles';
import { useAuth } from '../../../context/AuthContext';
import { deleteAccount } from '../../profile/services/profileService';

const MetricCard = ({ title, value, tag, color, bg, subtitle, onPress }) => (
  <Pressable 
    style={adminStyles.metricCard} 
    onPress={onPress}
    android_ripple={{ color: '#ddd', borderless: false }}
  >
    <View style={adminStyles.metricCardInner}>
      <View style={adminStyles.metricHeader}>
        <Text style={adminStyles.metricLabel}>{title}</Text>
        <View style={[adminStyles.metricIconBox, { backgroundColor: bg }]}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: color }}>{tag}</Text>
        </View>
      </View>
      <Text style={adminStyles.metricValue}>{value}</Text>
      {subtitle && <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>{subtitle}</Text>}
    </View>
  </Pressable>
);

const DashboardOverviewView = ({ 
  stats = { 
    totalUsers: 0, 
    activeUsers: 0, 
    suspendedUsers: 0,
    pendingApplications: 0,
    totalProfessionals: 0,
    totalPosts: 0,
    totalCommunities: 0,
    totalReports: 0
  }, 
  recentActivities = [], 
  onNavigate 
}) => {
  const { user, logout, token } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent. Your account and associated profile data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount(token);
      await logout();
    } catch (error) {
      Alert.alert('Unable to delete account', error.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={adminStyles.bodyArea} showsVerticalScrollIndicator={false}>
        <View style={[adminStyles.card, { backgroundColor: COLORS.primary, borderColor: COLORS.primaryDark }]}>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>
            MindMatter Mental Health Admin Portal
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>
            Platform status: Operational • All moderation queues active
          </Text>
        </View>

        <Text style={[adminStyles.cardTitle, { marginBottom: 12 }]}>System Overview</Text>
        <View style={adminStyles.metricsGrid}>
          <MetricCard
            title="Total Users"
            value={stats.totalUsers || 0}
            tag="USERS"
            color={COLORS.info}
            bg={COLORS.infoBg}
            subtitle="Registered members"
            onPress={() => onNavigate('users')}
          />
          <MetricCard
            title="Active Users"
            value={stats.activeUsers || 0}
            tag="ACTIVE"
            color={COLORS.success}
            bg={COLORS.successBg}
            subtitle="Good standing"
            onPress={() => onNavigate('users')}
          />
          <MetricCard
            title="Suspended Users"
            value={stats.suspendedUsers || 0}
            tag="SUSP"
            color={COLORS.danger}
            bg={COLORS.dangerBg}
            subtitle="Moderated accounts"
            onPress={() => onNavigate('users')}
          />
          <MetricCard
            title="Pending Applications"
            value={stats.pendingApplications || 0}
            tag="PEND"
            color={COLORS.warning}
            bg={COLORS.warningBg}
            subtitle="Therapists awaiting review"
            onPress={() => onNavigate('professionals')}
          />
          <MetricCard
            title="Total Professionals"
            value={stats.totalProfessionals || 0}
            tag="PROFS"
            color={COLORS.purple}
            bg={COLORS.purpleBg}
            subtitle="Verified therapists"
            onPress={() => onNavigate('professionals')}
          />
          <MetricCard
            title="Total Posts"
            value={stats.totalPosts || 0}
            tag="POSTS"
            color={COLORS.info}
            bg={COLORS.infoBg}
            subtitle="Peer contributions"
            onPress={() => onNavigate('posts')}
          />
          <MetricCard
            title="Total Communities"
            value={stats.totalCommunities || 0}
            tag="GROUPS"
            color={COLORS.primary}
            bg={COLORS.primaryLight}
            subtitle="Peer support groups"
            onPress={() => onNavigate('communities')}
          />
          <MetricCard
            title="Open Reports"
            value={stats.totalReports || 0}
            tag="REPORTS"
            color={COLORS.danger}
            bg={COLORS.dangerBg}
            subtitle="Requires investigation"
            onPress={() => onNavigate('reports')}
          />
        </View>
        <View style={[adminStyles.card, { marginTop: 12 }]}>
          <Text style={adminStyles.cardTitle}>Quick Admin Tasks</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            <Pressable
              style={[adminStyles.btn, adminStyles.btnPrimary, { flex: 1, minWidth: 140, margin: 4, paddingVertical: 10 }]}
              onPress={() => onNavigate('professionals')}
            >
              <Text style={adminStyles.btnText}>Review Therapists</Text>
            </Pressable>
            <Pressable
              style={[adminStyles.btn, adminStyles.btnDanger, { flex: 1, minWidth: 140, margin: 4, paddingVertical: 10 }]}
              onPress={() => onNavigate('reports')}
            >
              <Text style={adminStyles.btnText}>Flagged Reports</Text>
            </Pressable>
            <Pressable
              style={[adminStyles.btn, adminStyles.btnSecondary, { flex: 1, minWidth: 140, margin: 4, paddingVertical: 10 }]}
              onPress={() => onNavigate('broadcasts')}
            >
              <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' }}>Broadcast Notice</Text>
            </Pressable>
            <Pressable
              style={[adminStyles.btn, adminStyles.btnSecondary, { flex: 1, minWidth: 140, margin: 4, paddingVertical: 10 }]}
              onPress={() => onNavigate('users')}
            >
              <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' }}>User Accounts</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>

        <View style={[adminStyles.card, { marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={adminStyles.cardTitle}>Recent Activity Logs</Text>
            <Pressable onPress={() => onNavigate('audit-logs')}>
              <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '700' }}>View Audit Logs →</Text>
            </Pressable>
          </View>

          {recentActivities && recentActivities.length > 0 ? (
            recentActivities.map((item, idx) => (
              <View
                key={item._id || idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: idx === recentActivities.length - 1 ? 0 : 1,
                  borderBottomColor: COLORS.borderDark
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: COLORS.surfaceDark,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.primary }}>LOG</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' }}>
                    {item.action} — {item.targetName}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>
                    {item.details}
                  </Text>
                </View>
                <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: COLORS.textMuted, paddingVertical: 12 }}>No recent admin activities recorded.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  logoutButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E1D6',
    marginTop: 25,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4E824D',
  },
  deleteButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B94A48',
  }
};

export default DashboardOverviewView;