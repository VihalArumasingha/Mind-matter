import React, {useCallback, useState} from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {useFocusEffect} from '@react-navigation/native'
import {useAuth} from '../../../context/AuthContext'
import {
    getMyCircles,
    getAllPendingRequests,
    getDashboardStats,
    respondToRequest,
} from '../services/supportCircleService'


const TABS = ['Overview', 'My Circles', 'Request']

const BOTTOM_TABS = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        icon: 'view-dashboard-outline',
    },
    {
        key: 'requests',
        label: 'Requests',
        icon: 'clipboard-list-outline',
    },
    {
        key: 'profile',
        label: 'Profile',
        icon: 'account-outline',
    },
]

const OrganizerDashboardScreen = ({navigation}) => {
    const {token, user} = useAuth()

    const [activeTab, setActiveTab] = useState('Overview')
    const [activeBottomTab, setActiveBottomTab] =
        useState('dashboard')

    const [stats, setStats] = useState(null)
    const [circles, setCircles] = useState([])
    const [requests, setRequests] = useState([])

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // Currently selected join request for the preview modal
    const [selectedRequest, setSelectedRequest] =
        useState(null)

    // Tracks whether a request is being approved/rejected
    const [responding, setResponding] = useState({})

    // -------------------------------------------------------------------------
    // LOAD DASHBOARD DATA
    // -------------------------------------------------------------------------

    const loadAll = useCallback(async () => {
        try {
            setError('')

            const [
                statsData,
                circlesData,
                requestsData,
            ] = await Promise.all([
                getDashboardStats(token),
                getMyCircles(token),
                getAllPendingRequests(token),
            ])

            setStats(statsData)
            setCircles(circlesData.circles ?? [])
            setRequests(requestsData.requests ?? [])
        } catch (err) {
            setError(
                err.message ||
                    'Failed to load dashboard',
            )
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useFocusEffect(
        useCallback(() => {
            loadAll()
        }, [loadAll]),
    )

    // -------------------------------------------------------------------------
    // APPROVE / REJECT REQUEST
    // -------------------------------------------------------------------------

    const handleRespond = async (
        membershipId,
        decision,
    ) => {
        if (!membershipId) {
            return
        }

        setResponding(prev => ({
            ...prev,
            [membershipId]: decision,
        }))

        try {
            await respondToRequest(
                token,
                membershipId,
                decision,
            )

            // Close the preview if it is open
            setSelectedRequest(null)

            // Remove the handled request immediately
            setRequests(prev =>
                prev.filter(
                    request =>
                        request._id !== membershipId,
                ),
            )
        } catch (err) {
            Alert.alert(
                'Error',
                err.message ||
                    'Failed to respond to request',
            )
        } finally {
            setResponding(prev => {
                const next = {...prev}

                delete next[membershipId]

                return next
            })
        }
    }

    // -------------------------------------------------------------------------
    // BOTTOM NAVIGATION
    // -------------------------------------------------------------------------

    const handleTabChange = tabName => {
        if (tabName === 'profile') {
            setActiveBottomTab('profile')
            navigation.navigate('OrganizerProfile')
            return
        }

        setActiveBottomTab(tabName)

        if (tabName === 'requests') {
            setActiveTab('Request')
            return
        }

        setActiveTab('Overview')
    }

    // -------------------------------------------------------------------------
    // LOADING
    // -------------------------------------------------------------------------

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#4E8C4A"
                />
            </View>
        )
    }

    // -------------------------------------------------------------------------
    // MAIN SCREEN
    // -------------------------------------------------------------------------

    return (
        <View style={styles.container}>

            {/* ================================================================
                HEADER
            ================================================================= */}

            <View style={styles.header}>
                <Pressable
                    style={styles.menuButton}
                    accessibilityLabel="Open profile and navigation"
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={() =>
                        navigation.navigate(
                            'OrganizerProfile',
                        )
                    }>
                    <Text style={styles.menuIcon}>
                        ☰
                    </Text>
                </Pressable>

                <Text style={styles.brand}>
                    MindMatter
                </Text>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open notifications"
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Text style={styles.bellIcon}>🔔</Text>
                </Pressable>
            </View>

            <View style={styles.tabRow}>
                {TABS.map(tab => (
                    <Pressable
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab &&
                                styles.tabActive,
                        ]}
                        onPress={() =>
                            setActiveTab(tab)
                        }>
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab &&
                                    styles.tabTextActive,
                            ]}>
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </View>


            {error ? (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            ) : null}


            {activeTab === 'Overview' && (
                <ScrollView
                    contentContainerStyle={
                        styles.content
                    }
                    showsVerticalScrollIndicator={false}>

                    <View style={styles.statRow}>

                        <View style={styles.statCard}>
                            <Text
                                style={
                                    styles.statNumber
                                }>
                                {stats?.totalCircles ??
                                    0}
                            </Text>

                            <Text
                                style={
                                    styles.statLabel
                                }>
                                Total Circles
                            </Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text
                                style={
                                    styles.statNumber
                                }>
                                {stats?.totalMembers ??
                                    0}
                            </Text>

                            <Text
                                style={
                                    styles.statLabel
                                }>
                                Total Members
                            </Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text
                                style={
                                    styles.statNumber
                                }>
                                {stats?.pendingRequests ??
                                    0}
                            </Text>

                            <Text
                                style={
                                    styles.statLabel
                                }>
                                Pending Requests
                            </Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text
                                style={
                                    styles.statNumber
                                }>
                                {stats?.upcomingSessionsCount ??
                                    0}
                            </Text>

                            <Text
                                style={
                                    styles.statLabel
                                }>
                                Upcoming Sessions
                            </Text>
                        </View>

                    </View>

                    <Text style={styles.sectionTitle}>
                        RECENT ACTIVITIES
                    </Text>

                    {!stats?.recentActivity ||
                    stats.recentActivity.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text
                                style={
                                    styles.emptyStateBody
                                }>
                                Nothing yet — activity will
                                show up here as your
                                circles grow.
                            </Text>
                        </View>
                    ) : (
                        stats.recentActivity.map(
                            (activity, index) => (
                                <View
                                    key={index}
                                    style={
                                        styles.activityCard
                                    }>
                                    <Text
                                        style={
                                            styles.activityText
                                        }>
                                        {activity.message}
                                    </Text>
                                </View>
                            ),
                        )
                    )}
                </ScrollView>
            )}


            {activeTab === 'My Circles' && (
                <ScrollView
                    contentContainerStyle={
                        styles.content
                    }
                    showsVerticalScrollIndicator={false}>

                    {circles.length === 0 ? (
                        <View
                            style={
                                styles.emptyState
                            }>
                            <Text
                                style={
                                    styles.emptyStateTitle
                                }>
                                Start your first circle
                            </Text>

                            <Text
                                style={
                                    styles.emptyStateBody
                                }>
                                Create a support circle
                                to bring your community
                                together.
                            </Text>
                        </View>
                    ) : (
                        circles.map(circle => (
                            <Pressable
                                key={circle._id}
                                style={
                                    styles.circleCard
                                }
                                onPress={() =>
                                    navigation.navigate(
                                        'CircleDetail',
                                        {
                                            circleId:
                                                circle._id,
                                        },
                                    )
                                }>

                                <View
    style={[
        styles.circleAvatar,
        {
            borderColor:
                circle.status === 'active'
                    ? '#4E8C4A'
                    : '#A1A8A1',
        },
    ]}>
    {circle.profileImage ? (
        <Image
            source={{uri: circle.profileImage}}
            style={styles.circleAvatarImage}
        />
    ) : (
        <Text style={styles.circleAvatarText}>👥</Text>
    )}
</View>

                                <View
                                    style={
                                        styles.circleInfo
                                    }>
                                    <Text
                                        style={
                                            styles.circleName
                                        }>
                                        {circle.topic}
                                    </Text>

                                    <Text
                                        style={
                                            styles.circleMeta
                                        }>
                                        {
                                            circle.currentMemberCount
                                        }{' '}
                                        members ·{' '}
                                        {circle.meetingTypes?.join(
                                            ' & ',
                                        )}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor:
                                                circle.status ===
                                                'active'
                                                    ? '#E2EEDB'
                                                    : '#E7ECE4',
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            styles.statusBadgeText,
                                            {
                                                color:
                                                    circle.status ===
                                                    'active'
                                                        ? '#3F7540'
                                                        : '#666C66',
                                            },
                                        ]}>
                                        {circle.status ===
                                        'active'
                                            ? 'Active'
                                            : 'Archived'}
                                    </Text>
                                </View>

                            </Pressable>
                        ))
                    )}

                    <Pressable
                        style={styles.createButton}
                        onPress={() =>
                            navigation.navigate(
                                'CircleForm',
                            )
                        }>
                        <Text
                            style={
                                styles.createButtonText
                            }>
                            + Create a circle
                        </Text>
                    </Pressable>

                </ScrollView>
            )}

            {activeTab === 'Request' && (
                <ScrollView
                    contentContainerStyle={
                        styles.content
                    }
                    showsVerticalScrollIndicator={false}>

                    {requests.length === 0 ? (
                        <View
                            style={
                                styles.emptyState
                            }>
                            <Text
                                style={
                                    styles.emptyStateBody
                                }>
                                No pending join requests
                                right now.
                            </Text>
                        </View>
                    ) : (
                        requests.map(request => {
                            const applicant =
                                request.userId ?? {}

                            const name =
                                applicant.name ||
                                'Unknown member'

                            const email =
                                applicant.email || ''

                            const bio =
                                applicant.bio || ''

                            const profilePicture =
                                applicant.profilePicture

                            const isApproving =
                                responding[
                                    request._id
                                ] === 'approved'

                            const isRejecting =
                                responding[
                                    request._id
                                ] === 'rejected'

                            const isResponding =
                                isApproving ||
                                isRejecting

                            return (
                                <Pressable
                                    key={request._id}
                                    style={({pressed}) => [
                                        styles.requestCard,
                                        pressed &&
                                            styles.requestCardPressed,
                                    ]}
                                    onPress={() =>
                                        setSelectedRequest(
                                            request,
                                        )
                                    }
                                    disabled={
                                        isResponding
                                    }>

                                    {/* MEMBER HEADER */}

                                    <View
                                        style={
                                            styles.requestHeader
                                        }>

                                        {profilePicture ? (
                                            <Image
                                                source={{
                                                    uri: profilePicture,
                                                }}
                                                style={
                                                    styles.requestAvatar
                                                }
                                            />
                                        ) : (
                                            <View
                                                style={
                                                    styles.requestAvatarFallback
                                                }>
                                                <Text
                                                    style={
                                                        styles.requestAvatarText
                                                    }>
                                                    {name
                                                        .charAt(
                                                            0,
                                                        )
                                                        .toUpperCase()}
                                                </Text>
                                            </View>
                                        )}

                                        <View
                                            style={
                                                styles.requestInfo
                                            }>

                                            <Text
                                                style={
                                                    styles.requestName
                                                }>
                                                {name}
                                            </Text>

                                            {email ? (
                                                <Text
                                                    style={
                                                        styles.requestEmail
                                                    }
                                                    numberOfLines={
                                                        1
                                                    }>
                                                    {email}
                                                </Text>
                                            ) : null}

                                            <Text
                                                style={
                                                    styles.requestMeta
                                                }
                                                numberOfLines={
                                                    1
                                                }>
                                                wants to join{' '}
                                                {request
                                                    .groupId
                                                    ?.topic ||
                                                    'your community'}
                                            </Text>

                                        </View>

                                        <Text
                                            style={
                                                styles.requestArrow
                                            }>
                                            ›
                                        </Text>

                                    </View>


                                    {bio ? (
                                        <Text
                                            style={
                                                styles.requestBio
                                            }
                                            numberOfLines={
                                                2
                                            }>
                                            {bio}
                                        </Text>
                                    ) : (
                                        <Text
                                            style={
                                                styles.requestNoBio
                                            }>
                                            No bio provided
                                        </Text>
                                    )}

                                 

                                    <Text
                                        style={
                                            styles.tapToReview
                                        }>
                                        Tap to review member
                                    </Text>


                                    <View
                                        style={
                                            styles.requestActions
                                        }>

                                        <Pressable
                                            style={[
                                                styles.requestButton,
                                                styles.rejectButton,
                                                isResponding &&
                                                    styles.buttonDisabled,
                                            ]}
                                            disabled={
                                                isResponding
                                            }
                                            onPress={event => {
                                                event.stopPropagation()

                                                handleRespond(
                                                    request._id,
                                                    'rejected',
                                                )
                                            }}>

                                            {isRejecting ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="#FFFFFF"
                                                />
                                            ) : (
                                                <Text
                                                    style={
                                                        styles.requestButtonTextLight
                                                    }>
                                                    Reject
                                                </Text>
                                            )}

                                        </Pressable>

                                        <Pressable
                                            style={[
                                                styles.requestButton,
                                                styles.approveButton,
                                                isResponding &&
                                                    styles.buttonDisabled,
                                            ]}
                                            disabled={
                                                isResponding
                                            }
                                            onPress={event => {
                                                event.stopPropagation()

                                                handleRespond(
                                                    request._id,
                                                    'approved',
                                                )
                                            }}>

                                            {isApproving ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="#FFFFFF"
                                                />
                                            ) : (
                                                <Text
                                                    style={
                                                        styles.requestButtonTextLight
                                                    }>
                                                    Approve
                                                </Text>
                                            )}

                                        </Pressable>

                                    </View>

                                </Pressable>
                            )
                        })
                    )}

                </ScrollView>
            )}


            <Modal
                visible={!!selectedRequest}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setSelectedRequest(null)
                }>

                <View
                    style={
                        styles.modalOverlay
                    }>


                    <Pressable
                        style={
                            styles.modalBackdrop
                        }
                        onPress={() =>
                            setSelectedRequest(
                                null,
                            )
                        }
                    />


                    <View style={styles.modalCard}>


                        <Pressable
                            style={
                                styles.modalClose
                            }
                            hitSlop={10}
                            onPress={() =>
                                setSelectedRequest(
                                    null,
                                )
                            }>
                            <Text
                                style={
                                    styles.modalCloseText
                                }>
                                ×
                            </Text>
                        </Pressable>


                        {selectedRequest?.userId
                            ?.profilePicture ? (
                            <Image
                                source={{
                                    uri: selectedRequest
                                        .userId
                                        .profilePicture,
                                }}
                                style={
                                    styles.modalAvatar
                                }
                            />
                        ) : (
                            <View
                                style={
                                    styles.modalAvatarFallback
                                }>
                                <Text
                                    style={
                                        styles.modalAvatarText
                                    }>
                                    {(
                                        selectedRequest
                                            ?.userId
                                            ?.name ||
                                        '?'
                                    )
                                        .charAt(0)
                                        .toUpperCase()}
                                </Text>
                            </View>
                        )}

                   

                        <Text
                            style={
                                styles.modalName
                            }>
                            {selectedRequest?.userId
                                ?.name ||
                                'Unknown member'}
                        </Text>


                        {selectedRequest?.userId
                            ?.email ? (
                            <Text
                                style={
                                    styles.modalEmail
                                }>
                                {
                                    selectedRequest
                                        .userId.email
                                }
                            </Text>
                        ) : null}

                    

                        <View
                            style={
                                styles.modalStatus
                            }>
                            <View
                                style={
                                    styles.modalStatusDot
                                }
                            />

                            <Text
                                style={
                                    styles.modalStatusText
                                }>
                                Pending request
                            </Text>
                        </View>

                   

                        <View
                            style={
                                styles.modalDivider
                            }
                        />

                    

                        <Text
                            style={
                                styles.modalSectionTitle
                            }>
                            ABOUT THIS MEMBER
                        </Text>

                        <View
                            style={
                                styles.modalBioBox
                            }>
                            <Text
                                style={
                                    styles.modalBio
                                }>
                                {selectedRequest?.userId
                                    ?.bio ||
                                    'This member has not added a bio yet.'}
                            </Text>
                        </View>

                 

                        <Text
                            style={
                                styles.modalCommunity
                            }>
                            Wants to join{' '}
                            <Text
                                style={
                                    styles.modalCommunityBold
                                }>
                                {selectedRequest?.groupId
                                    ?.topic ||
                                    'this community'}
                            </Text>
                        </Text>

                       

                        <View
                            style={
                                styles.modalActions
                            }>

                            <Pressable
                                style={[
                                    styles.modalRejectButton,
                                    responding[
                                        selectedRequest?._id
                                    ] &&
                                        styles.buttonDisabled,
                                ]}
                                disabled={
                                    !!responding[
                                        selectedRequest?._id
                                    ]
                                }
                                onPress={() =>
                                    handleRespond(
                                        selectedRequest._id,
                                        'rejected',
                                    )
                                }>

                                {responding[
                                    selectedRequest?._id
                                ] === 'rejected' ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#B94A48"
                                    />
                                ) : (
                                    <Text
                                        style={
                                            styles.modalRejectText
                                        }>
                                        Reject
                                    </Text>
                                )}

                            </Pressable>

                            <Pressable
                                style={[
                                    styles.modalApproveButton,
                                    responding[
                                        selectedRequest?._id
                                    ] &&
                                        styles.buttonDisabled,
                                ]}
                                disabled={
                                    !!responding[
                                        selectedRequest?._id
                                    ]
                                }
                                onPress={() =>
                                    handleRespond(
                                        selectedRequest._id,
                                        'approved',
                                    )
                                }>

                                {responding[
                                    selectedRequest?._id
                                ] === 'approved' ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#FFFFFF"
                                    />
                                ) : (
                                    <Text
                                        style={
                                            styles.modalApproveText
                                        }>
                                        Approve
                                    </Text>
                                )}

                            </Pressable>

                        </View>

                    </View>
                </View>
            </Modal>

            {/* ================================================================
                BOTTOM NAVIGATION
            ================================================================= */}

            <View style={styles.bottomNav}>
                {BOTTOM_TABS.map(item => {
                    const isActive =
                        activeBottomTab ===
                        item.key

                    return (
                        <Pressable
                            key={item.key}
                            style={[
                                styles.bottomNavItem,
                                isActive &&
                                    styles.bottomNavItemActive,
                            ]}
                            onPress={() =>
                                handleTabChange(
                                    item.key,
                                )
                            }>

                            <MaterialCommunityIcons
                                name={item.icon}
                                size={22}
                                color={
                                    isActive
                                        ? '#4E8C4A'
                                        : '#707770'
                                }
                            />

                            <Text
                                style={[
                                    styles.bottomNavLabel,
                                    isActive &&
                                        styles.bottomNavLabelActive,
                                ]}>
                                {item.label}
                            </Text>

                        </Pressable>
                    )
                })}
            </View>

        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7EF',
    },

  
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },

    brand: {
        flex: 1,
        marginLeft: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#252A25',
    },

    menuIcon: {
        fontSize: 24,
        color: '#0AA35C',
    },

    menuButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    bellIcon: {
        fontSize: 18,
    },


    tabRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 16,
        padding: 4,
        marginBottom: 8,
    },

    tab: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 20,
        alignItems: 'center',
    },

    tabActive: {
        backgroundColor: '#4E8C4A',
    },

    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666C66',
    },

    tabTextActive: {
        color: '#FFFFFF',
    },

    errorText: {
        fontSize: 13,
        color: '#B94A48',
        marginHorizontal: 16,
        marginBottom: 8,
    },

  
    content: {
        padding: 16,
        paddingBottom: 110,
    },

   
    bottomNav: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#E5E9E1',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },

    bottomNavItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: 6,
        borderRadius: 12,
    },

    bottomNavItemActive: {
        backgroundColor: '#E2EEDB',
    },

    bottomNavLabel: {
        marginTop: 4,
        fontSize: 11,
        fontWeight: '600',
        color: '#707770',
    },

    bottomNavLabelActive: {
        color: '#4E8C4A',
    },

    statRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#E2EEDB',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        gap: 0,
    },

    statCard: {
        width: '50%',
        alignItems: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },

    statNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: '#252A25',
    },

    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3F7540',
        marginTop: 2,
    },

    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#252A25',
        letterSpacing: 0.3,
        marginBottom: 10,
    },

    emptyState: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 20,
        alignItems: 'center',
    },

    emptyStateTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#252A25',
        marginBottom: 4,
    },

    emptyStateBody: {
        fontSize: 13,
        color: '#707770',
        textAlign: 'center',
    },

    activityCard: {
        backgroundColor: '#4E8C4A',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },

    activityText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '500',
    },

    // ------------------------------------------------------------------------
    // MY CIRCLES
    // ------------------------------------------------------------------------

    circleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },

    circleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
},

circleAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
},

circleAvatarText: {
    fontSize: 15,
},

    circleInfo: {
        flex: 1,
    },

    circleName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#252A25',
    },

    circleMeta: {
        fontSize: 12,
        color: '#707770',
        marginTop: 2,
    },

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 20,
    },

    statusBadgeText: {
        fontSize: 11,
        fontWeight: '500',
    },

    createButton: {
        backgroundColor: '#4E8C4A',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },

    createButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    },

   
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        padding: 14,
        marginBottom: 10,
    },

    requestCardPressed: {
        opacity: 0.85,
        transform: [
            {
                scale: 0.99,
            },
        ],
    },

    requestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    requestAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
    },

    requestAvatarFallback: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
    },

    requestAvatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },

    requestInfo: {
        flex: 1,
        marginLeft: 11,
    },

    requestName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#252A25',
    },

    requestEmail: {
        fontSize: 11,
        color: '#8A9288',
        marginTop: 2,
    },

    requestMeta: {
        fontSize: 12,
        color: '#707770',
        marginTop: 3,
    },

    requestArrow: {
        fontSize: 25,
        color: '#4E8C4A',
        marginLeft: 8,
    },

    requestBio: {
        marginTop: 10,
        padding: 10,
        borderRadius: 9,
        backgroundColor: '#F7F9F5',
        color: '#626A61',
        fontSize: 12,
        lineHeight: 18,
    },

    requestNoBio: {
        marginTop: 10,
        color: '#9AA19A',
        fontSize: 12,
        fontStyle: 'italic',
    },

    tapToReview: {
        marginTop: 8,
        color: '#4E8C4A',
        fontSize: 11,
        fontWeight: '600',
    },

    requestActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 11,
    },

    requestButton: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 38,
    },

    approveButton: {
        backgroundColor: '#4E8C4A',
    },

    rejectButton: {
        backgroundColor: '#B94A48',
    },

    requestButtonTextLight: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },

    buttonDisabled: {
        opacity: 0.55,
    },

   
    modalOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.42)',
    },

    modalCard: {
        width: '100%',
        maxWidth: 370,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        paddingHorizontal: 22,
        paddingTop: 30,
        paddingBottom: 22,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 18,
    },

    modalClose: {
        position: 'absolute',
        right: 12,
        top: 10,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalCloseText: {
        fontSize: 28,
        color: '#333833',
        fontWeight: '300',
    },

    modalAvatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        marginBottom: 10,
    },

    modalAvatarFallback: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    modalAvatarText: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '700',
    },

    modalName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#252A25',
        textAlign: 'center',
    },

    modalEmail: {
        fontSize: 12,
        color: '#777F76',
        marginTop: 3,
        textAlign: 'center',
    },

    modalStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 9,
        backgroundColor: '#FFF7E2',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },

    modalStatusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#C8860A',
        marginRight: 5,
    },

    modalStatusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#C8860A',
    },

    modalDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E5E9E1',
        marginTop: 18,
    },

    modalSectionTitle: {
        alignSelf: 'flex-start',
        marginTop: 16,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.7,
        color: '#9DA59A',
    },

    modalBioBox: {
        width: '100%',
        backgroundColor: '#F7F9F5',
        borderRadius: 11,
        padding: 12,
        marginTop: 7,
    },

    modalBio: {
        fontSize: 13,
        lineHeight: 20,
        color: '#454C44',
    },

    modalCommunity: {
        width: '100%',
        marginTop: 12,
        fontSize: 12,
        color: '#777F76',
        textAlign: 'center',
    },

    modalCommunityBold: {
        fontWeight: '700',
        color: '#4E8C4A',
    },

    modalActions: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },

    modalRejectButton: {
        flex: 1,
        height: 46,
        borderRadius: 13,
        backgroundColor: '#FDF0F0',
        borderWidth: 1,
        borderColor: '#E7C3C1',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalApproveButton: {
        flex: 1,
        height: 46,
        borderRadius: 13,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalRejectText: {
        color: '#B94A48',
        fontSize: 14,
        fontWeight: '700',
    },

    modalApproveText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
})

export default OrganizerDashboardScreen