import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../context/AuthContext';
import { getAnalyticsApi } from '../services/adminService';

const COLORS = {
  green: '#2E7D32',
  greenDark: '#1B5E20',
  greenMid: '#43A047',
  greenLight: '#81C784',
  paleGreen: '#E8F5E9',
  softerGreen: '#F1F8F2',
  cardTint: '#F7FCF8',
  blue: '#1976D2',
  paleBlue: '#E3F2FD',
  amber: '#F57C00',
  paleAmber: '#FFF8E1',
  red: '#C62828',
  paleRed: '#FFEBEE',
  ink: '#0F1A12',
  muted: '#5F6B63',
  border: '#DCEADD',
  cardBg: '#FFFFFF',
  screenBg: '#F1F8F2',
};

const formatMonth = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1))
    .toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' });
};

const HeroHeader = ({ subtitle }) => (
  <View style={styles.hero}>
    <View style={styles.heroTopRow}>
      <View style={styles.heroIconWrap}>
        <Ionicons name="pulse" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Live</Text>
      </View>
    </View>
    <Text style={styles.heroTitle}>Platform Health</Text>
    <Text style={styles.heroSubtitle}>{subtitle}</Text>
    <View style={styles.heroDecorCircle} />
    <View style={styles.heroDecorCircleSmall} />
  </View>
);

const MetricBox = ({ label, value, color, tint, iconName }) => (
  <View style={styles.metricBox}>
    <View style={[styles.metricBoxIcon, { backgroundColor: tint }]}>
      <Ionicons name={iconName} size={13} color={color} />
    </View>
    <Text style={[styles.metricBoxValue, { color }]}>{value}</Text>
    <Text style={styles.metricBoxLabel} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const Bar = ({ label, value, maxValue, color, isSelected, onPress }) => (
  <Pressable style={styles.barColumn} onPress={onPress}>
    {isSelected && (
      <View style={styles.barTooltipBubble}>
        <Text style={styles.barTooltipText}>{value}</Text>
      </View>
    )}
    <Text style={[styles.barValue, isSelected && styles.selectedBarValue]}>
      {value}
    </Text>
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          {
            height: `${maxValue > 0 ? Math.max(8, (value / maxValue) * 100) : 8}%`,
            backgroundColor: isSelected ? COLORS.greenDark : color,
          },
        ]}
      />
    </View>
    <Text style={[styles.barLabel, isSelected && styles.selectedBarLabel]}>
      {formatMonth(label)}
    </Text>
  </Pressable>
);

const StatPill = ({ value, label, iconName, color, tint }) => (
  <View style={styles.statPill}>
    <View style={[styles.statPillIcon, { backgroundColor: tint }]}>
      <Ionicons name={iconName} size={14} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  </View>
);

