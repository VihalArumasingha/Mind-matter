import Session from '../../../models/Session.js'
import SupportCircle from '../../../models/SupportCircle.js'

// FM-57: Schedule a new session
export const createSession = async (req, res) => {
    try {
        const { circleId } = req.params
        const { title, description, scheduledAt, durationMinutes, location } = req.body

        const circle = await SupportCircle.findById(circleId)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        if (circle.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the circle owner can schedule sessions'
            })
        }

        const session = await Session.create({
            circleId,
            createdBy: req.user._id,
            title,
            description,
            scheduledAt,
            durationMinutes,
            location
        })

        res.status(201).json({
            session
        })
    } catch (error) {
        console.error('[Create Session Error]', error)

        res.status(500).json({
            message: 'Server error while creating session'
        })
    }
}

// List sessions for a circle
export const getSessionsForCircle = async (req, res) => {
    try {
        const { circleId } = req.params

        const sessions = await Session.find({ circleId }).sort({ scheduledAt: 1 })

        res.status(200).json({
            sessions
        })
    } catch (error) {
        console.error('[Get Sessions Error]', error)

        res.status(500).json({
            message: 'Server error while fetching sessions'
        })
    }
}

// FM-58: Update a session's details
export const updateSession = async (req, res) => {
    try {
        const { id } = req.params

        const session = await Session.findById(id)

        if (!session) {
            return res.status(404).json({
                message: 'Session not found'
            })
        }

        if (session.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the session organizer can edit this session'
            })
        }

        const allowedUpdates = ['title', 'description', 'scheduledAt', 'durationMinutes', 'location']

        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                session[field] = req.body[field]
            }
        })

        await session.save()

        res.status(200).json({
            session
        })
    } catch (error) {
        console.error('[Update Session Error]', error)

        res.status(500).json({
            message: 'Server error while updating session'
        })
    }
}

// FM-58: Cancel a session
export const cancelSession = async (req, res) => {
    try {
        const { id } = req.params

        const session = await Session.findById(id)

        if (!session) {
            return res.status(404).json({
                message: 'Session not found'
            })
        }

        if (session.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the session organizer can cancel this session'
            })
        }

        session.status = 'cancelled'
        await session.save()

        res.status(200).json({
            session
        })
    } catch (error) {
        console.error('[Cancel Session Error]', error)

        res.status(500).json({
            message: 'Server error while cancelling session'
        })
    }
}