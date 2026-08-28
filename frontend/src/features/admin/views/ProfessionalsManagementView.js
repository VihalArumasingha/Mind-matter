import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Linking ,
    StatusBar,
} from 'react-native';
import { adminStyles, COLORS } from '../styles/adminStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
const ProfessionalsManagementView = ({ applications = [], onApprove, onReject, onOpenApplyForm }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalType, setModalType] = useState(null); 
  const [rejectReason, setRejectReason] = useState('');

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    return true;
  });

  const handleOpenReject = (app) => {
    setSelectedApp(app);
    setRejectReason('');
    setModalType('reject');
  };

  const handleConfirmReject = () => {
    if (!selectedApp || !rejectReason.trim()) return;
    onReject(selectedApp._id, rejectReason.trim());
    setModalType(null);
  };

  const renderBadge = (status) => {
    let bg = COLORS.warningBg;
    let text = COLORS.warning;
    if (status === 'approved') {
      bg = COLORS.successBg;
      text = COLORS.success;
    } else if (status === 'rejected') {
      bg = COLORS.dangerBg;
      text = COLORS.danger;
    }
    return (
        
      <View style={[adminStyles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[adminStyles.statusBadgeText, { color: text }]}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7EF' }}>
      <StatusBar 
  barStyle="dark-content" 
  backgroundColor="#f1f3ed"  
  translucent={false} 
/>
    <ScrollView style={adminStyles.bodyArea} showsVerticalScrollIndicator={false}>

      <View style={{ backgroundColor: COLORS.primary, borderRadius: 10, padding: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
  <View style={{ flex: 1, marginRight: 10 }}>
    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', textAlign: 'center' }}>
      Professional Management
    </Text>
  </View>
</View>

      <View style={adminStyles.filterBar}>
        <View style={adminStyles.filterChips}>
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[adminStyles.chip, statusFilter === st && adminStyles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[adminStyles.chipText, statusFilter === st && adminStyles.chipTextActive]}>
                {st === 'all' ? 'All Applications' : st.charAt(0).toUpperCase() + st.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredApps.map((app) => (
        <TouchableOpacity
          key={app._id}
          style={adminStyles.card}
          activeOpacity={0.7}
          onPress={() => {
            setSelectedApp(app);
            setModalType('details');
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 15 }}>{app.fullName}</Text>
              <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600', marginTop: 1 }}>
                {app.profession}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>
                License: {app.licenseNum}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              {renderBadge(app.status)}
              <Text style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 4 }}>
                {app.expYears} Years Exp.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 6 }}>
            <Text style={{ color: COLORS.textMuted, fontSize: 11 }} numberOfLines={1}>
              Spec: <Text style={{ color: COLORS.textPrimary }}>{app.specialization || 'General Mental Health'}</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
              <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: 'bold', marginRight: 4 }}>Review Docs & Actions</Text>
              <Text style={{ color: COLORS.primary, fontSize: 12 }}>➔</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <Modal visible={modalType === 'details'} transparent animationType="fade">
        <View style={adminStyles.modalOverlay}>
          <View style={[adminStyles.modalBox, { maxWidth: 640 }]}>
            <View style={adminStyles.modalHeader}>
              <Text style={adminStyles.modalTitle}>Therapist Verification Details</Text>
              <TouchableOpacity style={adminStyles.closeButton} onPress={() => setModalType(null)}>
                <Text style={adminStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedApp && (
              <ScrollView style={{ maxHeight: 440 }}>
                <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' }}>{selectedApp.fullName}</Text>
                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
                  {selectedApp.profession} • {selectedApp.licenseNum}
                </Text>

                <View style={{ backgroundColor: COLORS.surfaceDark, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                    Email: <Text style={{ color: COLORS.textPrimary }}>{selectedApp.email}</Text>
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                    Phone: <Text style={{ color: COLORS.textPrimary }}>{selectedApp.phone || 'N/A'}</Text>
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                    Specialization: <Text style={{ color: COLORS.textPrimary }}>{selectedApp.specialization}</Text>
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                    Experience: <Text style={{ color: COLORS.textPrimary }}>{selectedApp.expYears} Years</Text>
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                    User ID Ref: <Text style={{ color: COLORS.textMuted }}>{selectedApp.userId}</Text>
                  </Text>
                </View>

                <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
                  Submitted Certification Documents ({selectedApp.documents ? selectedApp.documents.length : 0})
                </Text>

                {selectedApp.documents && selectedApp.documents.length > 0 ? (
                  selectedApp.documents.map((doc, idx) => (
                    <View key={idx} style={adminStyles.docCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={adminStyles.docTitle}>📄{doc.title}</Text>
                        <Text style={adminStyles.docSub}>Type: {doc.type || 'Verification PDF'}</Text>
                      </View>
                      <TouchableOpacity
                        style={[adminStyles.btn, adminStyles.btnSecondary]}
                        onPress={() => doc.url && Linking.openURL(doc.url).catch(() => { })}
                      >
                        <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: 'bold' }}>Inspect File</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>No document files attached.</Text>
                )}

                {selectedApp.status === 'pending' && (
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                    <TouchableOpacity
                      style={[adminStyles.btn, adminStyles.btnDanger, { marginRight: 8 }]}
                      onPress={() => {
                        setModalType(null);
                        handleOpenReject(selectedApp);
                      }}
                    >
                      <Text style={adminStyles.btnText}>Reject Application</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[adminStyles.btn, adminStyles.btnPrimary]}
                      onPress={() => {
                        onApprove(selectedApp._id);
                        setModalType(null);
                      }}
                    >
                      <Text style={adminStyles.btnText}>Approve & Issue License</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: Reject Application */}
      <Modal visible={modalType === 'reject'} transparent animationType="fade">
        <View style={adminStyles.modalOverlay}>
          <View style={adminStyles.modalBox}>
            <View style={adminStyles.modalHeader}>
              <Text style={adminStyles.modalTitle}>Reject Professional Application</Text>
              <TouchableOpacity style={adminStyles.closeButton} onPress={() => setModalType(null)}>
                <Text style={adminStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 16 }}>
              Applicant: <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>{selectedApp?.fullName}</Text>
            </Text>

            <View style={adminStyles.inputGroup}>
              <Text style={adminStyles.inputLabel}>Reason for Rejection</Text>
              <TextInput
                style={[adminStyles.textInput, { height: 80 }]}
                multiline
                placeholder="Specify rejection reason (e.g. License verification unconfirmed, missing degree transcript)..."
                placeholderTextColor={COLORS.textMuted}
                value={rejectReason}
                onChangeText={setRejectReason}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity
                style={[adminStyles.btn, adminStyles.btnSecondary, { marginRight: 8 }]}
                onPress={() => setModalType(null)}
              >
                <Text style={{ color: COLORS.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.btn, adminStyles.btnDanger]} onPress={handleConfirmReject}>
                <Text style={adminStyles.btnText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
};

export default ProfessionalsManagementView;
