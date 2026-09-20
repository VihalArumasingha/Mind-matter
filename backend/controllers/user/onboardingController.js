import OnboardingResponse from '../../models/OnboardingResponse.js'
import {generateRecommendations} from '../../utils/onboardingRecommendations.js'

export const getOnboardingStatus = async (req, res) => {
    try {
        const onboarding = await OnboardingResponse.findOne({
            userId: req.user._id
        })

        res.status(200).json({
            completed: Boolean(onboarding?.completedAt)
        })
    } catch (error) {
        console.error('[Get Onboarding Status Error]', error)

        res.status(500).json({
            message: 'Server error while checking onboarding status'
        })
    }
}

export const submitOnboarding = async (req, res) => {
    try {
        const {
            supportArea,
            currentFeeling,
            preferredSupport,
            socialConnection,
            personalGoal
        } = req.body

        const answers = {
            supportArea,
            currentFeeling,
            preferredSupport,
            socialConnection,
            personalGoal
        }

        const recommendationCategories =
            generateRecommendations(answers)

        const onboarding = await OnboardingResponse.findOneAndUpdate(
            {
                userId: req.user._id
            },
            {
                userId: req.user._id,
                answers,
                recommendationCategories,
                completedAt: new Date()
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        )

        res.status(200).json({
            message: 'Onboarding completed successfully',
            onboarding
        })
    } catch (error) {
        console.error('[Submit Onboarding Error]', error)

        res.status(500).json({
            message: 'Server error while saving onboarding responses'
        })
    }
}

export const getOnboarding = async (req, res) => {
    try {
        const onboarding = await OnboardingResponse.findOne({
            userId: req.user._id
        })

        if (!onboarding) {
            return res.status(404).json({
                message: 'Onboarding has not been completed'
            })
        }

        res.status(200).json({
            onboarding
        })
    } catch (error) {
        console.error('[Get Onboarding Error]', error)

        res.status(500).json({
            message: 'Server error while fetching onboarding'
        })
    }
}