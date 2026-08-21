import Attendance from '../../../models/Attendance.js'
import Session from '../../../models/Session.js'

// Register a member as attending a session (auto-created when they RSVP, or added by organizer)
export const registerAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { userId } = req.body

        const session = await Session.findById(sessionId)

        if (!session) {
            return res.status(404).json({
                message: 'Session not found'
            })
        }

        const targetUserId = userId || req.user._id

        const existing = await Attendance.findOne({
            sessionId,
            userId: targetUserId
        })

        if (existing) {
            return res.status(400).json({
                message: 'Attendance record already exists for this user and session'
            })
        }

        const attendance = await Attendance.create({
            sessionId,
            userId: targetUserId,
            status: 'registered'
        })

        res.status(201).json({
            attendance
        })
    } catch (error) {
        console.error('[Register Attendance Error]', error)

        res.status(500).json({
            message: 'Server error while registering attendance'
        })
    }
}

// FM-59: Organizer marks a member's attendance status (checked-in / absent / excused)
export const updateAttendanceStatus = async (req, res) => {
    try {
        const { attendanceId } = req.params
        const { status } = req.body

        if (!['registered', 'checked-in', 'absent', 'excused'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid attendance status'
            })
        }

        const attendance = await Attendance.findById(attendanceId)

        if (!attendance) {
            return res.status(404).json({
                message: 'Attendance record not found'
            })
        }

        const session = await Session.findById(attendance.sessionId)

        if (!session || session.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the session organizer can update attendance'
            })
        }

        attendance.status = status
        attendance.checkedInAt = status === 'checked-in' ? new Date() : attendance.checkedInAt

        await attendance.save()

        res.status(200).json({
            attendance
        })
    } catch (error) {
        console.error('[Update Attendance Error]', error)

        res.status(500).json({
            message: 'Server error while updating attendance'
        })
    }
}

// FM-59: View the attendance list for a session
export const getAttendanceForSession = async (req, res) => {
    try {
        const { sessionId } = req.params

        const attendance = await Attendance.find({ sessionId }).populate('userId', 'name email profilePicture')

        res.status(200).json({
            attendance
        })
    } catch (error) {
        console.error('[Get Attendance Error]', error)

        res.status(500).json({
            message: 'Server error while fetching attendance'
        })
    }
}