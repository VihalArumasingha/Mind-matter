import mongoose from 'mongoose'

const onboardingResponseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    answers: {
        supportArea: {
            type: String,
            required: true
        },
        currentFeeling: {
            type: String,
            required: true
        },
        preferredSupport: {
            type: String,
            required: true
        },
        socialConnection: {
            type: String,
            required: true
        },
        personalGoal: {
            type: String,
            required: true
        }
    },

    recommendationCategories: {
        type: [String],
        default: []
    },

    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

const OnboardingResponse =
    mongoose.model('OnboardingResponse', onboardingResponseSchema)

export default OnboardingResponse