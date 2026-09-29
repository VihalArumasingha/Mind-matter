import OnboardingResponse from '../../models/OnboardingResponse.js'
import SupportCircle from '../../models/SupportCircle.js'
import GroupMembership from '../../models/GroupMembership.js'
import { generateRecommendations } from '../../utils/onboardingRecommendations.js'
import { scoreCommunityForRecommendations } from '../../utils/onboardingRecommendations.js'

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

        const requiredAnswers = {
            supportArea,
            currentFeeling,
            preferredSupport,
            socialConnection,
            personalGoal
        }

        const missingAnswer = Object.entries(requiredAnswers)
            .find(([, value]) => !value)

        if (missingAnswer) {
            return res.status(400).json({
                message: 'Please answer all five onboarding questions'
            })
        }

        const answers = requiredAnswers

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

export const getRecommendedCommunities = async (req, res) => {
    try {
        const onboarding = await OnboardingResponse.findOne({userId: req.user._id})

        if (!onboarding?.completedAt) {
            return res.status(404).json({message: 'Complete onboarding to get community recommendations'})
        }

        const [circles, memberships] = await Promise.all([
            SupportCircle.find({status: 'active'}).lean(),
            GroupMembership.find({userId: req.user._id}).select('groupId status').lean(),
        ])

        const membershipByCircle = new Map(
            memberships.map(membership => [membership.groupId.toString(), membership.status]),
        )
        const categories = onboarding.recommendationCategories || []
        const communities = circles
            .map(circle => ({
                ...circle,
                membershipStatus: membershipByCircle.get(circle._id.toString()) || null,
                recommendationScore: scoreCommunityForRecommendations(circle, categories),
            }))
            .sort((left, right) => {
                if (right.recommendationScore !== left.recommendationScore) {
                    return right.recommendationScore - left.recommendationScore
                }

                return new Date(right.createdAt) - new Date(left.createdAt)
            })
            .slice(0, 3)
            .map(({recommendationScore, ...circle}) => circle)

        res.status(200).json({communities, recommendationCategories: categories})
    } catch (error) {
        console.error('[Get Recommended Communities Error]', error)
        res.status(500).json({message: 'Server error while recommending communities'})
    }
}