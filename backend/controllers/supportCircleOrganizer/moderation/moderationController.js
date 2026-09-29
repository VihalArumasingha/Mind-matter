import mongoose from 'mongoose'
import Post from '../../../models/Post.js'
import SupportCircle from '../../../models/SupportCircle.js'
import GroupMembership from '../../../models/GroupMembership.js'

const isValidId = id => mongoose.isValidObjectId(id)

const postPopulation = [
    { path: 'author', select: 'name profilePicture bio' },
    { path: 'comments.user', select: 'name profilePicture' },
    { path: 'supportCircle', select: 'topic rules' }
]

// Check that the logged-in user owns the support circle.
const getOwnedCircle = async (circleId, userId) => {
    if (!isValidId(circleId)) {
        return null
    }

    return SupportCircle.findOne({
        _id: circleId,
        ownerId: userId,
        status: 'active'
    })
}

// FM-62
// Get all pending posts belonging to the organizer's circles.
export const getPendingPosts = async (req, res) => {
    try {
        const circles = await SupportCircle.find({
            ownerId: req.user._id,
            status: 'active'
        }).select('_id topic')

        const circleIds = circles.map(circle => circle._id)

        const posts = await Post.find({
            supportCircle: { $in: circleIds },
            status: 'pending',
            needsReview: true
        })
            .sort({ createdAt: 1 })
            .populate(postPopulation)

        res.status(200).json({
            posts
        })
    } catch (error) {
        console.error('[Get Pending Posts Error]', error)

        res.status(500).json({
            message: 'Server error while fetching pending posts'
        })
    }
}

// FM-63
// Approve a pending group post.
export const approvePost = async (req, res) => {
    try {
        const { postId } = req.params

        if (!isValidId(postId)) {
            return res.status(400).json({
                message: 'Invalid post id'
            })
        }

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            })
        }

        if (!post.supportCircle) {
            return res.status(400).json({
                message: 'This is not a support circle post'
            })
        }

        const circle = await getOwnedCircle(
            post.supportCircle,
            req.user._id
        )

        if (!circle) {
            return res.status(403).json({
                message: 'You do not have permission to moderate this post'
            })
        }

        if (post.status !== 'pending') {
            return res.status(400).json({
                message: 'Only pending posts can be approved'
            })
        }

        post.status = 'active'
        post.needsReview = false
        post.restrictionReason = null
        post.moderatedBy = req.user._id
        post.moderatedAt = new Date()

        await post.save()

        res.status(200).json({
            message: 'Post approved successfully',
            post: await Post.findById(post._id).populate(postPopulation)
        })
    } catch (error) {
        console.error('[Approve Post Error]', error)

        res.status(500).json({
            message: 'Server error while approving post'
        })
    }
}

// FM-63
// Reject a pending group post.
// A reason is required.
export const rejectPost = async (req, res) => {
    try {
        const { postId } = req.params
        const { reason } = req.body

        if (!isValidId(postId)) {
            return res.status(400).json({
                message: 'Invalid post id'
            })
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                message: 'A rejection reason is required'
            })
        }

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            })
        }

        if (!post.supportCircle) {
            return res.status(400).json({
                message: 'This is not a support circle post'
            })
        }

        const circle = await getOwnedCircle(
            post.supportCircle,
            req.user._id
        )

        if (!circle) {
            return res.status(403).json({
                message: 'You do not have permission to moderate this post'
            })
        }

        if (post.status !== 'pending') {
            return res.status(400).json({
                message: 'Only pending posts can be rejected'
            })
        }

        post.status = 'removed'
        post.needsReview = false
        post.restrictionReason = reason.trim()
        post.moderatedBy = req.user._id
        post.moderatedAt = new Date()

        await post.save()

        res.status(200).json({
            message: 'Post rejected successfully',
            post: await Post.findById(post._id).populate(postPopulation)
        })
    } catch (error) {
        console.error('[Reject Post Error]', error)

        res.status(500).json({
            message: 'Server error while rejecting post'
        })
    }
}

