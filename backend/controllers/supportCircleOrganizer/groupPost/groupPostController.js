import mongoose from 'mongoose'
import Post from '../../../models/Post.js'
import SupportCircle from '../../../models/SupportCircle.js'
import GroupMembership from '../../../models/GroupMembership.js'
import cloudinary from '../../../config/cloudinary.js'
import {Readable} from 'stream'

const isValidId = id => mongoose.isValidObjectId(id)

const postPopulation = [
    { path: 'author', select: 'name profilePicture' },
    { path: 'comments.user', select: 'name profilePicture' },
    { path: 'supportCircle', select: 'topic description rules' }
]

const findPost = id => Post.findById(id).populate(postPopulation)

const uploadGroupPostImage = file => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        {folder: 'mindmatter_group_posts', resource_type: 'image'},
        (error, result) => error ? reject(error) : resolve(result),
    )

    Readable.from(file.buffer).pipe(stream)
})

const serializeGroupPost = post => {
    if (!post) return post

    const plain = post.toObject()
    if (plain.isAnonymous) {
        plain.author = {
            _id: plain.author?._id,
            name: 'Anonymous',
            profilePicture: null
        }
    }

    return plain
}

// Create a post inside a support circle. The same Post model is used for
// platform feed posts; supportCircle distinguishes a community post.
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

        const image = req.file ? await uploadGroupPostImage(req.file) : null
        const isOwner = circle.ownerId.toString() === req.user._id.toString()
        const post = await Post.create({
            author: req.user._id,
            supportCircle: circleId,
            title: title.trim(),
            description: description.trim(),
            content: description.trim(),
            isAnonymous: req.body.isAnonymous === true || req.body.isAnonymous === 'true',
            mood: ['happy', 'calm', 'anxious', 'sad', 'tired', 'grateful'].includes(req.body.mood)
                ? req.body.mood
                : null,
            imageUrl: image?.secure_url || '',
            imagePublicId: image?.public_id || '',
            status: isOwner ? 'active' : 'pending',
            needsReview: !isOwner
        })

        res.status(201).json({
            message: isOwner
                ? 'Group post published successfully'
                : 'Post submitted for organizer review',
            post: serializeGroupPost(await findPost(post._id))
        })
    } catch (error) {
        console.error('[Create Group Post Error]', error)

        res.status(500).json({
            message: 'Server error while creating group post'
        })
    }
}

// Community posts are visible to all signed-in users. Posting remains member-only.
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

        const posts = await Post.find({
            supportCircle: circleId,
            status: 'active'
        })
            .sort({ createdAt: -1 })
            .populate(postPopulation)

        posts.forEach(post => {
            post.comments = post.comments.filter(
                comment => comment.moderationStatus === 'active'
            )
        })

        res.status(200).json({posts: posts.map(serializeGroupPost)})
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
            posts: posts.map(serializeGroupPost)
        })
    } catch (error) {
        console.error('[Get My Group Posts Error]', error)

        res.status(500).json({
            message: 'Server error while fetching your group posts'
        })
    }
}
