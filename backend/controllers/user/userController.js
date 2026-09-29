import User from '../../models/User.js'
import ProfessionalApplication from '../../models/ProfessionalApplication.js'
import Availability from '../../models/Availability.js'
import AvailabilitySlot from '../../models/AvailabilitySlot.js'
import Booking from '../../models/Booking.js'
import Notification from '../../models/Notification.js'
import {uploadToCloudinary} from '../../middleware/uploadMiddleware.js'

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

        if (req.file) {
            const image = await uploadToCloudinary(req.file.buffer, 'mindmatter_profile_pictures')
            user.profilePicture = image.secure_url
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

        // Filter out Community Organizers from results
        const filteredProfessionals = professionals.filter(prof => prof.profession !== 'Community Organizer')

        res.status(200).json({
            success: true,
            professionals: filteredProfessionals
        })

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
            ? uniqueProfessions.map(p => p._id).filter(cat => cat !== 'Community Organizer')
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
        let targetProfessionalId = id;
        
        const profApp = await ProfessionalApplication.findById(id);
        if (profApp) {
            if (profApp.userId) {
                targetUserIds.push(profApp.userId);
                targetProfessionalId = profApp.userId;
            }
            if (profApp.email) {
                const userByEmail = await User.findOne({ email: profApp.email.toLowerCase() });
                if (userByEmail) {
                    targetUserIds.push(userByEmail._id);
                    if (!targetProfessionalId || targetProfessionalId === id) {
                        targetProfessionalId = userByEmail._id;
                    }
                }
            }
        } else {
            const userById = await User.findById(id);
            if (userById && userById.email) {
                targetUserIds.push(userById._id);
                targetProfessionalId = userById._id;
                const appByEmail = await ProfessionalApplication.findOne({ email: userById.email.toLowerCase() });
                if (appByEmail) {
                    targetUserIds.push(appByEmail._id);
                }
            }
        }

        console.log(`[Availability] Target user IDs for availability:`, targetUserIds);
        console.log(`[Availability] Target professional ID for bookings:`, targetProfessionalId);

        // Limit bookings query to prevent performance issues
        const [availability, slots, existingBookings] = await Promise.all([
            Availability.findOne({ user: { $in: targetUserIds } }),
            AvailabilitySlot.find({ user: { $in: targetUserIds } }).sort({ date: 1, start: 1 }).limit(100),
            Booking.find({
                professional: targetProfessionalId,
                status: { $in: ['pending', 'confirmed', 'approved', 'completed'] }
            }).limit(100)
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

        // Validate date and time are not in the past
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (date < todayStr) {
            return res.status(400).json({
                success: false,
                message: 'Cannot book appointments for past dates.',
            });
        }

        if (date === todayStr) {
            const parseTimeToMinutes = (timeStr) => {
                if (!timeStr || typeof timeStr !== 'string') return null;
                const str = timeStr.trim().toUpperCase();
                const match12 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
                if (match12) {
                    let hours = parseInt(match12[1], 10);
                    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
                    const period = match12[3];
                    if (hours === 12) hours = period === 'AM' ? 0 : 12;
                    else if (period === 'PM') hours += 12;
                    return hours * 60 + minutes;
                }
                const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
                if (match24) {
                    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
                }
                return null;
            };

            const slotMinutes = parseTimeToMinutes(startTime);
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            if (slotMinutes !== null && slotMinutes <= currentMinutes) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot book time slots that have already passed.',
                });
            }
        }

        // Check if this slot is already booked
        console.log(`[Create Booking] Checking for existing bookings for professionalId: ${professionalId}, date: ${date}, time: ${startTime}-${endTime}`);
        
        // Try to find the actual User ID for the professional
        let targetProfessionalId = professionalId;
        const profApp = await ProfessionalApplication.findById(professionalId);
        if (profApp && profApp.userId) {
            targetProfessionalId = profApp.userId;
            console.log(`[Create Booking] Found user ID ${targetProfessionalId} for professional application ${professionalId}`);
        } else {
            // If no userId in profApp, check if professionalId is already a User ID
            const userCheck = await User.findById(professionalId);
            if (userCheck) {
                console.log(`[Create Booking] professionalId ${professionalId} is already a User ID`);
                targetProfessionalId = professionalId;
            }
        }
        
        const existingBooking = await Booking.findOne({
            professional: targetProfessionalId,
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
            professional: targetProfessionalId, // Use the resolved User ID
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

export const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ 
            userId: req.user._id, 
            isRead: false 
        });

        return res.status(200).json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('[Get User Notifications Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching notifications',
        });
    }
}

export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { isRead: true },
            { returnDocument: 'after' }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        return res.status(200).json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('[Mark Notification As Read Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Server error marking notification as read',
        });
    }
}


