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
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },
        imageUrl: {
            type: String,
            default: ''
        },
        imagePublicId: {
            type: String,
            default: ''
        },
        comments: [commentSchema],
        status: {
      type: String,
      enum: ['active', 'restricted', 'removed', 'pending'],
      default: 'active'
    },
    needsReview: {
            type: Boolean,
            default: true  
        },
    restrictionReason: {
      type: String,
      default: null
    },
    reportsCount: {
      type: Number,
      default: 0
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
    },
    { timestamps: true }
)

postSchema.index({ createdAt: -1 })

const Post = mongoose.model('Post', postSchema)

export default Post