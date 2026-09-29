import mongoose from 'mongoose'
import GroupMessage from '../../../models/GroupMessage.js'
import GroupMembership from '../../../models/GroupMembership.js'
import SupportCircle from '../../../models/SupportCircle.js'

const isValidId = id => mongoose.isValidObjectId(id)

const messagePopulation = {path: 'sender', select: 'name profilePicture'}

export const getCircleMessages = async (req, res) => {
    try {
        const {circleId} = req.params

        if (!isValidId(circleId)) {
            return res.status(400).json({message: 'Invalid support circle id'})
        }

        const circle = await SupportCircle.findOne({_id: circleId, status: 'active'})

        if (!circle) {
            return res.status(404).json({message: 'Support circle not found'})
        }

        const messages = await GroupMessage.find({circleId})
            .sort({createdAt: -1})
            .limit(100)
            .populate(messagePopulation)

        res.status(200).json({messages: messages.reverse()})
    } catch (error) {
        console.error('[Get Circle Messages Error]', error)
        res.status(500).json({message: 'Server error while fetching community messages'})
    }
}

export const createCircleMessage = async (req, res) => {
    try {
        const {circleId} = req.params
        const content = typeof req.body.content === 'string' ? req.body.content.trim() : ''

        if (!isValidId(circleId)) {
            return res.status(400).json({message: 'Invalid support circle id'})
        }

        if (!content) {
            return res.status(400).json({message: 'Message cannot be empty'})
        }

        if (content.length > 2000) {
            return res.status(400).json({message: 'Message cannot exceed 2000 characters'})
        }

        const circle = await SupportCircle.findOne({_id: circleId, status: 'active'})

        if (!circle) {
            return res.status(404).json({message: 'Support circle not found'})
        }

        const membership = await GroupMembership.findOne({
            userId: req.user._id,
            groupId: circleId,
            status: 'approved'
        })

        if (!membership) {
            return res.status(403).json({message: 'Only approved community members can send messages'})
        }

        const message = await GroupMessage.create({
            circleId,
            sender: req.user._id,
            content
        })

        res.status(201).json({
            message: await GroupMessage.findById(message._id).populate(messagePopulation)
        })
    } catch (error) {
        console.error('[Create Circle Message Error]', error)
        res.status(500).json({message: 'Server error while sending community message'})
    }
}