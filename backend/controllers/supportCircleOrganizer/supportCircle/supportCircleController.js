import SupportCircle from '../../../models/SupportCircle.js'
import GroupMembership from '../../../models/GroupMembership.js'
import Session from '../../../models/Session.js'
import Post from '../../../models/Post.js'
import Attendance from '../../../models/Attendance.js'


// FM-46: Create a new support circle
export const createSupportCircle = async (req, res) => {
    try {
        const {
            topic,
            description,
            meetingTypes,
            maxCapacity,
            category,
            rules,
            coverImage,
            profileImage
        } = req.body

        const circle = await SupportCircle.create({
            ownerId: req.user._id,
            topic,
            description,
            meetingTypes,
            maxCapacity,
            category,
            rules,
            coverImage,
            profileImage
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
            message:
                error.message ||
                'Server error while creating support circle'
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

        if (
            circle.ownerId.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    'Only the circle owner can edit this circle'
            })
        }

        const allowedUpdates = [
            'topic',
            'description',
            'meetingTypes',
            'maxCapacity',
            'category',
            'rules',
            'coverImage',
            'profileImage'
        ]

        allowedUpdates.forEach(field => {
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
            message:
                error.message ||
                'Server error while updating support circle'
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

        if (
            circle.ownerId.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    'Only the circle owner can archive this circle'
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
            message:
                'Server error while archiving support circle'
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
        console.error(
            '[Get My Support Circles Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while fetching support circles'
        })
    }
}


// Get active support circles for member discovery
export const getAvailableSupportCircles = async (req, res) => {
    try {
        const circles = await SupportCircle.find({
            status: 'active'
        }).sort({ createdAt: -1 })

        res.status(200).json({
            circles
        })
    } catch (error) {
        console.error(
            '[Get Available Support Circles Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while fetching available support circles'
        })
    }
}


// Get a single support circle by id
export const getSupportCircleById = async (req, res) => {
    try {
        const { id } = req.params

        const circle = await SupportCircle.findById(id).populate('ownerId', 'name profilePicture role')

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        res.status(200).json({
            circle
        })
    } catch (error) {
        console.error(
            '[Get Support Circle Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while fetching support circle'
        })
    }
}


// FM-50 / FM-51: List pending join requests for a circle,
// with enough applicant info (bio included) for the organizer
// to review before deciding
export const getPendingJoinRequests = async (req, res) => {
    try {
        const { id } = req.params

        const circle = await SupportCircle.findById(id)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        if (
            circle.ownerId.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    'Only the circle owner can view join requests'
            })
        }

        const requests = await GroupMembership.find({
            groupId: id,
            status: 'pending'
        }).populate(
            'userId',
            'name email profilePicture bio role'
        )

        res.status(200).json({
            requests
        })
    } catch (error) {
        console.error(
            '[Get Pending Join Requests Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while fetching join requests'
        })
    }
}


// List pending join requests across ALL of the organizer's circles
// (used by the Requests tab on the dashboard)
export const getAllPendingJoinRequests = async (req, res) => {
    try {
        const circles = await SupportCircle.find({
            ownerId: req.user._id,
            status: { $ne: 'deleted' }
        })

        const circleIds = circles.map(
            circle => circle._id
        )

        const requests = await GroupMembership.find({
            groupId: { $in: circleIds },
            status: 'pending'
        })
            .populate(
                'userId',
                'name email profilePicture bio role'
            )
            .populate(
                'groupId',
                'topic'
            )

        res.status(200).json({
            requests
        })
    } catch (error) {
        console.error(
            '[Get All Pending Join Requests Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while fetching join requests'
        })
    }
}


// FM-52: Accept or decline a join request
export const respondToJoinRequest = async (req, res) => {
    try {
        const { membershipId } = req.params
        const { decision } = req.body

        // decision must be "approved" or "rejected"
        if (
            !['approved', 'rejected'].includes(
                decision
            )
        ) {
            return res.status(400).json({
                message:
                    'decision must be either "approved" or "rejected"'
            })
        }

        const membership =
            await GroupMembership.findById(
                membershipId
            )

        if (!membership) {
            return res.status(404).json({
                message: 'Join request not found'
            })
        }

        // Only pending requests can be approved/rejected.
        // This prevents the same membership from being
        // approved twice and increasing the member count twice.
        if (membership.status !== 'pending') {
            return res.status(400).json({
                message:
                    `This membership has already been ${membership.status}`
            })
        }

        const circle =
            await SupportCircle.findById(
                membership.groupId
            )

        if (
            !circle ||
            circle.ownerId.toString() !==
                req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    'Only the circle owner can respond to join requests'
            })
        }

        // ---------------------------------------------------------
        // APPROVE
        // ---------------------------------------------------------

        if (decision === 'approved') {
            // Re-check capacity at the exact moment of approval.
            //
            // Example:
            // maxCapacity = 5
            // currentMemberCount = 5
            //
            // The request may have been created earlier when
            // there was still space, so we must check again here.
            if (
                circle.currentMemberCount >=
                circle.maxCapacity
            ) {
                return res.status(400).json({
                    message:
                        'This support circle is now full. The member cannot be approved.'
                })
            }

            membership.status = 'approved'

            await membership.save()

            circle.currentMemberCount += 1

            await circle.save()
        }

        // ---------------------------------------------------------
        // REJECT
        // ---------------------------------------------------------

        if (decision === 'rejected') {
            membership.status = 'rejected'

            await membership.save()
        }

        res.status(200).json({
            membership
        })
    } catch (error) {
        console.error(
            '[Respond To Join Request Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while responding to join request'
        })
    }
}


