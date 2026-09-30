import mongoose from 'mongoose'

const groupMessageSchema = new mongoose.Schema(
    {
        circleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SupportCircle',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        }
    },
    {timestamps: true}
)

groupMessageSchema.index({circleId: 1, createdAt: -1})

export default mongoose.model('GroupMessage', groupMessageSchema)