import express from 'express'
<<<<<<< HEAD
import authMiddleware from '../middleware/authMiddleware.js'
import upload from '../middleware/uploadMiddleware.js'
=======
>>>>>>> origin/main
import {
    addComment,
    createPost,
    deleteComment,
    deletePost,
    getFeedPosts,
    getMyPosts,
<<<<<<< HEAD
    updateComment,
    updatePost,
} from '../controllers/postController.js'
=======
    getPost,
    updateComment,
    updatePost
} from '../controllers/postController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import {uploadPostImage} from '../middleware/postUploadMiddleware.js'
>>>>>>> origin/main

const router = express.Router()

router.use(authMiddleware)
<<<<<<< HEAD

router.get('/', getFeedPosts)
router.get('/mine', getMyPosts)
router.post('/', upload.single('image'), createPost)
router.put('/:id', upload.single('image'), updatePost)
=======
router.get('/', getFeedPosts)
router.get('/mine', getMyPosts)
router.get('/:id', getPost)
router.post('/', uploadPostImage, createPost)
router.put('/:id', uploadPostImage, updatePost)
>>>>>>> origin/main
router.delete('/:id', deletePost)
router.post('/:id/comments', addComment)
router.put('/:id/comments/:commentId', updateComment)
router.delete('/:id/comments/:commentId', deleteComment)

export default router