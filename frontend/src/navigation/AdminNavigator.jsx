import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  TextInput
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import DashboardOverviewView from '../features/admin/views/DashboardOverviewView';
import { 
  getDashboardStats, 
  getAuditLogs,
  getUsersApi,
  getProfessionalApplicationsApi,
  getCommunityOrganizerApplicationsApi,
  getCommunitiesApi,
  getPostsApi,
  getReportsApi,
  getBroadcastsApi,
  createBroadcastApi,
  warnUserApi,
  suspendUserApi,
  unsuspendUserApi,
  approveProfessionalApi,
  rejectProfessionalApi,
  approveCommunityOrganizerApi,
  rejectCommunityOrganizerApi,
  keepPostApi,
  restrictPostApi,
  removePostApi
} from '../features/admin/services/adminService';
import { useAuth } from '../context/AuthContext';
import UsersManagementView from '../features/admin/views/UsersManagementView';
import ProfessionalsManagementView from '../features/admin/views/ProfessionalsManagementView';
import CommunityOrganizerApplicationsView from '../features/admin/views/CommunityOrganizerApplicationsView';
import PostsManagementView from '../features/admin/views/PostsManagementView';
import PlatformHealthAnalyticsView from '../features/admin/views/PlatformHealthAnalyticsView';
import SidebarMenu from '../features/admin/components/SidebarMenu';   
import HeaderBar from '../features/admin/components/HeaderBar';

const Stack = createNativeStackNavigator();
const BROADCAST_AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'user', label: 'Users' },
  { value: 'volunteer', label: 'Volunteers' },
  { value: 'therapist', label: 'Therapists' },
  { value: 'communityOrganizer', label: 'Organizers' }
];

const AdminScreenWrapper = ({ children, navigation, badges = { pendingPros: 0, pendingCommunityOrganizers: 0, openReports: 0 } }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const SCREEN_TITLES = {
    dashboard: 'MindMatter Mental Health Admin Portal',
    users: 'User Management',
    professionals: 'Professionals Management',
    'community-organizer-requests': 'Community Organizer Requests',
    communities: 'Communities & Groups',
    posts: 'Posts Moderation',
    reports: 'Reports Queue',
    analytics: 'Platform Health Analytics',
    communityHealth: 'Platform Health Analytics',
    broadcasts: 'System Announcements',
    'audit-logs': 'Audit Logs'
  };

  const getScreenTitle = () => {
    try {
      const routeName = navigation.getState().routes[navigation.getState().index].name;
      return SCREEN_TITLES[routeName] || 'MindMatter Mental Health';
    } catch {
      return 'MindMatter Mental Health';
    }
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: '#F4F7EF' }}>
      {sidebarOpen && (
        <Pressable
          style={styles.drawerBackdrop}
          onPress={() => setSidebarOpen(false)}
        />
      )}
    
      {sidebarOpen && (
        <SidebarMenu
          activeTab={navigation.getState().routes[navigation.getState().index].name}
          onSelectTab={(tabId) => {
            navigation.navigate(tabId);
            setSidebarOpen(false);
          }}
          onClose={() => setSidebarOpen(false)}
          badges={badges}
        />
      )}
      <HeaderBar 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        title={getScreenTitle()}
      />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, logout } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statsResponse = await getDashboardStats(token);
      
      if (statsResponse && statsResponse.data) {
        setStats(statsResponse.data);
      } else if (statsResponse && statsResponse.stats) {
        setStats(statsResponse.stats);
      } else {
        setStats(statsResponse || {});
      }

      const logsResponse = await getAuditLogs(token);
      const activities = Array.isArray(logsResponse) ? logsResponse : (logsResponse?.data || []);
      setRecentActivities(activities.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data.');

      setStats({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        pendingApplications: 0,
        totalProfessionals: 0,
        totalPosts: 0,
        totalCommunities: 0,
        totalReports: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [token]) 
  );

  const handleNavigate = (screen) => {
    navigation.navigate(screen);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AdminScreenWrapper title="MindMatter Mental Health" navigation={navigation}>
      <DashboardOverviewView 
        stats={stats}
        recentActivities={recentActivities}
        onNavigate={handleNavigate}
        isLoading={loading}
        logout={logout}
      />
    </AdminScreenWrapper>
  );
};

const UsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUsersApi(token);
      setUsers(response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [token])
  );

  const handleWarnUser = async (userId, reason) => {
    try {
      await warnUserApi(token, userId, reason);
      Alert.alert('Success', 'User warned successfully');
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to warn user');
    }
  };

  const handleSuspendUser = async (userId, reason, days) => {
    try {
      await suspendUserApi(token, userId, reason, days);
      Alert.alert('Success', 'User suspended successfully');
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await unsuspendUserApi(token, userId);
      Alert.alert('Success', 'User restored successfully');
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to restore user');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AdminScreenWrapper title="Registered Users Management" navigation={navigation}>
      <UsersManagementView 
        users={users}
        loading={loading}
        onWarnUser={handleWarnUser}
        onSuspendUser={handleSuspendUser}
        onUnsuspendUser={handleUnsuspendUser}
        onRefresh={fetchUsers}
      />
    </AdminScreenWrapper>
  );
};

const ProfessionalsScreen = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProfessionalApplicationsApi(token);
      setApplications(response || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [token])
  );

  const handleApprove = async (id) => {
    try {
      await approveProfessionalApi(token, id);
      Alert.alert('Success', 'Professional application approved successfully');
      fetchApplications();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to approve application');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await rejectProfessionalApi(token, id, reason);
      Alert.alert('Success', 'Application rejected successfully');
      fetchApplications();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reject application');
    }
  };

  const handleOpenApplyForm = () => {
    Alert.alert('Info', 'Therapist application form will open here');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading professionals...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchApplications}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AdminScreenWrapper title="Therapist Applications" navigation={navigation}>
      <ProfessionalsManagementView 
        applications={applications}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenApplyForm={handleOpenApplyForm}
      />
    </AdminScreenWrapper>
  );
};

