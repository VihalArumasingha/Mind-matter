import User from '../../models/User.js'
import ProfessionalApplication from '../../models/ProfessionalApplication.js'
import Availability from '../../models/Availability.js'
import AvailabilitySlot from '../../models/AvailabilitySlot.js'
import Booking from '../../models/Booking.js'

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
        console.log(`[Availability] Fetching availability for professional ID: ${id}`);

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

        console.log(`[Availability] Target user IDs for availability:`, targetUserIds);

        const [availability, slots, existingBookings] = await Promise.all([
            Availability.findOne({ user: { $in: targetUserIds } }),
            AvailabilitySlot.find({ user: { $in: targetUserIds } }).sort({ date: 1, start: 1 }),
            Booking.find({
                professional: id,
                status: { $in: ['pending', 'confirmed', 'approved', 'completed'] }
            })
        ]);

        console.log(`[Availability] DEBUG: Found ${existingBookings.length} existing bookings for professional ${id}`);
        console.log(`[Availability] DEBUG: All bookings:`, existingBookings.map(b => ({
            id: b._id,
            professional: b.professional,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.status
        })));

        // Create a comprehensive set of booked time ranges for filtering
        const bookedTimeRanges = existingBookings.map(booking => ({
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime
        }));

        // Helper function to check if a time slot overlaps with any booked slot
        const isSlotBooked = (date, start, end) => {
            console.log(`[isSlotBooked] Checking slot: ${date} ${start}-${end} against ${bookedTimeRanges.length} bookings`);
            const isBooked = bookedTimeRanges.some(booking => {
                if (booking.date !== date) return false;
                // Check for time overlap
                const overlaps = (start < booking.endTime && end > booking.startTime);
                if (overlaps) {
                    console.log(`[isSlotBooked] MATCH: Slot ${date} ${start}-${end} overlaps with booking ${booking.date} ${booking.startTime}-${booking.endTime}`);
                }
                return overlaps;
            });
            console.log(`[isSlotBooked] Result for ${date} ${start}-${end}: ${isBooked}`);
            return isBooked;
        };

        console.log(`[Availability] Found ${existingBookings.length} existing bookings for professional ${id}`);
        console.log(`[Availability] Existing bookings details:`, existingBookings.map(b => ({
            id: b._id,
            professional: b.professional,
            date: b.date,
            time: `${b.startTime}-${b.endTime}`,
            status: b.status
        })));
        console.log(`[Availability] Booked time ranges:`, bookedTimeRanges);

        const slotsByDate = {};
        let filteredCount = 0;
        slots.forEach((slot) => {
            const dateKey = slot.date;
            if (!slotsByDate[dateKey]) {
                slotsByDate[dateKey] = [];
            }

            // Only include slots that are not booked
            if (!isSlotBooked(slot.date, slot.start, slot.end)) {
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
            } else {
                filteredCount++;
                console.log(`[Availability] Filtered out booked slot: ${slot.date} ${slot.start}-${slot.end}`);
            }
        });

        console.log(`[Availability] Total slots: ${slots.length}, Filtered out: ${filteredCount}, Available: ${slots.length - filteredCount}`);

        const availableDates = Object.keys(slotsByDate).filter(
            (d) => slotsByDate[d] && slotsByDate[d].length > 0
        );

        return res.status(200).json({
            success: true,
            data: {
                isAvailable: availability ? availability.isAvailable : true,
                slotsByDate,
                availableDates,
                bookedTimeRanges, // Include booked time ranges for frontend filtering
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

export const createBooking = async (req, res) => {
    try {
        const {
            professionalId,
            professionalName,
            profession,
            date,
            startTime,
            endTime,
            fullName,
            phone,
            reason,
            notes,
        } = req.body;

        if (!professionalId || !date || !startTime || !endTime || !fullName || !phone || !reason) {
            return res.status(400).json({
                success: false,
                message: 'All required fields (professionalId, date, startTime, endTime, fullName, phone, reason) must be provided',
            });
        }

        // Check if this slot is already booked
        console.log(`[Create Booking] Checking for existing bookings for professionalId: ${professionalId}, date: ${date}, time: ${startTime}-${endTime}`);
        const existingBooking = await Booking.findOne({
            professional: professionalId,
            date,
            startTime,
            endTime,
            status: { $in: ['pending', 'confirmed', 'approved', 'completed'] }
        });

        console.log(`[Create Booking] Existing booking found:`, existingBooking ? 'YES' : 'NO');
        if (existingBooking) {
            console.log(`[Create Booking] Existing booking details:`, existingBooking);
            return res.status(409).json({
                success: false,
                message: 'This time slot is already booked. Please select a different time.',
            });
        }

        const newBooking = await Booking.create({
            user: req.user._id,
            professional: professionalId,
            professionalName: professionalName || 'Professional',
            profession: profession || 'Therapist',
            date,
            startTime,
            endTime,
            fullName,
            phone,
            reason,
            notes: notes || '',
            status: 'pending',
        });

        console.log(`[Create Booking] Saved booking ID=${newBooking._id} for user=${req.user._id}`);
        console.log(`[Create Booking] Details:`, {
            professionalName: newBooking.professionalName,
            profession: newBooking.profession,
            date: newBooking.date,
            time: `${newBooking.startTime}-${newBooking.endTime}`,
            fullName: newBooking.fullName,
            phone: newBooking.phone,
            reason: newBooking.reason,
            notes: newBooking.notes,
            status: newBooking.status
        });

        return res.status(201).json({
            success: true,
            message: 'Session booking created successfully',
            booking: newBooking,
        });
    } catch (error) {
        console.error('[Create Booking Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Server error creating session booking: ' + error.message,
        });
    }
}

export const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            bookings,
        });
    } catch (error) {
        console.error('[Get User Bookings Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching bookings',
        });
    }
}


