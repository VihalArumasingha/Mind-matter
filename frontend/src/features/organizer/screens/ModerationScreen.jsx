import React, {useCallback, useState} from 'react'
import {
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {useAuth} from '../../../context/AuthContext'
import {
    getPendingPosts,
    approvePost,
    rejectPost,
} from '../services/moderationService'

const ModerationScreen = ({navigation}) => {
    const {token} = useAuth()
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [processingPostId, setProcessingPostId] = useState(null)

    const [rejectingPostId, setRejectingPostId] = useState(null)
    const [rejectReason, setRejectReason] = useState('')



    const loadPendingPosts = useCallback(async () => {
    if (!token) {
        setIsLoading(false)
        setIsRefreshing(false)
        return
    }

    try {
        const data = await getPendingPosts(token)

        setPosts(data.posts || [])
    } catch (error) {
        console.error(
            'Failed to load pending posts:',
            error,
        )

        Alert.alert(
            'Error',
            error.message || 'Failed to load pending posts.',
        )
    } finally {
        setIsLoading(false)
        setIsRefreshing(false)
    }
}, [token])

    React.useEffect(() => {
    loadPendingPosts()
}, [loadPendingPosts])

    const handleRefresh = () => {
        setIsRefreshing(true)
        loadPendingPosts()
    }

    const handleApprove = postId => {
        Alert.alert(
            'Approve post',
            'Are you sure you want to approve this post?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            setProcessingPostId(postId)

                            await approvePost(
                                token,
                                postId,
                            )

                            setPosts(currentPosts =>
                                currentPosts.filter(
                                    post =>
                                        post._id !== postId,
                                ),
                            )

                            Alert.alert(
                                'Post approved',
                                'The post is now visible in the community.',
                            )
                        } catch (error) {
                            console.error(
                                'Failed to approve post:',
                                error,
                            )

                            Alert.alert(
                                'Error',
                                error.message ||
                                    'Failed to approve the post.',
                            )
                        } finally {
                            setProcessingPostId(null)
                        }
                    },
                },
            ],
        )
    }

    const openRejectForm = postId => {
        setRejectingPostId(postId)
        setRejectReason('')
    }

    const closeRejectForm = () => {
        setRejectingPostId(null)
        setRejectReason('')
    }

    const handleReject = async postId => {
        const reason = rejectReason.trim()

        if (!reason) {
            Alert.alert(
                'Reason required',
                'Please enter a reason for rejecting this post.',
            )
            return
        }

        try {
            setProcessingPostId(postId)


            await rejectPost(
                token,
                postId,
                reason,
            )

            setPosts(currentPosts =>
                currentPosts.filter(
                    post => post._id !== postId,
                ),
            )

            closeRejectForm()

            Alert.alert(
                'Post rejected',
                'The post has been rejected and removed from the pending list.',
            )
        } catch (error) {
            console.error(
                'Failed to reject post:',
                error,
            )

            Alert.alert(
                'Error',
                error.message ||
                    'Failed to reject the post.',
            )
        } finally {
            setProcessingPostId(null)
        }
    }

    const getAuthorName = post => {
        if (post.isAnonymous) {
            return 'Anonymous member'
        }

        if (post.author?.name) {
            return post.author.name
        }

        if (post.author?.username) {
            return post.author.username
        }

        if (post.author?.email) {
            return post.author.email
        }

        return 'Community member'
    }

    const formatDate = dateValue => {
        if (!dateValue) {
            return ''
        }

        const date = new Date(dateValue)

        if (Number.isNaN(date.getTime())) {
            return ''
        }

        return date.toLocaleString()
    }

    const renderPost = post => {
        const isProcessing =
            processingPostId === post._id

        const isRejecting =
            rejectingPostId === post._id

        return (
            <View
                key={post._id}
                style={styles.postCard}>
                <View style={styles.postHeader}>
                    <View style={styles.authorContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {getAuthorName(post)
                                    .charAt(0)
                                    .toUpperCase()}
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.authorName}>
                                {getAuthorName(post)}
                            </Text>

                            {post.createdAt && (
                                <Text
                                    style={
                                        styles.postDate
                                    }>
                                    {formatDate(
                                        post.createdAt,
                                    )}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.pendingBadge}>
                        <Text
                            style={
                                styles.pendingBadgeText
                            }>
                            Pending
                        </Text>
                    </View>
                </View>

                {post.title ? (
                    <Text style={styles.postTitle}>
                        {post.title}
                    </Text>
                ) : null}

                {post.description ? (
                    <Text style={styles.postDescription}>
                        {post.description}
                    </Text>
                ) : post.content ? (
                    <Text style={styles.postDescription}>
                        {post.content}
                    </Text>
                ) : null}

                {post.imageUrl ? (
                    <Image
                        source={{
                            uri: post.imageUrl,
                        }}
                        style={styles.postImage}
                        resizeMode="cover"
                    />
                ) : null}

                {post.mood ? (
                    <View style={styles.moodContainer}>
                        <Text style={styles.moodLabel}>
                            Mood:
                        </Text>

                        <Text style={styles.moodValue}>
                            {post.mood}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.reviewNotice}>
                    <Text
                        style={
                            styles.reviewNoticeTitle
                        }>
                        Organizer review
                    </Text>

                    <Text
                        style={
                            styles.reviewNoticeText
                        }>
                        Review this post before it becomes
                        visible to community members.
                    </Text>
                </View>

                {isRejecting ? (
                    <View style={styles.rejectForm}>
                        <Text style={styles.reasonLabel}>
                            Rejection reason
                        </Text>

                        <TextInput
                            value={rejectReason}
                            onChangeText={
                                setRejectReason
                            }
                            placeholder="Explain why this post is being rejected..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            textAlignVertical="top"
                            editable={!isProcessing}
                            style={
                                styles.reasonInput
                            }
                        />

                        <View
                            style={
                                styles.rejectFormActions
                            }>
                            <Pressable
                                style={
                                    styles.cancelButton
                                }
                                onPress={
                                    closeRejectForm
                                }
                                disabled={
                                    isProcessing
                                }>
                                <Text
                                    style={
                                        styles.cancelButtonText
                                    }>
                                    Cancel
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.confirmRejectButton,
                                    isProcessing &&
                                        styles.disabledButton,
                                ]}
                                onPress={() =>
                                    handleReject(
                                        post._id,
                                    )
                                }
                                disabled={
                                    isProcessing
                                }>
                                <Text
                                    style={
                                        styles.confirmRejectButtonText
                                    }>
                                    {isProcessing
                                        ? 'Rejecting...'
                                        : 'Confirm rejection'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <View style={styles.actionRow}>
                        <Pressable
                            style={[
                                styles.rejectButton,
                                isProcessing &&
                                    styles.disabledButton,
                            ]}
                            onPress={() =>
                                openRejectForm(
                                    post._id,
                                )
                            }
                            disabled={isProcessing}>
                            <Text
                                style={
                                    styles.rejectButtonText
                                }>
                                Reject
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.approveButton,
                                isProcessing &&
                                    styles.disabledButton,
                            ]}
                            onPress={() =>
                                handleApprove(
                                    post._id,
                                )
                            }
                            disabled={isProcessing}>
                            <Text
                                style={
                                    styles.approveButtonText
                                }>
                                {isProcessing
                                    ? 'Processing...'
                                    : 'Approve'}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() =>
                        navigation.goBack()
                    }>
                    <Text style={styles.backButtonText}>
                        ‹
                    </Text>
                </Pressable>

                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>
                        Post Moderation
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Review posts before they are
                        published
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={
                    styles.scrollContent
                }
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                    />
                }
                showsVerticalScrollIndicator={false}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryNumber}>
                        {posts.length}
                    </Text>

                    <View
                        style={
                            styles.summaryTextContainer
                        }>
                        <Text
                            style={
                                styles.summaryTitle
                            }>
                            Pending posts
                        </Text>

                        <Text
                            style={
                                styles.summaryDescription
                            }>
                            Posts waiting for your review
                        </Text>
                    </View>
                </View>

                {isLoading ? (
                    <View
                        style={
                            styles.emptyContainer
                        }>
                        <Text
                            style={
                                styles.emptyTitle
                            }>
                            Loading posts...
                        </Text>
                    </View>
                ) : posts.length === 0 ? (
                    <View
                        style={
                            styles.emptyContainer
                        }>
                        <View
                            style={
                                styles.emptyIcon
                            }>
                            <Text
                                style={
                                    styles.emptyIconText
                                }>
                                ✓
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.emptyTitle
                            }>
                            All caught up!
                        </Text>

                        <Text
                            style={
                                styles.emptyDescription
                            }>
                            There are no posts waiting for
                            moderation right now.
                        </Text>
                    </View>
                ) : (
                    posts.map(renderPost)
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 18,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        marginRight: 12,
    },

    backButtonText: {
        fontSize: 32,
        lineHeight: 34,
        color: '#334155',
        marginTop: -3,
    },

    headerTextContainer: {
        flex: 1,
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
    },

    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 3,
    },

    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },

    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },

    summaryNumber: {
        fontSize: 30,
        fontWeight: '800',
        color: '#047857',
        marginRight: 14,
    },

    summaryTextContainer: {
        flex: 1,
    },

    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#065F46',
    },

    summaryDescription: {
        fontSize: 13,
        color: '#047857',
        marginTop: 2,
    },

    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#CCFBF1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F766E',
    },

    authorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },

    postDate: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },

    pendingBadge: {
        backgroundColor: '#FEF3C7',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },

    pendingBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
    },

    postTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },

    postDescription: {
        fontSize: 14,
        lineHeight: 21,
        color: '#475569',
        marginBottom: 14,
    },

    postImage: {
        width: '100%',
        height: 210,
        borderRadius: 12,
        marginBottom: 14,
    },

    moodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },

    moodLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginRight: 6,
    },

    moodValue: {
        fontSize: 13,
        color: '#334155',
    },

    reviewNotice: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },

    reviewNoticeTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 3,
    },

    reviewNoticeText: {
        fontSize: 12,
        lineHeight: 18,
        color: '#64748B',
    },

    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },

    rejectButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF5F5',
    },

    rejectButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC2626',
    },

    approveButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#059669',
    },

    approveButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    disabledButton: {
        opacity: 0.55,
    },

    rejectForm: {
        marginTop: 2,
    },

    reasonLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },

    reasonInput: {
        minHeight: 110,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#1E293B',
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
    },

    rejectFormActions: {
        flexDirection: 'row',
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },

    cancelButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },

    confirmRejectButton: {
        flex: 1.4,
        minHeight: 46,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
    },

    confirmRejectButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 70,
        paddingHorizontal: 30,
    },

    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    emptyIconText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#059669',
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
    },

    emptyDescription: {
        fontSize: 14,
        lineHeight: 21,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 7,
    },
})

export default ModerationScreen