import mongoose from 'mongoose'

const groupMembershipSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SupportCircle',
            required: true
        },

        role: {
            type: String,
            enum: ['member', 'owner'],
            default: 'member'
        },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'removed'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
)

const GroupMembership = mongoose.model('GroupMembership', groupMembershipSchema)

export default GroupMembership