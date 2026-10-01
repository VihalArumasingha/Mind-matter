import React, {useCallback, useState} from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native'
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {pick, types} from '@react-native-documents/picker'

import {useAuth} from '../../../context/AuthContext'
import CommunityOrganizerBadge from '../../../components/CommunityOrganizerBadge'
import {getCircleById, getMyMemberships} from '../../organizer/services/supportCircleService'
import {getSessionsForCircle} from '../../organizer/services/sessionService'
import {
    getAttendanceForSession,
    registerAttendance,
} from '../../organizer/services/attendanceService'
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

const MemberCircleActivityScreen = () => {
    const navigation = useNavigation()
    const route = useRoute()
    const {token, user} = useAuth()
    const {circleId} = route.params || {}

    const [circle, setCircle] = useState(null)
    const [membership, setMembership] = useState(null)
    const [posts, setPosts] = useState([])
    const [messages, setMessages] = useState([])
    const [sessions, setSessions] = useState([])
    const [attendanceBySession, setAttendanceBySession] = useState({})
    const [activeSection, setActiveSection] = useState('posts')
    const [postTitle, setPostTitle] = useState('')
    const [postDescription, setPostDescription] = useState('')
    const [postImage, setPostImage] = useState(null)
    const [isAnonymousPost, setIsAnonymousPost] = useState(false)
    const [postMood, setPostMood] = useState(null)
    const [messageText, setMessageText] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [isSendingMessage, setIsSendingMessage] = useState(false)
    const [registeringSessionId, setRegisteringSessionId] = useState(null)

    const loadActivity = useCallback(async () => {
        try {
            setError('')
            const [
                {circle: circleData},
                membershipData,
                groupPostData,
                myPostData,
                messageData,
                sessionData,
            ] = await Promise.all([
                getCircleById(token, circleId),
                getMyMemberships(token),
                getGroupPosts(token, circleId),
                getMyGroupPosts(token, circleId),
                getCircleMessages(token, circleId),
                getSessionsForCircle(token, circleId),
            ])

            setCircle(circleData)
            const allPosts = [...(groupPostData.posts || []), ...(myPostData.posts || [])]
            const uniquePosts = new Map(allPosts.map(post => [post._id, post]))
            setPosts(
                [...uniquePosts.values()].sort(
                    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
                ),
            )
            setMessages(messageData.messages || [])
            const upcomingSessions = sessionData.sessions || []
            setSessions(upcomingSessions)

            const attendanceMap = {}
            const attendanceResults = await Promise.all(
                upcomingSessions.map(async session => {
                    const attendanceData = await getAttendanceForSession(token, session._id)
                    attendanceMap[session._id] = attendanceData.attendance || []
                }),
            )

            if (attendanceResults.length) {
                setAttendanceBySession(attendanceMap)
            }

            const currentMembership = (membershipData.memberships || []).find(item =>
                item.groupId?._id === circleId || item.groupId === circleId,
            )
            setMembership(currentMembership || null)
        } catch (loadError) {
            setError(loadError.message || 'Unable to load this community')
        } finally {
            setLoading(false)
        }
    }, [token, circleId])

    const refreshMessages = useCallback(async () => {
        if (!token || !circleId) return

        try {
            const data = await getCircleMessages(token, circleId)
            setMessages(data.messages || [])
        } catch (refreshError) {
            console.error('Failed to refresh community chat:', refreshError)
        }
    }, [token, circleId])

    useFocusEffect(
        useCallback(() => {
            loadActivity()

            const isFocused = typeof navigation?.isFocused === 'function'
                ? navigation.isFocused()
                : false

            if (!isFocused) {
                return undefined
            }

            const interval = setInterval(() => {
                if (typeof navigation?.isFocused === 'function' && !navigation.isFocused()) {
                    return
                }

                refreshMessages()
            }, 4000)

            return () => clearInterval(interval)
        }, [loadActivity, navigation, refreshMessages]),
    )

    const canParticipate = membership?.status === 'approved'

    const choosePostImage = async () => {
        try {
            const [selectedImage] = await pick({type: [types.images]})
            setPostImage({
                uri: selectedImage.uri,
                name: selectedImage.name || `community-post-${Date.now()}.jpg`,
                type: selectedImage.type || 'image/jpeg',
            })
        } catch (pickerError) {
            if (pickerError?.code !== 'OPERATION_CANCELED') {
                Alert.alert('Unable to choose image', pickerError.message)
            }
        }
    }

    const submitPost = async () => {
        if (!postTitle.trim() || !postDescription.trim() || isPosting) return

        try {
            setIsPosting(true)
            const postData = new FormData()
            postData.append('title', postTitle.trim())
            postData.append('description', postDescription.trim())
            postData.append('isAnonymous', String(isAnonymousPost))
            if (postMood) postData.append('mood', postMood)
            if (postImage) postData.append('image', postImage)

            const result = await createGroupPost(token, circleId, postData)
            setPosts(current => [
                result.post,
                ...current.filter(post => post._id !== result.post._id),
            ])
            setPostTitle('')
            setPostDescription('')
            setPostImage(null)
            setIsAnonymousPost(false)
            setPostMood(null)
            Alert.alert(
                result.post.status === 'active' ? 'Post published' : 'Post submitted',
                result.message,
            )
        } catch (postError) {
            Alert.alert('Unable to create post', postError.message)
        } finally {
            setIsPosting(false)
        }
    }

    const submitMessage = async () => {
        const content = messageText.trim()
        if (!content || isSendingMessage) return

        try {
            setIsSendingMessage(true)
            const result = await sendCircleMessage(token, circleId, content)
            setMessages(current => [...current, result.message])
            setMessageText('')
        } catch (messageError) {
            Alert.alert('Unable to send message', messageError.message)
        } finally {
            setIsSendingMessage(false)
        }
    }

    const handleSessionRegister = async sessionId => {
        if (!sessionId || !canParticipate) return

        try {
            setRegisteringSessionId(sessionId)
            const result = await registerAttendance(token, sessionId)

            const attendanceRecord = result.attendance || {}
            setAttendanceBySession(current => ({
                ...current,
                [sessionId]: [...(current[sessionId] || []), attendanceRecord],
            }))
            Alert.alert('You are registered', 'Your session registration has been saved.')
        } catch (registerError) {
            Alert.alert('Unable to register', registerError.message || 'Please try again.')
        } finally {
            setRegisteringSessionId(null)
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#397A49" />
                    <Text style={styles.loadingText}>Loading community...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error || !circle) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.errorTitle}>Community unavailable</Text>
                    <Text style={styles.errorText}>{error || 'This community could not be found.'}</Text>
                    <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.primaryButtonText}>Go back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.communityHeader}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back to communities"
                    onPress={() => navigation.goBack()}
                    style={styles.activityBackButton}>
                    <Text style={styles.backButtonText}>‹</Text>
                </Pressable>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${circle.topic}. Open community details`}
                    onPress={() =>
                        navigation.navigate('MemberCircleDetail', {circleId})
                    }
                    style={styles.activityCommunityCard}>

                    <View style={styles.activityCover}>
                        {circle.coverImage ? (
                            <Image
                                source={{uri: circle.coverImage}}
                                style={styles.activityCoverImage}
                            />
                        ) : (
                            <View style={styles.activityCoverFallback}>
                                <Text style={styles.activityCoverFallbackText}>
                                    {circle.topic?.charAt(0)?.toUpperCase() || 'C'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.activityProfileWrapper}>
                        {circle.profileImage ? (
                            <Image
                                source={{uri: circle.profileImage}}
                                style={styles.activityProfileImage}
                            />
                        ) : (
                            <View style={styles.activityProfileFallback}>
                                <Text style={styles.activityProfileFallbackText}>
                                    ♥
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.activityCommunityInfo}>
                        <Text
                            numberOfLines={1}
                            style={styles.activityCommunityName}>
                            {circle.topic}
                        </Text>

                        <View style={styles.activityCategoryBadge}>
                            <Text style={styles.activityCategoryText}>
                                {circle.category || 'Support community'}
                            </Text>
                        </View>

                        <View style={styles.activityMetaRow}>
                            {circle.status === 'active' ? (
                                <View style={styles.activityActiveBadge}>
                                    <View style={styles.activityActiveDot} />
                                    <Text style={styles.activityActiveText}>
                                        Active
                                    </Text>
                                </View>
                            ) : null}

                            <Text style={styles.activityDetailsText}>
                                Community details
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.activityArrow}>›</Text>
                </Pressable>
            </View>

            <View style={styles.sectionTabs}>
                {[
                    {key: 'posts', label: 'Posts'},
                    {key: 'chat', label: 'Chat'},
                    {key: 'announcements', label: 'Announcements'},
                ].map(section => (
                    <Pressable
                        key={section.key}
                        accessibilityRole="tab"
                        accessibilityState={{selected: activeSection === section.key}}
                        onPress={() => setActiveSection(section.key)}
                        style={[styles.sectionTab, activeSection === section.key && styles.sectionTabActive]}>
                        <Text style={[styles.sectionTabText, activeSection === section.key && styles.sectionTabTextActive]}>
                            {section.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView
                key={activeSection}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}>
                {activeSection === 'posts' ? (
                    <>
                        {canParticipate ? (
                            <View style={styles.composer}>
                                <Text style={styles.composerTitle}>Share with the community</Text>
                                <View style={styles.anonymousRow}>
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
                                    style={styles.titleInput}
                                />
                                <TextInput
                                    value={postDescription}
                                    onChangeText={setPostDescription}
                                    maxLength={5000}
                                    multiline
                                    textAlignVertical="top"
                                    placeholder="Write a post..."
                                    placeholderTextColor="#879186"
                                    style={styles.descriptionInput}
                                />
                                <Text style={styles.optionTitle}>Add a mood (optional)</Text>
                                <View style={styles.moodOptions}>
                                    {MOOD_OPTIONS.map(option => (
                                        <Pressable
                                            key={option.value}
                                            accessibilityRole="button"
                                            accessibilityState={{selected: postMood === option.value}}
                                            onPress={() => setPostMood(current => current === option.value ? null : option.value)}
                                            style={[styles.moodOption, postMood === option.value && styles.moodOptionActive]}>
                                            <Text style={styles.moodOptionText}>{option.emoji} {option.label}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                                {postImage ? (
                                    <View style={styles.imagePreviewWrap}>
                                        <Image source={{uri: postImage.uri}} style={styles.imagePreview} />
                                        <Pressable onPress={() => setPostImage(null)} style={styles.removeImageButton}>
                                            <Text style={styles.removeImageText}>Remove image</Text>
                                        </Pressable>
                                    </View>
                                ) : null}
                                <View style={styles.composerActions}>
                                    <Pressable onPress={choosePostImage} style={styles.imagePickerButton}>
                                        <Text style={styles.imagePickerText}>＋ Add image</Text>
                                    </Pressable>
                                    <Pressable
                                        disabled={isPosting || !postTitle.trim() || !postDescription.trim()}
                                        onPress={submitPost}
                                        style={[styles.primaryButton, styles.publishButton, (isPosting || !postTitle.trim() || !postDescription.trim()) && styles.disabledButton]}>
                                        <Text style={styles.primaryButtonText}>{isPosting ? 'Submitting...' : 'Publish'}</Text>
                                    </Pressable>
                                </View>
                                <Text style={styles.reviewNote}>Posts may be reviewed by the organizer before publishing.</Text>
                            </View>
                        ) : (
                            <Text style={styles.readOnlyNote}>Join this community to publish a post or send a chat message.</Text>
                        )}

                        {posts.map(post => (
                            <View key={post._id} style={styles.postCard}>
                                <View style={styles.postMetaRow}>
                                    <View style={styles.postAuthorRow}>
                                        <Text style={styles.postAuthor}>
                                            {post.isAnonymous ? 'Anonymous' : post.author?.name || 'Community member'}
                                        </Text>
                                        {!post.isAnonymous ? (
                                            <CommunityOrganizerBadge
                                                role={post.author?.role}
                                                size="small"
                                                style={styles.postAuthorBadge}
                                            />
                                        ) : null}
                                    </View>
                                    {post.status !== 'active' ? (
                                        <Text style={styles.pendingLabel}>
                                            {post.status === 'pending' ? 'Awaiting review' : 'Removed'}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={styles.postTitle}>{post.title}</Text>
                                {post.mood ? (
                                    <Text style={styles.postMood}>
                                        {MOOD_OPTIONS.find(option => option.value === post.mood)?.emoji} Feeling {post.mood}
                                    </Text>
                                ) : null}
                                <Text style={styles.postDescription}>{post.description || post.content}</Text>
                                {post.imageUrl ? <Image source={{uri: post.imageUrl}} style={styles.postImage} /> : null}
                                <Text style={styles.postDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                            </View>
                        ))}
                        {posts.length === 0 ? <Text style={styles.emptyText}>No community posts yet.</Text> : null}
                    </>
                ) : activeSection === 'chat' ? (
                    <>
                        <View style={styles.chatHistory}>
                            {messages.map(item => {
                                const isOwnMessage = item.sender?._id === user?._id
                                return (
                                    <View key={item._id} style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
                                        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
                                            {!isOwnMessage ? (
                                                <View style={styles.messageSenderRow}>
                                                    <Text style={styles.messageSender}>{item.sender?.name || 'Community member'}</Text>
                                                    <CommunityOrganizerBadge
                                                        role={item.sender?.role}
                                                        size="small"
                                                        style={styles.messageSenderBadge}
                                                    />
                                                </View>
                                            ) : null}
                                            <Text style={[styles.messageContent, isOwnMessage && styles.ownMessageContent]}>{item.content}</Text>
                                            <Text style={styles.messageTime}>
                                                {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                            </Text>
                                        </View>
                                    </View>
                                )
                            })}
                            {messages.length === 0 ? <Text style={styles.emptyText}>No messages yet. Start the conversation.</Text> : null}
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
                                    onPress={submitMessage}
                                    style={[styles.sendButton, (!messageText.trim() || isSendingMessage) && styles.disabledButton]}>
                                    <Text style={styles.primaryButtonText}>Send</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <Text style={styles.readOnlyNote}>Join this community to send messages.</Text>
                        )}
                    </>
                ) : (
                    <>
                        <View style={styles.announcementIntro}>
                            <Text style={styles.announcementIntroTitle}>Community Announcements</Text>
                            <Text style={styles.announcementIntroText}>
                                Session updates and upcoming community meetings will appear here.
                            </Text>
                        </View>

                        {sessions.map(session => {
                            const scheduledAt = new Date(session.scheduledAt)
                            const sessionMeetingType =
                                session.meetingType ||
                                (session.meetingLink ? 'online' : session.location ? 'physical' : 'online')
                            const isCancelled = session.status === 'cancelled'
                            const isCompleted = session.status === 'completed' || scheduledAt < new Date()
                            const statusLabel = isCancelled
                                ? 'CANCELLED'
                                : isCompleted
                                  ? 'COMPLETED'
                                  : 'UPCOMING'
                            const attendanceRecords = attendanceBySession[session._id] || []
                            const registeredCount = attendanceRecords.filter(item => item.status === 'registered').length
                            const userRegistration = attendanceRecords.find(
                                item => (item.userId?._id || item.userId) === user?._id && item.status === 'registered',
                            )
                            const isPhysicalSession = sessionMeetingType === 'physical'
                            const capacityReached = isPhysicalSession && Number(session.capacity) > 0 && registeredCount >= Number(session.capacity)
                            const registrationDisabled =
                                !canParticipate ||
                                isCancelled ||
                                isCompleted ||
                                !!userRegistration ||
                                (registeringSessionId === session._id) ||
                                (isPhysicalSession && capacityReached)

                            return (
                                <View key={session._id} style={styles.announcementCard}>
                                    <View style={styles.announcementTopRow}>
                                        <View style={styles.announcementBadge}>
                                            <Text style={styles.announcementBadgeText}>SESSION</Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.announcementStatus,
                                                isCancelled && styles.announcementStatusCancelled,
                                                isCompleted && styles.announcementStatusCompleted,
                                            ]}>
                                            {statusLabel}
                                        </Text>
                                    </View>

                                    <Text style={styles.announcementTitle}>{session.title}</Text>

                                    <View style={styles.announcementInfoRow}>
                                        <Text style={styles.announcementInfoIcon}>📅</Text>
                                        <Text style={styles.announcementInfoText}>
                                            {scheduledAt.toLocaleDateString([], {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </Text>
                                    </View>

                                    <View style={styles.announcementInfoRow}>
                                        <Text style={styles.announcementInfoIcon}>🕐</Text>
                                        <Text style={styles.announcementInfoText}>
                                            {scheduledAt.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })} · {session.durationMinutes} min
                                        </Text>
                                    </View>

                                    <View style={styles.announcementInfoRow}>
                                        <Text style={styles.announcementInfoIcon}>🏷️</Text>
                                        <Text style={styles.announcementInfoText}>
                                            {sessionMeetingType === 'online' ? 'Online session' : 'Physical session'}
                                        </Text>
                                    </View>

                                    {sessionMeetingType === 'online' ? (
                                        <Pressable
                                            onPress={() => session.meetingLink && Linking.openURL(session.meetingLink)}
                                            style={styles.meetingLinkRow}>
                                            <Text style={styles.announcementInfoIcon}>🔗</Text>
                                            <Text style={styles.linkText} numberOfLines={2}>
                                                {session.meetingLink || 'Meeting link unavailable'}
                                            </Text>
                                        </Pressable>
                                    ) : (
                                        <View style={styles.announcementInfoRow}>
                                            <Text style={styles.announcementInfoIcon}>📍</Text>
                                            <Text style={styles.announcementInfoText} numberOfLines={2}>
                                                {session.location || 'Location unavailable'}
                                            </Text>
                                        </View>
                                    )}

                                    {isPhysicalSession ? (
                                        <View style={styles.capacityRow}>
                                            <Text style={styles.capacityText}>
                                                {registeredCount} / {session.capacity || 0} registered
                                            </Text>
                                            {capacityReached ? (
                                                <Text style={styles.capacityFull}>FULL</Text>
                                            ) : null}
                                        </View>
                                    ) : null}

                                    {session.description ? (
                                        <Text style={styles.announcementDescription}>
                                            {session.description}
                                        </Text>
                                    ) : null}

                                    <View style={styles.registerRow}>
                                        <Pressable
                                            disabled={registrationDisabled}
                                            onPress={() => handleSessionRegister(session._id)}
                                            style={[
                                                styles.registerButton,
                                                registrationDisabled && styles.registerButtonDisabled,
                                                capacityReached && styles.registerButtonFull,
                                            ]}>
                                            <Text style={styles.registerButtonText}>
                                                {userRegistration ? '✓ REGISTERED' : capacityReached ? 'FULL' : 'REGISTER'}
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )
                        })}

                        {sessions.length === 0 ? (
                            <View style={styles.emptyAnnouncementState}>
                                <Text style={styles.emptyAnnouncementIcon}>📢</Text>
                                <Text style={styles.emptyAnnouncementTitle}>No announcements yet</Text>
                                <Text style={styles.emptyText}>
                                    Session announcements from the community organizer will appear here.
                                </Text>
                            </View>
                        ) : null}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {flex: 1, backgroundColor: '#F8FAF5'},
    communityHeader: {
        backgroundColor: '#F8FAF5',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E9DF',
        paddingBottom: 10,
    },

    activityBackButton: {
        position: 'absolute',
        left: 10,
        top: 16,
        zIndex: 20,
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.88)',
    },

    backButtonText: {
        color: '#354335',
        fontSize: 32,
        lineHeight: 36,
    },

    activityCommunityCard: {
        marginHorizontal: 12,
        marginTop: 8,
        position: 'relative',
        paddingBottom: 2,
    },

    activityCover: {
        width: '100%',
        height: 158,
        overflow: 'hidden',
        borderRadius: 14,
        backgroundColor: '#DDEBDD',
    },

    activityCoverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    activityCoverFallback: {
        flex: 1,
        backgroundColor: '#DDEBDD',
        alignItems: 'center',
        justifyContent: 'center',
    },

    activityCoverFallbackText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#4E8C4A',
    },

    activityProfileWrapper: {
        width: 86,
        height: 86,
        borderRadius: 43,
        padding: 4,
        position: 'absolute',
        left: 18,
        top: 116,
        zIndex: 5,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.16,
        shadowRadius: 5,
        elevation: 5,
    },

    activityProfileImage: {
        width: 78,
        height: 78,
        borderRadius: 39,
        resizeMode: 'cover',
    },

    activityProfileFallback: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: '#E5F2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },

    activityProfileFallbackText: {
        fontSize: 30,
        color: '#4E8C4A',
    },

    activityCommunityInfo: {
        marginTop: 48,
        paddingHorizontal: 6,
        paddingLeft: 8,
    },

    activityCommunityName: {
        color: '#263526',
        fontSize: 21,
        lineHeight: 27,
        fontWeight: '700',
    },

    activityCategoryBadge: {
        alignSelf: 'flex-start',
        marginTop: 7,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: '#E7F3E4',
    },

    activityCategoryText: {
        color: '#4E8C4A',
        fontSize: 11,
        fontWeight: '700',
    },

    activityMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 9,
    },

    activityActiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 11,
        backgroundColor: '#E7F3E4',
    },

    activityActiveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4E8C4A',
        marginRight: 5,
    },

    activityActiveText: {
        color: '#4E8C4A',
        fontSize: 10,
        fontWeight: '700',
    },

    activityDetailsText: {
        marginLeft: 9,
        color: '#397A49',
        fontSize: 11,
        fontWeight: '600',
    },

    activityArrow: {
        position: 'absolute',
        right: 6,
        bottom: 24,
        color: '#748171',
        fontSize: 28,
    },

    sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF5',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE5D8',
    paddingHorizontal: 18,
},

    sectionTab: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
},

sectionTabActive: {
    borderBottomColor: '#397A49',
},

sectionTabText: {
    color: '#758174',
    fontSize: 13,
    fontWeight: '600',
},

sectionTabTextActive: {
    color: '#276D3B',
},

    content: {padding: 16, paddingBottom: 36},
    composer: {
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E8DC',
        borderRadius: 12,
    },
    composerTitle: {color: '#263526', fontSize: 16, fontWeight: '700'},
    anonymousRow: {flexDirection: 'row', alignItems: 'center', marginTop: 10},
    anonymousCopy: {flex: 1, paddingRight: 8},
    optionTitle: {marginTop: 10, color: '#263526', fontSize: 13, fontWeight: '700'},
    optionHint: {marginTop: 3, color: '#758174', fontSize: 11, lineHeight: 15},
    titleInput: {
        height: 44,
        marginTop: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#DCE5D8',
        borderRadius: 8,
        color: '#243024',
    },
    descriptionInput: {
        minHeight: 96,
        marginTop: 9,
        padding: 12,
        borderWidth: 1,
        borderColor: '#DCE5D8',
        borderRadius: 8,
        color: '#243024',
    },
    moodOptions: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8},
    moodOption: {minHeight: 34, justifyContent: 'center', paddingHorizontal: 9, backgroundColor: '#F1F5EC', borderRadius: 8},
    moodOptionActive: {backgroundColor: '#DCEBD8', borderWidth: 1, borderColor: '#397A49'},
    moodOptionText: {color: '#536057', fontSize: 11, fontWeight: '600'},
    imagePreviewWrap: {marginTop: 12},
    imagePreview: {width: '100%', height: 190, borderRadius: 8},
    removeImageButton: {alignSelf: 'flex-end', paddingTop: 8},
    removeImageText: {color: '#A3443E', fontSize: 12, fontWeight: '600'},
    composerActions: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 13},
    imagePickerButton: {minHeight: 42, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: '#B8CCB3', borderRadius: 8},
    imagePickerText: {color: '#397A49', fontSize: 13, fontWeight: '700'},
    primaryButton: {minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: '#397A49', borderRadius: 8},
    publishButton: {flex: 1},
    primaryButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
    disabledButton: {opacity: 0.55},
    reviewNote: {marginTop: 9, color: '#758174', fontSize: 11, lineHeight: 16},
    readOnlyNote: {marginBottom: 14, padding: 12, color: '#536057', backgroundColor: '#EEF3EE', borderRadius: 8, fontSize: 13, lineHeight: 19},
    postCard: {padding: 15, marginBottom: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E8DC', borderRadius: 12},
    postMetaRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
    postAuthorRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6},
    postAuthor: {color: '#536057', fontSize: 12, fontWeight: '600'},
    postAuthorBadge: {width: 14, height: 14},
    pendingLabel: {color: '#8A5C36', fontSize: 11, fontWeight: '700'},
    postTitle: {marginTop: 8, color: '#263526', fontSize: 16, fontWeight: '700'},
    postMood: {marginTop: 7, color: '#397A49', fontSize: 12, fontWeight: '600'},
    postDescription: {marginTop: 7, color: '#536057', fontSize: 14, lineHeight: 21},
    postImage: {width: '100%', height: 210, marginTop: 10, borderRadius: 8},
    postDate: {marginTop: 10, color: '#879186', fontSize: 11},
    emptyText: {paddingVertical: 28, color: '#758174', textAlign: 'center', fontSize: 13},
    announcementIntro: {
        padding: 15,
        marginBottom: 12,
        backgroundColor: '#EEF5EB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DCE9D8',
    },
    announcementIntroTitle: {color: '#263526', fontSize: 16, fontWeight: '700'},
    announcementIntroText: {marginTop: 5, color: '#687467', fontSize: 12, lineHeight: 18},
    announcementCard: {
        padding: 15,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DCE7D8',
        borderRadius: 12,
    },
    announcementTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    announcementBadge: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#E7F3E4',
    },
    announcementBadgeText: {color: '#397A49', fontSize: 10, fontWeight: '800', letterSpacing: 0.6},
    announcementStatus: {color: '#397A49', fontSize: 10, fontWeight: '800'},
    announcementStatusCancelled: {color: '#A3443E'},
    announcementStatusCompleted: {color: '#758174'},
    announcementTitle: {marginTop: 12, color: '#263526', fontSize: 18, lineHeight: 24, fontWeight: '700'},
    announcementInfoRow: {flexDirection: 'row', alignItems: 'flex-start', marginTop: 9},
    announcementInfoIcon: {width: 24, fontSize: 14},
    announcementInfoText: {flex: 1, color: '#536057', fontSize: 13, lineHeight: 19},
    meetingLinkRow: {flexDirection: 'row', alignItems: 'center', marginTop: 9},
    linkText: {flex: 1, color: '#397A49', fontSize: 13, lineHeight: 19, fontWeight: '600'},
    capacityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EDF1EB',
    },
    capacityText: {color: '#536057', fontSize: 12, fontWeight: '600'},
    capacityFull: {color: '#B94A48', fontSize: 11, fontWeight: '800', letterSpacing: 0.5},
    announcementDescription: {
        marginTop: 12,
        color: '#536057',
        fontSize: 13,
        lineHeight: 20,
    },
    registerRow: {marginTop: 14},
    registerButton: {
        backgroundColor: '#397A49',
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    registerButtonDisabled: {
        backgroundColor: '#D7DED5',
        opacity: 0.9,
    },
    registerButtonFull: {
        backgroundColor: '#B94A48',
    },
    registerButtonText: {color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.4},
    emptyAnnouncementState: {
        alignItems: 'center',
        paddingVertical: 42,
        paddingHorizontal: 20,
    },
    emptyAnnouncementIcon: {fontSize: 30, marginBottom: 10},
    emptyAnnouncementTitle: {color: '#354335', fontSize: 16, fontWeight: '700'},
    chatHistory: {minHeight: 180, padding: 12, backgroundColor: '#F0F4EE', borderRadius: 12},
    messageRow: {alignItems: 'flex-start', marginBottom: 10},
    ownMessageRow: {alignItems: 'flex-end'},
    messageBubble: {maxWidth: '86%', minWidth: 92, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#FFFFFF', borderRadius: 12},
    ownMessageBubble: {backgroundColor: '#397A49'},
    messageSenderRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4},
    messageSender: {color: '#397A49', fontSize: 11, fontWeight: '700'},
    messageSenderBadge: {width: 14, height: 14},
    messageContent: {color: '#263526', fontSize: 14, lineHeight: 20},
    ownMessageContent: {color: '#FFFFFF'},
    messageTime: {alignSelf: 'flex-end', marginTop: 4, color: '#879186', fontSize: 10},
    chatComposer: {flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10},
    messageInput: {flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE5D8', borderRadius: 10, color: '#243024'},
    sendButton: {minWidth: 62, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#397A49', borderRadius: 10},
    centered: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26},
    loadingText: {marginTop: 12, color: '#71806F', fontSize: 14},
    errorTitle: {color: '#354335', fontSize: 19, fontWeight: '700'},
    errorText: {marginTop: 8, marginBottom: 18, color: '#7A8477', fontSize: 14, lineHeight: 20, textAlign: 'center'},
})

export default MemberCircleActivityScreen