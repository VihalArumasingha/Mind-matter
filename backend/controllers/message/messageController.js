import Message from '../../models/Message.js';
import User from '../../models/User.js';
import Booking from '../../models/Booking.js';
import Notification from '../../models/Notification.js';

/**
 * Send a message to a user
 */
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, relatedBookingId } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and content are required',
      });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found',
      });
    }

    // Verify related booking exists (if provided)
    if (relatedBookingId) {
      const booking = await Booking.findById(relatedBookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Related booking not found',
        });
      }
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      relatedBooking: relatedBookingId || null,
    });

    // Populate sender and receiver details
    await message.populate('sender', 'name fullName email role profilePicture');
    await message.populate('receiver', 'name fullName email role profilePicture');

    // Create notification for the receiver
    try {
      const sender = await User.findById(senderId);
      const senderDisplayName = sender?.name || sender?.fullName || 'Someone';
      await Notification.create({
        userId: receiverId,
        type: 'new_message',
        title: `Message from ${senderDisplayName}`,
        message: `${senderDisplayName}: ${content.substring(0, 80)}${content.length > 80 ? '...' : ''}`,
        relatedUserId: senderId,
        relatedUserName: senderDisplayName,
        relatedBookingId: relatedBookingId || null,
        relatedMessageId: message._id,
        isRead: false,
      });
      console.log('[Message Notification] Sent to user:', receiverId);
    } catch (notifErr) {
      console.error('[Message Notification Error]', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('[Send Message Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending message',
    });
  }
};

/**
 * Get conversation between current user and another user
 */
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Get all messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'name fullName email role profilePicture')
      .populate('receiver', 'name fullName email role profilePicture')
      .sort({ createdAt: 1 });

    // Mark messages as read where current user is the receiver
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('[Get Conversation Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching conversation',
    });
  }
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get all unique users the current user has messaged with
    const sentMessages = await Message.find({ sender: currentUserId })
      .distinct('receiver');
    const receivedMessages = await Message.find({ receiver: currentUserId })
      .distinct('sender');

    // Combine and deduplicate user IDs
    const uniqueUserIds = [...new Set([...sentMessages, ...receivedMessages])];

    // Get details for each conversation
    const conversations = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        // Get the last message
        const lastMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: userId },
            { sender: userId, receiver: currentUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .populate('sender', 'name fullName email role profilePicture')
          .populate('receiver', 'name fullName email role profilePicture');

        // Count unread messages
        const unreadCount = await Message.countDocuments({
          sender: userId,
          receiver: currentUserId,
          isRead: false,
        });

        // Get user details
        const user = await User.findById(userId).select('name fullName email role profilePicture');

        if (!lastMessage || !user) return null;

        return {
          userId,
          userName: user.name || user.fullName || 'User',
          userEmail: user.email,
          lastMessage: lastMessage.content,
          lastMessageTime: lastMessage.createdAt,
          unreadCount,
          relatedBooking: lastMessage.relatedBooking,
        };
      })
    );

    // Filter out nulls and sort by last message time
    const validConversations = conversations
      .filter((conv) => conv !== null)
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    // Deduplicate by userId (extra safety)
    const deduplicatedConversations = validConversations.filter((conv, index, self) =>
      index === self.findIndex((c) => c.userId.toString() === conv.userId.toString())
    );

    return res.status(200).json({
      success: true,
      data: deduplicatedConversations,
    });
  } catch (error) {
    console.error('[Get Conversations Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching conversations',
    });
  }
};

/**
 * Update/edit a message
 */
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty',
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages',
      });
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    await message.populate('sender', 'name fullName email role profilePicture');
    await message.populate('receiver', 'name fullName email role profilePicture');

    return res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message,
    });
  } catch (error) {
    console.error('[Update Message Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating message',
    });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Only sender or recipient can delete
    if (message.sender.toString() !== currentUserId.toString() && message.receiver.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this message',
      });
    }

    await Message.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    console.error('[Delete Message Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting message',
    });
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('[Mark As Read Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking messages as read',
    });
  }
};
