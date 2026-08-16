import User from '../../models/User.js'

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