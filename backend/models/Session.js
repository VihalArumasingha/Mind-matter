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

        meetingType: {
            type: String,
            enum: ['online', 'physical'],
            default: null
        },

        meetingLink: {
            type: String,
            trim: true,
            default: null
        },

        location: {
            type: String,
            trim: true,
            default: null
        },

        capacity: {
            type: Number,
            min: 1,
            default: null
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


// Normalize and validate meeting details before saving
sessionSchema.pre('validate', async function () {
    const normalizedMeetingType =
        this.meetingType ||
        (this.meetingLink ? 'online' : this.location ? 'physical' : null)

    // If no meeting information was provided,
    // leave it to the controller/UI validation.
    if (!normalizedMeetingType) {
        return
    }

    this.meetingType = normalizedMeetingType

    // ─────────────────────────────────────────────
    // ONLINE SESSION
    // ─────────────────────────────────────────────
    if (normalizedMeetingType === 'online') {
        const normalizedLink =
            typeof this.meetingLink === 'string'
                ? this.meetingLink.trim()
                : ''

        this.meetingLink = normalizedLink

        // Online sessions don't use physical location/capacity
        this.location = null
        this.capacity = null

        if (!this.meetingLink) {
            throw new Error(
                'Meeting link is required for online sessions'
            )
        }

        // Validate URL
        if (!/^https?:\/\//i.test(this.meetingLink)) {
            throw new Error(
                'Meeting link must be a valid URL'
            )
        }

        return
    }


    // ─────────────────────────────────────────────
    // PHYSICAL SESSION
    // ─────────────────────────────────────────────
    const normalizedLocation =
        typeof this.location === 'string'
            ? this.location.trim()
            : ''

    const parsedCapacity = Number(this.capacity)

    this.location = normalizedLocation

    // Physical sessions don't use meeting links
    this.meetingLink = null

    if (!this.location) {
        throw new Error(
            'Location is required for physical sessions'
        )
    }

    if (
        !Number.isInteger(parsedCapacity) ||
        parsedCapacity <= 0
    ) {
        throw new Error(
            'Capacity must be a positive integer for physical sessions'
        )
    }

    this.capacity = parsedCapacity
})


const Session = mongoose.model('Session', sessionSchema)

export default Session