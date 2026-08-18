import { StyleSheet, Platform } from 'react-native';
import { COLORS } from './volunteerDashboardStyles';

export const profileStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 40,
  },

  /* Top Navigation Bar */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  editToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.greenBg,
  },
  editToggleBtnActive: {
    backgroundColor: COLORS.green,
  },
  editToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green,
  },
  editToggleTextActive: {
    color: COLORS.white,
  },

  /* Profile Card Header */
  profileHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarLargeText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '700',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.greenBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
  },

  /* Mini Stats Row */
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  miniStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  miniStatValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 14,
  },

  /* Form Fields */
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValueBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  fieldValueText: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  fieldInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1.5,
    borderColor: COLORS.green,
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  /* Action Buttons */
  saveButton: {
    backgroundColor: COLORS.green,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    elevation: 3,
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },

  /* Account Actions */
  accountActionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  actionTextDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
});

export default profileStyles;