const CommunityOrganizerRequestsScreen = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCommunityOrganizerApplicationsApi(token);
      setApplications(response || []);
    } catch (error) {
      console.error('Error fetching organizer applications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [token])
  );

  const handleApprove = async (id) => {
    try {
      await approveCommunityOrganizerApi(token, id);
      Alert.alert('Success', 'Community organizer request approved successfully');
      fetchApplications();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to approve organizer application');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await rejectCommunityOrganizerApi(token, id, reason);
      Alert.alert('Success', 'Community organizer request rejected successfully');
      fetchApplications();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reject organizer application');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading community organizer requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchApplications}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AdminScreenWrapper
      title="Community Organizer Requests"
      navigation={navigation}
      badges={{
        pendingPros: 0,
        pendingCommunityOrganizers: applications.filter((app) => app.status === 'pending').length,
        openReports: 0
      }}
    >
      <CommunityOrganizerApplicationsView
        applications={applications}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </AdminScreenWrapper>
  );
};

const CommunitiesScreen = ({ navigation }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await getCommunitiesApi(token);
      setCommunities(response || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCommunities();
    }, [token])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading communities...</Text>
      </View>
    );
  }

  return (
    <AdminScreenWrapper title="Communities & Groups" navigation={navigation}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Communities Management</Text>
        <Text style={styles.placeholderSubtext}>Total: {communities.length}</Text>
        <Pressable 
          style={[styles.retryButton, { marginTop: 20 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </AdminScreenWrapper>
  );
};

const PostsScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPostsApi(token);
      setPosts(response || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [token])
  );

  const handleKeepPost = async (postId) => {
    try {
      await keepPostApi(token, postId);
      Alert.alert('Success', 'Post marked as approved and kept active');
      fetchPosts();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to keep post');
    }
  };

  const handleRestrictPost = async (postId, reason) => {
    try {
      await restrictPostApi(token, postId, reason);
      Alert.alert('Success', 'Post restricted with warning label');
      fetchPosts();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to restrict post');
    }
  };

  const handleRemovePost = async (postId) => {
    Alert.alert(
      'Remove Post',
      'Are you sure you want to remove this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removePostApi(token, postId);
              Alert.alert('Success', 'Post removed successfully');
              fetchPosts();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove post');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchPosts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AdminScreenWrapper title="Peer Posts Moderation" navigation={navigation}>
      <PostsManagementView 
        posts={posts}
        onKeepPost={handleKeepPost}
        onRestrictPost={handleRestrictPost}
        onRemovePost={handleRemovePost}
        onRefresh={fetchPosts}
      />
    </AdminScreenWrapper>
  );
};

const ReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getReportsApi(token);
      setReports(response || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [token])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <AdminScreenWrapper title="User Reports Queue" navigation={navigation}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Reports Management</Text>
        <Text style={styles.placeholderSubtext}>Open: {reports.filter(r => r.status === 'open').length}</Text>
        <Pressable 
          style={[styles.retryButton, { marginTop: 20 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </AdminScreenWrapper>
  );
};
const BroadcastsScreen = ({ navigation }) => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState(null); 
  const { token } = useAuth();

  const fetchBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getBroadcastsApi(token);
      setBroadcasts(response || []);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      Alert.alert('Unable to load broadcasts', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchBroadcasts();
    }, [fetchBroadcasts])
  );

  const sendBroadcast = async () => {
    if (sending) return;

    try {
      setSending(true);
      const broadcast = await createBroadcastApi(token, title, message, targetAudience);
      setBroadcasts((current) => [broadcast, ...current]);
      setTitle('');
      setMessage('');
      setTargetAudience('all');
      Alert.alert('Broadcast sent', `Your announcement was delivered to ${broadcast.recipientCount} people.`);
    } catch (error) {
      Alert.alert('Unable to send broadcast', error.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const confirmSendBroadcast = () => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    if (!trimmedTitle || !trimmedMessage) {
      Alert.alert('Announcement required', 'Enter both a title and a message before sending.');
      return;
    }

    Alert.alert(
      'Send announcement?',
      'This will deliver an in-app notification to every eligible recipient in the selected audience.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: sendBroadcast }
      ]
    );
  };

  const handleDeleteBroadcast = (broadcastId) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to remove this announcement from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setBroadcasts((current) => current.filter(item => item._id !== broadcastId));
            if (expandedId === broadcastId) setExpandedId(null);
            Alert.alert('Success', 'Announcement record deleted.');
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading broadcasts...</Text>
      </View>
    );
  }

  return (
    <AdminScreenWrapper title="System Announcements" navigation={navigation}>
      <ScrollView contentContainerStyle={styles.broadcastContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.composerCard}>
          <View style={styles.composerHeader}>
            <Text style={styles.sectionHeaderTitle}>Create Announcement</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveText}>Live Push</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Target Group</Text>
            <View style={styles.pillContainer}>
              {BROADCAST_AUDIENCES.map((option) => {
                const isSelected = targetAudience === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                    onPress={() => setTargetAudience(option.value)}
                  >
                    <Text style={[styles.filterPillText, isSelected && styles.activeFilterPillText]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Title Heading</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Important Wellness Session Update"
              placeholderTextColor="#A3ABA0"
              maxLength={120}
              style={styles.textInputStyle}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Announcement Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type your broadcast body text here..."
              placeholderTextColor="#A3ABA0"
              maxLength={2000}
              multiline
              textAlignVertical="top"
              style={[styles.textInputStyle, styles.textAreaStyle]}
            />
          </View>

          <Pressable
            disabled={sending}
            style={[styles.publishButton, sending && styles.disabledPublishButton]}
            onPress={confirmSendBroadcast}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.publishButtonText}>Broadcast Now</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.historyListHeader}>
          <Text style={styles.sectionHeaderTitle}>Past Broadcasts</Text>
          <Text style={styles.countIndicatorText}>{broadcasts.length} Sent</Text>
        </View>

        {broadcasts.length === 0 ? (
          <View style={styles.emptyFeedContainer}>
            <Text style={styles.emptyFeedText}>No past announcements found.</Text>
          </View>
        ) : (
          broadcasts.map((broadcast) => {
            const isExpanded = expandedId === broadcast._id;
            const audienceLabel = BROADCAST_AUDIENCES.find(a => a.value === broadcast.targetAudience)?.label || broadcast.targetAudience;

            return (
              <Pressable 
                key={broadcast._id} 
                style={[styles.broadcastItemCard, isExpanded && styles.expandedItemCard]}
                onPress={() => setExpandedId(isExpanded ? null : broadcast._id)}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardItemTitle} numberOfLines={isExpanded ? undefined : 1}>
                    {broadcast.title}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.miniBadge}>
                      <Text style={styles.miniBadgeText}>{audienceLabel}</Text>
                    </View>
                    
                    <Pressable 
                      style={styles.deleteIconButton} 
                      onPress={(e) => {
                        e.stopPropagation(); 
                        handleDeleteBroadcast(broadcast._id);
                      }}
                    >
                      <Text style={styles.deleteIconText}>🗑️</Text>
                    </Pressable>
                  </View>
                </View>

                <Text 
                  style={styles.cardItemMessage} 
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {broadcast.message}
                </Text>

                {isExpanded && (
                  <View style={styles.expandedDetailsContainer}>
                    <View style={styles.dividerLine} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Total Recipients:</Text>
                      <Text style={styles.detailVal}>{broadcast.recipientCount || 0} users reached</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Dispatched On:</Text>
                      <Text style={styles.detailVal}>
                        {new Date(broadcast.createdAt).toLocaleString(undefined, { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </Text>
                    </View>
                    <Text style={styles.tapToCloseHint}>Tap card again to collapse</Text>
                  </View>
                )}

                {!isExpanded && (
                  <View style={styles.cardFooterRow}>
                    <Text style={styles.footerDateText}>
                      {new Date(broadcast.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.tapToExpandHint}>Tap to view details ›</Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </AdminScreenWrapper>
  );
};

const AuditLogsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await getAuditLogs(token);
      setLogs(response || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [token])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8C4A" />
        <Text style={styles.loadingText}>Loading audit logs...</Text>
      </View>
    );
  }

  return (
    <AdminScreenWrapper title="System Audit Logs" navigation={navigation}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Audit Logs</Text>
        <Text style={styles.placeholderSubtext}>Total: {logs.length}</Text>
        <Pressable 
          style={[styles.retryButton, { marginTop: 20 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </AdminScreenWrapper>
  );
};

const AdminNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" component={DashboardScreen} />
      <Stack.Screen name="users" component={UsersScreen} />
      <Stack.Screen name="professionals" component={ProfessionalsScreen} />
      <Stack.Screen name="community-organizer-requests" component={CommunityOrganizerRequestsScreen} />
      <Stack.Screen name="communities" component={CommunitiesScreen} />
      <Stack.Screen name="posts" component={PostsScreen} />
      <Stack.Screen name="reports" component={ReportsScreen} />
      <Stack.Screen name="analytics" component={PlatformHealthAnalyticsView} />
      <Stack.Screen name="communityHealth" component={PlatformHealthAnalyticsView} />
      <Stack.Screen name="broadcasts" component={BroadcastsScreen} />
      <Stack.Screen name="audit-logs" component={AuditLogsScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7EF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#687068',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7EF',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#B94A48',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4E8C4A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7EF',
    padding: 24,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4E8C4A',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#687068',
  },

  // ============ ALTERNATIVE EDITORIAL BROADCAST STYLES ============
  broadcastContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  composerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2EBE0',
    shadowColor: '#1A241A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F5F0',
  },
  sectionHeaderTitle: {
    color: '#1E291E',
    fontSize: 17,
    fontWeight: '700',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF4E7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4E8C4A',
  },
  liveText: {
    color: '#3B6B37',
    fontSize: 11,
    fontWeight: '700',
  },
  formSection: {
    gap: 6,
  },
  inputLabel: {
    color: '#343F34',
    fontSize: 12.5,
    fontWeight: '600',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E2D4',
    backgroundColor: '#F9FBF8',
  },
  activeFilterPill: {
    backgroundColor: '#4E8C4A',
    borderColor: '#4E8C4A',
  },
  filterPillText: {
    color: '#657065',
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInputStyle: {
    backgroundColor: '#F9FBF8',
    borderWidth: 1,
    borderColor: '#D8E2D4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#1E291E',
    minHeight: 46,
  },
  textAreaStyle: {
    minHeight: 100,
    paddingTop: 10,
  },
  publishButton: {
    backgroundColor: '#4E8C4A',
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabledPublishButton: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  historyListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  countIndicatorText: {
    color: '#707A70',
    fontSize: 12.5,
    fontWeight: '600',
  },
  emptyFeedContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyFeedText: {
    color: '#707A70',
    fontSize: 13.5,
  },
  broadcastItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5ECE2',
    gap: 8,
    shadowColor: '#1A241A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  expandedItemCard: {
    borderColor: '#4E8C4A',
    backgroundColor: '#FAFCF8',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardItemTitle: {
    flex: 1,
    color: '#1E291E',
    fontSize: 14.5,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBadge: {
    backgroundColor: '#EBF4E7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    color: '#3B6B37',
    fontSize: 10.5,
    fontWeight: '600',
  },
  deleteIconButton: {
    padding: 4,
  },
  deleteIconText: {
    fontSize: 13,
  },
  cardItemMessage: {
    color: '#4E574E',
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  footerDateText: {
    color: '#8A948A',
    fontSize: 11.5,
  },
  tapToExpandHint: {
    color: '#4E8C4A',
    fontSize: 11.5,
    fontWeight: '600',
  },
  expandedDetailsContainer: {
    marginTop: 4,
    gap: 6,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2EBE0',
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    color: '#707A70',
    fontSize: 12,
  },
  detailVal: {
    color: '#1E291E',
    fontSize: 12,
    fontWeight: '600',
  },
  tapToCloseHint: {
    color: '#8A948A',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },

  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
});

export default AdminNavigator;