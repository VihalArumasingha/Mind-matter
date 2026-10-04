// controllers/reportController.js
import Report from '../models/Report.js';
import User from '../models/User.js';
import ProfessionalApplication from '../models/ProfessionalApplication.js';
import Post from '../models/Post.js';
import ProfessionalPost from '../models/ProfessionalPost.js';
import SupportCircle from '../models/SupportCircle.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Create a new report (called by users from the mobile app)
 * POST /api/reports
 */
export const createReport = async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      targetTitle,
      reason,
      details,
      reporterId,
      reporterName,
    } = req.body;

    if (!targetType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'targetType and reason are required',
      });
    }

    const report = await Report.create({
      targetType,
      targetId: targetId || null,
      targetTitle: targetTitle || '',
      reason,
      details: details || '',
      reporterId: reporterId || req.user?._id || null,
      reporterName: reporterName || req.user?.name || 'Anonymous',
      status: 'open',
    });

    await AuditLog.create({
      adminName: 'System',
      action: 'CREATE_REPORT',
      targetType: 'Report',
      targetId: report._id,
      targetName: `Report on ${targetType}`,
      details: `New report submitted: ${reason}`,
    }).catch(() => {}); // audit log failure shouldn't block report creation

    res.status(201).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get report summary for stakeholders
 * GET /api/admin/reports/summary
 */
export const getReportSummary = async (req, res) => {
  try {
    const { startDate, endDate, targetType, status } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    let reportFilter = { ...dateFilter };
    if (targetType && targetType !== 'all') reportFilter.targetType = targetType;
    if (status && status !== 'all') reportFilter.status = status;

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      usersByRole,
      therapistCount,
      volunteerCount,
      communityOrganizerCount,
      professionalApps,
      totalPosts,
      activePosts,
      totalProfessionalPosts,
      publishedProfessionalPosts,
      totalCommunities,
      activeCommunities,
      reportStats,
      filteredReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'therapist' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'communityOrganizer' }),
      ProfessionalApplication.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Post.countDocuments(),
      Post.countDocuments({ status: 'active' }),
      ProfessionalPost.countDocuments(),
      ProfessionalPost.countDocuments({ status: 'published' }),
      SupportCircle.countDocuments({ status: { $ne: 'deleted' } }),
      SupportCircle.countDocuments({ status: 'active' }),
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.find(reportFilter).sort({ createdAt: -1 }).limit(1000).lean(),
    ]);

    const roleMap = {};
    usersByRole.forEach(({ _id, count }) => {
      if (_id) roleMap[_id] = count;
    });

    const appStatusMap = { approved: 0, pending: 0, rejected: 0 };
    professionalApps.forEach(({ _id, count }) => {
      if (_id) appStatusMap[_id] = count;
    });

    const reportStatusMap = {
      open: 0,
      investigating: 0,
      resolved: 0,
      dismissed: 0,
    };
    reportStats.forEach(({ _id, count }) => {
      if (_id) reportStatusMap[_id] = count;
    });

    const filteredByStatus = {
      open: 0,
      investigating: 0,
      resolved: 0,
      dismissed: 0,
    };
    const filteredByType = { User: 0, Post: 0, Professional: 0, Community: 0 };

    filteredReports.forEach((report) => {
      if (filteredByStatus[report.status] !== undefined) {
        filteredByStatus[report.status]++;
      }
      if (filteredByType[report.targetType] !== undefined) {
        filteredByType[report.targetType]++;
      }
    });

    const summary = {
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        targetType: targetType || 'all',
        status: status || 'all',
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        byRole: {
          user: roleMap.user || 0,
          volunteer: roleMap.volunteer || 0,
          therapist: roleMap.therapist || 0,
          communityOrganizer: roleMap.communityOrganizer || 0,
          admin: roleMap.admin || 0,
        },
      },
      professionals: {
        therapists: therapistCount,
        volunteers: volunteerCount,
        communityOrganizers: communityOrganizerCount,
        applications: appStatusMap,
      },
      content: {
        posts: totalPosts,
        activePosts,
        professionalPosts: totalProfessionalPosts,
        publishedProfessionalPosts,
        communities: totalCommunities,
        activeCommunities,
      },
      complaints: {
        total: Object.values(reportStatusMap).reduce((a, b) => a + b, 0),
        ...reportStatusMap,
        filtered: {
          total: filteredReports.length,
          byStatus: filteredByStatus,
          byType: filteredByType,
        },
      },
    };

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('Error generating report summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export report data (JSON or CSV)
 * GET /api/admin/reports/export
 */
export const exportReportData = async (req, res) => {
  try {
    const { startDate, endDate, targetType, status, format = 'json' } = req.query;

    let filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }
    if (targetType && targetType !== 'all') filter.targetType = targetType;
    if (status && status !== 'all') filter.status = status;

    const reports = await Report.find(filter).sort({ createdAt: -1 }).lean();

    if (format === 'csv') {
      const headers = [
        'ID',
        'Target Type',
        'Target Title',
        'Reason',
        'Status',
        'Created At',
        'Resolved At',
        'Action Taken',
      ];
      const rows = reports.map((r) => [
        r._id,
        r.targetType,
        `"${(r.targetTitle || '').replace(/"/g, '""')}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        r.status,
        r.createdAt ? new Date(r.createdAt).toISOString() : '',
        r.resolvedAt ? new Date(r.resolvedAt).toISOString() : '',
        `"${(r.actionTaken || '').replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=safety-report-${Date.now()}.csv`
      );
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      reports,
      count: reports.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error exporting report data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Alias so both `exportReport` and `exportReportData` imports work
export const exportReport = exportReportData;