import React, {useState, useEffect} from 'react'
import {StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import {getApprovedProfessionals, getProfessionCategories} from '../services/professionalService'
import {useAuth} from '../../../context/AuthContext'
import {PROFESSION_FILTERS} from '../../../config/professions'
import {Dimensions} from 'react-native'
import {API_BASE_URL} from '../../../config/api'

const {width} = Dimensions.get('window')

const ProfessionalHelpScreen = ({navigation}) => {
    const {token} = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFilter, setSelectedFilter] = useState(null)
    const [professionals, setProfessionals] = useState([])
    const [categories, setCategories] = useState(PROFESSION_FILTERS)
    const [isLoading, setIsLoading] = useState(true)

    const fetchProfessionals = async () => {
        try {
            console.log('[ProfessionalHelpScreen] Fetching professionals, token:', !!token)
            setIsLoading(true)
            
            if (!token) {
                throw new Error('Authentication token not available')
            }
            
            const specializationFilter = selectedFilter || ''
            const data = await getApprovedProfessionals(token, searchQuery, specializationFilter)
            console.log('[ProfessionalHelpScreen] Data received:', data)
            setProfessionals(data.professionals || [])
        } catch (err) {
            console.error('[ProfessionalHelpScreen] Fetch Error:', err)
            // Don't set error state, just use empty array as fallback
            setProfessionals([])
        } finally {
            setIsLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            if (!token) return
            
            const data = await getProfessionCategories(token)
            if (data.success && data.categories && data.categories.length > 0) {
                setCategories(data.categories)
            }
        } catch (err) {
            console.log('[ProfessionalHelpScreen] Using default categories due to fetch error:', err.message)
            // Keep using default categories from config
        }
    }

    useEffect(() => {
        console.log('[ProfessionalHelpScreen] Component mounted, token:', !!token)
        if (token) {
            fetchProfessionals()
            fetchCategories()
        } else {
            setIsLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (!token) return
        
        const debounceTimer = setTimeout(() => {
            fetchProfessionals()
        }, 500)

        return () => clearTimeout(debounceTimer)
    }, [searchQuery, selectedFilter, token])

    const renderProfessionalCard = ({item}) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.fullName.charAt(0)}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.specialization}>{item.profession}</Text>
                    <Text style={styles.details}>{item.specialization}</Text>
                    <View style={styles.detailsRow}>
                        <Text style={styles.details}>{item.expYears} years exp</Text>
                        <Text style={styles.details}>•</Text>
                        <Text style={styles.details}>License {item.licenseNum}</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity style={styles.bookButton}>
                <Text style={styles.bookButtonText}>Book Session</Text>
            </TouchableOpacity>
        </View>
    )

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-back" size={24} color="#4E8C4A" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Professional Support</Text>
                </View>

                <View style={styles.searchContainer}>
                    <Icon name="search" size={20} color="#8A918A" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or specialization"
                        placeholderTextColor="#8A918A"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filterContainer}>
                    {categories.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterButton,
                                selectedFilter === filter && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                selectedFilter === filter && styles.filterButtonTextActive
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#4E8C4A" />
                        <Text style={styles.loadingText}>Loading professionals...</Text>
                    </View>
                ) : professionals.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Icon name="person-search" size={48} color="#8A918A" />
                        <Text style={styles.emptyText}>No approved professionals found</Text>
                    </View>
                ) : (
                    <FlatList
                        data={professionals}
                        renderItem={renderProfessionalCard}
                        keyExtractor={(item) => item._id.toString()}
                        contentContainerStyle={styles.listContainer}
                        ListFooterComponent={
                            <View style={styles.footerSection}>
                                <TouchableOpacity 
                                    style={styles.viewPostsButton}
                                    onPress={() => navigation.navigate('ProfessionalPosts')}
                                >
                                    <View style={styles.viewPostsContent}>
                                        <Icon name="article" size={20} color="#FFFFFF" />
                                        <Text style={styles.viewPostsText}>View Professional Posts</Text>
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.footerText}>More approved professionals load below</Text>
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
        padding: 20,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },

    backButton: {
        marginRight: 12,
        padding: 4,
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D5A27',
        letterSpacing: -0.5,
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E8ECE6',
    },

    searchIcon: {
        marginRight: 12,
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        fontWeight: '500',
    },

    filterContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
        flexWrap: 'nowrap',
        overflow: 'hidden',
    },

    filterButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#C8D5C2',
        alignItems: 'center',
        flexShrink: 1,
    },

    filterButtonActive: {
        backgroundColor: '#4E8C4A',
        borderColor: '#4E8C4A',
    },

    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5A6A58',
        textAlign: 'center',
    },

    filterButtonTextActive: {
        color: '#FFFFFF',
    },

    listContainer: {
        paddingBottom: 20,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F4F0',
    },

    cardHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },

    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        shadowColor: '#4E8C4A',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },

    avatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    cardInfo: {
        flex: 1,
        justifyContent: 'center',
    },

    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 6,
        letterSpacing: -0.3,
    },

    specialization: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4E8C4A',
        marginBottom: 4,
    },

    details: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
    },

    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 8,
    },

    bookButton: {
        backgroundColor: '#4E8C4A',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#4E8C4A',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },

    bookButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    footerText: {
        textAlign: 'center',
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 20,
        marginBottom: 12,
        fontWeight: '500',
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },

    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },

    emptyText: {
        marginTop: 20,
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
    },

    footerSection: {
        marginTop: 20,
    },

    viewPostsButton: {
        backgroundColor: '#4E8C4A',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#4E8C4A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },

    viewPostsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    viewPostsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
})

export default ProfessionalHelpScreen