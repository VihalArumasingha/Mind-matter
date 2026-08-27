import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const COLORS = {
  primary: '#0D9488', 
  primaryDark: '#0F766E',
  primaryLight: '#E6FFFA',
  bgDark: '#F8FAFC', 
  cardDark: '#FFFFFF', 
  cardLight: '#FFFFFF',
  surfaceDark: '#F1F5F9', 
  borderDark: '#E2E8F0', 
  borderLight: '#CBD5E1',
  textPrimary: '#0F172A', 
  textSecondary: '#475569', 
  textMuted: '#94A3B8', 
  textDark: '#0F172A',
  textLight: '#F4F7EF',
  
  success: '#059669', 
  successBg: '#ECFDF5',
  warning: '#D97706', 
  warningBg: '#FFFBEB',
  danger: '#DC2626', 
  dangerBg: '#FEF2F2',
  info: '#2563EB', 
 infor: '#dbe7ff', 
  infoBg: '#EFF6FF',
  purple: '#7C3AED', 
  purpleBg: '#F5F3FF'
};

export const adminStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    position: 'relative'
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.bgDark
  },
  bodyArea: {
    flex: 1,
    padding: 16,

  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 999
  },
  sidebarDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 290,
    backgroundColor: COLORS.cardDark,
    zIndex: 1000,
    elevation: 25,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderDark,
    paddingHorizontal: 14,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10
  },

  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 20
  },
  brandHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  brandLogoText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20
  },
  brandName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: 'bold'
  },
  brandTag: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1
  },
  drawerCloseBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceDark
  },
  drawerCloseText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold'
  },

  // Menu List
  menuList: {
    flex: 1
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6
  },
  menuItemActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  menuIcon: {
    width: 24,
    fontSize: 16,
    textAlign: 'center',
    marginRight: 12,
    color: COLORS.textSecondary
  },
  menuIconActive: {
    color: '#FFF'
  },
  menuText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500'
  },
  menuTextActive: {
    color: '#FFF',
    fontWeight: '700'
  },
  badgeCount: {
    marginLeft: 'auto',
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },

  headerBarContainer: {
    backgroundColor: COLORS.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    paddingHorizontal: 14,
    paddingBottom: 10
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  menuToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    elevation: 4
  },
  toggleText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  expandSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10
  },
  expandSearchInput: {
    color: COLORS.textPrimary,
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
    paddingVertical: 2
  },

    commentItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  commentAuthor: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 12
  },
  commentDate: {
    color: COLORS.textMuted,
    fontSize: 10
  },
  commentContent: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18
  },
  // Cards
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: COLORS.borderDark
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4
  },
  metricCard: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 10
  },
  metricCardInner: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7
  },
  metricIconBox: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  minWidth: 42,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center'
},
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800'
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500'
  },
postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceDark,
  },
  modalImage: {
    width: '100%',
    height: 250,
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


  tableContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceDark,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark
  },
  tableHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  tableCellText: {
    color: COLORS.textPrimary,
    fontSize: 12
  },
  tableCellSubtext: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2
  },

  // Badges
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  filterChips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap'
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceDark,
    marginRight: 6,
    marginBottom: 6
  },
  chipActive: {
    backgroundColor: COLORS.primary
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#FFF'
  },

  // Action Buttons
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPrimary: {
    backgroundColor: COLORS.primary
  },
  btnDanger: {
    backgroundColor: COLORS.danger
  },
  btnWarning: {
    backgroundColor: COLORS.warning
  },
  btnSecondary: {
    backgroundColor: COLORS.surfaceDark
  },
  btnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700'
  },

  // Modals & Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  modalBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.cardDark,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    paddingBottom: 10
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 4
  },
  closeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4
  },
  textInput: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark
  },

  docCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  docTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  docSub: {
    color: COLORS.textSecondary,
    fontSize: 10
  }
});
