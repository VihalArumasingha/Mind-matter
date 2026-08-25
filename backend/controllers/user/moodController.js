import Mood from '../../models/Mood.js'

const startOfDay = date => {
    const value = new Date(date)
    value.setHours(0, 0, 0, 0)
    return value
}

export const saveMood = async (req, res) => {
    try {
        const mood = Number(req.body.mood)
        const intensity = Number(req.body.intensity)
        const note = typeof req.body.note === 'string' ? req.body.note.trim() : ''

        if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
            return res.status(400).json({message: 'Mood must be a whole number from 1 to 5'})
        }

        if (!Number.isInteger(intensity) || intensity < 1 || intensity > 10) {
            return res.status(400).json({message: 'Intensity must be a whole number from 1 to 10'})
        }

        if (note.length > 200) {
            return res.status(400).json({message: 'Note cannot exceed 200 characters'})
        }

        const entryDate = startOfDay(new Date())
        const savedMood = await Mood.findOneAndUpdate(
            {user: req.user._id, entryDate},
            {user: req.user._id, mood, intensity, note, entryDate},
            {new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true}
        )

        res.status(200).json({mood: savedMood})
    } catch (error) {
        console.error('[Save Mood Error]', error)
        res.status(500).json({message: 'Server error while saving mood'})
    }
}

export const getMoods = async (req, res) => {
    try {
        const moods = await Mood.find({user: req.user._id})
            .sort({entryDate: -1})
            .limit(365)

        res.status(200).json({moods})
    } catch (error) {
        console.error('[Get Moods Error]', error)
        res.status(500).json({message: 'Server error while loading mood history'})
    }
}
