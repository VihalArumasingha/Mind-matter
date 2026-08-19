import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  StatusBar,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminStyles, COLORS } from '../styles/adminStyles';

const UsersManagementView = ({ 
  users = [], 
  onWarnUser, 
  onSuspendUser, 
  onUnsuspendUser,
  loading = false,
  onRefresh 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [reasonInput, setReasonInput] = useState('');
  const [daysInput, setDaysInput] = useState('7');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatches = u.name ? u.name.toLowerCase().includes(query) : false;
      const emailMatches = u.email ? u.email.toLowerCase().includes(query) : false;
      const roleMatches = u.role ? u.role.toLowerCase().includes(query) : false;
      const statusMatches = u.status ? u.status.toLowerCase().includes(query) : false;
      if (!nameMatches && !emailMatches && !roleMatches && !statusMatches) return false;
    }

    if (statusFilter !== 'all' && u.status !== statusFilter) return false;

    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    return true;
  });

  const handleOpenWarn = (user) => {
    setSelectedUser(user);
    setReasonInput('');
    setModalType('warn');
  };

  const handleOpenSuspend = (user) => {
    setSelectedUser(user);
    setReasonInput('');
    setDaysInput('7');
    setModalType('suspend');
  };

  const handleConfirmWarn = () => {
    if (!selectedUser || !reasonInput.trim()) {
      Alert.alert('Error', 'Please enter a warning reason');
      return;
    }
    onWarnUser(selectedUser._id, reasonInput.trim());
    setModalType(null);
  };

  const handleConfirmSuspend = () => {
    if (!selectedUser || !reasonInput.trim()) {
      Alert.alert('Error', 'Please enter a suspension reason');
      return;
    }
    onSuspendUser(selectedUser._id, reasonInput.trim(), parseInt(daysInput, 10) || 7);
    setModalType(null);
  };

  const renderStatusBadge = (status) => {
    let bg = COLORS.successBg;
    let text = COLORS.success;
    if (status === 'warned') {
      bg = COLORS.warningBg;
      text = COLORS.warning;
    } else if (status === 'suspended') {
      bg = COLORS.dangerBg;
      text = COLORS.danger;
    }
    return (
      <View style={[adminStyles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[adminStyles.statusBadgeText, { color: text }]}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7EF' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F7EF" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7EF' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7EF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7EF" />
      <ScrollView 
        style={adminStyles.bodyArea} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={[adminStyles.card, { backgroundColor: COLORS.primary, borderColor: COLORS.primaryDark }]}>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>
           User Management
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>
            Total Users: {users.length} • Active: {users.filter(u => u.status === 'active').length}
          </Text>
        </View>
        <View style={adminStyles.filterBar}>
          
          <View style={{ marginBottom: 10, width: '100%' }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 2,
              borderWidth: 1.5,
              borderColor: isSearchFocused ? COLORS.primary : COLORS.borderDark,
              shadowColor: isSearchFocused ? COLORS.primary : '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isSearchFocused ? 0.15 : 0.05,
              shadowRadius: 4,
              elevation: isSearchFocused ? 4 : 1,
            }}>
              
              <TextInput
                style={{
                  flex: 1,
                  height: 40,
                  fontSize: 14,
                  color: COLORS.textPrimary,
                  paddingVertical: 8,
                }}
                placeholder="Search users by name or email..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={{
                    padding: 4,
                    paddingHorizontal: 6,
                    borderRadius: 12,
                    backgroundColor: COLORS.surfaceDark,
                  }}
                >
                  <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.trim() !== '' && (
              <Text style={{ 
                color: COLORS.textMuted, 
                fontSize: 12, 
                marginTop: 4, 
                marginLeft: 4 
              }}>
                Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View style={adminStyles.filterChips}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginRight: 8, fontWeight: '600' }}>Status:</Text>
            {['all', 'active', 'warned', 'suspended'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[adminStyles.chip, statusFilter === st && adminStyles.chipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[adminStyles.chipText, statusFilter === st && adminStyles.chipTextActive]}>
                  {st === 'all' ? 'All' : st.charAt(0).toUpperCase() + st.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={adminStyles.filterChips}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginRight: 8, fontWeight: '600' }}>Role:</Text>
            {['all', 'user', 'volunteer', 'therapist', 'admin'].map((rl) => (
              <TouchableOpacity
                key={rl}
                style={[adminStyles.chip, roleFilter === rl && adminStyles.chipActive]}
                onPress={() => setRoleFilter(rl)}
              >
                <Text style={[adminStyles.chipText, roleFilter === rl && adminStyles.chipTextActive]}>
                  {rl === 'all' ? 'All' : rl.charAt(0).toUpperCase() + rl.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={[adminStyles.card, { alignItems: 'center', padding: 30 }]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
            <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
              {searchQuery.trim() !== '' ? 'No matches found' : 'No users yet'}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>
              {searchQuery.trim() !== '' ? 'Try adjusting your search' : 'Users will appear here'}
            </Text>
            {searchQuery.trim() !== '' && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={{
                  marginTop: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  backgroundColor: COLORS.primary,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredUsers.map((user) => (
            <TouchableOpacity
              key={user._id}
              style={adminStyles.card}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedUser(user);
                setModalType('details');
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                  <View style={{ 
                    width: 42, 
                    height: 42, 
                    borderRadius: 21, 
                    backgroundColor: COLORS.primary, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginRight: 12 
                  }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18 }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 14 }}>{user.name || 'Unknown'}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 11 }} numberOfLines={1}>{user.email}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  {renderStatusBadge(user.status)}
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 4 }}>
                    ⚠ {user.warningsCount || 0}
                  </Text>
                </View>
              </View>

              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                borderTopWidth: 1, 
                borderTopColor: 'rgba(0,0,0,0.05)', 
                paddingTop: 8, 
                marginTop: 6 
              }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11, textTransform: 'capitalize' }}>
                  Role: <Text style={{ color: COLORS.textPrimary, fontWeight: '600' }}>{user.role}</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: 'bold', marginRight: 4 }}>Details</Text>
                  <Text style={{ color: COLORS.primary, fontSize: 12 }}>➔</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <Modal visible={modalType === 'details'} transparent animationType="fade">
          <View style={adminStyles.modalOverlay}>
            <View style={adminStyles.modalBox}>
              <View style={adminStyles.modalHeader}>
                <Text style={adminStyles.modalTitle}>User Account & Moderation</Text>
                <TouchableOpacity style={adminStyles.closeButton} onPress={() => setModalType(null)}>
                  <Text style={adminStyles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedUser && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 22 }}>
                        {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' }}>{selectedUser.name || 'Unknown'}</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{selectedUser.email}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                    <View style={{ flex: 1, backgroundColor: COLORS.surfaceDark, padding: 10, borderRadius: 8, marginRight: 8 }}>
                      <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>ACCOUNT ROLE</Text>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {selectedUser.role}
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: COLORS.surfaceDark, padding: 10, borderRadius: 8 }}>
                      <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>STATUS</Text>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {selectedUser.status}
                      </Text>
                    </View>
                  </View>

                  {selectedUser.status === 'suspended' && (
                    <View style={{ backgroundColor: COLORS.dangerBg, padding: 12, borderRadius: 8, marginBottom: 14 }}>
                      <Text style={{ color: COLORS.danger, fontWeight: 'bold', fontSize: 12 }}>🚫 Suspension Active</Text>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 11, marginTop: 2 }}>
                        Reason: {selectedUser.suspensionReason || 'N/A'}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 2 }}>
                        Until: {selectedUser.suspendedUntil ? new Date(selectedUser.suspendedUntil).toLocaleDateString() : 'Indefinite'}
                      </Text>
                    </View>
                  )}

                  <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                    Violation History ({selectedUser.violations ? selectedUser.violations.length : 0})
                  </Text>

                  {selectedUser.violations && selectedUser.violations.length > 0 ? (
                    selectedUser.violations.slice().reverse().map((v, i) => (
                      <View key={i} style={adminStyles.docCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={adminStyles.docTitle}>⚠️ {v.reason}</Text>
                          <Text style={adminStyles.docSub}>
                            Issued by {v.adminName || 'Admin'} on {new Date(v.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 14 }}>No violation logs recorded.</Text>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.borderDark, paddingTop: 12 }}>
                    {selectedUser.status !== 'suspended' ? (
                      <>
                        <TouchableOpacity
                          style={[adminStyles.btn, { backgroundColor: COLORS.warning, marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }]}
                          onPress={() => handleOpenWarn(selectedUser)}
                        >
                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}> Warn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[adminStyles.btn, { backgroundColor: COLORS.danger, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }]}
                          onPress={() => handleOpenSuspend(selectedUser)}
                        >
                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Suspend</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[adminStyles.btn, { backgroundColor: COLORS.success, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 }]}
                        onPress={() => {
                          onUnsuspendUser(selectedUser._id);
                          setModalType(null);
                        }}
                      >
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Restore</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={modalType === 'warn'} transparent animationType="fade">
          <View style={adminStyles.modalOverlay}>
            <View style={[adminStyles.modalBox, { maxWidth: 420 }]}>
              <View style={adminStyles.modalHeader}>
                <Text style={adminStyles.modalTitle}>⚠️ Issue Warning</Text>
                <TouchableOpacity style={adminStyles.closeButton} onPress={() => setModalType(null)}>
                  <Text style={adminStyles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 16 }}>
                User: <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>{selectedUser?.name}</Text>
              </Text>

              <View style={adminStyles.inputGroup}>
                <Text style={adminStyles.inputLabel}>Warning Reason *</Text>
                <TextInput
                  style={[adminStyles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                  multiline
                  placeholder="Enter warning reason..."
                  placeholderTextColor={COLORS.textMuted}
                  value={reasonInput}
                  onChangeText={setReasonInput}
                  numberOfLines={3}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity
                  style={[adminStyles.btn, adminStyles.btnSecondary, { marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }]}
                  onPress={() => setModalType(null)}
                >
                  <Text style={{ color: COLORS.textPrimary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[adminStyles.btn, { backgroundColor: COLORS.warning, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }]} 
                  onPress={handleConfirmWarn}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={modalType === 'suspend'} transparent animationType="fade">
          <View style={adminStyles.modalOverlay}>
            <View style={[adminStyles.modalBox, { maxWidth: 420 }]}>
              <View style={adminStyles.modalHeader}>
                <Text style={adminStyles.modalTitle}>🚫 Suspend Account</Text>
                <TouchableOpacity style={adminStyles.closeButton} onPress={() => setModalType(null)}>
                  <Text style={adminStyles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 16 }}>
                Target: <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>{selectedUser?.name}</Text>
              </Text>

              <View style={adminStyles.inputGroup}>
                <Text style={adminStyles.inputLabel}>Duration (Days)</Text>
                <TextInput
                  style={adminStyles.textInput}
                  keyboardType="numeric"
                  value={daysInput}
                  onChangeText={setDaysInput}
                />
              </View>

              <View style={adminStyles.inputGroup}>
                <Text style={adminStyles.inputLabel}>Suspension Reason *</Text>
                <TextInput
                  style={[adminStyles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                  multiline
                  placeholder="Enter suspension reason..."
                  placeholderTextColor={COLORS.textMuted}
                  value={reasonInput}
                  onChangeText={setReasonInput}
                  numberOfLines={3}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity
                  style={[adminStyles.btn, adminStyles.btnSecondary, { marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }]}
                  onPress={() => setModalType(null)}
                >
                  <Text style={{ color: COLORS.textPrimary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[adminStyles.btn, { backgroundColor: COLORS.danger, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }]} 
                  onPress={handleConfirmSuspend}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UsersManagementView;