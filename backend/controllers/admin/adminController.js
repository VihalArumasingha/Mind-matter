import User from '../../models/User.js';
import ProfessionalApplication from '../../models/ProfessionalApplication.js';
import Report from '../../models/Report.js';
import AuditLog from '../../models/AuditLog.js';
import { uploadFilesToCloudinary } from '../../middleware/uploadMiddleware.js';
import Post from '../../models/Post.js';
import Notification from '../../models/Notification.js';
import Broadcast from '../../models/Broadcast.js';
import SupportCircle from '../../models/SupportCircle.js';
import GroupMembership from '../../models/GroupMembership.js';
import Session from '../../models/Session.js';
import Attendance from '../../models/Attendance.js';
import Mood from '../../models/Mood.js';
import Booking from '../../models/Booking.js';
import ProfessionalPost from '../../models/ProfessionalPost.js';
import bcrypt from 'bcryptjs';

export const resolveApplicationType = (application = {}) => {
  const type = application.applicationType || (application.profession === 'Community Organizer' ? 'communityOrganizer' : 'professional');
  return type === 'communityOrganizer' ? 'communityOrganizer' : 'professional';
};

export const buildApplicationTypeQuery = (applicationType = 'professional') => {
  const normalizedType = applicationType === 'communityOrganizer' ? 'communityOrganizer' : 'professional';

  if (normalizedType === 'communityOrganizer') {
    return {
      $or: [
        { applicationType: 'communityOrganizer' },
        { applicationType: { $exists: false }, profession: 'Community Organizer' }
      ]
    };
  }

  return {
    $or: [
      { applicationType: 'professional' },
      { applicationType: { $exists: false }, profession: { $ne: 'Community Organizer' } }
    ]
  };
};

export const getApprovalRoleForApplication = (application = {}) => {
  return resolveApplicationType(application) === 'communityOrganizer' ? 'communityOrganizer' : 'therapist';
};

const aggregateActiveUsers = (Model, userField, since, eligibleRoles) => Model.aggregate([
  {
    $match: {
      createdAt: { $gte: since },
      [userField]: { $ne: null }
    }
  },
  { $group: { _id: `$${userField}` } },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'actor'
    }
  },
  { $unwind: '$actor' },
  {
    $match: {
      'actor.role': { $in: eligibleRoles },
      'actor.status': { $ne: 'suspended' }
    }
  },
  { $project: { _id: 0, userId: '$_id' } }
]);

