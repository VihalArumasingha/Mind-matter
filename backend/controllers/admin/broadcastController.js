import Broadcast from '../../models/Broadcast.js';
import User from '../../models/User.js';
import Post from '../../models/Post.js';
import AuditLog from '../../models/AuditLog.js';

/**
 * Create and send a broadcast
 * - Creates a Broadcast record
 * - Creates a Post with isBroadcast flag so it appears in feeds
 * - Counts recipients based on target audience
 */
export const createBroadcast = async (req, res) => {
  try {
    const { title, message, targetAudience } = req.body;
    const adminName = req.user?.name || 'System Admin';
    const adminId = req.user?._id || null;

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Broadcast title is required'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Broadcast message is required'
      });
    }

    const validAudiences = ['both', 'all_users', 'all_professionals'];
    if (!validAudiences.includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target audience'
      });
    }

    // Count recipients based on target audience
    let recipientQuery = { status: { $ne: 'suspended' } };
    
    if (targetAudience === 'all_users') {
      recipientQuery.role = 'user';
    } else if (targetAudience === 'all_professionals') {
      recipientQuery.role = { $in: ['therapist', 'communityOrganizer', 'volunteer'] };
    }
    // 'both' = no role filter, all non-suspended users

    const recipientCount = await User.countDocuments(recipientQuery);

    // Create the broadcast record
    const broadcast = await Broadcast.create({
      title: title.trim(),
      message: message.trim(),
      targetAudience,
      sentBy: adminName,
      recipientCount
    });

    // Create a Post so the broadcast appears in the feed with a star mark
    // The post will be pinned and marked as a broadcast
    const broadcastPost = await Post.create({
      author: adminId,
      authorName: adminName,
      authorRole: 'admin',
      content: `⭐ ANNOUNCEMENT: ${message.trim()}`,
      title: title.trim(),
      description: message.trim(),
      category: 'Announcement',
      communityName: 'System Announcements',
      status: 'active',
      isBroadcast: true,
      isPinned: true,
      broadcastId: broadcast._id,
      targetAudience: targetAudience,
      reportsCount: 0,
      likes: [],
      comments: []
    });

    // Link the post to the broadcast
    broadcast.postId = broadcastPost._id;
    await broadcast.save();

    // Create audit log
    await AuditLog.create({
      adminName,
      action: 'CREATE_BROADCAST',
      targetType: 'Broadcast',
      targetId: broadcast._id,
      targetName: title.trim(),
      details: `Sent broadcast to ${targetAudience} (${recipientCount} recipients): "${message.trim().substring(0, 100)}${message.length > 100 ? '...' : ''}"`
    });

    console.log(`[Broadcast] Created broadcast "${title}" for ${targetAudience} (${recipientCount} recipients)`);

    res.status(201).json({
      success: true,
      message: 'Broadcast sent successfully',
      broadcast: {
        _id: broadcast._id,
        title: broadcast.title,
        message: broadcast.message,
        targetAudience: broadcast.targetAudience,
        sentBy: broadcast.sentBy,
        recipientCount: broadcast.recipientCount,
        postId: broadcast.postId,
        createdAt: broadcast.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating broadcast:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create broadcast'
    });
  }
};

/**
 * Get all broadcasts (for admin history view)
 */
export const getBroadcasts = async (req, res) => {
  try {
    const { limit = 50, targetAudience } = req.query;

    let filter = {};
    if (targetAudience && targetAudience !== 'all') {
      filter.targetAudience = targetAudience;
    }

    const broadcasts = await Broadcast.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      broadcasts,
      count: broadcasts.length
    });

  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get broadcasts visible to a specific user (for mobile app feed)
 * Filters based on user role
 */
export const getUserBroadcasts = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Determine which broadcasts this user should see
    let audienceFilter = ['both'];
    
    if (userRole === 'user') {
      audienceFilter.push('all_users');
    } else if (['therapist', 'communityOrganizer', 'volunteer'].includes(userRole)) {
      audienceFilter.push('all_professionals');
    }

    const broadcasts = await Broadcast.find({
      targetAudience: { $in: audienceFilter }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Mark which broadcasts have been read by this user
    // (In production, you'd have a separate read-receipts collection)
    const broadcastsWithReadStatus = broadcasts.map(b => ({
      ...b,
      isRead: false // Placeholder - implement read tracking if needed
    }));

    res.status(200).json({
      success: true,
      broadcasts: broadcastsWithReadStatus,
      count: broadcastsWithReadStatus.length
    });

  } catch (error) {
    console.error('Error fetching user broadcasts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete a broadcast (admin only)
 * Also removes the associated post
 */
export const deleteBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.user?.name || 'System Admin';

    const broadcast = await Broadcast.findById(id);
    if (!broadcast) {
      return res.status(404).json({
        success: false,
        message: 'Broadcast not found'
      });
    }

    // Remove the associated post if it exists
    if (broadcast.postId) {
      await Post.findByIdAndDelete(broadcast.postId);
    }

    await Broadcast.findByIdAndDelete(id);

    await AuditLog.create({
      adminName,
      action: 'DELETE_BROADCAST',
      targetType: 'Broadcast',
      targetId: id,
      targetName: broadcast.title,
      details: `Deleted broadcast: "${broadcast.title}"`
    });

    res.status(200).json({
      success: true,
      message: 'Broadcast deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting broadcast:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get broadcast statistics
 */
export const getBroadcastStats = async (req, res) => {
  try {
    const totalBroadcasts = await Broadcast.countDocuments();
    const totalRecipients = await Broadcast.aggregate([
      { $group: { _id: null, total: { $sum: '$recipientCount' } } }
    ]);

    const audienceBreakdown = await Broadcast.aggregate([
      { $group: { _id: '$targetAudience', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalBroadcasts,
        totalRecipients: totalRecipients[0]?.total || 0,
        audienceBreakdown
      }
    });

  } catch (error) {
    console.error('Error fetching broadcast stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};