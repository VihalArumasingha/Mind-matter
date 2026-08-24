import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        }
    },
    { timestamps: true }
)

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },
        comments: [commentSchema]
    },
    { timestamps: true }
)

postSchema.index({ createdAt: -1 })

const Post = mongoose.model('Post', postSchema)

export default Post