const aggregateMonthlyActiveUsers = (Model, userField, since, eligibleRoles) => Model.aggregate([
  {
    $match: {
      createdAt: { $gte: since },
      [userField]: { $ne: null }
    }
  },
  {
    $group: {
      _id: {
        month: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } },
        userId: `$${userField}`
      }
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id.userId',
      foreignField: '_id',
      as: 'actor'
    }
  },
  { $unwind: '$actor' },
  {
    $match: {
      'actor.role': { $in: eligibleRoles },
      'actor.status': { $ne: 'suspended' }
    }
  },
  {
    $group: {
      _id: '$_id.month',
      users: { $addToSet: '$_id.userId' }
    }
  }
]);

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
     const totalPosts = await Post.countDocuments();
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
        totalPosts,
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
    const { status } = req.query;
    let query = buildApplicationTypeQuery('professional');
    if (status && status !== 'all') {
      query.status = status;
    }
    const applications = await ProfessionalApplication.find(query)
      .sort({ createdAt: -1 });

    console.log(' Applications with docs:', applications.map(app => ({
      name: app.fullName,
      docCount: app.documents?.length || 0,
      docs: app.documents?.map(d => ({ title: d.title, url: d.url }))
    })));

    return res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCommunityOrganizerApplications = async (req, res) => {
  try {
    const { status } = req.query;
    let query = buildApplicationTypeQuery('communityOrganizer');
    if (status && status !== 'all') {
      query.status = status;
    }

    const applications = await ProfessionalApplication.find(query)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const submitProfessionalApplication = async (req, res) => {
  try {
    console.log('Received application data:', req.body);
    console.log('Received files:', req.files);

    const {
      fullName,
      email,
      accountEmail,
      password,
      phone,
      profession,
      licenseNum,
      specialization,
      expYears,
      bio,
      userId,
      applicationType
    } = req.body;

    if (!fullName || !email || !licenseNum) {
      return res.status(400).json({
        success: false,
        error: 'Full Name, Email, and License Number are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const existingApp = await ProfessionalApplication.findOne({ licenseNum });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        error: 'This license number is already registered'
      });
    }

    let uploadedDocuments = [];
    if (req.files && req.files.length > 0) {
      try {
        uploadedDocuments = await uploadFilesToCloudinary(req.files, 'professionals');
        console.log('Files processed for application:', uploadedDocuments);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        const errMsg = uploadError?.message || uploadError?.error?.message || (typeof uploadError === 'string' ? uploadError : 'Document upload failed');
        return res.status(500).json({
          success: false,
          error: 'Failed to upload documents: ' + errMsg
        });
      }
    }
    const normalizedProfession = profession || 'Clinical Psychologist';
    const normalizedApplicationType = resolveApplicationType({
      applicationType,
      profession: normalizedProfession
    });

    const applicationData = {
      userId: userId || null,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(), // Save form email as-is in the application
      accountEmail: accountEmail?.trim().toLowerCase() || email.trim().toLowerCase(), // Store account email separately for linking
      password: password ? password.trim() : '',
      phone: phone || '',
      profession: normalizedProfession,
      applicationType: normalizedApplicationType,
      licenseNum: licenseNum.trim(),
      specialization: specialization || 'General Mental Health Support',
      expYears: parseInt(expYears, 10) || 1,
      bio: bio || '',
      status: 'pending',
      documents: uploadedDocuments, 
    };

    console.log('Saving to database:', applicationData);

    // Save to database
    const newApplication = new ProfessionalApplication(applicationData);
    const savedApplication = await newApplication.save();

    console.log('Application saved with ID:', savedApplication._id);

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: savedApplication
    });

  } catch (error) {
    console.error('Error in submitProfessionalApplication:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'License number already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
export const approveProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'Admin User';
    
    console.log('Approving professional application with ID:', id);
    
    const application = await ProfessionalApplication.findById(id);
    if (!application) {
      console.log('Application not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    console.log('Found application:', application.fullName, 'Email:', application.email, 'User ID:', application.userId);
    
    application.status = 'approved';
    application.reviewedBy = adminName;
    await application.save();
    
    console.log('Application status updated to approved');
    
    // Handle user account creation or update
    let user;
    const roleToSet = getApprovalRoleForApplication(application);

    if (application.userId) {
      console.log('Updating existing user with ID:', application.userId);
      user = await User.findByIdAndUpdate(application.userId, {
        role: roleToSet,
        phone: application.phone,
        profession: application.profession,
        licenseNum: application.licenseNum,
        specialization: application.specialization,
        expYears: application.expYears,
        bio: application.bio
      }, { returnDocument: 'after' });
      console.log('Updated user role to:', roleToSet, user?.name, 'New role:', user?.role);
    } else {
      console.log('Checking for existing user with account email:', application.accountEmail);
      // Check if user already exists with account email (use accountEmail for linking)
      const emailToCheck = application.accountEmail || application.email;
      const existingUser = await User.findOne({ email: emailToCheck });
      
      if (existingUser) {
        console.log('Found existing user with account email, updating role:', roleToSet, existingUser.name);
        user = await User.findByIdAndUpdate(existingUser._id, {
          role: roleToSet,
          phone: application.phone,
          profession: application.profession,
          licenseNum: application.licenseNum,
          specialization: application.specialization,
          expYears: application.expYears,
          bio: application.bio
        }, { returnDocument: 'after' });
        console.log('Updated existing user role:', user.name, 'New role:', user.role);
      } else {
        console.log('Creating new user with role using account email:', roleToSet);
        const hashedPassword = application.password 
          ? await bcrypt.hash(application.password, 10)
          : await bcrypt.hash('Therapist@123', 10);
        
        user = await User.create({
          name: application.fullName,
          email: application.accountEmail || application.email,
          password: hashedPassword,
          role: roleToSet,
          phone: application.phone,
          profession: application.profession,
          licenseNum: application.licenseNum,
          specialization: application.specialization,
          expYears: application.expYears,
          bio: application.bio
        });
        console.log('Created new user with role:', user.name, 'Role:', user.role);
      }
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
      message: 'Professional application approved successfully. User account created/updated.',
      application,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
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

export const approveCommunityOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'Admin User';
    const application = await ProfessionalApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Community organizer application not found'
      });
    }

    application.status = 'approved';
    application.reviewedBy = adminName;
    application.applicationType = resolveApplicationType(application);
    await application.save();

    const roleToSet = getApprovalRoleForApplication(application);
    let user = null;

    if (application.userId) {
      user = await User.findByIdAndUpdate(application.userId, {
        role: roleToSet,
        phone: application.phone,
        profession: application.profession,
        specialization: application.specialization,
        bio: application.bio 
      }, { returnDocument: 'after' });
    } else {
      const emailToCheck = application.accountEmail || application.email;
      const existingUser = await User.findOne({ email: emailToCheck });

      if (existingUser) {
        user = await User.findByIdAndUpdate(existingUser._id, {
          role: roleToSet,
          phone: application.phone,
          profession: application.profession,
          specialization: application.specialization,
          bio: application.bio
        }, { returnDocument: 'after' });
      } else {
        const hashedPassword = application.password
          ? await bcrypt.hash(application.password, 10)
          : await bcrypt.hash('CommunityOrganizer@123', 10);

        user = await User.create({
          name: application.fullName,
          email: application.accountEmail || application.email,
          password: hashedPassword,
          role: roleToSet,
          phone: application.phone,
          profession: application.profession,
          specialization: application.specialization,
          bio: application.bio
        });
      }
    }

    await AuditLog.create({
      adminName,
      action: 'APPROVE_COMMUNITY_ORGANIZER',
      targetType: 'Community Organizer',
      targetId: application._id,
      targetName: application.fullName,
      details: `Approved community organizer application for ${application.fullName}`
    });

    res.status(200).json({
      success: true,
      message: 'Community organizer application approved successfully.',
      application,
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        role: user?.role
      }
    });
  } catch (error) {
    console.error('Error approving community organizer application:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const rejectCommunityOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminName = req.user?.name || 'Admin User';

    const application = await ProfessionalApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Community organizer application not found'
      });
    }

    application.status = 'rejected';
    application.rejectionReason = reason || 'Application did not meet requirements';
    application.reviewedBy = adminName;
    await application.save();

    await AuditLog.create({
      adminName,
      action: 'REJECT_COMMUNITY_ORGANIZER',
      targetType: 'Community Organizer',
      targetId: application._id,
      targetName: application.fullName,
      details: `Rejected community organizer application. Reason: ${reason || 'Application did not meet requirements'}`
    });

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error rejecting community organizer application:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getPosts = async (req, res) => {
  try {
    const { status = 'all', search = '' } = req.query;
    
    let filter = {};
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'name email role profilePicture');
    
    const formattedPosts = posts.map(post => {
      const author = post.author || {};
      let authorName = 'Unknown User';
      if (author.name) {
        authorName = author.name;
      } else if (post.authorName) {
        authorName = post.authorName;
      } else if (post.authorId?.name) {
        authorName = post.authorId.name;
      }
      
      let authorRole = 'user';
      if (author.role) {
        authorRole = author.role;
      } else if (post.authorRole) {
        authorRole = post.authorRole;
      } else if (post.authorType) {
        authorRole = post.authorType;
      }

      const formattedComments = (post.comments || []).map(comment => ({
        _id: comment._id,
        content: comment.content,
        user: comment.user ? {
          _id: comment.user._id || comment.user,
          name: comment.user.name || 'Unknown User'
        } : {
          _id: comment.userId || 'unknown',
          name: comment.userName || 'Unknown User'
        },
        createdAt: comment.createdAt || comment.timestamp || post.createdAt
      }));
      
      return {
        _id: post._id,
        content: post.content || post.description || post.title || 'No content',
        authorName: authorName,
        authorRole: authorRole,
        authorId: post.author || post.authorId,
        communityName: post.communityName || 'General',
        communityId: post.communityId || null,
        category: post.category || 'General',
        status: post.status || 'active',
        restrictionReason: post.restrictionReason || null,
        reportsCount: post.reportsCount || 0,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        imageUrl: post.imageUrl || '',
        title: post.title,
        description: post.description,
        imageUrl: post.imageUrl,
        comments: formattedComments,
        likes: post.likes || [],
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0
      };
    });
    
    res.status(200).json({
      success: true,
      posts: formattedPosts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const keepPost = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'Admin User';
    
    const post = await Post.findById(id);
    if (!post) {
      console.log('Post not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: 'active', 
          restrictionReason: null 
        } 
      },
      { 
        new: true,
        runValidators: false  
      }
    );
    
    
    await AuditLog.create({
      adminName,
      action: 'KEEP_POST',
      targetType: 'Post',
      targetId: post._id,
      targetName: post.title || 'Post',
      details: 'Post was reviewed and kept active.'
    });
    
    res.status(200).json({
      success: true,
      message: 'Post kept active',
      post: {
        _id: updatedPost._id,
        status: updatedPost.status,
        restrictionReason: updatedPost.restrictionReason
      }
    });
  } catch (error) {
    console.error('Error keeping post:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const restrictPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminName = req.user?.name || 'Admin User';
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Restriction reason is required'
      });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      console.log('Post not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: 'restricted', 
          restrictionReason: reason.trim() 
        } 
      },
      { 
        new: true,
        runValidators: false  
      }
    );
    
    
    await AuditLog.create({
      adminName,
      action: 'RESTRICT_POST',
      targetType: 'Post',
      targetId: post._id,
      targetName: post.title || 'Post',
      details: `Post restricted with warning: ${reason}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Post restricted successfully',
      post: {
        _id: updatedPost._id,
        status: updatedPost.status,
        restrictionReason: updatedPost.restrictionReason
      }
    });
  } catch (error) {
    console.error('Error restricting post:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const removePost = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'Admin User';
    
    const post = await Post.findById(id);
    if (!post) {
      console.log('Post not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: { status: 'removed' } },
      { 
        new: true,
        runValidators: false  
      }
    );
    
    
    await AuditLog.create({
      adminName,
      action: 'REMOVE_POST',
      targetType: 'Post',
      targetId: post._id,
      targetName: post.title || 'Post',
      details: 'Post was removed by admin.'
    });
    
    res.status(200).json({
      success: true,
      message: 'Post removed successfully',
      post: {
        _id: updatedPost._id,
        status: updatedPost.status
      }
    });
  } catch (error) {
    console.error('Error removing post:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const deletePostPermanently = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'Admin User';
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    await Post.findByIdAndDelete(id);
    
    await AuditLog.create({
      adminName,
      action: 'DELETE_POST_PERMANENTLY',
      targetType: 'Post',
      targetId: id,
      targetName: post.title || 'Post',
      details: 'Post was permanently deleted from database.'
    });
    
    res.status(200).json({
      success: true,
      message: 'Post permanently deleted'
    });
  } catch (error) {
    console.error('Error deleting post permanently:', error);
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
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const platformRoles = ['user', 'volunteer', 'therapist', 'communityOrganizer'];
    const [
      userGrowth,
      approvedProfessionals,
      pendingProfessionals,
      rejectedProfessionals,
      openReports,
      investigatingReports,
      resolvedReports,
      dismissedReports,
      totalCommunities,
      activeCommunities,
      archivedCommunities,
      deletedCommunities,
      approvedMembers,
      pendingJoinRequests,
      upcomingSessions,
      activeCommunityPosts,
      openCommunityReports,
      totalCommunityReports,
      activeCircleCapacity,
      monthlyJoinRequests,
      eligibleUsers,
      newUsers30d,
      moodCheckins30d,
      communityPosts30d,
      professionalPosts30d,
      bookings30d,
      sessionRsvps30d,
      sessionCheckins30d,
      upcomingSessions30d,
      completedSessions30d,
      totalSessionRsvps,
      checkedInAttendance,
      finalizedAttendance,
      recentActivityUsers,
      monthlyActivityBySource
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      ProfessionalApplication.countDocuments({ status: 'approved' }),
      ProfessionalApplication.countDocuments({ status: 'pending' }),
      ProfessionalApplication.countDocuments({ status: 'rejected' }),
      Report.countDocuments({ status: 'open' }),
      Report.countDocuments({ status: 'investigating' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'dismissed' }),
      SupportCircle.countDocuments({ status: { $ne: 'deleted' } }),
      SupportCircle.countDocuments({ status: 'active' }),
      SupportCircle.countDocuments({ status: 'archived' }),
      SupportCircle.countDocuments({ status: 'deleted' }),
      GroupMembership.countDocuments({ status: 'approved' }),
      GroupMembership.countDocuments({ status: 'pending' }),
      Session.countDocuments({ status: 'upcoming', scheduledAt: { $gte: now } }),
      Post.countDocuments({ supportCircle: { $ne: null }, status: 'active' }),
      Report.countDocuments({ targetType: 'Community', status: { $in: ['open', 'investigating'] } }),
      Report.countDocuments({ targetType: 'Community' }),
      SupportCircle.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            memberCount: { $sum: '$currentMemberCount' },
            capacity: { $sum: '$maxCapacity' }
          }
        }
      ]),
      GroupMembership.aggregate([
        { $match: { role: 'member', createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      User.countDocuments({ role: { $in: platformRoles }, status: { $ne: 'suspended' } }),
      User.countDocuments({
        role: { $in: platformRoles },
        status: { $ne: 'suspended' },
        createdAt: { $gte: thirtyDaysAgo }
      }),
      Mood.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Post.countDocuments({
        status: 'active',
        isBroadcast: { $ne: true },
        createdAt: { $gte: thirtyDaysAgo }
      }),
      ProfessionalPost.countDocuments({ status: 'published', createdAt: { $gte: thirtyDaysAgo } }),
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Attendance.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
        status: { $in: ['registered', 'checked-in', 'absent', 'excused'] }
      }),
      Attendance.countDocuments({ checkedInAt: { $gte: thirtyDaysAgo } }),
      Session.countDocuments({ status: 'upcoming', scheduledAt: { $gte: now } }),
      Session.countDocuments({ status: 'completed' }),
      Attendance.countDocuments({}),
      Attendance.countDocuments({ status: 'checked-in' }),
      Attendance.countDocuments({ status: { $in: ['checked-in', 'absent', 'excused'] } }),
      Promise.all([
        aggregateActiveUsers(Post, 'author', thirtyDaysAgo, platformRoles),
        aggregateActiveUsers(ProfessionalPost, 'authorId', thirtyDaysAgo, platformRoles),
        aggregateActiveUsers(Mood, 'user', thirtyDaysAgo, platformRoles),
        aggregateActiveUsers(Booking, 'user', thirtyDaysAgo, platformRoles),
        aggregateActiveUsers(Attendance, 'userId', thirtyDaysAgo, platformRoles)
      ]),
      Promise.all([
        aggregateMonthlyActiveUsers(Post, 'author', sixMonthsAgo, platformRoles),
        aggregateMonthlyActiveUsers(ProfessionalPost, 'authorId', sixMonthsAgo, platformRoles),
        aggregateMonthlyActiveUsers(Mood, 'user', sixMonthsAgo, platformRoles),
        aggregateMonthlyActiveUsers(Booking, 'user', sixMonthsAgo, platformRoles),
        aggregateMonthlyActiveUsers(Attendance, 'userId', sixMonthsAgo, platformRoles)
      ])
    ]);

    const joinRequestCounts = new Map(monthlyJoinRequests.map(({ _id, count }) => [_id, count]));
    const monthlyJoinRequestTrend = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
      const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`;

      return {
        month: key,
        count: joinRequestCounts.get(key) || 0
      };
    });

    const activeCapacity = activeCircleCapacity[0] || { memberCount: 0, capacity: 0 };
    const activeUserIds = new Set(recentActivityUsers.flat().map(({ userId }) => userId.toString()));
    const monthlyActiveUsers = new Map();
    monthlyActivityBySource.flat().forEach(({ _id, users }) => {
      const monthlyUsers = monthlyActiveUsers.get(_id) || new Set();
      users.forEach((userId) => monthlyUsers.add(userId.toString()));
      monthlyActiveUsers.set(_id, monthlyUsers);
    });
    const monthlyEngagementTrend = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
      const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`;

      return {
        month: key,
        engagedUsers: monthlyActiveUsers.get(key)?.size || 0
      };
    });
    const sessionAttendanceRate = finalizedAttendance
      ? Math.round((checkedInAttendance / finalizedAttendance) * 100)
      : 0;
    const platformHealth = {
      eligibleUsers,
      engagedUsers30d: activeUserIds.size,
      engagementRate30d: eligibleUsers
        ? Math.round((activeUserIds.size / eligibleUsers) * 100)
        : 0,
      newUsers30d,
      moodCheckins30d,
      postsPublished30d: communityPosts30d + professionalPosts30d,
      bookings30d,
      sessionRsvps30d,
      sessionCheckins30d,
      upcomingSessions: upcomingSessions30d,
      completedSessions: completedSessions30d,
      totalSessionRsvps,
      checkedInAttendance,
      sessionAttendanceRate,
      monthlyEngagementTrend
    };
    const communityHealth = {
      totalCommunities,
      activeCommunities,
      archivedCommunities,
      deletedCommunities,
      approvedMembers,
      pendingJoinRequests,
      upcomingSessions,
      activeCommunityPosts,
      openReports: openCommunityReports,
      totalReports: totalCommunityReports,
      capacityUtilization: activeCapacity.capacity
        ? Math.min(100, Math.round((activeCapacity.memberCount / activeCapacity.capacity) * 100))
        : 0,
      monthlyJoinRequestTrend
    };
    
    res.status(200).json({
      success: true,
      analytics: {
        userGrowth,
        professionalStats: {
          approved: approvedProfessionals,
          pending: pendingProfessionals,
          rejected: rejectedProfessionals
        },
        reportStats: {
          open: openReports,
          investigating: investigatingReports,
          resolved: resolvedReports,
          dismissed: dismissedReports
        },
        platformHealth,
        communityHealth
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

const BROADCAST_ROLES = ['user', 'volunteer', 'therapist', 'communityOrganizer'];

export const createBroadcast = async (req, res) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const { targetAudience } = req.body;

    if (!title || title.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and must be 120 characters or fewer'
      });
    }

    if (!message || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be 2000 characters or fewer'
      });
    }

    if (targetAudience !== 'all' && !BROADCAST_ROLES.includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: 'A valid target audience is required'
      });
    }

    const recipientFilter = {
      role: targetAudience === 'all' ? { $in: BROADCAST_ROLES } : targetAudience,
      status: { $ne: 'suspended' }
    };
    const recipients = await User.find(recipientFilter).select('_id').lean();

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'There are no eligible recipients for this audience'
      });
    }

    const broadcast = new Broadcast({
      title,
      message,
      targetAudience,
      recipientCount: recipients.length,
      sentBy: req.user._id,
      senderName: req.user.name
    });

    try {
      await Notification.insertMany(
        recipients.map(({ _id }) => ({
          userId: _id,
          type: 'system',
          title,
          message,
          broadcastId: broadcast._id
        }))
      );
      await broadcast.save();
    } catch (error) {
      try {
        await Promise.all([
          Notification.deleteMany({ broadcastId: broadcast._id }),
          Broadcast.deleteOne({ _id: broadcast._id })
        ]);
      } catch (cleanupError) {
        console.error('Failed to roll back incomplete broadcast:', cleanupError);
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      broadcast
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to send broadcast'
    });
  }
};

export const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      broadcasts
    });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch broadcasts'
    });
  }
};