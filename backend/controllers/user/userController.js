import User from '../../models/User.js'
import ProfessionalApplication from '../../models/ProfessionalApplication.js'
import Availability from '../../models/Availability.js'
import AvailabilitySlot from '../../models/AvailabilitySlot.js'

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

export const getProfessionCategories = async (req, res) => {
    try {
        // Get unique profession categories from approved professionals
        const uniqueProfessions = await ProfessionalApplication.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: '$profession' } },
            { $sort: { _id: 1 } }
        ])

        // Default categories if no professionals exist
        const defaultCategories = [
            'Clinical Psychologist',
            'Licensed Counselor (LPC)',
            'Psychiatrist (MD)',
            'Licensed Social Worker (LCSW)',
            'Therapist',
            'CBT Specialist',
            'Psychologist'
        ]

        const categories = uniqueProfessions.length > 0 
            ? uniqueProfessions.map(p => p._id)
            : defaultCategories

        res.status(200).json({
            success: true,
            categories
        })
    } catch (error) {
        console.error('[Get Profession Categories Error]', error)

        res.status(500).json({
            success: false,
            message: 'Server error while fetching profession categories'
        })
    }
}

export const getProfessionalAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        let targetUserIds = [id];
        const profApp = await ProfessionalApplication.findById(id);
        if (profApp) {
            if (profApp.userId) {
                targetUserIds.push(profApp.userId);
            }
            if (profApp.email) {
                const userByEmail = await User.findOne({ email: profApp.email.toLowerCase() });
                if (userByEmail) {
                    targetUserIds.push(userByEmail._id);
                }
            }
        } else {
            const userById = await User.findById(id);
            if (userById && userById.email) {
                targetUserIds.push(userById._id);
                const appByEmail = await ProfessionalApplication.findOne({ email: userById.email.toLowerCase() });
                if (appByEmail) {
                    targetUserIds.push(appByEmail._id);
                }
            }
        }

        const [availability, slots] = await Promise.all([
            Availability.findOne({ user: { $in: targetUserIds } }),
            AvailabilitySlot.find({ user: { $in: targetUserIds } }).sort({ date: 1, start: 1 })
        ]);

        const slotsByDate = {};
        slots.forEach((slot) => {
            const dateKey = slot.date;
            if (!slotsByDate[dateKey]) {
                slotsByDate[dateKey] = [];
            }
            slotsByDate[dateKey].push({
                id: String(slot._id),
                date: slot.date,
                start: slot.start,
                end: slot.end,
                slotDuration: slot.slotDuration || '',
                breakStart: slot.breakStart || '',
                breakEnd: slot.breakEnd || '',
                breakDuration: slot.breakDuration || '',
            });
        });

        const availableDates = Object.keys(slotsByDate).filter(
            (d) => slotsByDate[d] && slotsByDate[d].length > 0
        );

        return res.status(200).json({
            success: true,
            data: {
                isAvailable: availability ? availability.isAvailable : true,
                slotsByDate,
                availableDates,
            }
        });
    } catch (error) {
        console.error('[Get Professional Availability Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching professional availability'
        });
    }
}
