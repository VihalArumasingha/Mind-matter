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

const recommendationKeywords = {
    'Stress Management': ['stress', 'overwhelm', 'burnout', 'pressure', 'relaxation'],
    'Anxiety Support': ['anxiety', 'anxious', 'worry', 'panic'],
    'Relationships and Communication': ['relationship', 'communication', 'family', 'conflict'],
    'Social Connection': ['social', 'connection', 'loneliness', 'lonely', 'isolation', 'friendship'],
    'Grief and Loss Support': ['grief', 'loss', 'bereavement', 'mourning'],
    'Self-Confidence': ['confidence', 'self-esteem', 'self esteem'],
    'General Wellbeing': ['wellbeing', 'wellness', 'self-care', 'self care'],
    'Emotional Wellbeing': ['emotional', 'feelings', 'wellbeing'],
    'Peer Support': ['peer', 'support group', 'sharing experiences'],
    'Support Communities': ['community', 'communities', 'group support'],
    'Professional Support': ['professional', 'therapy', 'therapist', 'counseling'],
    'Coping Strategies': ['coping', 'resilience', 'strategies'],
    'Wellness Resources': ['resources', 'wellness', 'wellbeing'],
}

export const scoreCommunityForRecommendations = (circle, categories) => {
    const searchableText = [
        circle.topic,
        circle.category,
        circle.description,
        circle.rules,
    ].filter(Boolean).join(' ').toLowerCase()

    return categories.reduce((score, category) => {
        const normalizedCategory = category.toLowerCase()
        const keywords = recommendationKeywords[category] || [normalizedCategory]
        const exactMatch = searchableText.includes(normalizedCategory) ? 5 : 0
        const keywordMatches = keywords.filter(keyword =>
            searchableText.includes(keyword.toLowerCase()),
        ).length

        return score + exactMatch + keywordMatches * 2
    }, 0)
}