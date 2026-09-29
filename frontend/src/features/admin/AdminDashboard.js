import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, Modal } from 'react-native';
import { adminStyles, COLORS } from './styles/adminStyles';
import SidebarMenu from './components/SidebarMenu';
import HeaderBar from './components/HeaderBar';
import TherapistApplicationForm from '../therapist/TherapistApplicationForm';

import DashboardOverviewView from './views/DashboardOverviewView';
import UsersManagementView from './views/UsersManagementView';
import ProfessionalsManagementView from './views/ProfessionalsManagementView';
import CommunitiesManagementView from './views/CommunitiesManagementView';
import PostsManagementView from './views/PostsManagementView';


import {
  getDashboardOverviewApi,
  getUsersApi,
  warnUserApi,
  suspendUserApi,
  unsuspendUserApi,
  getProfessionalApplicationsApi,
  approveProfessionalApi,
  rejectProfessionalApi,
  getCommunitiesApi,
  warnCommunityApi,
  restrictCommunityApi,
  removeCommunityApi,
  getPostsApi,
  keepPostApi,
  restrictPostApi,
  removePostApi,
  getReportsApi,
  investigateReportApi,
  resolveReportApi,
  dismissReportApi,
  getAnalyticsApi,
  createBroadcastApi,
  getBroadcastsApi,
  getAuditLogsApi
} from './services/adminService';

const TITLES = {
  dashboard: 'System Overview & Dashboard',
  users: 'Registered Users Management',
  professionals: 'Professionals Management',
  communities: 'Communities & Groups',
  posts: 'Peer Posts Moderation',
  reports: 'User Reports Queue',
  analytics: 'Platform Analytics',
  broadcasts: 'System Announcements',
  settings: 'Admin System Settings',
  'audit-logs': 'System Audit Logs'
};
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({ stats: {}, recentActivities: [] });
  const [users, setUsers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [broadcasts, setBroadcasts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Load All Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const dash = await getDashboardOverviewApi();
      if (dash && dash.stats) setDashboardData(dash);

      const u = await getUsersApi(search);
      setUsers(u || []);

      const p = await getProfessionalApplicationsApi();
      setProfessionals(p || []);

      const c = await getCommunitiesApi();
      setCommunities(c || []);

      const po = await getPostsApi();
      setPosts(po || []);

      const r = await getReportsApi();
      setReports(r || []);

      const an = await getAnalyticsApi();
      setAnalytics(an || {});

      const b = await getBroadcastsApi();
      setBroadcasts(b || []);

      const al = await getAuditLogsApi(search);
      setAuditLogs(al || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Auto close sidebar on selection
  };

  // Action Handlers
  const handleWarnUser = async (id, reason) => {
    await warnUserApi(id, reason);
    loadAdminData();
  };

  const handleSuspendUser = async (id, reason, days) => {
    await suspendUserApi(id, reason, days);
    loadAdminData();
  };

  const handleUnsuspendUser = async (id) => {
    await unsuspendUserApi(id);
    loadAdminData();
  };

  const handleApproveProfessional = async (id) => {
    await approveProfessionalApi(id);
    loadAdminData();
  };

  const handleRejectProfessional = async (id, reason) => {
    await rejectProfessionalApi(id, reason);
    loadAdminData();
  };

  const handleWarnCommunity = async (id, message) => {
    await warnCommunityApi(id, message);
    loadAdminData();
  };

  const handleRestrictCommunity = async (id) => {
    await restrictCommunityApi(id);
    loadAdminData();
  };

  const handleRemoveCommunity = async (id) => {
    await removeCommunityApi(id);
    loadAdminData();
  };

  const handleKeepPost = async (id) => {
    await keepPostApi(id);
    loadAdminData();
  };

  const handleRestrictPost = async (id, reason) => {
    await restrictPostApi(id, reason);
    loadAdminData();
  };

  const handleRemovePost = async (id) => {
    await removePostApi(id);
    loadAdminData();
  };

  const handleInvestigateReport = async (id) => {
    await investigateReportApi(id);
    loadAdminData();
  };

  const handleResolveReport = async (id, actionTaken) => {
    await resolveReportApi(id, actionTaken);
    loadAdminData();
  };

  const handleDismissReport = async (id) => {
    await dismissReportApi(id);
    loadAdminData();
  };

  const handleSendBroadcast = async (title, message, targetAudience) => {
    await createBroadcastApi(title, message, targetAudience);
    loadAdminData();
  };

  const pendingProsCount = professionals.filter((p) => p.status === 'pending').length;
  const openReportsCount = reports.filter((r) => r.status === 'open' || r.status === 'investigating').length;

  const [showApplyFormModal, setShowApplyFormModal] = useState(false);

  const renderActiveView = () => {
    if (loading) {
      return (
        <View style={adminStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={adminStyles.loadingText}>Loading Admin Data...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverviewView
            stats={dashboardData.stats}
            recentActivities={dashboardData.recentActivities}
            onNavigate={handleSelectTab}
          />
        );
      case 'users':
        return (
          <UsersManagementView
            users={users}
            onWarnUser={handleWarnUser}
            onSuspendUser={handleSuspendUser}
            onUnsuspendUser={handleUnsuspendUser}
          />
        );
      case 'professionals':
        return (
          <ProfessionalsManagementView
            applications={professionals}
            onApprove={handleApproveProfessional}
            onReject={handleRejectProfessional}
            onOpenApplyForm={() => setShowApplyFormModal(true)}
            onRefresh={loadAdminData}
          />
        );
      case 'communities':
        return (
          <CommunitiesManagementView
            communities={communities}
            onWarnGroup={handleWarnCommunity}
            onRestrictGroup={handleRestrictCommunity}
            onRemoveGroup={handleRemoveCommunity}
          />
        );
      case 'posts':
        return (
          <PostsManagementView
            posts={posts}
            onKeepPost={handleKeepPost}
            onRestrictPost={handleRestrictPost}
            onRemovePost={handleRemovePost}
          />
        );
      
      
      default:
        return <DashboardOverviewView stats={dashboardData.stats} recentActivities={dashboardData.recentActivities} onNavigate={handleSelectTab} />;
    }
  };

  return (
    <View style={adminStyles.container}>
      {/* Overlay Drawer Backdrop */}
      {sidebarOpen && (
      <TouchableOpacity
        style={adminStyles.drawerBackdrop}
        activeOpacity={1}
        onPress={() => setSidebarOpen(false)}
      />
    )}

    {/* Slide-out Sidebar Drawer - MENU EKA MEKE */}
    {sidebarOpen && (
      <SidebarMenu
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onClose={() => setSidebarOpen(false)}
        badges={{ pendingPros: pendingProsCount, openReports: openReportsCount }}
      />
    )}

    {/* Main Full-Width Content Area */}
    <View style={adminStyles.mainContent}>
      <HeaderBar
        title={TITLES[activeTab] || 'Admin Dashboard'}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        search={search}
        setSearch={setSearch}
        onRefresh={loadAdminData}
      />

      {renderActiveView()}
    </View>

      {/* Modal for User-Facing Therapist Registration Form */}
      <Modal
        visible={showApplyFormModal}
        animationType="slide"
        onRequestClose={() => setShowApplyFormModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark, backgroundColor: COLORS.cardBg }}>
            <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' }}>Therapist Application (User Form View)</Text>
            <TouchableOpacity onPress={() => setShowApplyFormModal(false)} style={{ padding: 6 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 18, fontWeight: 'bold' }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <TherapistApplicationForm
            onSubmitSuccess={() => {
              setShowApplyFormModal(false);
              loadAdminData();
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

export default AdminDashboard;
