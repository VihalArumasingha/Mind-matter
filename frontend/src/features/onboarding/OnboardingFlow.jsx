import React, {useState} from 'react'
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native'

import {submitOnboarding} from './services/onboardingService'
import OnboardingScreen from './screens/OnboardingScreen'
import OnboardingResultScreen from './screens/OnboardingResultScreen'

const OnboardingFlow = ({token, onFinished}) => {
    const [recommendations, setRecommendations] = useState(null)
    const [error, setError] = useState('')

    const handleComplete = async answers => {
        try {
            setError('')

            const data = await submitOnboarding(
                token,
                answers
            )

            setRecommendations(
                data.onboarding.recommendationCategories
            )
        } catch (error) {
            setError(error.message)
            throw error
        }
    }

    if (error && !recommendations) {
        // The error is already displayed by OnboardingScreen.
    }

    if (recommendations) {
        return (
            <OnboardingResultScreen
                recommendations={recommendations}
                onContinue={onFinished}
            />
        )
    }

    return (
        <OnboardingScreen
            onComplete={handleComplete}
        />
    )
}

export default OnboardingFlow