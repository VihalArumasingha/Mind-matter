import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet,
  Pressable,
  Alert
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import DashboardOverviewView from '../features/admin/views/DashboardOverviewView';
import { 
  getDashboardStats, 
  getAuditLogs,
  getUsersApi,
  getProfessionalApplicationsApi,
  getCommunitiesApi,
  getPostsApi,
  getReportsApi,
  getBroadcastsApi,
  warnUserApi,
  suspendUserApi,
  unsuspendUserApi,
  approveProfessionalApi,
  rejectProfessionalApi,
  keepPostApi,
  restrictPostApi,
  removePostApi
} from '../features/admin/services/adminService';
import { useAuth } from '../context/AuthContext';
import UsersManagementView from '../features/admin/views/UsersManagementView';
import ProfessionalsManagementView from '../features/admin/views/ProfessionalsManagementView';
import PostsManagementView from '../features/admin/views/PostsManagementView';
import SidebarMenu from '../features/admin/components/SidebarMenu';   
import HeaderBar from '../features/admin/components/HeaderBar';

const Stack = createNativeStackNavigator();
const AdminScreenWrapper = ({ children, navigation }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const SCREEN_TITLES = {
    dashboard: 'MindMatter Mental Health Admin Portal',
    users: 'User Management',
    professionals: 'Professionals Management',
    communities: 'Communities & Groups',
    posts: 'Posts Moderation',
    reports: 'Reports Queue',
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
          badges={{ pendingPros: 0, openReports: 0 }}
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

// ============ COMMUNITIES SCREEN ============
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
  const { token } = useAuth();

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await getBroadcastsApi(token);
      setBroadcasts(response || []);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBroadcasts();
    }, [token])
  );

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
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Broadcasts</Text>
        <Text style={styles.placeholderSubtext}>Total: {broadcasts.length}</Text>
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
      <Stack.Screen name="communities" component={CommunitiesScreen} />
      <Stack.Screen name="posts" component={PostsScreen} />
      <Stack.Screen name="reports" component={ReportsScreen} />
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