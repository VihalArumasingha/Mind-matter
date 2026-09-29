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
        },

        // Used when a circle organizer moderates a comment
        moderationStatus: {
            type: String,
            enum: ['active', 'removed'],
            default: 'active'
        },

        moderationReason: {
            type: String,
            default: null,
            trim: true
        },

        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        moderatedAt: {
            type: Date,
            default: null
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

        // Support circle this post belongs to.
        // Null means it is a normal platform-wide post.
        supportCircle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SupportCircle',
            default: null,
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
        isAnonymous: {
            type: Boolean,
            default: false
        },
        mood: {
            type: String,
            enum: ['happy', 'calm', 'anxious', 'sad', 'tired', 'grateful', null],
            default: null
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

        // Moderation fields
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
            default: null,
            trim: true
        },

        // Organizer who performed the moderation action
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        moderatedAt: {
            type: Date,
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
postSchema.index({ supportCircle: 1, status: 1, createdAt: -1 })

const Post = mongoose.model('Post', postSchema)

export default Post