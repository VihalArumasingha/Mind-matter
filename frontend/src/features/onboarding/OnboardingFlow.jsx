import React, {useState} from 'react'

import {submitOnboarding} from './services/onboardingService'
import OnboardingScreen from './screens/OnboardingScreen'
import OnboardingResultScreen from './screens/OnboardingResultScreen'

const OnboardingFlow = ({token, onFinished}) => {
    const [recommendations, setRecommendations] = useState(null)

    const handleComplete = async answers => {
        const data = await submitOnboarding(token, answers)
        setRecommendations(data.onboarding.recommendationCategories)
    }

    if (recommendations) {
        return (
            <OnboardingResultScreen
                token={token}
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