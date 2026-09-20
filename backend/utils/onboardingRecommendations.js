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
    }

    if (supportArea === 'anxiety') {
        recommendations.add('Anxiety Support')
    }

    if (supportArea === 'relationships') {
        recommendations.add('Relationships and Communication')
    }

    if (supportArea === 'loneliness') {
        recommendations.add('Social Connection')
    }

    if (supportArea === 'grief') {
        recommendations.add('Grief and Loss Support')
    }

    if (supportArea === 'confidence') {
        recommendations.add('Self-Confidence')
    }

    if (supportArea === 'wellbeing') {
        recommendations.add('General Wellbeing')
    }

    if (currentFeeling === 'overwhelmed') {
        recommendations.add('Stress Management')
    }

    if (currentFeeling === 'stressed') {
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
    }

    if (preferredSupport === 'community') {
        recommendations.add('Support Communities')
    }

    if (preferredSupport === 'professional') {
        recommendations.add('Professional Support')
    }

    if (preferredSupport === 'coping') {
        recommendations.add('Coping Strategies')
    }

    if (preferredSupport === 'resources') {
        recommendations.add('Wellness Resources')
    }

    if (
        socialConnection === 'more_connection' ||
        socialConnection === 'isolated'
    ) {
        recommendations.add('Social Connection')
        recommendations.add('Support Communities')
    }

    if (personalGoal === 'stress') {
        recommendations.add('Stress Management')
    }

    if (personalGoal === 'feelings') {
        recommendations.add('Emotional Wellbeing')
    }

    if (personalGoal === 'confidence') {
        recommendations.add('Self-Confidence')
    }

    if (personalGoal === 'relationships') {
        recommendations.add('Relationships and Communication')
    }

    if (personalGoal === 'connection') {
        recommendations.add('Social Connection')
    }

    if (personalGoal === 'wellbeing') {
        recommendations.add('General Wellbeing')
    }

    return [...recommendations]
}