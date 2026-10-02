import React, {useState, useEffect, useCallback} from 'react'
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
    StatusBar,
    Platform,
} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import {getApprovedProfessionals, getProfessionCategories} from '../services/professionalService'
import {useAuth} from '../../../context/AuthContext'
import {PROFESSION_FILTERS} from '../../../config/professions'

const AVATAR_COLORS = [
    '#2D6A4F', // Forest green
    '#1B4332', // Deep emerald
    '#0077B6', // Ocean blue
    '#2B593F', // Sage deep
    '#3D5A80', // Slate blue
    '#40916C', // Leaf green
]

const getAvatarColor = (name = '') => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) % 1000000007
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
}

const formatDoctorName = (name = '') => {
    if (!name) return 'Specialist'
    return name
        .trim()
        .split(' ')
        .map(word => {
            if (!word) return ''
            if (word.toLowerCase() === 'dr' || word.toLowerCase() === 'dr.') return 'Dr.'
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(' ')
}

const getInitials = (name = '') => {
    if (!name) return 'P'
    const clean = name.replace(/^dr\.?\s+/i, '').trim().split(' ')
    if (clean.length >= 2) {
        return (clean[0][0] + clean[1][0]).toUpperCase()
    }
    return (clean[0] ? clean[0][0] : 'P').toUpperCase()
}

const ProfessionalHelpScreen = ({navigation}) => {
    const {token} = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFilter, setSelectedFilter] = useState(null)
    const [professionals, setProfessionals] = useState([])
    const [categories, setCategories] = useState(PROFESSION_FILTERS)
    const [isLoading, setIsLoading] = useState(true)
    const [expandedCard, setExpandedCard] = useState(null)

    const fetchProfessionals = useCallback(async () => {
        try {
            setIsLoading(true)
            if (!token) throw new Error('Authentication token not available')
            
            const specializationFilter = selectedFilter || ''
            const data = await getApprovedProfessionals(token, searchQuery, specializationFilter)
            setProfessionals(data.professionals || [])
        } catch (err) {
            console.error('[ProfessionalHelpScreen] Fetch Error:', err)
            setProfessionals([])
        } finally {
            setIsLoading(false)
        }
    }, [token, searchQuery, selectedFilter])

    const fetchCategories = useCallback(async () => {
        try {
            if (!token) return
            const data = await getProfessionCategories(token)
            if (data.success && data.categories && data.categories.length > 0) {
                setCategories(data.categories)
            }
        } catch (err) {
            console.log('[ProfessionalHelpScreen] Using default categories:', err.message)
        }
    }, [token])

    useEffect(() => {
        if (token) {
            fetchCategories()
        } else {
            setIsLoading(false)
        }
    }, [token, fetchCategories])

    useEffect(() => {
        if (!token) return
        const debounceTimer = setTimeout(() => {
            fetchProfessionals()
        }, 400)
        return () => clearTimeout(debounceTimer)
    }, [token, fetchProfessionals])

    const handleGoBack = () => {
        if (navigation?.canGoBack && navigation.canGoBack()) {
            navigation.goBack()
        } else if (navigation?.navigate) {
            navigation.navigate('UserTabs', { screen: 'Home' })
        }
    }

    const renderProfessionalCard = ({item}) => {
        const isExpanded = expandedCard === item._id
        const displayName = formatDoctorName(item.fullName)
        const initials = getInitials(item.fullName)
        const avatarBg = getAvatarColor(item.fullName)

        return (
            <View style={styles.card}>
                {/* Header Row: Avatar, Info */}
                <View style={styles.cardHeader}>
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatar, {backgroundColor: avatarBg}]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.verifiedIconBadge}>
                            <Icon name="verified" size={15} color="#2563EB" />
                        </View>
                    </View>

                    <View style={styles.cardInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                        </View>

                        <Text style={styles.professionText} numberOfLines={1}>
                            {item.profession || 'Mental Health Professional'}
                        </Text>

                        {/* Badges / Meta tags */}
                        <View style={styles.badgeRow}>
                            <View style={styles.statBadge}>
                                <Icon name="work-outline" size={13} color="#475569" style={styles.statIcon} />
                                <Text style={styles.statBadgeText}>{item.expYears || 0}y exp</Text>
                            </View>

                            {item.licenseNum ? (
                                <View style={styles.statBadge}>
                                    <Icon name="verified-user" size={13} color="#2E6A38" style={styles.statIcon} />
                                    <Text style={styles.statBadgeText}>Lic: {item.licenseNum}</Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Specialization tag if exists and not placeholder */}
                        {item.specialization && item.specialization.length > 2 && (
                            <View style={styles.specializationPill}>
                                <Icon name="spa" size={12} color="#2D6A4F" style={styles.statIcon} />
                                <Text style={styles.specializationPillText} numberOfLines={1}>
                                    {item.specialization}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Collapsible Details */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {item.bio ? (
                            <View style={styles.infoSection}>
                                <View style={styles.infoHeader}>
                                    <View style={styles.infoIconBox}>
                                        <Icon name="person" size={14} color="#2E6A38" />
                                    </View>
                                    <Text style={styles.infoLabel}>About</Text>
                                </View>
                                <Text style={styles.infoText}>{item.bio}</Text>
                            </View>
                        ) : null}

                        <View style={styles.infoGrid}>
                            <View style={[styles.infoSection, styles.infoGridItem]}>
                                <View style={styles.infoHeader}>
                                    <View style={styles.infoIconBox}>
                                        <Icon name="email" size={14} color="#2E6A38" />
                                    </View>
                                    <Text style={styles.infoLabel}>Email</Text>
                                </View>
                                <Text style={styles.infoText} numberOfLines={1}>{item.email || 'Provided upon booking'}</Text>
                            </View>

                            {item.phone ? (
                                <View style={[styles.infoSection, styles.infoGridItem]}>
                                    <View style={styles.infoHeader}>
                                        <View style={styles.infoIconBox}>
                                            <Icon name="phone" size={14} color="#2E6A38" />
                                        </View>
                                        <Text style={styles.infoLabel}>Phone</Text>
                                    </View>
                                    <Text style={styles.infoText}>{item.phone}</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.infoSection}>
                            <View style={styles.infoHeader}>
                                <View style={styles.infoIconBox}>
                                    <Icon name="verified" size={14} color="#2E6A38" />
                                </View>
                                <Text style={styles.infoLabel}>License & Verification</Text>
                            </View>
                            <Text style={styles.infoText}>Official License #{item.licenseNum} • Verified by Administrator</Text>
                        </View>

                        <View style={styles.infoSection}>
                            <View style={styles.infoHeader}>
                                <View style={styles.infoIconBox}>
                                    <Icon name="schedule" size={14} color="#2E6A38" />
                                </View>
                                <Text style={styles.infoLabel}>Online Consultation</Text>
                            </View>
                            <Text style={styles.infoText}>Choose from available 1-on-1 virtual time slots on the next screen.</Text>
                        </View>
                    </View>
                )}

                {/* Card Action Row: Side-by-Side Details & Book Button */}
                <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                        style={[styles.detailsButton, isExpanded && styles.detailsButtonActive]}
                        onPress={() => setExpandedCard(isExpanded ? null : item._id)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.detailsButtonText}>
                            {isExpanded ? 'Less' : 'Details'}
                        </Text>
                        <Ionicons 
                            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                            size={16} 
                            color="#2E6A38" 
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => navigation.navigate('ProfessionalAvailabilityBooking', { professional: item })}
                        activeOpacity={0.85}
                    >
                        <Icon name="calendar-today" size={16} color="#FFFFFF" style={styles.bookIcon} />
                        <Text style={styles.bookButtonText}>Book Session</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAF7" />
            <View style={styles.container}>
                {/* Modern Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={handleGoBack}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Icon name="arrow-back-ios" size={18} color="#1E293B" style={styles.backIcon} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Professional Support</Text>
                        <Text style={styles.subtitle}>Verified psychologists & counselors</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.headerActionButton}
                        onPress={() => navigation.navigate('ProfessionalPosts')}
                        activeOpacity={0.7}
                        accessibilityLabel="Professional Articles"
                    >
                        <Icon name="article" size={20} color="#2D6A4F" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Icon name="search" size={20} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, role or focus..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => setSearchQuery('')}
                            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                            style={styles.clearSearchBtn}
                        >
                            <Icon name="close" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Horizontal Category Filter Chips */}
                <View style={styles.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScroll}
                    >
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                !selectedFilter && styles.filterChipActive
                            ]}
                            onPress={() => setSelectedFilter(null)}
                            activeOpacity={0.7}
                        >
                            <Icon 
                                name="apps" 
                                size={14} 
                                color={!selectedFilter ? '#FFFFFF' : '#64748B'} 
                                style={styles.filterIcon} 
                            />
                            <Text style={[
                                styles.filterChipText,
                                !selectedFilter && styles.filterChipTextActive
                            ]}>
                                All
                            </Text>
                        </TouchableOpacity>

                        {categories.map((filter) => {
                            const isActive = selectedFilter === filter
                            return (
                                <TouchableOpacity
                                    key={filter}
                                    style={[
                                        styles.filterChip,
                                        isActive && styles.filterChipActive
                                    ]}
                                    onPress={() => setSelectedFilter(isActive ? null : filter)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        isActive && styles.filterChipTextActive
                                    ]}>
                                        {filter}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                {/* Result count & reset filter bar */}
                <View style={styles.resultsInfoRow}>
                    <Text style={styles.resultsCountText}>
                        {professionals.length} {professionals.length === 1 ? 'specialist' : 'specialists'} available
                    </Text>
                    {selectedFilter && (
                        <TouchableOpacity 
                            onPress={() => setSelectedFilter(null)}
                            style={styles.clearFilterBadge}
                        >
                            <Text style={styles.clearFilterText}>Reset filter</Text>
                            <Icon name="close" size={12} color="#2D6A4F" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Main Body: List / Loading / Empty */}
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#2D6A4F" />
                        <Text style={styles.loadingText}>Finding specialists...</Text>
                    </View>
                ) : professionals.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Icon name="person-search" size={38} color="#94A3B8" />
                        </View>
                        <Text style={styles.emptyTitle}>No specialists found</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery || selectedFilter
                                ? 'Try clearing your search or changing the filter.'
                                : 'No verified professionals are currently registered.'}
                        </Text>
                        {(searchQuery || selectedFilter) && (
                            <TouchableOpacity
                                style={styles.resetSearchBtn}
                                onPress={() => {
                                    setSearchQuery('')
                                    setSelectedFilter(null)
                                }}
                            >
                                <Text style={styles.resetSearchBtnText}>Clear all filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={professionals}
                        renderItem={renderProfessionalCard}
                        keyExtractor={(item) => item._id.toString()}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={
                            <View style={styles.footerSection}>
                                <TouchableOpacity 
                                    style={styles.articlesBannerCard}
                                    onPress={() => navigation.navigate('ProfessionalPosts')}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.articlesBannerIcon}>
                                        <Icon name="menu-book" size={24} color="#2D6A4F" />
                                    </View>
                                    <View style={styles.articlesBannerContent}>
                                        <Text style={styles.articlesBannerTitle}>Professional Insights & Articles</Text>
                                        <Text style={styles.articlesBannerSubtitle}>Explore expert mental health guidance & tips</Text>
                                    </View>
                                    <Icon name="chevron-right" size={22} color="#2D6A4F" />
                                </TouchableOpacity>
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
        backgroundColor: '#F8FAF7',
    },

    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: 4,
    },

    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    backIcon: {
        marginLeft: 4,
    },

    headerTitleContainer: {
        flex: 1,
    },

    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.3,
    },

    subtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
        marginTop: 2,
    },

    headerActionButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },

    /* Search Bar */
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 12 : 6,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    searchIcon: {
        marginRight: 10,
    },

    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
        paddingVertical: 4,
    },

    clearSearchBtn: {
        padding: 4,
    },

    /* Filter Chips */
    filterWrapper: {
        marginBottom: 12,
        marginHorizontal: -16,
    },

    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },

    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },

    filterIcon: {
        marginRight: 6,
    },

    filterChipActive: {
        backgroundColor: '#2D6A4F',
        borderColor: '#2D6A4F',
        shadowColor: '#2D6A4F',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },

    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },

    filterChipTextActive: {
        color: '#FFFFFF',
    },

    /* Results Info Row */
    resultsInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 2,
    },

    resultsCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    clearFilterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },

    clearFilterText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2D6A4F',
    },

    /* List Container */
    listContainer: {
        paddingBottom: 24,
    },

    /* Professional Card */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    avatarWrapper: {
        position: 'relative',
        marginRight: 14,
    },

    avatar: {
        width: 54,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },

    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    verifiedIconBadge: {
        position: 'absolute',
        bottom: -3,
        right: -3,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    cardInfo: {
        flex: 1,
    },

    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },

    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: -0.2,
    },

    professionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2D6A4F',
        marginBottom: 6,
    },

    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 6,
    },

    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },

    statIcon: {
        marginRight: 4,
    },

    statBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },

    specializationPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },

    specializationPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#065F46',
    },

    /* Expanded Details */
    expandedContent: {
        backgroundColor: '#F8FAF8',
        borderRadius: 14,
        padding: 12,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    infoGrid: {
        flexDirection: 'row',
        gap: 12,
    },

    infoGridItem: {
        flex: 1,
    },

    infoSection: {
        marginBottom: 10,
    },

    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },

    infoIconBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    infoLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D6A4F',
    },

    infoText: {
        fontSize: 12,
        color: '#334155',
        lineHeight: 17,
        marginLeft: 28,
    },

    /* Action Row (Side-by-Side) */
    cardActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },

    detailsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F1F5F0',
        borderWidth: 1,
        borderColor: '#D8E2D6',
    },

    detailsButtonActive: {
        backgroundColor: '#E4ECE2',
    },

    detailsButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2D6A4F',
    },

    bookButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2D6A4F',
        borderRadius: 12,
        paddingVertical: 11,
        shadowColor: '#2D6A4F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },

    bookIcon: {
        marginRight: 8,
    },

    bookButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },

    /* Footer Articles Banner */
    footerSection: {
        marginTop: 10,
        marginBottom: 16,
    },

    articlesBannerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },

    articlesBannerIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    articlesBannerContent: {
        flex: 1,
    },

    articlesBannerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },

    articlesBannerSubtitle: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 16,
    },

    /* State Screens */
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20,
    },

    loadingText: {
        marginTop: 14,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },

    emptyIconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },

    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
    },

    emptyText: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 18,
    },

    resetSearchBtn: {
        backgroundColor: '#2D6A4F',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },

    resetSearchBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
})

export default ProfessionalHelpScreen