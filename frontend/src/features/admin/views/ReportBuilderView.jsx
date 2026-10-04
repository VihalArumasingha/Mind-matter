import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../../context/AuthContext';
import { shareReportFile } from '../utils/shareReportFile';
import { buildReportPdf } from '../utils/pdfBuilder';
import {
  getDashboardStats,
  getUsersApi,
  getProfessionalApplicationsApi,
  getCommunitiesApi,
  getPostsApi,
  getReportsApi,
} from '../services/adminService';

const COLORS = {
  primary: '#0A6D3D',
  primaryLight: '#E6F4EC',
  primaryDark: '#065530',
  primaryHeader: '#0A6D3D',

  bg: '#F7FAF7',
  card: '#FFFFFF',
  border: '#DCE5DE',
  borderLight: '#EFF4EF',

  ink: '#17231B',
  inkLight: '#4A564C',
  muted: '#647067',
  mutedLight: '#9AA69D',

  blue: '#2563EB',
  blueBg: '#DBEAFE',
  purple: '#7C3AED',
  purpleBg: '#EDE9FE',
  amber: '#B45309',
  amberBg: '#FEF3C7',
  red: '#B42318',
  redBg: '#FEE2E2',
  cyan: '#0891B2',
  cyanBg: '#CFFAFE',
  pink: '#DB2777',
  pinkBg: '#FCE7F3',
  lime: '#65A30D',
  limeBg: '#ECFCCB',
};

const REPORT_TYPES = [
  {
    id: 'platform',
    label: 'Platform summary',
    icon: 'insights',
    color: COLORS.primary,
    tint: COLORS.primaryLight,
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'people',
    color: COLORS.blue,
    tint: COLORS.blueBg,
  },
  {
    id: 'professionals',
    label: 'Professionals',
    icon: 'verified-user',
    color: COLORS.primary,
    tint: COLORS.primaryLight,
  },
  {
    id: 'communities',
    label: 'Communities',
    icon: 'groups',
    color: COLORS.purple,
    tint: COLORS.purpleBg,
  },
  {
    id: 'posts',
    label: 'Posts',
    icon: 'article',
    color: COLORS.cyan,
    tint: COLORS.cyanBg,
  },
];

const asArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const normalizeRows = (records, reportType) =>
  asArray(records).map((record, index) => ({
    name:
      record.name ||
      record.title ||
      record.communityName ||
      record.username ||
      `${reportType} ${index + 1}`,
    category:
      record.role ||
      record.targetType ||
      record.type ||
      record.category ||
      reportType,
    status: record.status || record.state || 'Unspecified',
    date: formatDate(
      record.createdAt || record.created_at || record.updatedAt || record.date
    ),
  }));

const getPlatformRows = (response) => {
  const stats =
    response?.data?.stats ||
    response?.stats ||
    response?.data ||
    response ||
    {};
  return Object.entries(stats)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .map(([name, value]) => ({
      name: name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (letter) => letter.toUpperCase()),
      category: 'Platform metric',
      status: 'Summary',
      date: new Date().toISOString().slice(0, 10),
      value: Number(value),
    }));
};

/* Status colors — for badges */
const getStatusConfig = (status = '') => {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'approved' || s === 'resolved')
    return { bg: COLORS.primaryLight, color: COLORS.primary };
  if (s === 'pending' || s === 'investigating' || s === 'warned')
    return { bg: COLORS.amberBg, color: COLORS.amber };
  if (s === 'suspended' || s === 'rejected' || s === 'removed' || s === 'dismissed')
    return { bg: COLORS.redBg, color: COLORS.red };
  if (s === 'restricted') return { bg: COLORS.amberBg, color: COLORS.amber };
  return { bg: '#F1F5F9', color: COLORS.muted };
};

