import User from '../../models/User.js'
import ProfessionalApplication from '../../models/ProfessionalApplication.js'
import Report from '../../models/Report.js'

export const getVolunteerDashboard = async (req, res) => {
    try {
        const volunteerId = req.user._id

        // Get volunteer profile
        const volunteer = await User.findById(volunteerId)
        if (!volunteer) {
            return res.status(404).json({
                message: 'Volunteer not found'
            })
        }

        // Get pending professional applications count
        const pendingApplications = await ProfessionalApplication.countDocuments({
            status: 'pending'
        })

        // Get volunteer's professional application if exists
        const professionalApplication = await ProfessionalApplication.findOne({
            userId: volunteerId
        })

        // Get open reports count
        const openReports = await Report.countDocuments({
            status: 'open'
        })

        // Get volunteer's activity (reports they've submitted)
        const volunteerReports = await Report.find({
            reporterId: volunteerId
        }).sort({ createdAt: -1 }).limit(5)

        res.status(200).json({
            volunteer: {
                id: volunteer._id,
                name: volunteer.name,
                email: volunteer.email,
                role: volunteer.role,
                profilePicture: volunteer.profilePicture,
                bio: volunteer.bio,
                createdAt: volunteer.createdAt
            },
            statistics: {
                pendingApplications,
                openReports,
                totalReports: volunteerReports.length
            },
            professionalApplication,
            recentActivity: volunteerReports
        })
    } catch (error) {
        console.error('[Get Volunteer Dashboard Error]', error)
        res.status(500).json({
            message: 'Server error while getting volunteer dashboard'
        })
    }
}

export const getVolunteerApplications = async (req, res) => {
    try {
        const { status } = req.query
        const filter = status ? { status } : {}

        const applications = await ProfessionalApplication.find(filter)
            .populate('userId', 'name email profilePicture')
            .sort({ createdAt: -1 })

        res.status(200).json({
            applications
        })
    } catch (error) {
        console.error('[Get Volunteer Applications Error]', error)
        res.status(500).json({
            message: 'Server error while getting applications'
        })
    }
}

export const reviewApplication = async (req, res) => {
    try {
        const { applicationId } = req.params
        const { status, rejectionReason } = req.body

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be approved or rejected'
            })
        }

        const application = await ProfessionalApplication.findById(applicationId)

        if (!application) {
            return res.status(404).json({
                message: 'Application not found'
            })
        }

        application.status = status
        application.reviewedBy = req.user.name
        application.rejectionReason = rejectionReason || ''

        if (status === 'approved' && application.userId) {
            // Update user role to volunteer
            await User.findByIdAndUpdate(application.userId, {
                role: 'volunteer'
            })
        }

        await application.save()

        res.status(200).json({
            message: `Application ${status} successfully`,
            application
        })
    } catch (error) {
        console.error('[Review Application Error]', error)
        res.status(500).json({
            message: 'Server error while reviewing application'
        })
    }
}

export const getVolunteerReports = async (req, res) => {
    try {
        const { status } = req.query
        const filter = status ? { status } : {}

        const reports = await Report.find(filter)
            .populate('reporterId', 'name email profilePicture')
            .sort({ createdAt: -1 })

        res.status(200).json({
            reports
        })
    } catch (error) {
        console.error('[Get Volunteer Reports Error]', error)
        res.status(500).json({
            message: 'Server error while getting reports'
        })
    }
}

export const updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params
        const { status, actionTaken } = req.body

        if (!['investigating', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status'
            })
        }

        const report = await Report.findById(reportId)

        if (!report) {
            return res.status(404).json({
                message: 'Report not found'
            })
        }

        report.status = status
        report.actionTaken = actionTaken || ''
        report.resolvedBy = req.user.name

        await report.save()

        res.status(200).json({
            message: 'Report status updated successfully',
            report
        })
    } catch (error) {
        console.error('[Update Report Status Error]', error)
        res.status(500).json({
            message: 'Server error while updating report status'
        })
    }
}