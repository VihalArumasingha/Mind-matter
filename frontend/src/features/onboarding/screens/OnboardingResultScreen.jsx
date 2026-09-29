import React, {useCallback, useEffect, useState} from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import {getRecommendedCommunities} from '../services/onboardingService'
import {requestToJoinCircle} from '../../organizer/services/supportCircleService'

const OnboardingResultScreen = ({
    token,
    recommendations,
    onContinue
}) => {
    const [communities, setCommunities] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [joiningCircleId, setJoiningCircleId] = useState(null)

    const loadRecommendations = useCallback(async () => {
        try {
            setLoadError('')
            const data = await getRecommendedCommunities(token)
            setCommunities(data.communities || [])
        } catch (error) {
            setLoadError(error.message || 'Unable to load community recommendations')
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useEffect(() => {
        loadRecommendations()
    }, [loadRecommendations])

    const handleJoin = async circle => {
        if (joiningCircleId) return

        try {
            setJoiningCircleId(circle._id)
            const data = await requestToJoinCircle(token, circle._id)
            setCommunities(current => current.map(item =>
                item._id === circle._id
                    ? {...item, membershipStatus: data.membership.status}
                    : item,
            ))
        } catch (error) {
            Alert.alert('Unable to request to join', error.message)
        } finally {
            setJoiningCircleId(null)
        }
    }

    const membershipLabel = status => {
        if (status === 'approved') return 'Joined'
        if (status === 'pending') return 'Request pending'
        if (status === 'rejected') return 'Request rejected'
        if (status === 'removed') return 'Membership removed'
        return 'Request to join'
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>✓</Text>
                </View>

                <Text style={styles.title}>
                    We've got some ideas for you
                </Text>

                <Text style={styles.subtitle}>
                    Based on your answers, these are some
                    support areas that may be useful to explore.
                </Text>

                <Text style={styles.cardTitle}>Top communities for you</Text>

                {isLoading ? (
                    <ActivityIndicator style={styles.loader} size="large" color="#4E8C4A" />
                ) : loadError ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{loadError}</Text>
                        <Pressable style={styles.retryButton} onPress={loadRecommendations}>
                            <Text style={styles.retryButtonText}>Try again</Text>
                        </Pressable>
                    </View>
                ) : communities.length ? (
                    communities.map(community => {
                        const status = community.membershipStatus
                        const isMember = status === 'approved'
                        const canRequest = !status

                        return (
                            <View key={community._id} style={styles.communityCard}>
                                <View style={styles.communityHeader}>
                                    <View style={styles.communityLogo}>
                                        {community.profileImage ? (
                                            <Image source={{uri: community.profileImage}} style={styles.communityLogoImage} />
                                        ) : (
                                            <Text style={styles.communityLogoFallback}>♥</Text>
                                        )}
                                    </View>
                                    <View style={styles.communityInfo}>
                                        <Text style={styles.communityName}>{community.topic}</Text>
                                        {community.category ? (
                                            <Text style={styles.communityCategory}>{community.category}</Text>
                                        ) : null}
                                    </View>
                                </View>
                                <Text numberOfLines={2} style={styles.communityDescription}>
                                    {community.description}
                                </Text>
                                <View style={styles.communityActions}>
                                    <Pressable
                                        style={styles.viewButton}
                                        onPress={() => onContinue(community._id)}>
                                        <Text style={styles.viewButtonText}>View community</Text>
                                    </Pressable>
                                    <Pressable
                                        disabled={!canRequest || joiningCircleId === community._id}
                                        style={[
                                            styles.joinButton,
                                            !canRequest && styles.joinButtonDisabled,
                                        ]}
                                        onPress={() => handleJoin(community)}>
                                        <Text style={[
                                            styles.joinButtonText,
                                            !canRequest && styles.joinButtonTextDisabled,
                                        ]}>
                                            {joiningCircleId === community._id
                                                ? 'Sending...'
                                                : membershipLabel(status)}
                                        </Text>
                                    </Pressable>
                                </View>
                                {isMember ? (
                                    <Text style={styles.memberNote}>You are already a member of this community.</Text>
                                ) : null}
                            </View>
                        )
                    })
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>There are no active communities to recommend yet.</Text>
                    </View>
                )}

                {recommendations.length ? (
                    <Text style={styles.matchingAreas}>
                        Matched to your interests: {recommendations.slice(0, 3).join(' · ')}
                    </Text>
                ) : null}

                <Text style={styles.disclaimer}>
                    These recommendations are based on your
                    answers and preferences. They are not a
                    medical diagnosis.
                </Text>

                <Pressable
                    style={styles.button}
                    onPress={onContinue}>
                    <Text style={styles.buttonText}>
                        Continue to MindMatter
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAF5'
    },

    container: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center'
    },

    iconContainer: {
        alignSelf: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E5F1E2',
        alignItems: 'center',
        justifyContent: 'center'
    },

    icon: {
        fontSize: 32,
        color: '#4E8C4A',
        fontWeight: '700'
    },

    title: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 27,
        fontWeight: '700',
        color: '#243224'
    },

    subtitle: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 21,
        color: '#71806F'
    },

    card: {
        marginTop: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E3E9DF'
    },

    loader: {
        marginTop: 28,
        marginBottom: 28,
    },

    communityCard: {
        marginTop: 12,
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E3E9DF',
        borderRadius: 12,
    },

    communityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    communityLogo: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#E5F1E2',
        borderRadius: 12,
    },

    communityLogoImage: {
        width: '100%',
        height: '100%',
    },

    communityLogoFallback: {
        color: '#4E8C4A',
        fontSize: 22,
    },

    communityInfo: {
        flex: 1,
        marginLeft: 12,
    },

    communityName: {
        color: '#243224',
        fontSize: 16,
        fontWeight: '700',
    },

    communityCategory: {
        marginTop: 3,
        color: '#6B8968',
        fontSize: 12,
        fontWeight: '600',
    },

    communityDescription: {
        marginTop: 11,
        color: '#687367',
        fontSize: 13,
        lineHeight: 19,
    },

    communityActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },

    viewButton: {
        flex: 1,
        minHeight: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#397A49',
        borderRadius: 8,
    },

    viewButtonText: {
        color: '#397A49',
        fontSize: 12,
        fontWeight: '700',
    },

    joinButton: {
        flex: 1,
        minHeight: 42,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 7,
        backgroundColor: '#397A49',
        borderRadius: 8,
    },

    joinButtonDisabled: {
        backgroundColor: '#EDF2EB',
    },

    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },

    joinButtonTextDisabled: {
        color: '#61735D',
    },

    memberNote: {
        marginTop: 9,
        color: '#61735D',
        fontSize: 11,
    },

    emptyState: {
        alignItems: 'center',
        marginTop: 16,
        padding: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E3E9DF',
        borderRadius: 12,
    },

    emptyText: {
        color: '#71806F',
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
    },

    retryButton: {
        marginTop: 12,
        paddingHorizontal: 18,
        paddingVertical: 9,
        backgroundColor: '#4E8C4A',
        borderRadius: 8,
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    matchingAreas: {
        marginTop: 14,
        color: '#71806F',
        fontSize: 11,
        lineHeight: 16,
        textAlign: 'center',
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#243224',
        marginBottom: 16
    },

    recommendation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 13
    },

    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4E8C4A',
        marginRight: 10
    },

    recommendationText: {
        flex: 1,
        fontSize: 14,
        color: '#4D594D'
    },

    disclaimer: {
        marginTop: 18,
        fontSize: 12,
        lineHeight: 18,
        color: '#899287',
        textAlign: 'center'
    },

    button: {
        marginTop: 24,
        height: 52,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4E8C4A'
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700'
    }
})

export default OnboardingResultScreen