import Attendance from '../../../models/Attendance.js'
import GroupMembership from '../../../models/GroupMembership.js'
import Session from '../../../models/Session.js'
import SupportCircle from '../../../models/SupportCircle.js'
import { createOrganizerNotification } from '../../../utils/organizerNotifications.js'

const getEffectiveMeetingType = session => {
    if (session.meetingType) {
        return session.meetingType
    }

    if (session.meetingLink) {
        return 'online'
    }

    return 'physical'
}

// Register a member as attending a session (auto-created when they RSVP, or added by organizer)
export const registerAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params

        const session = await Session.findById(sessionId)

        if (!session) {
            return res.status(404).json({
                message: 'Session not found'
            })
        }

        const membership = await GroupMembership.findOne({
            userId: req.user._id,
            groupId: session.circleId,
            status: 'approved'
        })

        if (!membership) {
            return res.status(403).json({
                message: 'Only approved members can register for sessions in this circle.'
            })
        }

        if (session.status === 'cancelled') {
            return res.status(400).json({
                message: 'This session has been cancelled.'
            })
        }

        if (session.status === 'completed' || new Date(session.scheduledAt) <= new Date()) {
            return res.status(400).json({
                message: 'Registration is closed for this session.'
            })
        }

        const existing = await Attendance.findOne({
            sessionId,
            userId: req.user._id
        })

        if (existing) {
            return res.status(400).json({
                message: 'You are already registered for this session.'
            })
        }

        const effectiveMeetingType = getEffectiveMeetingType(session)

        if (effectiveMeetingType === 'physical') {
            const registeredCount = await Attendance.countDocuments({
                sessionId,
                status: 'registered'
            })

            if (session.capacity && registeredCount >= session.capacity) {
                return res.status(400).json({
                    message: 'This session is full.'
                })
            }
        }

        const attendance = await Attendance.create({
            sessionId,
            userId: req.user._id,
            status: 'registered'
        })

        try {
            const circle = await SupportCircle.findById(session.circleId).select('ownerId topic')
            if (circle && targetUserId.toString() !== circle.ownerId.toString()) {
                await createOrganizerNotification({
                    recipient: circle.ownerId,
                    actorId: targetUserId,
                    type: 'SESSION_REGISTRATION',
                    title: 'New Session Registration',
                    message: `A member registered for ${session.title}.`,
                    circleId: circle._id,
                    sessionId: session._id,
                })
            }
        } catch (notificationError) {
            console.error('[Session Registration Notification Error]', notificationError)
        }

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

        const attendance = await Attendance.find({ sessionId }).populate('userId', 'name email profilePicture role')

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