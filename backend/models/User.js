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
            enum: ['user', 'volunteer', 'communityOrganizer', 'admin'],
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