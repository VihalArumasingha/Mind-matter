import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
    {
        circleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SupportCircle',
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ''
        },

        scheduledAt: {
            type: Date,
            required: true
        },

        durationMinutes: {
            type: Number,
            required: true,
            min: 5
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: ['upcoming', 'completed', 'cancelled'],
            default: 'upcoming'
        }
    },
    {
        timestamps: true
    }
)

const Session = mongoose.model('Session', sessionSchema)

export default Session