import User from '../../models/User.js';
import ProfessionalApplication from '../../models/ProfessionalApplication.js';
import Report from '../../models/Report.js';
import AuditLog from '../../models/AuditLog.js';

export const getDashboardOverview = async (req, res) => {
  try {
    // Get stats from database
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      $or: [
        { status: 'active' },
        { status: { $exists: false } }
      ]
    });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    
    const pendingApplications = await ProfessionalApplication.countDocuments({ status: 'pending' });
    const totalProfessionals = await ProfessionalApplication.countDocuments({ status: 'approved' });
    
    const totalReports = await Report.countDocuments({ 
      status: { $in: ['open', 'investigating'] } 
    });

    const recentActivities = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        pendingApplications,
        totalProfessionals,
        totalReports
      },
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { search = '', status = 'all', role = 'all' } = req.query;
    
    let filter = {};
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (role !== 'all') {
      filter.role = role;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const warnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminName = req.user?.name || 'Admin User';
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.warningsCount = (user.warningsCount || 0) + 1;
    user.status = 'warned';
    user.violations = user.violations || [];
    user.violations.push({
      reason,
      adminName,
      date: new Date()
    });
    
    await user.save();
    await AuditLog.create({
      adminName,
      action: 'WARN_USER',
      targetType: 'User',
      targetId: user._id,
      targetName: user.name,
      details: `Issued warning to user. Reason: ${reason}`
    });
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        warningsCount: user.warningsCount,
        violations: user.violations
      }
    });
  } catch (error) {
    console.error('Error warning user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, days } = req.body;
    const adminName = req.user?.name || 'Admin User';
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.status = 'suspended';
    user.suspensionReason = reason || 'Violation of community guidelines';
    user.suspendedUntil = days 
      ? new Date(Date.now() + days * 86400000) 
      : null;
    user.violations = user.violations || [];
    user.violations.push({
      reason: `SUSPENSION: ${reason || 'Violation of community guidelines'}`,
      adminName,
      date: new Date()
    });
    
    await user.save();
    
    await AuditLog.create({
      adminName,
      action: 'SUSPEND_USER',
      targetType: 'User',
      targetId: user._id,
      targetName: user.name,
      details: `Suspended user account (${days ? days + ' days' : 'indefinite'}). Reason: ${reason || 'Violation of community guidelines'}`
    });
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        suspensionReason: user.suspensionReason,
        suspendedUntil: user.suspendedUntil
      }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'Admin User';
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.status = 'active';
    user.suspensionReason = '';
    user.suspendedUntil = null;
    
    await user.save();
    
    await AuditLog.create({
      adminName,
      action: 'UNSUSPEND_USER',
      targetType: 'User',
      targetId: user._id,
      targetName: user.name,
      details: 'Restored user account status to active.'
    });
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProfessionalApplications = async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    let filter = {};
    if (status !== 'all') {
      filter.status = status;
    }
    
    const applications = await ProfessionalApplication.find(filter)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching professional applications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const submitProfessionalApplication = async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      phone,
      profession,
      licenseNum,
      specialization,
      bio,
      expYears,
      documents
    } = req.body;
    
    const existing = await ProfessionalApplication.findOne({ licenseNum });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'License number already exists'
      });
    }
    
    const application = await ProfessionalApplication.create({
      userId,
      fullName,
      email,
      phone,
      profession,
      licenseNum,
      specialization,
      bio,
      expYears,
      documents,
      status: 'pending'
    });
    
    await AuditLog.create({
      adminName: req.user?.name || 'System',
      action: 'SUBMIT_APPLICATION',
      targetType: 'Professional',
      targetId: application._id,
      targetName: fullName,
      details: `Submitted professional application for ${profession}`
    });
    
    res.status(201).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const approveProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'Admin User';
    
    const application = await ProfessionalApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    application.status = 'approved';
    application.reviewedBy = adminName;
    await application.save();
    
    // Update user role if userId exists
    if (application.userId) {
      await User.findByIdAndUpdate(application.userId, {
        role: 'therapist'
      });
    }
    
    await AuditLog.create({
      adminName,
      action: 'APPROVE_PROFESSIONAL',
      targetType: 'Professional',
      targetId: application._id,
      targetName: application.fullName,
      details: `Approved verification application for license ${application.licenseNum} (${application.profession})`
    });
    
    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error approving professional:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const rejectProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminName = req.user?.name || 'Admin User';
    
    const application = await ProfessionalApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    application.status = 'rejected';
    application.rejectionReason = reason || 'Application did not meet requirements';
    application.reviewedBy = adminName;
    await application.save();
    
    await AuditLog.create({
      adminName,
      action: 'REJECT_PROFESSIONAL',
      targetType: 'Professional',
      targetId: application._id,
      targetName: application.fullName,
      details: `Rejected professional application. Reason: ${reason || 'Application did not meet requirements'}`
    });
    
    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error rejecting professional:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getReports = async (req, res) => {
  try {
    const { targetType = 'all', status = 'all' } = req.query;
    
    let filter = {};
    if (targetType !== 'all') {
      filter.targetType = targetType;
    }
    if (status !== 'all') {
      filter.status = status;
    }
    
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const investigateReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    report.status = 'investigating';
    await report.save();
    
    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error investigating report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken } = req.body;
    const adminName = req.user?.name || 'Admin User';
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    report.status = 'resolved';
    report.actionTaken = actionTaken || 'Issue resolved';
    report.resolvedBy = adminName;
    await report.save();
    
    await AuditLog.create({
      adminName,
      action: 'RESOLVE_REPORT',
      targetType: 'Report',
      targetId: report._id,
      targetName: `Report on ${report.targetType}`,
      details: `Resolved report: ${actionTaken || 'Issue resolved'}`
    });
    
    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const dismissReport = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'Admin User';
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    report.status = 'dismissed';
    report.resolvedBy = adminName;
    await report.save();
    
    await AuditLog.create({
      adminName,
      action: 'DISMISS_REPORT',
      targetType: 'Report',
      targetId: report._id,
      targetName: `Report on ${report.targetType}`,
      details: 'Dismissed report as invalid.'
    });
    
    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { search = '', action = 'all' } = req.query;
    
    let filter = {};
    if (action !== 'all') {
      filter.action = action;
    }
    
    if (search) {
      filter.$or = [
        { adminName: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { targetName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const professionalStats = {
      approved: await ProfessionalApplication.countDocuments({ status: 'approved' }),
      pending: await ProfessionalApplication.countDocuments({ status: 'pending' }),
      rejected: await ProfessionalApplication.countDocuments({ status: 'rejected' })
    };
    
    const reportStats = {
      open: await Report.countDocuments({ status: 'open' }),
      investigating: await Report.countDocuments({ status: 'investigating' }),
      resolved: await Report.countDocuments({ status: 'resolved' }),
      dismissed: await Report.countDocuments({ status: 'dismissed' })
    };
    
    res.status(200).json({
      success: true,
      analytics: {
        userGrowth,
        professionalStats,
        reportStats
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};