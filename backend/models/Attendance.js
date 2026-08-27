import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        status: {
            type: String,
            enum: ['registered', 'checked-in', 'absent', 'excused'],
            default: 'registered'
        },

        checkedInAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
)

const Attendance = mongoose.model('Attendance', attendanceSchema)

export default Attendance