import React, {useCallback, useMemo, useState} from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {useAuth} from '../../../context/AuthContext'
import {getAvailableSupportCircles} from '../../organizer/services/supportCircleService'

const CommunitiesScreen = () => {
    const navigation = useNavigation()
    const {token} = useAuth()

    const [circles, setCircles] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadCommunities = useCallback(async () => {
        if (!token) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError('')

            const data = await getAvailableSupportCircles(token)

            setCircles(data.circles || [])
        } catch (err) {
            console.error('Failed to load communities:', err)
            setError(err.message || 'Failed to load communities')
        } finally {
            setLoading(false)
        }
    }, [token])

    useFocusEffect(
        useCallback(() => {
            loadCommunities()
        }, [loadCommunities]),
    )

    const filteredCircles = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        if (!query) {
            return circles
        }

        return circles.filter(circle => {
            const topic = circle.topic?.toLowerCase() || ''
            const description = circle.description?.toLowerCase() || ''
            const category = circle.category?.toLowerCase() || ''

            return (
                topic.includes(query) ||
                description.includes(query) ||
                category.includes(query)
            )
        })
    }, [circles, searchQuery])

    const openCommunity = circle => {
    navigation.getParent()?.navigate('MemberCircleDetail', {
        circleId: circle._id,
    })
    }

    const renderCommunity = ({item}) => {
        return (
            <Pressable
                style={({pressed}) => [
                    styles.communityCard,
                    pressed && styles.communityCardPressed,
                ]}
                onPress={() => openCommunity(item)}>
                <View style={styles.cardTopRow}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>♥</Text>
                    </View>

                    <View style={styles.cardTitleContainer}>
                        <Text style={styles.communityTitle} numberOfLines={1}>
                            {item.topic || 'Support Community'}
                        </Text>

                        {item.category ? (
                            <Text style={styles.categoryText}>
                                {item.category}
                            </Text>
                        ) : null}
                    </View>

                    <Text style={styles.arrow}>›</Text>
                </View>

                <Text
                    style={styles.communityDescription}
                    numberOfLines={3}>
                    {item.description ||
                        'A safe space to connect, share and support one another.'}
                </Text>

                <View style={styles.cardBottomRow}>
                    <View style={styles.memberInfo}>
                        <Text style={styles.memberIcon}>●</Text>

                        <Text style={styles.memberText}>
                            {item.currentMemberCount || 0} members
                        </Text>
                    </View>

                    {item.meetingTypes?.length ? (
                        <View style={styles.meetingBadge}>
                            <Text style={styles.meetingBadgeText}>
                                {item.meetingTypes[0]}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </Pressable>
        )
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4E8C4A" />

                    <Text style={styles.loadingText}>
                        Finding communities...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Communities</Text>

                        <Text style={styles.subtitle}>
                            Find a space where you feel supported
                        </Text>
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>⌕</Text>

                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search communities..."
                        placeholderTextColor="#8B9588"
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Explore Communities
                    </Text>

                    <Text style={styles.communityCount}>
                        {filteredCircles.length}
                    </Text>
                </View>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>
                            Something went wrong
                        </Text>

                        <Text style={styles.errorText}>{error}</Text>

                        <Pressable
                            style={styles.retryButton}
                            onPress={loadCommunities}>
                            <Text style={styles.retryButtonText}>
                                Try Again
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        data={filteredCircles}
                        keyExtractor={item => item._id}
                        renderItem={renderCommunity}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={
                            filteredCircles.length === 0
                                ? styles.emptyList
                                : styles.listContent
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>♡</Text>

                                <Text style={styles.emptyTitle}>
                                    No communities found
                                </Text>

                                <Text style={styles.emptyText}>
                                    {searchQuery
                                        ? 'Try searching for a different topic or category.'
                                        : 'There are no active communities available right now.'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAF5',
    },

    container: {
        flex: 1,
        paddingHorizontal: 20,
    },

    header: {
        paddingTop: 12,
        paddingBottom: 20,
    },

    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#243224',
    },

    subtitle: {
        marginTop: 6,
        fontSize: 15,
        color: '#71806F',
    },

    searchContainer: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#E3E9DF',
        marginBottom: 24,
    },

    searchIcon: {
        fontSize: 24,
        color: '#71806F',
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#243224',
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },

    sectionTitle: {
        flex: 1,
        fontSize: 19,
        fontWeight: '700',
        color: '#243224',
    },

    communityCount: {
        minWidth: 28,
        height: 28,
        paddingHorizontal: 8,
        borderRadius: 14,
        backgroundColor: '#E5F1E2',
        color: '#4E8C4A',
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 13,
        fontWeight: '700',
    },

    listContent: {
        paddingBottom: 30,
    },

    communityCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 17,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E7ECE4',
        shadowColor: '#243224',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },

    communityCardPressed: {
        opacity: 0.85,
        transform: [{scale: 0.99}],
    },

    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: '#E8F4E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    iconText: {
        fontSize: 23,
        color: '#4E8C4A',
    },

    cardTitleContainer: {
        flex: 1,
    },

    communityTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#263526',
    },

    categoryText: {
        marginTop: 4,
        fontSize: 12,
        color: '#6B8968',
        fontWeight: '600',
    },

    arrow: {
        fontSize: 28,
        color: '#A0AA9D',
        marginLeft: 8,
    },

    communityDescription: {
        marginTop: 14,
        fontSize: 14,
        lineHeight: 21,
        color: '#687367',
    },

    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
    },

    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    memberIcon: {
        fontSize: 10,
        color: '#4E8C4A',
        marginRight: 7,
    },

    memberText: {
        fontSize: 13,
        color: '#667164',
        fontWeight: '500',
    },

    meetingBadge: {
        backgroundColor: '#F1F5EC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },

    meetingBadgeText: {
        fontSize: 11,
        color: '#61735D',
        fontWeight: '600',
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#71806F',
    },

    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
        paddingTop: 70,
    },

    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#354335',
    },

    errorText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: '#7A8477',
        textAlign: 'center',
    },

    retryButton: {
        marginTop: 18,
        backgroundColor: '#4E8C4A',
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 12,
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    emptyList: {
        flexGrow: 1,
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingTop: 70,
    },

    emptyIcon: {
        fontSize: 48,
        color: '#9BB596',
    },

    emptyTitle: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: '700',
        color: '#354335',
    },

    emptyText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: '#7A8477',
        textAlign: 'center',
    },
})

export default CommunitiesScreen