/* ───────── CSV HELPERS ───────── */
const utf8Bytes = (value) => {
  const encoded = encodeURIComponent(value);
  const bytes = [];
  for (let index = 0; index < encoded.length; index += 1) {
    if (encoded[index] === '%') {
      bytes.push(parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else {
      bytes.push(encoded.charCodeAt(index));
    }
  }
  return bytes;
};

const bytesToBase64 = (bytes) => {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    result += alphabet[b1 >> 2];
    result += alphabet[((b1 & 3) << 4) | ((b2 ?? 0) >> 4)];
    result +=
      b2 === undefined ? '=' : alphabet[((b2 & 15) << 2) | ((b3 ?? 0) >> 6)];
    result += b3 === undefined ? '=' : alphabet[b3 & 63];
  }
  return result;
};

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const createCsvDataUri = (rows) => {
  const csv = [
    ['Name', 'Category', 'Status', 'Date', 'Value'].map(csvEscape).join(','),
    ...rows.map((row) =>
      [row.name, row.category, row.status, row.date, row.value]
        .map(csvEscape)
        .join(',')
    ),
  ].join('\r\n');
  return `data:text/csv;charset=utf-8;base64,${bytesToBase64(utf8Bytes(csv))}`;
};

const isValidDateFilter = (value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

export default function ReportBuilderView() {
  const { token } = useAuth();
  const [reportType, setReportType] = useState('platform');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let result;
      switch (reportType) {
        case 'users':
          result = normalizeRows(await getUsersApi(token), 'User');
          break;
        case 'professionals':
          result = normalizeRows(
            await getProfessionalApplicationsApi(token),
            'Professional'
          );
          break;
        case 'communities':
          result = normalizeRows(await getCommunitiesApi(token), 'Community');
          break;
        case 'posts':
          result = normalizeRows(await getPostsApi(token), 'Post');
          break;
        case 'reports':
          result = normalizeRows(await getReportsApi(token), 'Report');
          break;
        default:
          result = getPlatformRows(await getDashboardStats(token));
      }
      setRows(result);
      setStatusFilter('All statuses');
    } catch (loadError) {
      console.error('Unable to load report data:', loadError);
      setError(loadError.message || 'Unable to load report data.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, token]);

  useFocusEffect(
    useCallback(() => {
      loadRows();
    }, [loadRows])
  );

  const statuses = useMemo(
    () => ['All statuses', ...new Set(rows.map((row) => row.status))],
    [rows]
  );

  const invalidDateRange =
    !isValidDateFilter(startDate) ||
    !isValidDateFilter(endDate) ||
    (startDate && endDate && startDate > endDate);

  const filteredRows = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !searchTerm ||
        [row.name, row.category, row.status, row.date]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm);
      const matchesStatus =
        statusFilter === 'All statuses' || row.status === statusFilter;
      const matchesDate =
        invalidDateRange ||
        (!startDate && !endDate) ||
        (Boolean(row.date) &&
          (!startDate || row.date >= startDate) &&
          (!endDate || row.date <= endDate));
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [rows, search, statusFilter, startDate, endDate, invalidDateRange]);

  const activeReport =
    REPORT_TYPES.find((type) => type.id === reportType) || REPORT_TYPES[0];

  const shareReport = async (format) => {
    setExporting(format);
    try {
      const fileName = `mindmatter-${reportType}-report.${format}`;

      const dataUri =
        format === 'csv'
          ? createCsvDataUri(filteredRows)
          : buildReportPdf({
              reportLabel: activeReport.label,
              periodLabel:
                startDate || endDate
                  ? `${startDate || 'Any'} to ${endDate || 'Any'}`
                  : 'All time',
              statusLabel: statusFilter,
              records: filteredRows,
              generatedAt: new Date(),
              generatedBy: 'Admin',
              reportType,
            });

      await shareReportFile(dataUri, fileName, format);
    } catch (shareError) {
      const cancelled =
        shareError?.message === 'User did not share' ||
        shareError?.message === 'User cancelled' ||
        shareError?.message?.includes('cancel');

      if (!cancelled) {
        console.error(
          `Unable to export ${format.toUpperCase()} report:`,
          shareError
        );
        Alert.alert(
          'Export failed',
          shareError.message ||
            `Unable to export the ${format.toUpperCase()} report.`
        );
      }
    } finally {
      setExporting('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
        
    
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />
      <View style={styles.greenHeader}>
        <View style={styles.greenHeaderInner}>
          
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.greenHeaderTitle}>Report Builder</Text>
            <Text style={styles.greenHeaderSubtitle}>
              Generate stakeholder-ready summaries
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: COLORS.primary }]}>
              <Text style={[styles.stepBadgeText, { color: '#FFF' }]}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Choose a report type</Text>
          </View>

          <View style={styles.typeGrid}>
            {REPORT_TYPES.map((type) => {
              const active = reportType === type.id;
              return (
                <Pressable
                  key={type.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setReportType(type.id)}
                  style={[
                    styles.typeCard,
                    active && {
                      borderColor: COLORS.primary,
                      backgroundColor: COLORS.primaryLight,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.typeIcon,
                      {
                        backgroundColor: active ? COLORS.primary : COLORS.primaryLight,
                      },
                    ]}
                  >
                    <Icon
                      name={type.icon}
                      size={18}
                      color={active ? '#FFFFFF' : COLORS.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.typeLabel,
                      active && { color: COLORS.primary, fontWeight: '700' },
                    ]}
                    numberOfLines={2}
                  >
                    {type.label}
                  </Text>
                  {active && (
                    <View style={[styles.typeCheck, { backgroundColor: COLORS.primary }]}>
                      <Icon name="check" size={10} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: COLORS.primary }]}>
              <Text style={[styles.stepBadgeText, { color: '#FFF' }]}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Filter the results</Text>
          </View>

          <View
            style={[
              styles.searchBox,
              isSearchFocused && styles.searchBoxFocused,
            ]}
          >
            <Icon name="search" size={18} color={COLORS.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, category, or status"
              placeholderTextColor={COLORS.mutedLight}
              style={styles.searchInput}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Icon name="close" size={18} color={COLORS.muted} />
              </Pressable>
            )}
          </View>

          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.chipList}>
            {statuses.map((status) => {
              const active = statusFilter === status;
              return (
                <Pressable
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={[
                    styles.chip,
                    active && {
                      backgroundColor: COLORS.primary,
                      borderColor: COLORS.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && { color: '#FFF', fontWeight: '700' },
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Date range (YYYY-MM-DD)</Text>
          <View style={styles.dateRow}>
            <View
              style={[
                styles.dateInputWrap,
                invalidDateRange && styles.dateInputWrapError,
              ]}
            >
              <Icon name="calendar-today" size={14} color={COLORS.primary} />
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="From"
                placeholderTextColor={COLORS.mutedLight}
                style={styles.dateInput}
              />
            </View>
            <View
              style={[
                styles.dateInputWrap,
                invalidDateRange && styles.dateInputWrapError,
              ]}
            >
              <Icon name="calendar-today" size={14} color={COLORS.primary} />
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="To"
                placeholderTextColor={COLORS.mutedLight}
                style={styles.dateInput}
              />
            </View>
          </View>
          {invalidDateRange && (
            <Text style={styles.validationText}>
              Enter valid dates in YYYY-MM-DD format, with the start before the end.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: COLORS.primary }]}>
              <Text style={[styles.stepBadgeText, { color: '#FFF' }]}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>Live preview</Text>
            <View style={[styles.countBadge, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={[styles.countText, { color: COLORS.primary }]}>
                {filteredRows.length}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.feedback}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.feedbackText}>Loading report data...</Text>
            </View>
          ) : error ? (
            <View style={styles.feedback}>
              <Icon name="error-outline" size={32} color={COLORS.red} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={loadRows}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : filteredRows.length === 0 ? (
            <View style={styles.feedback}>
              <Icon name="search-off" size={32} color={COLORS.mutedLight} />
              <Text style={styles.emptyText}>
                No records match these filters.
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.nameColumn]}>
                  NAME
                </Text>
                <Text style={[styles.tableHeaderText, styles.statusColumn]}>
                  STATUS
                </Text>
                <Text style={[styles.tableHeaderText, styles.dateColumn]}>
                  DATE
                </Text>
              </View>
              {filteredRows.slice(0, 8).map((row, index) => {
                const cfg = getStatusConfig(row.status);
                const initial = (row.name || 'R').charAt(0).toUpperCase();
                return (
                  <View
                    key={`${row.name}-${row.date}-${index}`}
                    style={styles.tableRow}
                  >
                    <View style={[styles.rowAvatar, { backgroundColor: COLORS.primary }]}>
                      <Text style={styles.rowAvatarText}>{initial}</Text>
                    </View>
                    <View style={[styles.nameColumn, { marginLeft: 10 }]}>
                      <Text numberOfLines={1} style={styles.rowName}>
                        {row.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.rowCategory}>
                        {row.category}
                        {row.value === undefined
                          ? ''
                          : ` · ${row.value.toLocaleString()}`}
                      </Text>
                    </View>
                    <View style={styles.statusColumn}>
                      <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                        <Text
                          style={[styles.statusPillText, { color: cfg.color }]}
                          numberOfLines={1}
                        >
                          {row.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.rowText, styles.dateColumn]}>
                      {row.date || '-'}
                    </Text>
                  </View>
                );
              })}
              {filteredRows.length > 8 && (
                <Text style={styles.moreText}>
                  Showing 8 of {filteredRows.length}; exports include all matches.
                </Text>
              )}
            </View>
          )}

          <View style={styles.exportRow}>
            <Pressable
              disabled={loading || Boolean(error) || Boolean(exporting)}
              onPress={() => shareReport('pdf')}
              style={[
                styles.exportButton,
                styles.primaryButton,
                (loading || Boolean(error) || Boolean(exporting)) && styles.disabled,
              ]}
            >
              <Icon name="picture-as-pdf" size={16} color="#FFF" />
              <Text style={styles.primaryButtonText}>
                {exporting === 'pdf' ? 'Preparing...' : 'Export PDF'}
              </Text>
            </Pressable>
            <Pressable
              disabled={loading || Boolean(error) || Boolean(exporting)}
              onPress={() => shareReport('csv')}
              style={[
                styles.exportButton,
                styles.secondaryButton,
                (loading || Boolean(error) || Boolean(exporting)) && styles.disabled,
              ]}
            >
              <Icon name="table-chart" size={16} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>
                {exporting === 'csv' ? 'Preparing...' : 'Export CSV'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.exportHint}>
            Exports include every matching record and can be shared as a file.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: { padding: 16, paddingTop: 16, paddingBottom: 40, gap: 14 },

  greenHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greenHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenHeaderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greenHeaderSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },

  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#0A2010',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepBadgeText: { fontSize: 13, fontWeight: '800' },
  sectionTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '700', flex: 1 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 34,
    alignItems: 'center',
  },
  countText: { fontSize: 12, fontWeight: '800' },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    flexGrow: 1,
    flexBasis: '31%',
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    position: 'relative',
  },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink,
    textAlign: 'center',
  },
  typeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FBF8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13.5,
    color: COLORS.ink,
    marginLeft: 8,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 16,
    marginBottom: 8,
  },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { fontSize: 11.5, fontWeight: '600', color: COLORS.muted },

  /* ─── Date Range ─── */
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 2,
    backgroundColor: '#F9FBF8',
  },
  dateInputWrapError: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redBg,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: COLORS.ink,
    fontSize: 13,
  },
  validationText: {
    color: COLORS.red,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 8,
    fontWeight: '500',
  },

  /* ─── Feedback / Empty ─── */
  feedback: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  feedbackText: { color: COLORS.muted, fontSize: 13 },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  retryButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: { color: COLORS.primary, fontSize: 12.5, fontWeight: '700' },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  /* ─── Table ─── */
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    paddingBottom: 9,
    marginBottom: 4,
  },
  tableHeaderText: {
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: COLORS.borderLight,
    borderBottomWidth: 1,
  },
  rowAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  nameColumn: { flex: 1.6, paddingRight: 8 },
  statusColumn: { flex: 1.1, paddingRight: 8 },
  dateColumn: { flex: 0.9, textAlign: 'right', color: COLORS.muted, fontSize: 11 },

  rowName: { color: COLORS.ink, fontSize: 12.5, fontWeight: '700' },
  rowCategory: { color: COLORS.muted, fontSize: 10.5, marginTop: 2 },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  rowText: { color: COLORS.muted, fontSize: 11 },
  moreText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },

  /* ─── Export Buttons ─── */
  exportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  primaryButton: { backgroundColor: COLORS.primary },
  secondaryButton: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.card,
  },
  primaryButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: { opacity: 0.5 },
  exportHint: {
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 10,
    fontStyle: 'italic',
  },
});