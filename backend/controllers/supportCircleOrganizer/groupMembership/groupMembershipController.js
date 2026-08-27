import GroupMembership from '../../../models/GroupMembership.js'
import SupportCircle from '../../../models/SupportCircle.js'

// Request to join a support circle (creates a pending membership)
export const requestToJoinCircle = async (req, res) => {
    try {
        const { circleId } = req.params

        const circle = await SupportCircle.findById(circleId)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
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

        const membership = await GroupMembership.create({
            userId: req.user._id,
            groupId: circleId,
            role: 'member',
            status: 'pending'
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

// List the logged-in user's own group memberships (for their feed/profile)
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