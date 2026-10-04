import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { adminStyles, COLORS } from '../styles/adminStyles';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AUDIENCE_OPTIONS = [
  { id: 'both', label: 'Both', sub: 'Users & Pros', icon: 'groups', color: '#7C3AED' },
  { id: 'all_users', label: 'Users', sub: 'Regular only', icon: 'person', color: '#2563EB' },
  { id: 'all_professionals', label: 'Pros', sub: 'Therapists', icon: 'medical-services', color: '#059669' },
];

const BroadcastsView = ({
  broadcasts = [],
  onSendBroadcast,
  onUpdateBroadcast,
  onDeleteBroadcast,
  loading = false,
  onRefresh,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('both');
  const [sending, setSending] = useState(false);

  const [detailBroadcast, setDetailBroadcast] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [editBroadcast, setEditBroadcast] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editAudience, setEditAudience] = useState('both');
  const [editSaving, setEditSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');

  const filteredBroadcasts = useMemo(() => {
    let list = [...broadcasts];
    if (audienceFilter !== 'all') list = list.filter(b => b.targetAudience === audienceFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.message || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [broadcasts, audienceFilter, searchQuery]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing Fields', 'Please enter both a title and message.');
      return;
    }
    const audienceText =
      targetAudience === 'both' ? 'all users and professionals' :
      targetAudience === 'all_users' ? 'all regular users' :
      'all verified professionals';

    Alert.alert('Send Broadcast', `Send this announcement to ${audienceText}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          setSending(true);
          try {
            await onSendBroadcast(title.trim(), message.trim(), targetAudience);
            setTitle('');
            setMessage('');
            setTargetAudience('both');
            Alert.alert('Success', 'Broadcast sent successfully!');
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to send broadcast');
          } finally {
            setSending(false);
          }
        },
      },
    ]);
  };

  const openDetail = (b) => { setDetailBroadcast(b); setDetailVisible(true); };
  const closeDetail = () => { setDetailVisible(false); setDetailBroadcast(null); };

  const openEdit = (b) => {
    setEditBroadcast(b);
    setEditTitle(b.title || '');
    setEditMessage(b.message || '');
    setEditAudience(b.targetAudience || 'both');
    closeDetail();
  };
  const closeEdit = () => { setEditBroadcast(null); setEditSaving(false); };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editMessage.trim()) {
      Alert.alert('Missing Fields', 'Title and message cannot be empty.');
      return;
    }
    setEditSaving(true);
    try {
      await onUpdateBroadcast(editBroadcast._id, editTitle.trim(), editMessage.trim(), editAudience);
      Alert.alert('Updated', 'Broadcast updated successfully.');
      closeEdit();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update broadcast');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = (b) => {
    Alert.alert(
      'Delete Broadcast',
      `Are you sure you want to delete "${b.title}"? This will also remove the announcement post from the feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(b._id);
            try {
              await onDeleteBroadcast(b._id);
              if (detailBroadcast?._id === b._id) closeDetail();
              Alert.alert('Deleted', 'Broadcast removed successfully.');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete broadcast');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };


  const getAudienceMeta = (aud) =>
    AUDIENCE_OPTIONS.find(a => a.id === aud) || AUDIENCE_OPTIONS[0];

  const formatDateTime = (date) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderBroadcastCard = (item) => {
    const meta = getAudienceMeta(item.targetAudience);
    const { date } = formatDateTime(item.createdAt);
    const isDeleting = deletingId === item._id;

    return (
      <TouchableOpacity
        key={item._id}
        style={styles.broadcastCard}
        activeOpacity={0.75}
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.starBadge}>
            <Text style={styles.starText}>⭐</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.cardMetaRow}>
              <Icon name="person-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.cardMetaText}>{item.sentBy || 'System Admin'}</Text>
              <Text style={styles.cardMetaDot}>•</Text>
              <Text style={styles.cardMetaText}>{date}</Text>
            </View>
          </View>
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLORS.danger} />
          ) : (
            <Icon name="chevron-right" size={22} color={COLORS.textMuted} />
          )}
        </View>

        <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>

        <View style={styles.cardFooter}>
          <View style={[styles.audiencePill, { backgroundColor: meta.color + '15', borderColor: meta.color + '40' }]}>
            <Icon name={meta.icon} size={12} color={meta.color} />
            <Text style={[styles.audiencePillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <View style={styles.recipientPill}>
            <Icon name="people" size={12} color={COLORS.primary} />
            <Text style={styles.recipientPillText}>{item.recipientCount} recipients</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
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
      <View style={styles.composerCard}>
        <View style={styles.composerHeader}>
          <View style={styles.composerIconWrap}>
            <Icon name="campaign" size={20} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.composerTitle}>New Announcement</Text>
            <Text style={styles.composerSubtitle}>Broadcast to your community in real-time</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Scheduled Maintenance Notice"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={styles.fieldLabel}>Target Audience</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {AUDIENCE_OPTIONS.map((aud) => {
            const active = targetAudience === aud.id;
            return (
              <TouchableOpacity
                key={aud.id}
                style={[
                  styles.audienceCard,
                  active && { borderColor: aud.color, backgroundColor: aud.color + '10' },
                ]}
                onPress={() => setTargetAudience(aud.id)}
                activeOpacity={0.8}
              >
                <Icon name={aud.icon} size={18} color={active ? aud.color : COLORS.textSecondary} />
                <Text style={[styles.audienceCardLabel, active && { color: aud.color, fontWeight: '700' }]}>
                  {aud.label}
                </Text>
                <Text style={styles.audienceCardSub} numberOfLines={1}>{aud.sub}</Text>
                {active && (
                  <View style={[styles.audienceCheck, { backgroundColor: aud.color }]}>
                    <Icon name="check" size={10} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Message</Text>
        <TextInput
          style={[styles.textInput, { height: 110, textAlignVertical: 'top', paddingTop: 10 }]}
          multiline
          placeholder="Compose your announcement message..."
          placeholderTextColor={COLORS.textMuted}
          value={message}
          onChangeText={setMessage}
          maxLength={1000}
          numberOfLines={5}
        />
        <Text style={styles.charCounter}>{message.length}/1000</Text>

        <TouchableOpacity
          style={[styles.sendButton, (!title.trim() || !message.trim() || sending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          activeOpacity={0.85}
        >
          {sending ? (
            <>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.sendButtonText}>Sending Broadcast...</Text>
            </>
          ) : (
            <>
              <Icon name="send" size={16} color="#FFF" />
              <Text style={styles.sendButtonText}>Send Broadcast</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="history" size={18} color={COLORS.textPrimary} />
          <Text style={styles.sectionTitle}>Sent History</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{broadcasts.length}</Text>
        </View>
      </View>

      <View style={styles.searchInputWrap}>
        <Icon name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search broadcasts..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterChipsRow}>
        {[
          { id: 'all', label: 'All' },
          { id: 'both', label: '👥 Both' },
          { id: 'all_users', label: '👤 Users' },
          { id: 'all_professionals', label: '🩺 Pros' },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, audienceFilter === f.id && styles.filterChipActive]}
            onPress={() => setAudienceFilter(f.id)}
          >
            <Text style={[styles.filterChipText, audienceFilter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredBroadcasts.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="campaign" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>
            {searchQuery || audienceFilter !== 'all' ? 'No matching broadcasts' : 'No broadcasts yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || audienceFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Your sent announcements will appear here'}
          </Text>
        </View>
      ) : (
        filteredBroadcasts.map(renderBroadcastCard)
      )}

      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>⭐</Text>
                <Text style={styles.modalTitle}>Broadcast Details</Text>
              </View>
              <TouchableOpacity onPress={closeDetail} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {detailBroadcast && (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.detailTitle}>{detailBroadcast.title}</Text>

                <View style={styles.detailMetaRow}>
                  <Icon name="person-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.detailMetaText}>{detailBroadcast.sentBy || 'System Admin'}</Text>
                  <Text style={styles.detailMetaDot}>•</Text>
                  <Icon name="schedule" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.detailMetaText}>
                    {formatDateTime(detailBroadcast.createdAt).date} {formatDateTime(detailBroadcast.createdAt).time}
                  </Text>
                </View>

                <View style={styles.detailStatsRow}>
                  <View style={styles.detailStatCard}>
                    <View style={[styles.detailStatIcon, {
                      backgroundColor: getAudienceMeta(detailBroadcast.targetAudience).color + '15'
                    }]}>
                      <Icon
                        name={getAudienceMeta(detailBroadcast.targetAudience).icon}
                        size={18}
                        color={getAudienceMeta(detailBroadcast.targetAudience).color}
                      />
                    </View>
                    <Text style={styles.detailStatLabel}>Audience</Text>
                    <Text style={styles.detailStatValue}>
                      {getAudienceMeta(detailBroadcast.targetAudience).label}
                    </Text>
                  </View>

                  <View style={styles.detailStatCard}>
                    <View style={[styles.detailStatIcon, { backgroundColor: COLORS.primaryLight }]}>
                      <Icon name="people" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.detailStatLabel}>Recipients</Text>
                    <Text style={styles.detailStatValue}>{detailBroadcast.recipientCount}</Text>
                  </View>
                </View>

                <Text style={styles.detailSectionLabel}>Message</Text>
                <View style={styles.detailMessageBox}>
                  <Text style={styles.detailMessageText}>{detailBroadcast.message}</Text>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, styles.detailEditBtn]}
                    onPress={() => openEdit(detailBroadcast)}
                    activeOpacity={0.8}
                  >
                    <Icon name="edit" size={16} color={COLORS.primary} />
                    <Text style={[styles.detailActionText, { color: COLORS.primary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionBtn, styles.detailDeleteBtn]}
                    onPress={() => handleDelete(detailBroadcast)}
                    activeOpacity={0.8}
                  >
                    <Icon name="delete-outline" size={16} color={COLORS.danger} />
                    <Text style={[styles.detailActionText, { color: COLORS.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={!!editBroadcast} transparent animationType="slide" onRequestClose={closeEdit}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Broadcast</Text>
                <TouchableOpacity onPress={closeEdit}>
                  <Icon name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  maxLength={100}
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.fieldLabel}>Target Audience</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {AUDIENCE_OPTIONS.map((aud) => {
                    const active = editAudience === aud.id;
                    return (
                      <TouchableOpacity
                        key={aud.id}
                        style={[
                          styles.audienceCard,
                          active && { borderColor: aud.color, backgroundColor: aud.color + '10' },
                        ]}
                        onPress={() => setEditAudience(aud.id)}
                      >
                        <Icon name={aud.icon} size={18} color={active ? aud.color : COLORS.textSecondary} />
                        <Text style={[styles.audienceCardLabel, active && { color: aud.color, fontWeight: '700' }]}>
                          {aud.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Message</Text>
                <TextInput
                  style={[styles.textInput, { height: 110, textAlignVertical: 'top', paddingTop: 10 }]}
                  multiline
                  value={editMessage}
                  onChangeText={setEditMessage}
                  maxLength={1000}
                  numberOfLines={5}
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.charCounter}>{editMessage.length}/1000</Text>

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.editCancelBtn}
                    onPress={closeEdit}
                    disabled={editSaving}
                  >
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editSaveBtn, editSaving && { opacity: 0.6 }]}
                    onPress={handleSaveEdit}
                    disabled={editSaving}
                  >
                    {editSaving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Icon name="check" size={16} color="#FFF" />
                        <Text style={styles.editSaveText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  composerCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  composerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  composerIconWrap: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  composerTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  composerSubtitle: { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },

  fieldLabel: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700',
    marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  textInput: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  charCounter: { color: COLORS.textMuted, fontSize: 10, textAlign: 'right', marginTop: 4 },

  audienceCard: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.borderDark, backgroundColor: COLORS.cardDark,
    alignItems: 'center', position: 'relative',
  },
  audienceCardLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, marginTop: 6 },
  audienceCardSub: { fontSize: 9, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  audienceCheck: {
    position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },

  sendButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, marginTop: 16,
  },
  sendButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 8 },

  /* section header */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 22, marginBottom: 12,
  },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', marginLeft: 8 },
  countBadge: { backgroundColor: COLORS.surfaceDark, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  countBadgeText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },

  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardDark,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.borderDark, marginBottom: 10,
  },
  searchInput: {
    flex: 1, marginLeft: 8, color: COLORS.textPrimary, fontSize: 13, paddingVertical: 6,
  },

  filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: COLORS.surfaceDark, marginRight: 6, marginBottom: 6,
  },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  filterChipTextActive: { color: '#FFF' },

  broadcastCard: {
    backgroundColor: COLORS.cardDark, borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderDark,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  starBadge: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  starText: { fontSize: 20 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  cardMetaText: { color: COLORS.textMuted, fontSize: 10, marginLeft: 3 },
  cardMetaDot: { color: COLORS.textMuted, fontSize: 10, marginHorizontal: 4 },
  cardMessage: {
    color: COLORS.textSecondary, fontSize: 12, lineHeight: 18,
    marginTop: 10, marginBottom: 12,
  },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  audiencePill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, marginRight: 6,
  },
  audiencePillText: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
  recipientPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, backgroundColor: COLORS.primaryLight,
  },
  recipientPillText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, marginLeft: 4 },

  /* empty */
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 12 },
  emptySubtitle: {
    color: COLORS.textMuted, fontSize: 12, marginTop: 4,
    textAlign: 'center', paddingHorizontal: 30,
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modalBox: {
    width: '100%', maxWidth: 540, backgroundColor: COLORS.cardDark,
    borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.borderDark,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderDark,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },

  detailTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  detailMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 },
  detailMetaText: { color: COLORS.textSecondary, fontSize: 11, marginLeft: 4, marginRight: 8 },
  detailMetaDot: { color: COLORS.textMuted, marginHorizontal: 4 },
  detailStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  detailStatCard: {
    flex: 1, backgroundColor: COLORS.surfaceDark, borderRadius: 12,
    padding: 12, alignItems: 'center',
  },
  detailStatIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  detailStatLabel: { color: COLORS.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  detailStatValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 2 },
  detailSectionLabel: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6,
  },
  detailMessageBox: {
    backgroundColor: COLORS.surfaceDark, borderRadius: 12,
    padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  detailMessageText: { color: COLORS.textPrimary, fontSize: 13, lineHeight: 20 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  detailActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 10, borderWidth: 1.5,
  },
  detailEditBtn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  detailDeleteBtn: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerBg },
  detailActionText: { fontSize: 13, fontWeight: '700', marginLeft: 6 },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  editCancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.surfaceDark, borderWidth: 1, borderColor: COLORS.borderDark,
  },
  editCancelText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  editSaveBtn: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary,
  },
  editSaveText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginLeft: 6 },
}); 

export default BroadcastsView;