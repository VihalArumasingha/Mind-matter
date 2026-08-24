import mongoose from 'mongoose'
import Post from '../models/Post.js'
import postCloudinary from '../config/postCloudinary.js'
import {Readable} from 'stream'

const postPopulation = [
    { path: 'author', select: 'name profilePicture' },
    { path: 'comments.user', select: 'name profilePicture' }
]

const findPost = id => Post.findById(id).populate(postPopulation)

const isValidId = id => mongoose.isValidObjectId(id)

const uploadPostImage = file => new Promise((resolve, reject) => {
    const stream = postCloudinary.uploader.upload_stream(
        {folder: 'mindmatter_feed_posts', resource_type: 'image'},
        (error, result) => error ? reject(error) : resolve(result),
    )

    Readable.from(file.buffer).pipe(stream)
})

const readPostFields = body => ({
    title: typeof body.title === 'string' ? body.title.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
})

const validatePostFields = ({title, description}) => {
    if (!title || !description) return 'Post title and description are required'
    if (title.length > 200) return 'Post title cannot exceed 200 characters'
    if (description.length > 5000) return 'Post description cannot exceed 5000 characters'
    return null
}

export const getFeedPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate(postPopulation)

        res.status(200).json({ posts })
    } catch (error) {
        console.error('[Get Feed Posts Error]', error)
        res.status(500).json({ message: 'Server error while fetching posts' })
    }
}

export const getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({author: req.user._id})
            .sort({createdAt: -1})
            .populate(postPopulation)

        res.status(200).json({posts})
    } catch (error) {
        console.error('[Get My Posts Error]', error)
        res.status(500).json({message: 'Server error while fetching your posts'})
    }
}

export const getPost = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid post id' })
        }

        const post = await findPost(req.params.id)

        if (!post) {
            return res.status(404).json({ message: 'Post not found' })
        }

        res.status(200).json({ post })
    } catch (error) {
        console.error('[Get Post Error]', error)
        res.status(500).json({ message: 'Server error while fetching post' })
    }
}

export const createPost = async (req, res) => {
    try {
        const fields = readPostFields(req.body)
        const validationError = validatePostFields(fields)

        if (validationError) {
            return res.status(400).json({message: validationError})
        }

        const post = await Post.create({
            author: req.user._id,
            ...fields,
            content: fields.description,
        })

        if (req.file) {
            const image = await uploadPostImage(req.file)
            post.imageUrl = image.secure_url
            post.imagePublicId = image.public_id
            await post.save()
        }

        res.status(201).json({ post: await findPost(post._id) })
    } catch (error) {
        console.error('[Create Post Error]', error)
        res.status(500).json({ message: 'Server error while creating post' })
    }
}

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'Invalid post id' })
        }

        const post = await Post.findById(id)

        if (!post) {
            return res.status(404).json({ message: 'Post not found' })
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the post author can update this post' })
        }

        const fields = readPostFields(req.body)
        const validationError = validatePostFields(fields)

        if (validationError) {
            return res.status(400).json({message: validationError})
        }

        post.title = fields.title
        post.description = fields.description
        post.content = fields.description

        if (req.file) {
            const image = await uploadPostImage(req.file)
            post.imageUrl = image.secure_url
            post.imagePublicId = image.public_id
        }

        await post.save()

        res.status(200).json({ post: await findPost(post._id) })
    } catch (error) {
        console.error('[Update Post Error]', error)
        res.status(500).json({ message: 'Server error while updating post' })
    }
}

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'Invalid post id' })
        }

        const post = await Post.findById(id)

        if (!post) {
            return res.status(404).json({ message: 'Post not found' })
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the post author can delete this post' })
        }

        await post.deleteOne()

        res.status(200).json({ message: 'Post deleted successfully' })
    } catch (error) {
        console.error('[Delete Post Error]', error)
        res.status(500).json({ message: 'Server error while deleting post' })
    }
}

export const addComment = async (req, res) => {
    try {
        const { id } = req.params
        const content = typeof req.body.content === 'string'
            ? req.body.content.trim()
            : ''

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'Invalid post id' })
        }

        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' })
        }

        if (content.length > 1000) {
            return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' })
        }

        const post = await Post.findById(id)

        if (!post) {
            return res.status(404).json({ message: 'Post not found' })
        }

        post.comments.push({ user: req.user._id, content })
        await post.save()

        res.status(201).json({ post: await findPost(post._id) })
    } catch (error) {
        console.error('[Add Comment Error]', error)
        res.status(500).json({ message: 'Server error while adding comment' })
    }
}

export const updateComment = async (req, res) => {
    try {
        const { id, commentId } = req.params
        const content = typeof req.body.content === 'string'
            ? req.body.content.trim()
            : ''

        if (!isValidId(id) || !isValidId(commentId)) {
            return res.status(400).json({ message: 'Invalid post or comment id' })
        }

        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' })
        }

        if (content.length > 1000) {
            return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' })
        }

        const post = await Post.findById(id)
        const comment = post?.comments.id(commentId)

        if (!post || !comment) {
            return res.status(404).json({ message: 'Comment not found' })
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the comment author can update this comment' })
        }

        comment.content = content
        await post.save()

        res.status(200).json({ post: await findPost(post._id) })
    } catch (error) {
        console.error('[Update Comment Error]', error)
        res.status(500).json({ message: 'Server error while updating comment' })
    }
}

export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params

        if (!isValidId(id) || !isValidId(commentId)) {
            return res.status(400).json({ message: 'Invalid post or comment id' })
        }

        const post = await Post.findById(id)
        const comment = post?.comments.id(commentId)

        if (!post || !comment) {
            return res.status(404).json({ message: 'Comment not found' })
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the comment author can delete this comment' })
        }

        comment.deleteOne()
        await post.save()

        res.status(200).json({ post: await findPost(post._id) })
    } catch (error) {
        console.error('[Delete Comment Error]', error)
        res.status(500).json({ message: 'Server error while deleting comment' })
    }
}