// FM-66
// Remove an already published post that violates circle guidelines.
export const removePost = async (req, res) => {
    try {
        const { postId } = req.params
        const { reason } = req.body

        if (!isValidId(postId)) {
            return res.status(400).json({
                message: 'Invalid post id'
            })
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                message: 'A removal reason is required'
            })
        }

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            })
        }

        if (!post.supportCircle) {
            return res.status(400).json({
                message: 'This is not a support circle post'
            })
        }

        const circle = await getOwnedCircle(
            post.supportCircle,
            req.user._id
        )

        if (!circle) {
            return res.status(403).json({
                message: 'You do not have permission to remove this post'
            })
        }

        post.status = 'removed'
        post.needsReview = false
        post.restrictionReason = reason.trim()
        post.moderatedBy = req.user._id
        post.moderatedAt = new Date()

        await post.save()

        res.status(200).json({
            message: 'Post removed successfully',
            post: await Post.findById(post._id).populate(postPopulation)
        })
    } catch (error) {
        console.error('[Remove Post Error]', error)

        res.status(500).json({
            message: 'Server error while removing post'
        })
    }
}

// FM-65
// Get comments from posts belonging to the organizer's circles.
export const getCommentsForModeration = async (req, res) => {
    try {
        const circles = await SupportCircle.find({
            ownerId: req.user._id,
            status: 'active'
        }).select('_id')

        const circleIds = circles.map(circle => circle._id)

        const posts = await Post.find({
            supportCircle: { $in: circleIds },
            'comments.moderationStatus': 'active'
        })
            .sort({ createdAt: -1 })
            .populate(postPopulation)

        const comments = []

        posts.forEach(post => {
            post.comments.forEach(comment => {
                if (comment.moderationStatus === 'active') {
                    comments.push({
                        commentId: comment._id,
                        postId: post._id,
                        postTitle: post.title,
                        circleId: post.supportCircle,
                        user: comment.user,
                        content: comment.content,
                        createdAt: comment.createdAt
                    })
                }
            })
        })

        comments.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )

        res.status(200).json({
            comments
        })
    } catch (error) {
        console.error('[Get Comments For Moderation Error]', error)

        res.status(500).json({
            message: 'Server error while fetching comments'
        })
    }
}

// FM-65 + FM-66
// Remove a comment from a group post.
export const removeComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params
        const { reason } = req.body

        if (!isValidId(postId) || !isValidId(commentId)) {
            return res.status(400).json({
                message: 'Invalid post or comment id'
            })
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                message: 'A removal reason is required'
            })
        }

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            })
        }

        if (!post.supportCircle) {
            return res.status(400).json({
                message: 'This is not a support circle post'
            })
        }

        const circle = await getOwnedCircle(
            post.supportCircle,
            req.user._id
        )

        if (!circle) {
            return res.status(403).json({
                message: 'You do not have permission to moderate this comment'
            })
        }

        const comment = post.comments.id(commentId)

        if (!comment) {
            return res.status(404).json({
                message: 'Comment not found'
            })
        }

        comment.moderationStatus = 'removed'
        comment.moderationReason = reason.trim()
        comment.moderatedBy = req.user._id
        comment.moderatedAt = new Date()

        await post.save()

        res.status(200).json({
            message: 'Comment removed successfully',
            post: await Post.findById(post._id).populate(postPopulation)
        })
    } catch (error) {
        console.error('[Remove Comment Error]', error)

        res.status(500).json({
            message: 'Server error while removing comment'
        })
    }
}

// FM-66
// Get removed posts/comments belonging to the organizer's circles.
export const getRemovedContent = async (req, res) => {
    try {
        const circles = await SupportCircle.find({
            ownerId: req.user._id
        }).select('_id topic')

        const circleIds = circles.map(circle => circle._id)

        const posts = await Post.find({
            supportCircle: { $in: circleIds },
            status: 'removed'
        })
            .sort({ moderatedAt: -1 })
            .populate(postPopulation)

        const removedComments = await Post.find({
            supportCircle: { $in: circleIds },
            'comments.moderationStatus': 'removed'
        })
            .sort({ updatedAt: -1 })
            .populate(postPopulation)

        res.status(200).json({
            posts,
            comments: removedComments.flatMap(post =>
                post.comments
                    .filter(comment => comment.moderationStatus === 'removed')
                    .map(comment => ({
                        commentId: comment._id,
                        postId: post._id,
                        postTitle: post.title,
                        circleId: post.supportCircle,
                        user: comment.user,
                        content: comment.content,
                        reason: comment.moderationReason,
                        moderatedBy: comment.moderatedBy,
                        moderatedAt: comment.moderatedAt
                    }))
            )
        })
    } catch (error) {
        console.error('[Get Removed Content Error]', error)

        res.status(500).json({
            message: 'Server error while fetching removed content'
        })
    }
}
