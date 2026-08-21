import mongoose from 'mongoose'

const supportCircleSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        topic: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        meetingType: {
            type: String,
            enum: ['online', 'in-person', 'hybrid'],
            required: true
        },

        maxCapacity: {
            type: Number,
            required: true,
            min: 1
        },

        currentMemberCount: {
            type: Number,
            default: 1
        },

        category: {
            type: String,
            trim: true,
            default: ''
        },

        coverImage: {
            type: String,
            default: ''
        },

        status: {
            type: String,
            enum: ['active', 'archived', 'deleted'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
)

const SupportCircle = mongoose.model('SupportCircle', supportCircleSchema)

export default SupportCircle