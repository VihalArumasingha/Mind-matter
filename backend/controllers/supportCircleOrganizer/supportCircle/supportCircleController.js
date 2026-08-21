import SupportCircle from '../../../models/SupportCircle.js'
import GroupMembership from '../../../models/GroupMembership.js'
import Session from '../../../models/Session.js'

// FM-46: Create a new support circle
export const createSupportCircle = async (req, res) => {
    try {
        const { topic, description, meetingType, maxCapacity, category, coverImage } = req.body

        const circle = await SupportCircle.create({
            ownerId: req.user._id,
            topic,
            description,
            meetingType,
            maxCapacity,
            category,
            coverImage
        })

        // Owner automatically becomes an approved member with role "owner"
        await GroupMembership.create({
            userId: req.user._id,
            groupId: circle._id,
            role: 'owner',
            status: 'approved'
        })

        res.status(201).json({
            circle
        })
    } catch (error) {
        console.error('[Create Support Circle Error]', error)

        res.status(500).json({
            message: 'Server error while creating support circle'
        })
    }
}

// FM-47: Edit an existing support circle's details
export const updateSupportCircle = async (req, res) => {
    try {
        const { id } = req.params

        const circle = await SupportCircle.findById(id)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        if (circle.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the circle owner can edit this circle'
            })
        }

        const allowedUpdates = ['topic', 'description', 'meetingType', 'maxCapacity', 'category', 'coverImage']

        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                circle[field] = req.body[field]
            }
        })

        await circle.save()

        res.status(200).json({
            circle
        })
    } catch (error) {
        console.error('[Update Support Circle Error]', error)

        res.status(500).json({
            message: 'Server error while updating support circle'
        })
    }
}

// FM-49: Archive (soft delete) a support circle
export const archiveSupportCircle = async (req, res) => {
    try {
        const { id } = req.params

        const circle = await SupportCircle.findById(id)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        if (circle.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the circle owner can archive this circle'
            })
        }

        circle.status = 'archived'
        await circle.save()

        res.status(200).json({
            circle
        })
    } catch (error) {
        console.error('[Archive Support Circle Error]', error)

        res.status(500).json({
            message: 'Server error while archiving support circle'
        })
    }
}

// List circles owned by the logged-in organizer
export const getMySupportCircles = async (req, res) => {
    try {
        const circles = await SupportCircle.find({
            ownerId: req.user._id,
            status: { $ne: 'deleted' }
        }).sort({ createdAt: -1 })

        res.status(200).json({
            circles
        })
    } catch (error) {
        console.error('[Get My Support Circles Error]', error)

        res.status(500).json({
            message: 'Server error while fetching support circles'
        })
    }
}

// Get a single support circle by id
export const getSupportCircleById = async (req, res) => {
    try {
        const { id } = req.params

        const circle = await SupportCircle.findById(id)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        res.status(200).json({
            circle
        })
    } catch (error) {
        console.error('[Get Support Circle Error]', error)

        res.status(500).json({
            message: 'Server error while fetching support circle'
        })
    }
}

// FM-50 / FM-51: List pending join requests for a circle, with enough
// applicant info (bio included) for the organizer to review before deciding
export const getPendingJoinRequests = async (req, res) => {
    try {
        const { id } = req.params

        const circle = await SupportCircle.findById(id)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        if (circle.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the circle owner can view join requests'
            })
        }

        const requests = await GroupMembership.find({
            groupId: id,
            status: 'pending'
        }).populate('userId', 'name email profilePicture bio')

        res.status(200).json({
            requests
        })
    } catch (error) {
        console.error('[Get Pending Join Requests Error]', error)

        res.status(500).json({
            message: 'Server error while fetching join requests'
        })
    }
}

// FM-52: Accept or decline a join request
export const respondToJoinRequest = async (req, res) => {
    try {
        const { membershipId } = req.params
        const { decision } = req.body // "approved" or "rejected"

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({
                message: 'decision must be either "approved" or "rejected"'
            })
        }

        const membership = await GroupMembership.findById(membershipId)

        if (!membership) {
            return res.status(404).json({
                message: 'Join request not found'
            })
        }

        const circle = await SupportCircle.findById(membership.groupId)

        if (!circle || circle.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the circle owner can respond to join requests'
            })
        }

        membership.status = decision
        await membership.save()

        if (decision === 'approved') {
            circle.currentMemberCount += 1
            await circle.save()
        }

        res.status(200).json({
            membership
        })
    } catch (error) {
        console.error('[Respond To Join Request Error]', error)

        res.status(500).json({
            message: 'Server error while responding to join request'
        })
    }
}

// FM-53: View the current member list for a circle
export const getCircleMembers = async (req, res) => {
    try {
        const { id } = req.params

        const circle = await SupportCircle.findById(id)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        if (circle.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the circle owner can view the member list'
            })
        }

        const members = await GroupMembership.find({
            groupId: id,
            status: 'approved'
        }).populate('userId', 'name email profilePicture')

        res.status(200).json({
            members
        })
    } catch (error) {
        console.error('[Get Circle Members Error]', error)

        res.status(500).json({
            message: 'Server error while fetching circle members'
        })
    }
}

// FM-54: Remove a member from the circle
export const removeMember = async (req, res) => {
    try {
        const { membershipId } = req.params

        const membership = await GroupMembership.findById(membershipId)

        if (!membership) {
            return res.status(404).json({
                message: 'Membership not found'
            })
        }

        const circle = await SupportCircle.findById(membership.groupId)

        if (!circle || circle.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Only the circle owner can remove a member'
            })
        }

        if (membership.role === 'owner') {
            return res.status(400).json({
                message: 'The circle owner cannot be removed'
            })
        }

        membership.status = 'removed'
        await membership.save()

        if (circle.currentMemberCount > 0) {
            circle.currentMemberCount -= 1
            await circle.save()
        }

        res.status(200).json({
            membership
        })
    } catch (error) {
        console.error('[Remove Member Error]', error)

        res.status(500).json({
            message: 'Server error while removing member'
        })
    }
}

// FM-70 / FM-71: Aggregate dashboard stats for the logged-in organizer
export const getDashboardStats = async (req, res) => {
    try {
        const circles = await SupportCircle.find({
            ownerId: req.user._id,
            status: { $ne: 'deleted' }
        })

        const circleIds = circles.map((circle) => circle._id)

        const totalMembers = circles.reduce((total, circle) => total + circle.currentMemberCount, 0)

        const pendingRequests = await GroupMembership.countDocuments({
            groupId: { $in: circleIds },
            status: 'pending'
        })

        const upcomingSessions = await Session.find({
            circleId: { $in: circleIds },
            status: 'upcoming',
            scheduledAt: { $gte: new Date() }
        })
            .sort({ scheduledAt: 1 })
            .limit(5)
            .populate('circleId', 'topic')

        res.status(200).json({
            totalCircles: circles.length,
            totalMembers,
            pendingRequests,
            // Post moderation isn't built yet (Sprint 3) — placeholder until it is
            pendingPostApprovals: 0,
            upcomingSessions
        })
    } catch (error) {
        console.error('[Get Dashboard Stats Error]', error)

        res.status(500).json({
            message: 'Server error while fetching dashboard stats'
        })
    }
}