import ProfessionalPost from '../../models/ProfessionalPost.js';
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';

const createNotification = async (userId, type, title, message, relatedPostId, relatedUserId, relatedUserName) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedPostId,
      relatedUserId,
      relatedUserName,
    });
    await notification.save();
  } catch (error) {
    console.error('[Create Notification Error]', error);
  }
};

export const createProfessionalPost = async (req, res) => {
  try {
    console.log('[Create Professional Post] Request received');
    console.log('[Create Professional Post] User:', req.user);
    console.log('[Create Professional Post] Body:', req.body);
    console.log('[Create Professional Post] Model being used:', ProfessionalPost.modelName);
    console.log('[Create Professional Post] Collection name:', ProfessionalPost.collection.name);
    
    const { title, content, categories, authorType } = req.body;
    const userId = req.user._id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one category is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const post = new ProfessionalPost({
      title,
      content,
      categories,
      authorId: userId,
      authorName: user.name || user.fullName,
      authorType: authorType || 'professional',
    });

    await post.save();

    console.log('[Create Professional Post] Post saved successfully');
    console.log('[Create Professional Post] Saved to collection:', post.constructor.collection.name);

    res.status(201).json({
      success: true,
      message: 'Professional post created successfully',
      post
    });
  } catch (error) {
    console.error('[Create Professional Post Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating post'
    });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { category, authorType } = req.query;
    
    let filter = { status: 'published' };
    
    if (category) {
      filter.categories = category;
    }
    
    if (authorType) {
      filter.authorType = authorType;
    }

    const posts = await ProfessionalPost.find(filter)
      .populate('authorId', 'name fullName profilePicture')
      .populate('likes', 'name fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('[Get Posts Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching posts'
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await ProfessionalPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const hasLiked = post.likes.includes(userId);
    
    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
      // Create notification for post author
      if (post.authorId.toString() !== userId.toString()) {
        await createNotification(
          post.authorId,
          'like',
          'New Like',
          `${req.user.name || req.user.fullName} liked your post`,
          post._id,
          userId,
          req.user.name || req.user.fullName
        );
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked: !hasLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('[Like Post Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while liking post'
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const post = await ProfessionalPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const comment = {
      userId,
      userName: user.name || user.fullName,
      userAvatar: user.profilePicture || '',
      content: content.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    // Create notification for post author
    if (post.authorId.toString() !== userId.toString()) {
      await createNotification(
        post.authorId,
        'comment',
        'New Comment',
        `${user.name || user.fullName} commented on your post`,
        post._id,
        userId,
        user.name || user.fullName
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('[Add Comment Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const posts = await ProfessionalPost.find({ authorId: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('[Get My Posts Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching posts'
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;
    const userId = req.user._id;

    const post = await ProfessionalPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.authorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    if (title) post.title = title;
    if (content) post.content = content;

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('[Update Post Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating post'
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await ProfessionalPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.authorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    await ProfessionalPost.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Post Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting post'
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Mark notifications as read
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('[Get Notifications Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own notifications as read'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('[Mark Notification As Read Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read'
    });
  }
};