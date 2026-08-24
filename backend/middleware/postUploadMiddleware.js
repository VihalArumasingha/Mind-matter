import multer from 'multer'

const postUpload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 10 * 1024 * 1024},
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
            callback(null, true)
        } else {
            callback(new Error('Post image must be a valid image file'))
        }
    },
})

export const uploadPostImage = postUpload.single('image')