import mongoose from 'mongoose'
import Post from '../../../models/Post.js'
import SupportCircle from '../../../models/SupportCircle.js'
import GroupMembership from '../../../models/GroupMembership.js'

const isValidId = id => mongoose.isValidObjectId(id)

const postPopulation = [
    { path: 'author', select: 'name profilePicture' },
    { path: 'comments.user', select: 'name profilePicture' },
    { path: 'supportCircle', select: 'topic description rules' }
]

const findPost = id => Post.findById(id).populate(postPopulation)

// Create a post inside a support circle
// FM-62: Member posts require organizer review before publishing
export const createGroupPost = async (req, res) => {
    try {
        const { circleId } = req.params
        const { title, description } = req.body

        if (!isValidId(circleId)) {
            return res.status(400).json({
                message: 'Invalid support circle id'
            })
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Post title is required'
            })
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                message: 'Post description is required'
            })
        }

        if (title.trim().length > 200) {
            return res.status(400).json({
                message: 'Post title cannot exceed 200 characters'
            })
        }

        if (description.trim().length > 5000) {
            return res.status(400).json({
                message: 'Post description cannot exceed 5000 characters'
            })
        }

        const circle = await SupportCircle.findById(circleId)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        if (circle.status !== 'active') {
            return res.status(400).json({
                message: 'This support circle is not active'
            })
        }

        // Only approved members can create posts inside the circle
        const membership = await GroupMembership.findOne({
            userId: req.user._id,
            groupId: circleId,
            status: 'approved'
        })

        if (!membership) {
            return res.status(403).json({
                message: 'Only approved members can post in this support circle'
            })
        }

        const post = await Post.create({
            author: req.user._id,
            supportCircle: circleId,
            title: title.trim(),
            description: description.trim(),
            content: description.trim(),

            // IMPORTANT:
            // Group posts must be reviewed by the organizer first.
            status: 'pending',
            needsReview: true
        })

        const populatedPost = await findPost(post._id)

        res.status(201).json({
            message: 'Post submitted for organizer review',
            post: populatedPost
        })
    } catch (error) {
        console.error('[Create Group Post Error]', error)

        res.status(500).json({
            message: 'Server error while creating group post'
        })
    }
}

// Get published posts for a support circle
// Only approved members can see the circle feed.
export const getGroupPosts = async (req, res) => {
    try {
        const { circleId } = req.params

        if (!isValidId(circleId)) {
            return res.status(400).json({
                message: 'Invalid support circle id'
            })
        }

        const circle = await SupportCircle.findById(circleId)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        const membership = await GroupMembership.findOne({
            userId: req.user._id,
            groupId: circleId,
            status: 'approved'
        })

        if (!membership) {
            return res.status(403).json({
                message: 'You must be an approved member to view this circle'
            })
        }

        const posts = await Post.find({
    supportCircle: circleId,
    status: 'active'
})
    .sort({ createdAt: -1 })
    .populate(postPopulation)

// Hide comments that were removed by the organizer
posts.forEach(post => {
    post.comments = post.comments.filter(
        comment => comment.moderationStatus === 'active'
    )
})

res.status(200).json({
    posts
})
    } catch (error) {
        console.error('[Get Group Posts Error]', error)

        res.status(500).json({
            message: 'Server error while fetching group posts'
        })
    }
}

// Get the logged-in member's posts for a particular circle.
// Useful for showing "pending" status to the member.
export const getMyGroupPosts = async (req, res) => {
    try {
        const { circleId } = req.params

        if (!isValidId(circleId)) {
            return res.status(400).json({
                message: 'Invalid support circle id'
            })
        }

        const posts = await Post.find({
            supportCircle: circleId,
            author: req.user._id
        })
            .sort({ createdAt: -1 })
            .populate(postPopulation)

        res.status(200).json({
            posts
        })
    } catch (error) {
        console.error('[Get My Group Posts Error]', error)

        res.status(500).json({
            message: 'Server error while fetching your group posts'
        })
    }
}