// FM-53: View the current member list for a circle
export const getCircleMembers = async (req, res) => {
    try {
        const { id } = req.params

        const circle =
            await SupportCircle.findById(id)

        if (!circle) {
            return res.status(404).json({
                message: 'Support circle not found'
            })
        }

        if (
            circle.ownerId.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    'Only the circle owner can view the member list'
            })
        }

        const members =
            await GroupMembership.find({
                groupId: id,
                status: 'approved'
            }).populate(
                'userId',
                'name email profilePicture role'
            )

        res.status(200).json({
            members
        })
    } catch (error) {
        console.error(
            '[Get Circle Members Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while fetching circle members'
        })
    }
}


// FM-54: Remove a member from the circle
export const removeMember = async (req, res) => {
    try {
        const { membershipId } = req.params

        const membership =
            await GroupMembership.findById(
                membershipId
            )

        if (!membership) {
            return res.status(404).json({
                message: 'Membership not found'
            })
        }

        const circle =
            await SupportCircle.findById(
                membership.groupId
            )

        if (
            !circle ||
            circle.ownerId.toString() !==
                req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    'Only the circle owner can remove a member'
            })
        }

        if (membership.role === 'owner') {
            return res.status(400).json({
                message:
                    'The circle owner cannot be removed'
            })
        }

        // Only decrement the count when removing an
        // actually approved member.
        if (membership.status === 'approved') {
            membership.status = 'removed'

            await membership.save()

            if (circle.currentMemberCount > 0) {
                circle.currentMemberCount -= 1
                await circle.save()
            }
        } else {
            membership.status = 'removed'

            await membership.save()
        }

        res.status(200).json({
            membership
        })
    } catch (error) {
        console.error(
            '[Remove Member Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while removing member'
        })
    }
}


// FM-70 / FM-71: Aggregate dashboard stats
// for the logged-in organizer
export const buildOrganizerNotifications = async userId => {
    const circles = await SupportCircle.find({
        ownerId: userId,
        status: { $ne: 'deleted' }
    }).select('_id topic')

    if (!circles.length) {
        return { notifications: [] }
    }

    const circleIds = circles.map(circle => circle._id)

    const [pendingRequests, pendingPosts, upcomingSessionIds] = await Promise.all([
        GroupMembership.find({
            groupId: { $in: circleIds },
            status: 'pending'
        })
            .sort({ createdAt: -1 })
            .populate('userId', 'name username profilePicture email')
            .populate('groupId', 'topic'),
        Post.find({
            supportCircle: { $in: circleIds },
            status: 'pending',
            needsReview: true
        })
            .sort({ createdAt: -1 })
            .populate('author', 'name username profilePicture email')
            .populate('supportCircle', 'topic'),
        Session.find({
            circleId: { $in: circleIds },
            status: 'upcoming'
        }).distinct('_id')
    ])

    const registrationAttendance = await Attendance.find({
        sessionId: { $in: upcomingSessionIds },
        status: 'registered'
    })
        .sort({ createdAt: -1 })
        .populate('userId', 'name username profilePicture email')
        .populate({
            path: 'sessionId',
            select: 'title scheduledAt circleId',
            populate: {
                path: 'circleId',
                select: 'topic'
            }
        })

    const notifications = [
        ...pendingRequests.map(request => {
            const circle = request.groupId
            const userName = request.userId?.name || request.userId?.username || 'A member'
            const circleName = circle?.topic || 'your circle'

            return {
                id: request._id.toString(),
                _id: request._id,
                type: 'MEMBER_REQUEST',
                title: 'New member request',
                message: `${userName} requested to join "${circleName}"`,
                action: 'join_request',
                circleId: circle?._id ? circle._id.toString() : request.groupId?.toString?.() ?? null,
                circleName,
                circle: circle ? { _id: circle._id, topic: circle.topic } : null,
                userId: request.userId?._id ? request.userId._id.toString() : request.userId,
                userName,
                membershipId: request._id,
                createdAt: request.createdAt,
                isRead: false,
            }
        }),
        ...pendingPosts.map(post => {
            const circle = post.supportCircle
            const circleName = circle?.topic || 'your circle'
            const authorName = post.isAnonymous ? 'Anonymous member' : post.author?.name || post.author?.username || 'A community member'

            return {
                id: post._id.toString(),
                _id: post._id,
                type: 'POST_MODERATION',
                title: 'Post requires moderation',
                message: `A new post in "${circleName}" is waiting for review.`,
                action: 'moderation',
                circleId: circle?._id ? circle._id.toString() : post.supportCircle?.toString?.() ?? null,
                circleName,
                circle: circle ? { _id: circle._id, topic: circle.topic } : null,
                postId: post._id,
                userId: post.author?._id ? post.author._id.toString() : post.author,
                userName: authorName,
                createdAt: post.createdAt,
                isRead: false,
            }
        }),
        ...registrationAttendance.map(attendance => {
            const session = attendance.sessionId
            const circle = session?.circleId
            const memberName = attendance.userId?.name || attendance.userId?.username || 'A member'
            const sessionTitle = session?.title || 'a session'
            const circleName = circle?.topic || 'your circle'

            return {
                id: attendance._id.toString(),
                _id: attendance._id,
                type: 'SESSION_REGISTRATION',
                title: 'New session registration',
                message: `${memberName} registered for ${sessionTitle}`,
                action: 'attendance',
                circleId: circle?._id ? circle._id.toString() : session?.circleId?.toString?.() ?? null,
                circleName,
                circle: circle ? { _id: circle._id, topic: circle.topic } : null,
                sessionId: session?._id ? session._id.toString() : attendance.sessionId,
                sessionTitle,
                userId: attendance.userId?._id ? attendance.userId._id.toString() : attendance.userId,
                userName: memberName,
                createdAt: attendance.createdAt,
                isRead: false,
            }
        })
    ].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))

    return { notifications }
}

