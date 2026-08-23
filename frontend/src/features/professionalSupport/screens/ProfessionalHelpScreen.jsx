import React, {useState, useEffect} from 'react'
import {StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import {getApprovedProfessionals} from '../services/professionalService'
import {useAuth} from '../../../context/AuthContext'

const ProfessionalHelpScreen = ({navigation}) => {
    const {token} = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFilter, setSelectedFilter] = useState(null)
    const [professionals, setProfessionals] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const filters = ['CBT', 'Psychiatrist', 'Counselor', 'Therapist', 'Psychologist']

    const fetchProfessionals = async () => {
        try {
            console.log('[ProfessionalHelpScreen] Fetching professionals, token:', !!token)
            setIsLoading(true)
            setError(null)
            
            if (!token) {
                throw new Error('Authentication token not available')
            }
            
            const specializationFilter = selectedFilter || ''
            const data = await getApprovedProfessionals(token, searchQuery, specializationFilter)
            console.log('[ProfessionalHelpScreen] Data received:', data)
            setProfessionals(data.professionals || [])
        } catch (err) {
            console.error('[ProfessionalHelpScreen] Fetch Error:', err)
            setError(err.message || 'Failed to load professionals')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        console.log('[ProfessionalHelpScreen] Component mounted, token:', !!token)
        if (token) {
            fetchProfessionals()
        } else {
            setIsLoading(false)
            setError('Please log in to view professionals')
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
                    <Text style={styles.specialization}>{item.profession} - {item.specialization}</Text>
                    <Text style={styles.details}>{item.expYears} years experience</Text>
                    <Text style={styles.details}>License {item.licenseNum}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.bookButton}>
                <Text style={styles.bookButtonText}>Book</Text>
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
                    {filters.map((filter) => (
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
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Icon name="error-outline" size={48} color="#FF6B6B" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchProfessionals}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
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
                            <Text style={styles.footerText}>More approved professionals load below</Text>
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
        backgroundColor: '#F4F7EF',
    },

    container: {
        flex: 1,
        padding: 16,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    backButton: {
        marginRight: 12,
    },

    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#4E8C4A',
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    searchIcon: {
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333333',
    },

    filterContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },

    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#4E8C4A',
    },

    filterButtonActive: {
        backgroundColor: '#4E8C4A',
    },

    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4E8C4A',
    },

    filterButtonTextActive: {
        color: '#FFFFFF',
    },

    listContainer: {
        paddingBottom: 16,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    cardInfo: {
        flex: 1,
        justifyContent: 'center',
    },

    name: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 4,
    },

    specialization: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4E8C4A',
        marginBottom: 4,
    },

    details: {
        fontSize: 12,
        color: '#687068',
        marginBottom: 2,
    },

    bookButton: {
        backgroundColor: '#4E8C4A',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },

    bookButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    footerText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#8A918A',
        marginTop: 16,
        marginBottom: 8,
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },

    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8A918A',
    },

    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#FF6B6B',
        textAlign: 'center',
    },

    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#4E8C4A',
        borderRadius: 8,
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8A918A',
        textAlign: 'center',
    },
})

export default ProfessionalHelpScreen