import SupportCircle from '../../../models/SupportCircle.js'
import {uploadToCloudinary} from '../../../middleware/uploadMiddleware.js'

export const updateCircleImages = async (req, res) => {
    try {
        const {id} = req.params
        const circle = await SupportCircle.findById(id)

        if (!circle) return res.status(404).json({message: 'Support circle not found'})

        if (circle.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({message: 'Only the circle owner can update circle images'})
        }

        const coverFile = req.files?.coverImage?.[0]
        const profileFile = req.files?.profileImage?.[0]

        if (!coverFile && !profileFile) {
            return res.status(400).json({message: 'At least one image must be provided'})
        }

        if (coverFile) {
            const image = await uploadToCloudinary(coverFile.buffer, 'mindmatter_support_circles/covers')
            circle.coverImage = image.secure_url
        }

        if (profileFile) {
            const image = await uploadToCloudinary(profileFile.buffer, 'mindmatter_support_circles/profiles')
            circle.profileImage = image.secure_url
        }

        await circle.save()
        return res.status(200).json({message: 'Circle images updated successfully', circle})
    } catch (error) {
        console.error('[Update Circle Images Error]', error)
        return res.status(500).json({message: error.message || 'Server error while updating circle images'})
    }
}
