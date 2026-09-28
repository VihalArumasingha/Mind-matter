import multer from 'multer'

const circleImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 10 * 1024 * 1024},
    fileFilter: (req, file, callback) => {
        if (file.mimetype?.startsWith('image/')) callback(null, true)
        else callback(new Error('Circle images must be valid image files'))
    },
})

export const uploadCircleImages = circleImageUpload.fields([
    {name: 'coverImage', maxCount: 1},
    {name: 'profileImage', maxCount: 1},
])
