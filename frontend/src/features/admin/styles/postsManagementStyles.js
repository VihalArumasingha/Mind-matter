import { StyleSheet } from 'react-native';
import { COLORS } from './adminStyles';

export const postsManagementStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7EF',
  },

  headerContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  dateFilterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardDark,
    borderRadius: 10,
    padding: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  dateFilterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateFilterActive: {
    backgroundColor: COLORS.primary,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dateFilterTextActive: {
    color: '#FFFFFF',
  },

  // ✅ Filter Info
  filterInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  filterInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  filterClearText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  // Stats Header
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statsLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borderDark,
  },

  // Filter Reset
  filterReset: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  filterResetText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Post Card
  postCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  authorName: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  authorRole: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  authorDot: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginHorizontal: 4,
  },
  authorCommunity: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  // Image and Title
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceDark,
  },
  postTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: COLORS.surfaceDark,
  },
  modalTitleText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 6,
  },

  // Post Stats
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  reportBadge: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    paddingTop: 8,
    marginTop: 8,
  },
  categoryText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  reviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 2,
  },

  // Badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: COLORS.infor,
  },
  badgeRestricted: {
    backgroundColor: COLORS.warningBg,
  },
  badgePending: {
    backgroundColor: COLORS.infoBg,
  },
  badgeDefault: {
    backgroundColor: COLORS.surfaceDark,
  },
  badgeTextActive: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextRestricted: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextPending: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextDefault: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Time Ago
  timeAgo: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '400',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Modal
  modalBox: {
    maxHeight: '85%',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalAuthorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalAuthorName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalAuthorMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  modalStatusSection: {
    alignItems: 'flex-end',
  },
  modalDate: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  modalContentCard: {
    backgroundColor: COLORS.surfaceDark,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalContentText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  modalEngagement: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  modalEngagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalEngagementText: {
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontSize: 13,
  },
  modalReportItem: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  restrictionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  restrictionContent: {
    flex: 1,
    marginLeft: 8,
  },
  restrictionLabel: {
    color: COLORS.warning,
    fontWeight: 'bold',
    fontSize: 12,
  },
  restrictionText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    marginTop: 2,
  },
  commentsSection: {
    marginBottom: 12,
  },
  commentsTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  commentItem: {
    backgroundColor: COLORS.surfaceDark,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  commentAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  commentAuthor: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  commentDate: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  commentContent: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },

  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
    gap: 6,
  },
  actionKeep: {
    backgroundColor: COLORS.success,
  },
  actionRestrict: {
    backgroundColor: COLORS.warning,
  },
  actionRemove: {
    backgroundColor: COLORS.danger,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Status Messages
  statusMessageActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
  },
  statusMessageRestricted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
  },
  statusMessagePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoBg,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
  },
  statusMessageRemoved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
  },
  statusMessageText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },

  // Restrict Modal
  restrictModalContent: {
    paddingVertical: 8,
  },
  restrictWarningIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  restrictModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  restrictModalSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  restrictInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  restrictActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  restrictButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  restrictCancel: {
    backgroundColor: COLORS.surfaceDark,
  },
  restrictCancelText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  restrictConfirm: {
    backgroundColor: COLORS.warning,
  },
  restrictConfirmText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  restrictDisabled: {
    opacity: 0.5,
  },
});