import User from '../../models/User.js'
import ProfessionalApplication from '../../models/ProfessionalApplication.js'

export const getCurrentUser = async (req, res) => {
    try {
        res.status(200).json({
            user: req.user
        })
    } catch (error) {
        console.error('[Get Current User Error]', error)

        res.status(500).json({
            message: 'Server error while getting user profile'
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { name, email, bio, profilePicture } = req.body

        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({
                email,
                _id: { $ne: user._id }
            })

            if (existingUser) {
                return res.status(409).json({
                    message: 'An account with this email already exists'
                })
            }

            user.email = email
        }

        if (name !== undefined) {
            user.name = name
        }

        if (bio !== undefined) {
            user.bio = bio
        }

        if (profilePicture !== undefined) {
            user.profilePicture = profilePicture
        }

        await user.save()

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                bio: user.bio,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        })
    } catch (error) {
        console.error('[Update Profile Error]', error)

        res.status(500).json({
            message: 'Server error while updating profile'
        })
    }
}

export const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        await User.findByIdAndDelete(req.user._id)

        res.status(200).json({
            message: 'Account deleted successfully'
        })
    } catch (error) {
        console.error('[Delete Account Error]', error)

        res.status(500).json({
            message: 'Server error while deleting account'
        })
    }
}

export const getApprovedProfessionals = async (req, res) => {
    try {
        const { search = '', specialization = '' } = req.query

        let filter = { status: 'approved' }

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } },
                { profession: { $regex: search, $options: 'i' } }
            ]
        }

        if (specialization) {
            filter.profession = { $regex: specialization, $options: 'i' }
        }

        const professionals = await ProfessionalApplication.find(filter)
            .select('-documents')
            .sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            professionals
        })
    } catch (error) {
        console.error('[Get Approved Professionals Error]', error)

        res.status(500).json({
            success: false,
            message: 'Server error while fetching professionals'
        })
    }
}