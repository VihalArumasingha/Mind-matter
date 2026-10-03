import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLORS } from '../styles/adminStyles';
import { useAuth } from '../../../context/AuthContext';
import { getReportSummaryApi, exportReportDataApi } from '../services/adminService';

const TARGET_TYPES = ['all', 'User', 'Post', 'Professional', 'Community'];
const REPORT_STATUSES = ['all', 'open', 'investigating', 'resolved', 'dismissed'];

const formatLabel = (value) => {
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const toDateInputValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString();
};

const ReportsManagementView = ({
  reports = [],
  summary: initialSummary,
  loading = false,
  onRefresh,
  onInvestigateReport,
  onResolveReport,
  onDismissReport,
}) => {
  const { token } = useAuth();
  
  // Filter states
  const [targetType, setTargetType] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Report generation states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [summary, setSummary] = useState(initialSummary);
  const [processingId, setProcessingId] = useState(null);
  const [reportPreview, setReportPreview] = useState(null);

  const dateError = useMemo(() => {
    if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
      return 'Enter dates in YYYY-MM-DD format.';
    }
    if (startDate && endDate && startDate > endDate) {
      return 'The start date must be on or before the end date.';
    }
    return '';
  }, [startDate, endDate]);

  const hasActiveFilters =
    targetType !== 'all' || status !== 'all' || Boolean(startDate) || Boolean(endDate);

  const clearFilters = () => {
    setTargetType('all');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setReportPreview(null);
  };

  const filteredReports = useMemo(() => {
    if (dateError) return [];

    return reports
      .filter((report) => targetType === 'all' || report.targetType === targetType)
      .filter((report) => status === 'all' || report.status === status)
      .filter((report) => {
        const createdAt = new Date(report.createdAt);
        if (Number.isNaN(createdAt.getTime())) return !startDate && !endDate;
        const reportDate = toDateInputValue(createdAt);
        return (
          (!startDate || reportDate >= startDate) &&
          (!endDate || reportDate <= endDate)
        );
      })
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }, [reports, targetType, status, startDate, endDate, dateError]);

  // Fetch fresh summary with filters applied
  const fetchFilteredSummary = useCallback(async () => {
    if (dateError) return;
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (targetType !== 'all') params.append('targetType', targetType);
      if (status !== 'all') params.append('status', status);

      const data = await getReportSummaryApi(token, params.toString());
      if (data) {
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching filtered summary:', error);
    }
  }, [token, startDate, endDate, targetType, status, dateError]);

  // Generate stakeholder report
  const generateStakeholderReport = async () => {
    if (dateError) {
      Alert.alert('Check report filters', dateError);
      return;
    }

    setGeneratingReport(true);

    try {
      // Build report content
      const generatedAt = new Date().toLocaleString();
      const period =
        startDate || endDate
          ? `${startDate || 'Beginning'} to ${endDate || 'Today'}`
          : 'All available dates';

      // Count reports by status and type from filtered data
      const statusCounts = ['open', 'investigating', 'resolved', 'dismissed'].map(
        (s) => `${formatLabel(s)}: ${filteredReports.filter((r) => r.status === s).length}`
      );
      
      const typeCounts = ['User', 'Post', 'Professional', 'Community'].map(
        (t) => `${t}: ${filteredReports.filter((r) => r.targetType === t).length}`
      );

      const urgentCount = filteredReports.filter((r) =>
        ['open', 'investigating'].includes(r.status)
      ).length;

      // Create formatted report
      const reportLines = [
        '═══════════════════════════════════════════',
        '       MINDMATTER PLATFORM SAFETY REPORT',
        '═══════════════════════════════════════════',
        '',
        `📅 Generated: ${generatedAt}`,
        `📊 Reporting Period: ${period}`,
        `🔍 Filters Applied: ${formatLabel(targetType)} / ${formatLabel(status)}`,
        '',
        '───────────────────────────────────────────',
        '                    EXECUTIVE SUMMARY',
        '───────────────────────────────────────────',
        '',
        `Total Complaints Reviewed: ${filteredReports.length}`,
        `Requiring Immediate Attention: ${urgentCount}`,
        '',
        '───────────────────────────────────────────',
        '                    COMPLAINTS BY STATUS',
        '───────────────────────────────────────────',
        '',
        ...statusCounts.map((s) => `  • ${s}`),
        '',
        '───────────────────────────────────────────',
        '                    COMPLAINTS BY TYPE',
        '───────────────────────────────────────────',
        '',
        ...typeCounts.map((t) => `  • ${t}`),
        '',
        '───────────────────────────────────────────',
        '                    PLATFORM METRICS',
        '───────────────────────────────────────────',
        '',
        '👥 USER BASE',
        `  • Total Users: ${summary?.users?.total ?? 'N/A'}`,
        `  • Active: ${summary?.users?.active ?? 'N/A'}`,
        `  • Suspended: ${summary?.users?.suspended ?? 'N/A'}`,
        '',
        '🩺 PROFESSIONALS',
        `  • Therapists: ${summary?.professionals?.therapists ?? 'N/A'}`,
        `  • Volunteers: ${summary?.professionals?.volunteers ?? 'N/A'}`,
        `  • Applications Approved: ${summary?.professionals?.applications?.approved ?? 'N/A'}`,
        `  • Applications Pending: ${summary?.professionals?.applications?.pending ?? 'N/A'}`,
        '',
        '📝 CONTENT',
        `  • Total Posts: ${summary?.content?.posts ?? 'N/A'}`,
        `  • Active Posts: ${summary?.content?.activePosts ?? 'N/A'}`,
        `  • Communities: ${summary?.content?.communities ?? 'N/A'}`,
        '',
        '───────────────────────────────────────────',
        '                    ALL-TIME COMPLAINTS',
        '───────────────────────────────────────────',
        '',
        `  • Total: ${summary?.complaints?.total ?? 'N/A'}`,
        `  • Open: ${summary?.complaints?.open ?? 'N/A'}`,
        `  • Investigating: ${summary?.complaints?.investigating ?? 'N/A'}`,
        `  • Resolved: ${summary?.complaints?.resolved ?? 'N/A'}`,
        `  • Dismissed: ${summary?.complaints?.dismissed ?? 'N/A'}`,
        '',
        '═══════════════════════════════════════════',
        '  This report contains aggregate data only.',
        '  Reporter identities are excluded for privacy.',
        '═══════════════════════════════════════════',
      ];

      const reportText = reportLines.join('\n');

      // Show preview modal
      setReportPreview(reportText);

    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', error.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const shareReport = async () => {
    if (!reportPreview) return;

    try {
      await Share.share({
        title: 'MindMatter Platform Safety Report',
        message: reportPreview,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Unable to share', error.message || 'Please try again.');
    }
  };

  const exportAsCsv = async () => {
    if (dateError) {
      Alert.alert('Check filters', dateError);
      return;
    }

    setExportingData(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (targetType !== 'all') params.append('targetType', targetType);
      if (status !== 'all') params.append('status', status);
      params.append('format', 'csv');

      const headers = ['ID', 'Type', 'Title', 'Reason', 'Status', 'Created', 'Action Taken'];
      const rows = filteredReports.map((r) => [
        r._id,
        r.targetType,
        `"${(r.targetTitle || '').replace(/"/g, '""')}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        r.status,
        r.createdAt ? new Date(r.createdAt).toISOString() : '',
        `"${(r.actionTaken || '').replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      await Share.share({
        title: 'MindMatter Safety Report Data (CSV)',
        message: csv,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Export Failed', error.message || 'Please try again.');
    } finally {
      setExportingData(false);
    }
  };

  const updateReport = (report, action, callback, label) => {
    Alert.alert(
      `${label} report?`,
      `This will mark the report about ${report.targetType?.toLowerCase()} as ${action}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          style: action === 'dismissed' ? 'destructive' : 'default',
          onPress: async () => {
            setProcessingId(report._id);
            try {
              await callback(report._id);
              await onRefresh?.();
            } catch (error) {
              console.error(`Error ${action} report:`, error);
              Alert.alert('Unable to update report', error.message || 'Please try again.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderFilterOptions = (options, selected, onSelect) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterOptions}
    >
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(option)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
              {formatLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <Text style={styles.title}>Platform Safety Reports</Text>
      <Text style={styles.subtitle}>
        Review reported content, filter by criteria, and generate comprehensive reports for stakeholders.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}> Filter Report Data</Text>
        
        <Text style={styles.fieldLabel}>Reported Content Type</Text>
        {renderFilterOptions(TARGET_TYPES, targetType, setTargetType)}
        
        <Text style={styles.fieldLabel}>Report Status</Text>
        {renderFilterOptions(REPORT_STATUSES, status, setStatus)}
        
        <Text style={styles.fieldLabel}>Reporting Period (Optional)</Text>
        <View style={styles.dateRow}>
          <TextInput
            placeholder="Start: YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            value={startDate}
            onChangeText={setStartDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={styles.dateInput}
          />
          <TextInput
            placeholder="End: YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            value={endDate}
            onChangeText={setEndDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={styles.dateInput}
          />
        </View>
        
        {dateError ? <Text style={styles.validationText}>{dateError}</Text> : null}
        
        {hasActiveFilters && (
          <Pressable onPress={clearFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Filtered Results</Text>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{filteredReports.length}</Text>
          </View>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>
              {filteredReports.filter((r) => r.status === 'open').length}
            </Text>
            <Text style={styles.summaryStatLabel}>Open</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>
              {filteredReports.filter((r) => r.status === 'investigating').length}
            </Text>
            <Text style={styles.summaryStatLabel}>Investigating</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>
              {filteredReports.filter((r) => r.status === 'resolved').length}
            </Text>
            <Text style={styles.summaryStatLabel}>Resolved</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>
              {filteredReports.filter((r) => r.status === 'dismissed').length}
            </Text>
            <Text style={styles.summaryStatLabel}>Dismissed</Text>
          </View>
        </View>

        <Text style={styles.summaryCaption}>
          {filteredReports.filter((r) => ['open', 'investigating'].includes(r.status)).length} reports need review
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generate Stakeholder Report</Text>
        <Text style={styles.sectionDescription}>
          Create a comprehensive safety report with platform metrics and complaint data based on your current filters.
        </Text>

        <View style={styles.reportActions}>
          <Pressable
            onPress={generateStakeholderReport}
            disabled={generatingReport || Boolean(dateError)}
            style={[styles.primaryButton, (generatingReport || dateError) && styles.buttonDisabled]}
          >
            {generatingReport ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Generate Report</Text>
            )}
          </Pressable>

          <Pressable
            onPress={exportAsCsv}
            disabled={exportingData || Boolean(dateError)}
            style={[styles.secondaryButton, (exportingData || dateError) && styles.buttonDisabled]}
          >
            {exportingData ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Export CSV</Text>
            )}
          </Pressable>
        </View>
      </View>

      {reportPreview && (
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>📄 Report Preview</Text>
            <Pressable onPress={() => setReportPreview(null)}>
              <Text style={styles.previewClose}>✕</Text>
            </Pressable>
          </View>
          
          <ScrollView style={styles.previewContent} nestedScrollEnabled>
            <Text style={styles.previewText}>{reportPreview}</Text>
          </ScrollView>

          <View style={styles.previewActions}>
            <Pressable onPress={shareReport} style={styles.shareButton}>
              <Text style={styles.shareButtonText}>📤 Share Report</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Reports List */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Reported Content</Text>
        <Text style={styles.resultCount}>{filteredReports.length} results</Text>
      </View>

      {filteredReports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>
            {dateError ? 'Check your date filters' : 'No matching reports'}
          </Text>
          <Text style={styles.emptyText}>
            {dateError
              ? 'Correct the reporting period to view results.'
              : hasActiveFilters
              ? 'No reports match these filters. Try adjusting your criteria.'
              : 'There are no safety reports in the queue yet.'}
          </Text>
        </View>
      ) : (
        filteredReports.slice(0, 50).map((report) => {
          const busy = processingId === report._id;
          return (
            <View key={report._id} style={styles.reportCard}>
              <View style={styles.reportHeading}>
                <Text style={styles.reportType}>{report.targetType || 'Reported content'}</Text>
                <Text style={[styles.status, styles[`status_${report.status}`]]}>
                  {formatLabel(report.status || 'unknown')}
                </Text>
              </View>
              <Text style={styles.reportTitle}>
                {report.targetTitle || `Report on ${report.targetType}`}
              </Text>
              <Text style={styles.reportMeta}>
                {report.reason || 'No reason provided'} · {formatDate(report.createdAt)}
              </Text>
              {report.details ? (
                <Text style={styles.reportDetails}>{report.details}</Text>
              ) : null}
              
              {report.status === 'open' && onInvestigateReport ? (
                <View style={styles.actions}>
                  <Pressable
                    disabled={busy}
                    onPress={() => updateReport(report, 'investigating', onInvestigateReport, 'Investigate')}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionText}>{busy ? 'Updating…' : 'Investigate'}</Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => updateReport(report, 'dismissed', onDismissReport, 'Dismiss')}
                    style={[styles.actionButton, styles.dismissButton]}
                  >
                    <Text style={[styles.actionText, styles.dismissText]}>Dismiss</Text>
                  </Pressable>
                </View>
              ) : null}
              
              {report.status === 'investigating' && onResolveReport ? (
                <View style={styles.actions}>
                  <Pressable
                    disabled={busy}
                    onPress={() => updateReport(report, 'resolved', onResolveReport, 'Resolve')}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionText}>{busy ? 'Updating…' : 'Resolve'}</Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => updateReport(report, 'dismissed', onDismissReport, 'Dismiss')}
                    style={[styles.actionButton, styles.dismissButton]}
                  >
                    <Text style={[styles.actionText, styles.dismissText]}>Dismiss</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {filteredReports.length > 50 && (
        <Text style={styles.moreResults}>
          Showing first 50 of {filteredReports.length} results
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  content: { padding: 16, paddingBottom: 32 },
  
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 18,
  },

  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
  },
  filterOptions: { gap: 8, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceDark,
  },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },

  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 8,
    color: COLORS.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: COLORS.surfaceDark,
  },
  validationText: { color: COLORS.danger, fontSize: 12, marginTop: 8 },

  // Clear filters
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  clearFiltersText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  // Summary card
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  summaryBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryStatItem: { alignItems: 'center', flex: 1 },
  summaryStatValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  summaryStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  summaryCaption: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
  },

  // Report actions
  reportActions: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    minHeight: 48,
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.55 },

  // Report preview
  previewSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  previewTitle: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  previewClose: { color: COLORS.primary, fontSize: 18, fontWeight: '700' },
  previewContent: {
    maxHeight: 300,
    padding: 14,
    backgroundColor: COLORS.surfaceDark,
  },
  previewText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    lineHeight: 16,
    color: COLORS.textPrimary,
  },
  previewActions: { padding: 12 },
  shareButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  shareButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // List header
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultCount: { color: COLORS.textSecondary, fontSize: 12 },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },

  reportCard: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  reportHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportType: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  status: {
    overflow: 'hidden',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  status_open: { color: COLORS.warning, backgroundColor: COLORS.warningBg },
  status_investigating: { color: COLORS.info, backgroundColor: COLORS.infoBg },
  status_resolved: { color: COLORS.success, backgroundColor: COLORS.successBg },
  status_dismissed: { color: COLORS.textSecondary, backgroundColor: COLORS.surfaceDark },
  reportTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 10 },
  reportMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5 },
  reportDetails: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 10 },

  // Actions
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  dismissButton: { backgroundColor: COLORS.dangerBg },
  dismissText: { color: COLORS.danger },

  moreResults: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ReportsManagementView;