import React, {useCallback, useState} from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native'
import {
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {useAuth} from '../../../context/AuthContext'
import {
    getCircleById,
    getMyMemberships,
    requestToJoinCircle,
} from '../../organizer/services/supportCircleService'
import {
    createGroupPost,
    getCircleMessages,
    getGroupPosts,
    getMyGroupPosts,
    sendCircleMessage,
} from '../services/groupPostService'

const MOOD_OPTIONS = [
    {value: 'happy', label: 'Happy', emoji: '😊'},
    {value: 'calm', label: 'Calm', emoji: '😌'},
    {value: 'anxious', label: 'Anxious', emoji: '😟'},
    {value: 'sad', label: 'Sad', emoji: '😢'},
    {value: 'tired', label: 'Tired', emoji: '😴'},
    {value: 'grateful', label: 'Grateful', emoji: '🍃'},
]

const MemberCircleDetailScreen = () => {
    const navigation = useNavigation()
    const route = useRoute()

    const {token, user} = useAuth()
    const {circleId} = route.params || {}

    const [circle, setCircle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Current user's membership for this community
    const [membership, setMembership] = useState(null)
    const [posts, setPosts] = useState([])
    const [messages, setMessages] = useState([])
    const [activeSection, setActiveSection] = useState('posts')
    const [postTitle, setPostTitle] = useState('')
    const [postDescription, setPostDescription] = useState('')
    const [isAnonymousPost, setIsAnonymousPost] = useState(false)
    const [postMood, setPostMood] = useState(null)
    const [messageText, setMessageText] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [isSendingMessage, setIsSendingMessage] = useState(false)

    // Loading state for the join request
    const [isJoining, setIsJoining] = useState(false)

    // ─────────────────────────────────────────────────────────────
    // Load community + current user's membership
    // ─────────────────────────────────────────────────────────────

    const loadDetail = useCallback(async () => {
        if (!token || !circleId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError('')

            const [
                {circle: circleData},
                membershipData,
                groupPostData,
                myPostData,
                messageData,
            ] =
                await Promise.all([
                    getCircleById(token, circleId),
                    getMyMemberships(token),
                    getGroupPosts(token, circleId),
                    getMyGroupPosts(token, circleId),
                    getCircleMessages(token, circleId),
                ])

            setCircle(circleData)
            const visiblePosts = new Map()
            ;[...(groupPostData.posts || []), ...(myPostData.posts || [])]
                .forEach(post => visiblePosts.set(post._id, post))
            setPosts(
                [...visiblePosts.values()].sort(
                    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
                ),
            )
            setMessages(messageData.messages || [])

            const memberships = membershipData.memberships ?? []

            const currentMembership = memberships.find(
                item =>
                    item.groupId?._id === circleId ||
                    item.groupId === circleId,
            )

            setMembership(currentMembership ?? null)
        } catch (err) {
            console.error('Failed to load community:', err)

            setError(
                err.message || 'Failed to load community',
            )
        } finally {
            setLoading(false)
        }
    }, [token, circleId])

    useFocusEffect(
        useCallback(() => {
            loadDetail()

            const refreshMessages = async () => {
                try {
                    const data = await getCircleMessages(token, circleId)
                    setMessages(data.messages || [])
                } catch (err) {
                    console.error('Failed to refresh community chat:', err)
                }
            }

            const interval = setInterval(refreshMessages, 4000)
            return () => clearInterval(interval)
        }, [loadDetail, token, circleId]),
    )

    const handleCreatePost = async () => {
        if (!postTitle.trim() || !postDescription.trim() || isPosting) return

        try {
            setIsPosting(true)
            const data = await createGroupPost(token, circleId, {
                title: postTitle.trim(),
                description: postDescription.trim(),
                isAnonymous: isAnonymousPost,
                mood: postMood,
            })

            setPosts(current => [data.post, ...current.filter(post => post._id !== data.post._id)])
            setPostTitle('')
            setPostDescription('')
            setIsAnonymousPost(false)
            setPostMood(null)
            Alert.alert(
                data.post.status === 'active' ? 'Post published' : 'Post submitted',
                data.message,
            )
        } catch (err) {
            Alert.alert('Unable to create post', err.message)
        } finally {
            setIsPosting(false)
        }
    }

    const handleSendMessage = async () => {
        const content = messageText.trim()
        if (!content || isSendingMessage) return

        try {
            setIsSendingMessage(true)
            const data = await sendCircleMessage(token, circleId, content)
            setMessages(current => [
                ...current.filter(item => item._id !== data.message._id),
                data.message,
            ])
            setMessageText('')
        } catch (err) {
            Alert.alert('Unable to send message', err.message)
        } finally {
            setIsSendingMessage(false)
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Request to join community
    // ─────────────────────────────────────────────────────────────

    const handleRequestToJoin = async () => {
        if (!token || !circleId || isJoining) {
            return
        }

        try {
            setIsJoining(true)

            const data = await requestToJoinCircle(
                token,
                circleId,
            )

            // Immediately update the UI with the new membership
            setMembership(data.membership)

            Alert.alert(
                'Request Sent',
                'Your request to join this community has been sent to the organizer.',
            )
        } catch (err) {
            console.error(
                'Failed to request to join community:',
                err,
            )

            Alert.alert(
                'Unable to Join',
                err.message ||
                    'Failed to request to join this community.',
            )
        } finally {
            setIsJoining(false)
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Loading state
    // ─────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#4E8C4A"
                    />

                    <Text style={styles.loadingText}>
                        Loading community...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    // ─────────────────────────────────────────────────────────────
    // Error state
    // ─────────────────────────────────────────────────────────────

    if (error || !circle) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorIcon}>!</Text>

                    <Text style={styles.errorTitle}>
                        Community unavailable
                    </Text>

                    <Text style={styles.errorText}>
                        {error ||
                            'We could not find this community.'}
                    </Text>

                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>
                            Go Back
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        )
    }

    // ─────────────────────────────────────────────────────────────
    // Render join section based on membership status
    // ─────────────────────────────────────────────────────────────

    const membershipStatus = membership?.status
    const canParticipate = membershipStatus === 'approved'

    const renderJoinAction = () => {
        // User is already an approved member
        if (membershipStatus === 'approved') {
            return (
                <View style={styles.joinedButton}>
                    <Text style={styles.joinedButtonText}>
                        ✓ Joined Community
                    </Text>
                </View>
            )
        }

        // User has requested to join and is waiting
        if (membershipStatus === 'pending') {
            return (
                <View style={styles.pendingButton}>
                    <Text style={styles.pendingButtonText}>
                        Request Pending
                    </Text>
                </View>
            )
        }

        // Organizer rejected the request
        if (membershipStatus === 'rejected') {
            return (
                <View style={styles.rejectedButton}>
                    <Text style={styles.rejectedButtonText}>
                        Request Rejected
                    </Text>
                </View>
            )
        }

        // User has no membership yet
        return (
            <Pressable
                style={[
                    styles.joinButton,
                    isJoining && styles.joinButtonDisabled,
                ]}
                onPress={handleRequestToJoin}
                disabled={isJoining}>
                {isJoining ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.joinButtonText}>
                        Request to Join
                    </Text>
                )}
            </Pressable>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backIconButton}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>‹</Text>
                </Pressable>

                <Text style={styles.headerTitle}>
                    Community
                </Text>

                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}>
                {/* Hero / Group Profile Image */}
                    <View style={styles.heroIcon}>
                        {circle.profileImage ? (
                            <Image
                                source={{uri: circle.profileImage}}
                                style={styles.heroProfileImage}
                            />
                        ) : (
                            <Text style={styles.heroIconText}>♥</Text>
                        )}
                    </View>

                {/* Community title */}
                <Text style={styles.title}>
                    {circle.topic || 'Support Community'}
                </Text>

                {/* Category */}
                {circle.category ? (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                            {circle.category}
                        </Text>
                    </View>
                ) : null}

                {/* Description */}
                <Text style={styles.description}>
                    {circle.description ||
                        'A safe space where members can connect and support one another.'}
                </Text>

                {/* Stats */}
                <View style={styles.statsCard}>
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>
                            {circle.currentMemberCount || 0}
                        </Text>

                        <Text style={styles.statLabel}>
                            Members
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>
                            {circle.meetingTypes?.length || 0}
                        </Text>

                        <Text style={styles.statLabel}>
                            Meeting types
                        </Text>
                    </View>
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        About this community
                    </Text>

                    <Text style={styles.sectionText}>
                        This community provides a supportive
                        environment where people can connect,
                        share experiences and take part in
                        group activities.
                    </Text>
                </View>

                {/* Meeting options */}
                {circle.meetingTypes?.length ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Meeting options
                        </Text>

                        <View style={styles.badgesContainer}>
                            {circle.meetingTypes.map(type => (
                                <View
                                    key={type}
                                    style={styles.meetingBadge}>
                                    <Text
                                        style={
                                            styles.meetingBadgeText
                                        }>
                                        {type}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Join card */}
                <View style={styles.joinCard}>
                    <Text style={styles.joinTitle}>
                        {membershipStatus === 'approved'
                            ? 'You are a member'
                            : membershipStatus === 'pending'
                            ? 'Request under review'
                            : membershipStatus === 'rejected'
                                ? 'Join request rejected'
                                : 'Interested in joining?'}
                    </Text>

                    <Text style={styles.joinText}>
                        {membershipStatus === 'approved'
                            ? 'You have joined this community and can participate in its activities.'
                            : membershipStatus === 'pending'
                            ? 'Your request has been sent to the organizer. You will be able to join once it is approved.'
                            : membershipStatus === 'rejected'
                                ? 'Your previous request to join this community was rejected by the organizer.'
                                : 'Request to join this community and connect with other members.'}
                    </Text>

                    {renderJoinAction()}

                </View>

                <View style={styles.activitySection}>
                    <View style={styles.activityTabs}>
                        {[
                            {key: 'posts', label: 'Posts'},
                            {key: 'chat', label: 'Chat'},
                        ].map(section => (
                            <Pressable
                                key={section.key}
                                accessibilityRole="tab"
                                accessibilityState={{selected: activeSection === section.key}}
                                onPress={() => setActiveSection(section.key)}
                                style={[
                                    styles.activityTab,
                                    activeSection === section.key && styles.activityTabActive,
                                ]}>
                                <Text style={[
                                    styles.activityTabText,
                                    activeSection === section.key && styles.activityTabTextActive,
                                ]}>
                                    {section.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {activeSection === 'posts' ? (
                        <View>
                            {canParticipate ? (
                                <View style={styles.postComposer}>
                                    <Text style={styles.activityHeading}>Share with the community</Text>
                                    <View style={styles.anonymousOption}>
                                        <View style={styles.anonymousCopy}>
                                            <Text style={styles.optionTitle}>Post anonymously</Text>
                                            <Text style={styles.optionHint}>Your name will be hidden from other members.</Text>
                                        </View>
                                        <Switch
                                            value={isAnonymousPost}
                                            onValueChange={setIsAnonymousPost}
                                            trackColor={{false: '#D8E1D4', true: '#4E8C4A'}}
                                            thumbColor="#FFFFFF"
                                        />
                                    </View>
                                    <TextInput
                                        value={postTitle}
                                        onChangeText={setPostTitle}
                                        maxLength={200}
                                        placeholder="Post title"
                                        placeholderTextColor="#879186"
                                        style={styles.postTitleInput}
                                    />
                                    <TextInput
                                        value={postDescription}
                                        onChangeText={setPostDescription}
                                        maxLength={5000}
                                        multiline
                                        textAlignVertical="top"
                                        placeholder="Write a post..."
                                        placeholderTextColor="#879186"
                                        style={styles.postBodyInput}
                                    />
                                    <Text style={styles.optionTitle}>Add a mood (optional)</Text>
                                    <View style={styles.moodOptionsRow}>
                                        {MOOD_OPTIONS.map(option => (
                                            <Pressable
                                                key={option.value}
                                                accessibilityRole="button"
                                                accessibilityState={{selected: postMood === option.value}}
                                                onPress={() => setPostMood(current => current === option.value ? null : option.value)}
                                                style={[
                                                    styles.moodOption,
                                                    postMood === option.value && styles.moodOptionSelected,
                                                ]}>
                                                <Text style={styles.moodOptionText}>
                                                    {option.emoji} {option.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                    <Pressable
                                        disabled={isPosting || !postTitle.trim() || !postDescription.trim()}
                                        onPress={handleCreatePost}
                                        style={[
                                            styles.sendButton,
                                            (isPosting || !postTitle.trim() || !postDescription.trim()) && styles.disabledButton,
                                        ]}>
                                        <Text style={styles.sendButtonText}>
                                            {isPosting ? 'Submitting...' : 'Publish post'}
                                        </Text>
                                    </Pressable>
                                    <Text style={styles.reviewNote}>
                                        Community posts may be reviewed by the organizer before appearing publicly.
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.readOnlyNote}>
                                    Join this community to publish a post or send a chat message.
                                </Text>
                            )}

                            {posts.map(post => (
                                <View key={post._id} style={styles.postCard}>
                                    <View style={styles.postMetaRow}>
                                        <Text style={styles.postAuthor}>
                                            {post.isAnonymous ? 'Anonymous' : post.author?.name || 'Community member'}
                                        </Text>
                                        {post.status !== 'active' ? (
                                            <Text style={styles.pendingLabel}>
                                                {post.status === 'pending' ? 'Awaiting review' : 'Removed'}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Text style={styles.postHeading}>{post.title}</Text>
                                    {post.mood ? (
                                        <Text style={styles.postMood}>
                                            {MOOD_OPTIONS.find(option => option.value === post.mood)?.emoji} Feeling {post.mood}
                                        </Text>
                                    ) : null}
                                    <Text style={styles.postBody}>{post.description || post.content}</Text>
                                    {post.imageUrl ? (
                                        <Image source={{uri: post.imageUrl}} style={styles.postImage} />
                                    ) : null}
                                    <Text style={styles.postDate}>
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            ))}
                            {posts.length === 0 ? (
                                <Text style={styles.emptyActivity}>No community posts yet.</Text>
                            ) : null}
                        </View>
                    ) : (
                        <View>
                            <View style={styles.chatHistory}>
                                {messages.map(item => {
                                    const ownMessage = item.sender?._id === user?._id
                                    return (
                                        <View
                                            key={item._id}
                                            style={[
                                                styles.messageRow,
                                                ownMessage && styles.ownMessageRow,
                                            ]}>
                                            <View style={[
                                                styles.messageBubble,
                                                ownMessage && styles.ownMessageBubble,
                                            ]}>
                                                {!ownMessage ? (
                                                    <Text style={styles.messageSender}>
                                                        {item.sender?.name || 'Community member'}
                                                    </Text>
                                                ) : null}
                                                <Text style={[
                                                    styles.messageContent,
                                                    ownMessage && styles.ownMessageContent,
                                                ]}>
                                                    {item.content}
                                                </Text>
                                                <Text style={styles.messageTime}>
                                                    {new Date(item.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                    )
                                })}
                                {messages.length === 0 ? (
                                    <Text style={styles.emptyActivity}>No messages yet. Start the conversation.</Text>
                                ) : null}
                            </View>

                            {canParticipate ? (
                                <View style={styles.chatComposer}>
                                    <TextInput
                                        value={messageText}
                                        onChangeText={setMessageText}
                                        maxLength={2000}
                                        multiline
                                        placeholder="Message the community..."
                                        placeholderTextColor="#879186"
                                        style={styles.messageInput}
                                    />
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Send message"
                                        disabled={!messageText.trim() || isSendingMessage}
                                        onPress={handleSendMessage}
                                        style={[
                                            styles.chatSendButton,
                                            (!messageText.trim() || isSendingMessage) && styles.disabledButton,
                                        ]}>
                                        <Text style={styles.chatSendButtonText}>Send</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <Text style={styles.readOnlyNote}>
                                    Join this community to send messages.
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAF5',
    },

    header: {
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E7ECE4',
        backgroundColor: '#F8FAF5',
    },

    backIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    backIcon: {
        fontSize: 34,
        lineHeight: 36,
        color: '#354335',
    },

    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '700',
        color: '#263526',
    },

    headerSpacer: {
        width: 40,
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 40,
    },

    heroIcon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#E5F2E2',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },

    heroProfileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    },

    heroIconText: {
        fontSize: 34,
        color: '#4E8C4A',
    },

    title: {
        marginTop: 18,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '700',
        color: '#263526',
        textAlign: 'center',
    },

    categoryBadge: {
        alignSelf: 'center',
        marginTop: 10,
        backgroundColor: '#EAF3E7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },

    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#557452',
    },

    description: {
        marginTop: 18,
        fontSize: 15,
        lineHeight: 23,
        color: '#687367',
        textAlign: 'center',
    },

    statsCard: {
        marginTop: 25,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5EAE2',
    },

    stat: {
        flex: 1,
        alignItems: 'center',
    },

    statNumber: {
        fontSize: 21,
        fontWeight: '700',
        color: '#4E8C4A',
    },

    statLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#778076',
    },

    divider: {
        width: 1,
        height: 35,
        backgroundColor: '#E2E7DF',
    },

    section: {
        marginTop: 28,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D392D',
        marginBottom: 9,
    },

    sectionText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6D766C',
    },

    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    meetingBadge: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DDE6D9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },

    meetingBadgeText: {
        fontSize: 13,
        color: '#557452',
        fontWeight: '600',
    },

    joinCard: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#EAF4E7',
        borderRadius: 20,
    },

    joinTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#314330',
    },

    joinText: {
        marginTop: 7,
        fontSize: 14,
        lineHeight: 21,
        color: '#667464',
    },

    // ─────────────────────────────────────────────
    // Join button
    // ─────────────────────────────────────────────

    joinButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
    },

    joinButtonDisabled: {
        opacity: 0.7,
    },

    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─────────────────────────────────────────────
    // Pending state
    // ─────────────────────────────────────────────

    pendingButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#EEF3EE',
        borderWidth: 1,
        borderColor: '#D7E2D4',
        alignItems: 'center',
        justifyContent: 'center',
    },

    pendingButtonText: {
        color: '#687168',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─────────────────────────────────────────────
    // Joined state
    // ─────────────────────────────────────────────

    joinedButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#DCEBD8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    joinedButtonText: {
        color: '#3F7540',
        fontSize: 15,
        fontWeight: '700',
    },

    createPostButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#4E8C4A',
    alignItems: 'center',
    justifyContent: 'center',
    },

    createPostButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─────────────────────────────────────────────
    // Rejected state
    // ─────────────────────────────────────────────

    rejectedButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F1E7E5',
        borderWidth: 1,
        borderColor: '#E3D2CF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    rejectedButtonText: {
        color: '#8A5C56',
        fontSize: 15,
        fontWeight: '700',
    },

    activitySection: {
        marginTop: 28,
    },

    activityTabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#DCE5D8',
        marginBottom: 18,
    },

    activityTab: {
        flex: 1,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },

    activityTabActive: {
        borderBottomColor: '#397A49',
    },

    activityTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#758174',
    },

    activityTabTextActive: {
        color: '#276D3B',
    },

    postComposer: {
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E8DC',
        borderRadius: 14,
    },

    activityHeading: {
        color: '#263526',
        fontSize: 16,
        fontWeight: '700',
    },

    anonymousOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },

    anonymousCopy: {
        flex: 1,
        paddingRight: 8,
    },

    optionTitle: {
        marginTop: 10,
        color: '#263526',
        fontSize: 13,
        fontWeight: '700',
    },

    optionHint: {
        marginTop: 3,
        color: '#758174',
        fontSize: 11,
        lineHeight: 15,
    },

    moodOptionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 8,
    },

    moodOption: {
        minHeight: 34,
        justifyContent: 'center',
        paddingHorizontal: 9,
        backgroundColor: '#F1F5EC',
        borderRadius: 8,
    },

    moodOptionSelected: {
        backgroundColor: '#DCEBD8',
        borderWidth: 1,
        borderColor: '#397A49',
    },

    moodOptionText: {
        color: '#536057',
        fontSize: 11,
        fontWeight: '600',
    },

    postTitleInput: {
        marginTop: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#DCE5D8',
        borderRadius: 8,
        color: '#243024',
    },

    postBodyInput: {
        marginTop: 10,
        minHeight: 100,
        padding: 12,
        borderWidth: 1,
        borderColor: '#DCE5D8',
        borderRadius: 8,
        color: '#243024',
    },

    sendButton: {
        minHeight: 44,
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#397A49',
        borderRadius: 8,
    },

    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    disabledButton: {
        opacity: 0.55,
    },

    reviewNote: {
        marginTop: 9,
        color: '#758174',
        fontSize: 12,
        lineHeight: 17,
    },

    readOnlyNote: {
        marginBottom: 14,
        padding: 12,
        color: '#536057',
        backgroundColor: '#EEF3EE',
        borderRadius: 8,
        fontSize: 13,
        lineHeight: 19,
    },

    postCard: {
        marginBottom: 12,
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E8DC',
        borderRadius: 12,
    },

    postMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },

    postAuthor: {
        color: '#536057',
        fontSize: 12,
        fontWeight: '600',
    },

    pendingLabel: {
        color: '#8A5C36',
        fontSize: 11,
        fontWeight: '700',
    },

    postHeading: {
        marginTop: 8,
        color: '#263526',
        fontSize: 16,
        fontWeight: '700',
    },

    postMood: {
        marginTop: 7,
        color: '#397A49',
        fontSize: 12,
        fontWeight: '600',
    },

    postBody: {
        marginTop: 7,
        color: '#536057',
        fontSize: 14,
        lineHeight: 21,
    },

    postImage: {
        width: '100%',
        height: 210,
        marginTop: 10,
        borderRadius: 8,
    },

    postDate: {
        marginTop: 10,
        color: '#879186',
        fontSize: 11,
    },

    chatHistory: {
        minHeight: 180,
        padding: 12,
        backgroundColor: '#F0F4EE',
        borderRadius: 12,
    },

    messageRow: {
        alignItems: 'flex-start',
        marginBottom: 10,
    },

    ownMessageRow: {
        alignItems: 'flex-end',
    },

    messageBubble: {
        maxWidth: '86%',
        minWidth: 92,
        paddingHorizontal: 12,
        paddingVertical: 9,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },

    ownMessageBubble: {
        backgroundColor: '#397A49',
    },

    messageSender: {
        marginBottom: 4,
        color: '#397A49',
        fontSize: 11,
        fontWeight: '700',
    },

    messageContent: {
        color: '#263526',
        fontSize: 14,
        lineHeight: 20,
    },

    ownMessageContent: {
        color: '#FFFFFF',
    },

    messageTime: {
        alignSelf: 'flex-end',
        marginTop: 4,
        color: '#879186',
        fontSize: 10,
    },

    chatComposer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 10,
        gap: 8,
    },

    messageInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DCE5D8',
        borderRadius: 10,
        color: '#243024',
    },

    chatSendButton: {
        minWidth: 58,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#397A49',
        borderRadius: 10,
    },

    chatSendButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    emptyActivity: {
        paddingVertical: 26,
        color: '#758174',
        textAlign: 'center',
        fontSize: 13,
    },

    // ─────────────────────────────────────────────
    // Loading / error
    // ─────────────────────────────────────────────

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#71806F',
    },

    errorIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FCE9E7',
        color: '#C6534D',
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 25,
        fontWeight: '700',
    },

    errorTitle: {
        marginTop: 15,
        fontSize: 19,
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

    backButton: {
        marginTop: 20,
        backgroundColor: '#4E8C4A',
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 12,
    },

    backButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
})

export default MemberCircleDetailScreen