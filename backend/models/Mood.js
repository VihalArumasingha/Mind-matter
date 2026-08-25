import mongoose from 'mongoose'

const moodSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        mood: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        intensity: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        note: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ''
        },
        entryDate: {
            type: Date,
            required: true
        }
    },
    { timestamps: true }
)

moodSchema.index({user: 1, entryDate: 1}, {unique: true})
moodSchema.index({user: 1, entryDate: -1})

const Mood = mongoose.model('Mood', moodSchema)

export default Mood
