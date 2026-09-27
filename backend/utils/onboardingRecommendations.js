export const generateRecommendations = answers => {
    const recommendations = new Set()
    const {
        supportArea,
        currentFeeling,
        preferredSupport,
        socialConnection,
        personalGoal
    } = answers

    if (supportArea === 'stress') {
        recommendations.add('Stress Management')
    } else if (supportArea === 'anxiety') {
        recommendations.add('Anxiety Support')
    } else if (supportArea === 'relationships') {
        recommendations.add('Relationships and Communication')
    } else if (supportArea === 'loneliness') {
        recommendations.add('Social Connection')
    } else if (supportArea === 'grief') {
        recommendations.add('Grief and Loss Support')
    } else if (supportArea === 'confidence') {
        recommendations.add('Self-Confidence')
    } else if (supportArea === 'wellbeing') {
        recommendations.add('General Wellbeing')
    }

    if (currentFeeling === 'overwhelmed' ||
        currentFeeling === 'stressed') {
        recommendations.add('Stress Management')
    }

    if (currentFeeling === 'anxious') {
        recommendations.add('Anxiety Support')
    }

    if (currentFeeling === 'lonely') {
        recommendations.add('Social Connection')
    }

    if (currentFeeling === 'difficult') {
        recommendations.add('Peer Support')
    }

    if (preferredSupport === 'talking') {
        recommendations.add('Peer Support')
    } else if (preferredSupport === 'community') {
        recommendations.add('Support Communities')
    } else if (preferredSupport === 'professional') {
        recommendations.add('Professional Support')
    } else if (preferredSupport === 'coping') {
        recommendations.add('Coping Strategies')
    } else if (preferredSupport === 'resources') {
        recommendations.add('Wellness Resources')
    }

    if (socialConnection === 'more_connection' ||
        socialConnection === 'isolated') {
        recommendations.add('Social Connection')
        recommendations.add('Support Communities')
    }

    if (personalGoal === 'stress') {
        recommendations.add('Stress Management')
    } else if (personalGoal === 'feelings') {
        recommendations.add('Emotional Wellbeing')
    } else if (personalGoal === 'confidence') {
        recommendations.add('Self-Confidence')
    } else if (personalGoal === 'relationships') {
        recommendations.add('Relationships and Communication')
    } else if (personalGoal === 'connection') {
        recommendations.add('Social Connection')
    } else if (personalGoal === 'wellbeing') {
        recommendations.add('General Wellbeing')
    }

    return [...recommendations]
}