export const getOrganizerNotifications = async (req, res) => {
    try {
        const data = await buildOrganizerNotifications(req.user._id)

        res.status(200).json({
            notifications: data.notifications,
            total: data.notifications.length,
            unreadCount: data.notifications.length,
        })
    } catch (error) {
        console.error('[Get Organizer Notifications Error]', error)
        res.status(500).json({
            message: 'Server error while fetching organizer attention items'
        })
    }
}

export const getDashboardStats = async (req, res) => {
    try {
        const circles = await SupportCircle.find({
            ownerId: req.user._id,
            status: { $ne: 'deleted' }
        })

        const circleIds = circles.map(
            circle => circle._id
        )

        const pendingPostApprovals =
            await Post.countDocuments({
                supportCircle: {
                    $in: circleIds
                },
                status: 'pending',
                needsReview: true
            })

        const totalMembers =
            circles.reduce(
                (total, circle) =>
                    total +
                    circle.currentMemberCount,
                0
            )

        const pendingRequests =
            await GroupMembership.countDocuments({
                groupId: {
                    $in: circleIds
                },
                status: 'pending'
            })

        const upcomingSessions =
            await Session.find({
                circleId: {
                    $in: circleIds
                },
                status: 'upcoming',
                scheduledAt: {
                    $gte: new Date()
                }
            })
                .sort({
                    scheduledAt: 1
                })
                .limit(5)
                .populate(
                    'circleId',
                    'topic'
                )

        // Recent activity feed:
        // latest membership changes + latest sessions,
        // merged and sorted by most recent first
        const recentMemberships =
            await GroupMembership.find({
                groupId: {
                    $in: circleIds
                },
                status: {
                    $in: [
                        'approved',
                        'pending'
                    ]
                }
            })
                .sort({
                    updatedAt: -1
                })
                .limit(5)
                .populate(
                    'userId',
                    'name'
                )
                .populate(
                    'groupId',
                    'topic'
                )

        const recentSessions =
            await Session.find({
                circleId: {
                    $in: circleIds
                }
            })
                .sort({
                    createdAt: -1
                })
                .limit(5)
                .populate(
                    'circleId',
                    'topic'
                )

        const membershipActivity =
            recentMemberships.map(
                membership => ({
                    message:
                        membership.status ===
                        'approved'
                            ? `${
                                  membership
                                      .userId
                                      ?.name ||
                                  'A member'
                              } joined ${
                                  membership
                                      .groupId
                                      ?.topic ||
                                  'a circle'
                              }`
                            : `${
                                  membership
                                      .userId
                                      ?.name ||
                                  'Someone'
                              } requested to join ${
                                  membership
                                      .groupId
                                      ?.topic ||
                                  'a circle'
                              }`,
                    timestamp:
                        membership.updatedAt
                })
            )

        const sessionActivity =
            recentSessions.map(
                session => ({
                    message: `Session '${session.title}' scheduled for ${
                        session.circleId
                            ?.topic ||
                        'a circle'
                    }`,
                    timestamp:
                        session.createdAt
                })
            )

        const recentActivity = [
            ...membershipActivity,
            ...sessionActivity
        ]
            .sort(
                (a, b) =>
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
            )
            .slice(0, 5)

        res.status(200).json({
            totalCircles:
                circles.length,

            totalMembers,

            pendingRequests,

            pendingPostApprovals,

            upcomingSessionsCount:
                upcomingSessions.length,

            upcomingSessions,

            recentActivity
        })
    } catch (error) {
        console.error(
            '[Get Dashboard Stats Error]',
            error
        )

        res.status(500).json({
            message:
                'Server error while fetching dashboard stats'
        })
    }
}