import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ['user', 'volunteer', 'therapist', 'communityOrganizer', 'admin'],
            default: 'user'
        },

        profilePicture: {
            type: String,
            default: ''
        },

        bio: {
            type: String,
            default: ''
        },

        // Therapist-specific fields
        phone: {
            type: String,
            default: ''
        },
        profession: {
            type: String,
            default: ''
        },
        licenseNum: {
            type: String,
            default: ''
        },
        specialization: {
            type: String,
            default: ''
        },
        expYears: {
            type: Number,
            default: 0
        },
        documents: [{
            title: String,
            url: String,
            type: String,
            fileName: String,
            mimeType: String,
            publicId: String
        }],

        status: {
            type: String,
            enum: ['active', 'warned', 'suspended'],
            default: 'active'
        },
        warningsCount: {
            type: Number,
            default: 0
        },
        suspensionReason: {
            type: String,
            default: ''
        },
        suspendedUntil: {
            type: Date,
            default: null
        },
        violations: [
            {
                reason: { type: String },
                adminName: { type: String },
                date: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true
    }
)

const User = mongoose.model('User', userSchema)

export default User
