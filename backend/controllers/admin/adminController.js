import User from '../../models/User.js';
import ProfessionalApplication from '../../models/ProfessionalApplication.js';
import Report from '../../models/Report.js';
import AuditLog from '../../models/AuditLog.js';
import { uploadFilesToCloudinary } from '../../middleware/uploadMiddleware.js';
import Post from '../../models/Post.js';
import bcrypt from 'bcryptjs';

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
    let query = {};
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
      userId
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
    const applicationData = {
      userId: userId || null,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(), // Save form email as-is in the application
      accountEmail: accountEmail?.trim().toLowerCase() || email.trim().toLowerCase(), // Store account email separately for linking
      password: password ? password.trim() : '',
      phone: phone || '',
      profession: profession || 'Clinical Psychologist',
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

    if (application.userId) {
      console.log('Updating existing user with ID:', application.userId);
      const roleToSet = application.profession === 'Community Organizer'
        ? 'communityOrganizer'
        : 'therapist';
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
        console.log('Found existing user with account email, updating role to therapist:', existingUser.name);
        // Update existing user to therapist role - skip documents to avoid schema conflicts
        user = await User.findByIdAndUpdate(existingUser._id, {
          role: 'therapist',
          phone: application.phone,
          profession: application.profession,
          licenseNum: application.licenseNum,
          specialization: application.specialization,
          expYears: application.expYears,
          bio: application.bio
        }, { returnDocument: 'after' });
        console.log('Updated existing user role to therapist:', user.name, 'New role:', user.role);
      } else {
        console.log('Creating new user with therapist role using account email');
        // Create new user with therapist role using account email
        const hashedPassword = application.password 
          ? await bcrypt.hash(application.password, 10)
          : await bcrypt.hash('Therapist@123', 10); // Default password for cases where password wasn't provided
        
        user = await User.create({
          name: application.fullName,
          email: application.accountEmail || application.email, // Use account email for user account
          password: hashedPassword,
          role: 'therapist',
          phone: application.phone,
          profession: application.profession,
          licenseNum: application.licenseNum,
          specialization: application.specialization,
          expYears: application.expYears,
          bio: application.bio
        });
        console.log('Created new user with therapist role:', user.name, 'Role:', user.role);
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