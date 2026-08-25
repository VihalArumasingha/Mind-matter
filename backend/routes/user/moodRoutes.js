import express from 'express'
import {getMoods, saveMood} from '../../controllers/user/moodController.js'
import authMiddleware from '../../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)
router.get('/', getMoods)
router.post('/', saveMood)

export default router
