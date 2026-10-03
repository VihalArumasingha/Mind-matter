import Session from '../../../models/Session.js'
import SupportCircle from '../../../models/SupportCircle.js'

const normalizeMeetingType = value => {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim().toLowerCase()
}

const validateMeetingSessionInput = (circle, incoming) => {
    const requestedMeetingType = normalizeMeetingType(
        incoming.meetingType ||
        (incoming.meetingLink ? 'online' : incoming.location ? 'physical' : null) ||
        (Array.isArray(circle.meetingTypes) && circle.meetingTypes.length ? circle.meetingTypes[0] : 'online')
    )

    if (!['online', 'physical'].includes(requestedMeetingType)) {
        return {
            error: 'Meeting type must be either online or physical.'
        }
    }

    const allowedMeetingTypes = (circle.meetingTypes || []).map(type => type.toLowerCase())

    if (!allowedMeetingTypes.includes(requestedMeetingType)) {
        return {
            error: `This circle does not support ${requestedMeetingType} sessions.`
        }
    }

    if (requestedMeetingType === 'online') {
        const meetingLink = String(incoming.meetingLink ?? '').trim()

        if (!meetingLink) {
            return {
                error: 'Meeting link is required for online sessions.'
            }
        }

        if (!/^https?:\/\//i.test(meetingLink)) {
            return {
                error: 'Meeting link must be a valid URL.'
            }
        }

        return {
            meetingType: 'online',
            meetingLink,
            location: null,
            capacity: null
        }
    }

    const location = String(incoming.location ?? '').trim()
    const capacityValue = Number(incoming.capacity)

    if (!location) {
        return {
            error: 'Location is required for physical sessions.'
        }
    }

    if (!Number.isInteger(capacityValue) || capacityValue <= 0) {
        return {
            error: 'Capacity must be a positive integer for physical sessions.'
        }
    }

    return {
        meetingType: 'physical',
        location,
        capacity: capacityValue,
        meetingLink: null
    }
}

// FM-57: Schedule a new session
export const createSession = async (req, res) => {
    try {
        const { circleId } = req.params
        const { title, description, scheduledAt, durationMinutes, ...rest } = req.body

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

        const validatedSession = validateMeetingSessionInput(circle, {
            ...rest,
            meetingType: rest.meetingType,
            meetingLink: rest.meetingLink,
            location: rest.location,
            capacity: rest.capacity,
        })

        if (validatedSession.error) {
            return res.status(400).json({
                message: validatedSession.error
            })
        }

        const session = await Session.create({
            circleId,
            createdBy: req.user._id,
            title,
            description,
            scheduledAt,
            durationMinutes,
            ...validatedSession
        })

        res.status(201).json({
            session
        })
    } catch (error) {
        console.error('[Create Session Error]', error)

        const message = error?.message || 'Server error while creating session'

        res.status(400).json({
            message
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

        const normalizedCircleId = typeof session.circleId === 'object' && session.circleId !== null
            ? (session.circleId._id ?? session.circleId.toString())
            : session.circleId

        const circle = await SupportCircle.findById(normalizedCircleId)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        const requestedMeetingType = normalizeMeetingType(
            req.body.meetingType ||
            session.meetingType ||
            (session.meetingLink ? 'online' : session.location ? 'physical' : 'online')
        )

        const nextSessionData = {
            ...session.toObject(),
            ...req.body,
            meetingType: requestedMeetingType,
        }

        const validatedSession = validateMeetingSessionInput(circle, nextSessionData)

        if (validatedSession.error) {
            return res.status(400).json({
                message: validatedSession.error
            })
        }

        const allowedUpdates = [
            'title',
            'description',
            'scheduledAt',
            'durationMinutes',
            'meetingType',
            'meetingLink',
            'location',
            'capacity'
        ]

        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined || field === 'meetingType' || field === 'meetingLink' || field === 'location' || field === 'capacity') {
                if (field === 'meetingType' || field === 'meetingLink' || field === 'location' || field === 'capacity') {
                    session[field] = validatedSession[field]
                } else if (req.body[field] !== undefined) {
                    session[field] = req.body[field]
                }
            }
        })

        if (req.body.title !== undefined) {
            session.title = req.body.title
        }

        if (req.body.description !== undefined) {
            session.description = req.body.description
        }

        if (req.body.scheduledAt !== undefined) {
            session.scheduledAt = req.body.scheduledAt
        }

        if (req.body.durationMinutes !== undefined) {
            session.durationMinutes = req.body.durationMinutes
        }

        Object.assign(session, validatedSession)

        await session.save()

        res.status(200).json({
            session
        })
    } catch (error) {
        console.error('[Update Session Error]', error)

        res.status(400).json({
            message: error.message || 'Server error while updating session'
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