export default function PlatformHealthAnalyticsView({ navigation }) {
  const { token } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const analytics = await getAnalyticsApi(token);
      setAnalyticsData(analytics);
      if (analytics?.platformHealth?.monthlyEngagementTrend?.length > 0) {
        setSelectedMonthIndex(
          analytics.platformHealth.monthlyEngagementTrend.length - 1
        );
      }
    } catch (fetchError) {
      console.error('Error fetching community health analytics:', fetchError);
      setError(fetchError.message || 'Unable to load community health metrics.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [fetchAnalytics])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.screenBg} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.mutedText}>Synchronizing analytics metrics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error ||
    !analyticsData?.platformHealth ||
    !analyticsData?.communityHealth
  ) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.screenBg} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.red} />
          <Text style={styles.errorTitle}>Metrics unavailable</Text>
          <Text style={styles.mutedText}>
            {error || 'No community health data was returned.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={fetchAnalytics}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { platformHealth, communityHealth, reportStats } = analyticsData;
  const trend = platformHealth.monthlyEngagementTrend || [];
  const maxEngagedUsers = Math.max(1, ...trend.map((item) => item.engagedUsers));
  const statusTotal =
    communityHealth.totalCommunities + communityHealth.deletedCommunities;
  const activeShare = statusTotal
    ? (communityHealth.activeCommunities / statusTotal) * 100
    : 0;
  const archivedShare = statusTotal
    ? (communityHealth.archivedCommunities / statusTotal) * 100
    : 0;
  const deletedShare = statusTotal
    ? (communityHealth.deletedCommunities / statusTotal) * 100
    : 0;

  const pendingReports = reportStats.open + reportStats.investigating;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.screenBg} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <HeroHeader subtitle="A real-time pulse of member activity, wellbeing check-ins, and support engagement across the platform." />

        {/* SMALL METRIC BOXES */}
        <Text style={styles.sectionLabel}>Overview · Last 30 days</Text>
        <View style={styles.metricsGrid}>
          <MetricBox
            label="Engaged Accounts"
            value={platformHealth.engagedUsers30d.toLocaleString()}
            color={COLORS.green}
            tint={COLORS.paleGreen}
            iconName="people-outline"
          />
          <MetricBox
            label="New Registrations"
            value={platformHealth.newUsers30d.toLocaleString()}
            color={COLORS.blue}
            tint={COLORS.paleBlue}
            iconName="person-add-outline"
          />
          <MetricBox
            label="Mood Check-ins"
            value={platformHealth.moodCheckins30d.toLocaleString()}
            color={COLORS.blue}
            tint={COLORS.paleBlue}
            iconName="heart-outline"
          />
          <MetricBox
            label="Content Published"
            value={platformHealth.postsPublished30d.toLocaleString()}
            color={COLORS.green}
            tint={COLORS.paleGreen}
            iconName="document-text-outline"
          />
          <MetricBox
            label="Support Bookings"
            value={platformHealth.bookings30d.toLocaleString()}
            color={COLORS.amber}
            tint={COLORS.paleAmber}
            iconName="calendar-outline"
          />
          <MetricBox
            label="Pending Reports"
            value={pendingReports.toLocaleString()}
            color={pendingReports > 0 ? COLORS.red : COLORS.green}
            tint={pendingReports > 0 ? COLORS.paleRed : COLORS.paleGreen}
            iconName="shield-alert-outline"
          />
        </View>

        {/* ENGAGEMENT CHART */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithAction}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Member Engagement Trend</Text>
              <Text style={styles.cardSubtitle}>
                Tap a bar to inspect the monthly record
              </Text>
            </View>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="bar-chart-outline" size={18} color={COLORS.green} />
            </View>
          </View>

          {trend.length > 0 ? (
            <View style={styles.chart}>
              {trend.map((item, index) => (
                <Bar
                  key={item.month}
                  label={item.month}
                  value={item.engagedUsers}
                  maxValue={maxEngagedUsers}
                  color={COLORS.greenMid}
                  isSelected={selectedMonthIndex === index}
                  onPress={() => setSelectedMonthIndex(index)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.mutedText}>
              No member activity recorded for this period.
            </Text>
          )}
          <Text style={styles.chartNote}>
            * Engagement aggregates unique accounts with recorded posts,
            check-ins, or appointments.
          </Text>
        </View>

        {/* SESSION STATS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Engagement</Text>
          <Text style={styles.cardSubtitle}>
            Community support attendance metrics
          </Text>

          <View style={styles.statPillGrid}>
            <StatPill
              iconName="calendar-number-outline"
              value={platformHealth.upcomingSessions.toLocaleString()}
              label="Upcoming Sessions"
              color={COLORS.green}
              tint={COLORS.paleGreen}
            />
            <StatPill
              iconName="checkmark-done-outline"
              value={platformHealth.completedSessions.toLocaleString()}
              label="Completed"
              color={COLORS.blue}
              tint={COLORS.paleBlue}
            />
            <StatPill
              iconName="ticket-outline"
              value={platformHealth.sessionRsvps30d.toLocaleString()}
              label="RSVPs (30d)"
              color={COLORS.amber}
              tint={COLORS.paleAmber}
            />
            <StatPill
              iconName="log-in-outline"
              value={platformHealth.sessionCheckins30d.toLocaleString()}
              label="Check-ins (30d)"
              color={COLORS.green}
              tint={COLORS.paleGreen}
            />
          </View>

          <View style={styles.utilizationRow}>
            <View style={styles.utilizationCopy}>
              <Text style={styles.utilizationTitle}>
                Recorded Attendance Rate
              </Text>
              <Text style={styles.cardSubtitle}>
                Verified attendance vs. expected
              </Text>
            </View>
            <Text style={styles.utilizationValue}>
              {platformHealth.sessionAttendanceRate}%
            </Text>
          </View>
          <View style={styles.capacityTrack}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${Math.min(
                    100,
                    platformHealth.sessionAttendanceRate
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* COMMUNITY DISTRIBUTION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Community Distribution</Text>
          <Text style={styles.cardSubtitle}>
            Support-circle status breakdown
          </Text>

          <View style={styles.communityStatsContainer}>
            <View style={styles.communityStatItem}>
              <Text style={styles.communityStatVal}>
                {communityHealth.activeCommunities}
              </Text>
              <Text style={styles.communityStatLabel}>Active</Text>
            </View>
            <View style={styles.communityStatItem}>
              <Text style={styles.communityStatVal}>
                {communityHealth.approvedMembers}
              </Text>
              <Text style={styles.communityStatLabel}>Members</Text>
            </View>
            <View style={styles.communityStatItem}>
              <Text style={styles.communityStatVal}>
                {communityHealth.pendingJoinRequests}
              </Text>
              <Text style={styles.communityStatLabel}>Pending</Text>
            </View>
            <View style={styles.communityStatItem}>
              <Text style={styles.communityStatVal}>
                {communityHealth.openReports}
              </Text>
              <Text style={styles.communityStatLabel}>Reports</Text>
            </View>
          </View>

          <View style={styles.statusTrack}>
            <View
              style={[
                styles.statusSegment,
                { flex: activeShare || 1, backgroundColor: COLORS.greenMid },
              ]}
            />
            <View
              style={[
                styles.statusSegment,
                { flex: archivedShare || 0.1, backgroundColor: COLORS.amber },
              ]}
            />
            <View
              style={[
                styles.statusSegment,
                { flex: deletedShare || 0.1, backgroundColor: COLORS.red },
              ]}
            />
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItemRow}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.greenMid }]}
              />
              <Text style={styles.legendItemText}>
                Active ({communityHealth.activeCommunities})
              </Text>
            </View>
            <View style={styles.legendItemRow}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.amber }]}
              />
              <Text style={styles.legendItemText}>
                Archived ({communityHealth.archivedCommunities})
              </Text>
            </View>
            <View style={styles.legendItemRow}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.red }]}
              />
              <Text style={styles.legendItemText}>
                Deleted ({communityHealth.deletedCommunities})
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={styles.communitiesLink}
          onPress={() => navigation.navigate('communities')}
        >
          <View style={styles.ctaIconBox}>
            <Ionicons name="people-circle-outline" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.communitiesLinkText}>
            Review Communities & Groups
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },

  /* HERO */
  hero: {
    backgroundColor: COLORS.green,
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
    marginBottom: 4,
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C8E6C9',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroTitle: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: '92%',
  },
  heroDecorCircle: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroDecorCircleSmall: {
    position: 'absolute',
    right: 30,
    bottom: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  sectionLabel: {
    marginTop: 4,
    marginLeft: 4,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  /* ═════════ SMALL METRIC BOXES ═════════ */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    flexGrow: 1,
    flexBasis: '31%',
    minHeight: 90,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricBoxIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricBoxValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricBoxLabel: {
    marginTop: 2,
    color: COLORS.ink,
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 13,
  },

  /* CARDS */
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11.5,
    lineHeight: 16,
  },

  /* CHART */
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 10,
    marginTop: 18,
    paddingTop: 20,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barTooltipBubble: {
    position: 'absolute',
    top: -2,
    backgroundColor: COLORS.greenDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  barTooltipText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  barValue: {
    minHeight: 14,
    color: COLORS.muted,
    fontSize: 9.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedBarValue: {
    color: COLORS.greenDark,
    fontWeight: '800',
  },
  barTrack: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: COLORS.softerGreen,
  },
  barFill: {
    width: '100%',
    minHeight: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  barLabel: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 10,
  },
  selectedBarLabel: {
    color: COLORS.greenDark,
    fontWeight: '800',
  },
  chartNote: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 10.5,
    fontStyle: 'italic',
  },

  /* STAT PILLS */
  statPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  statPill: {
    flexGrow: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.softerGreen,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statPillIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPillValue: {
    color: COLORS.greenDark,
    fontSize: 16,
    fontWeight: '800',
  },
  statPillLabel: {
    marginTop: 1,
    color: COLORS.muted,
    fontSize: 10.5,
  },

  /* UTILIZATION */
  utilizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  utilizationCopy: {
    flex: 1,
  },
  utilizationTitle: {
    color: COLORS.ink,
    fontSize: 12.5,
    fontWeight: '700',
  },
  utilizationValue: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: '800',
  },
  capacityTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: COLORS.softerGreen,
    marginTop: 8,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.greenMid,
  },

  /* COMMUNITY */
  communityStatsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  communityStatItem: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.softerGreen,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  communityStatVal: {
    color: COLORS.greenDark,
    fontSize: 15,
    fontWeight: '800',
  },
  communityStatLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  /* STATUS TRACK */
  statusTrack: {
    flexDirection: 'row',
    height: 10,
    gap: 3,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: COLORS.softerGreen,
    marginTop: 18,
  },
  statusSegment: {
    minWidth: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 14,
  },
  legendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendItemText: {
    color: COLORS.muted,
    fontSize: 11.5,
    fontWeight: '500',
  },

  /* CTA */
  communitiesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.greenDark,
    padding: 16,
    borderRadius: 14,
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  communitiesLinkText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },

  /* STATES */
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.screenBg,
  },
  mutedText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 10,
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.green,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});