import GroupMembership from '../../../models/GroupMembership.js'
import SupportCircle from '../../../models/SupportCircle.js'
import { createOrganizerNotification } from '../../../utils/organizerNotifications.js'

// Request to join a support circle
export const requestToJoinCircle = async (req, res) => {
    try {
        const { circleId } = req.params

        const circle = await SupportCircle.findById(circleId)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        // Only active circles can accept new members
        if (circle.status !== 'active') {
            return res.status(400).json({
                message: 'This support circle is not currently accepting members'
            })
        }

        const existing = await GroupMembership.findOne({
            userId: req.user._id,
            groupId: circleId
        })

        if (existing) {
            return res.status(400).json({
                message: `You already have a ${existing.status} membership for this circle`
            })
        }

        // Do not allow new join requests when the circle is full
        if (circle.currentMemberCount >= circle.maxCapacity) {
            return res.status(400).json({
                message: 'This support circle is currently full'
            })
        }

        const membership = await GroupMembership.create({
            userId: req.user._id,
            groupId: circleId,
            role: 'member',
            status: 'pending'
        })

        await createOrganizerNotification({
            recipient: circle.ownerId,
            actorId: req.user._id,
            type: 'MEMBER_REQUEST',
            title: 'New Member Request',
            message: `${req.user.name || 'A member'} wants to join ${circle.topic}.`,
            circleId: circle._id,
            membershipId: membership._id,
        })

        res.status(201).json({
            membership
        })
    } catch (error) {
        console.error('[Request To Join Circle Error]', error)

        res.status(500).json({
            message: 'Server error while requesting to join circle'
        })
    }
}

// List the logged-in user's own group memberships
export const getMyMemberships = async (req, res) => {
    try {
        const memberships = await GroupMembership.find({
            userId: req.user._id
        }).populate('groupId')

        res.status(200).json({
            memberships
        })
    } catch (error) {
        console.error('[Get My Memberships Error]', error)

        res.status(500).json({
            message: 'Server error while fetching memberships'
        })
    }
}