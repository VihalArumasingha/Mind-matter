import express from 'express'
import authMiddleware from '../../../middleware/authMiddleware.js'
import {
    createCircleMessage,
    getCircleMessages
} from '../../../controllers/supportCircleOrganizer/groupPost/groupChatController.js'

const router = express.Router()

router.use(authMiddleware)
router.get('/circle/:circleId', getCircleMessages)
router.post('/circle/:circleId', createCircleMessage)

export default router