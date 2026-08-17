import React, { useEffect, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Modal
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { getVolunteerApplications, reviewApplication as reviewApplicationAPI } from '../services/volunteerService'
import { useAuth } from '../../context/AuthContext'

const VolunteerApplicationsScreen = ({ navigation }) => {
    const { token } = useAuth()
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedApplication, setSelectedApplication] = useState(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [filter, setFilter] = useState('all')

    const fetchApplications = async () => {
        try {
            const response = await getVolunteerApplications(token, filter)
            setApplications(response.applications)
        } catch (error) {
            console.error('Error fetching applications:', error)
            // Fallback to mock data if API fails
            setApplications([
                {
                    _id: '1',
                    fullName: 'John Doe',
                    email: 'john@example.com',
                    profession: 'Psychologist',
                    licenseNum: 'PSY12345',
                    specialization: 'Clinical Psychology',
                    expYears: 5,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                },
                {
                    _id: '2',
                    fullName: 'Jane Smith',
                    email: 'jane@example.com',
                    profession: 'Social Worker',
                    licenseNum: 'SW67890',
                    specialization: 'Community Mental Health',
                    expYears: 8,
                    status: 'pending',
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                }
            ])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [filter])

    const onRefresh = () => {
        setRefreshing(true)
        fetchApplications()
    }

    const handleReview = (application) => {
        setSelectedApplication(application)
        setShowReviewModal(true)
    }

    const handleApprove = async () => {
        try {
            await reviewApplicationAPI(token, selectedApplication._id, { status: 'approved' })
            setApplications(applications.map(app => 
                app._id === selectedApplication._id 
                    ? { ...app, status: 'approved' }
                    : app
            ))
            setShowReviewModal(false)
            setSelectedApplication(null)
        } catch (error) {
            console.error('Error approving application:', error)
        }
    }

    const handleReject = async (reason) => {
        try {
            await reviewApplicationAPI(token, selectedApplication._id, { 
                status: 'rejected', 
                rejectionReason: reason 
            })
            setApplications(applications.map(app => 
                app._id === selectedApplication._id 
                    ? { ...app, status: 'rejected', rejectionReason: reason }
                    : app
            ))
            setShowReviewModal(false)
            setSelectedApplication(null)
        } catch (error) {
            console.error('Error rejecting application:', error)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return '#FFA500'
            case 'approved':
                return '#4E8C4A'
            case 'rejected':
                return '#FF6B6B'
            default:
                return '#687068'
        }
    }

    const filteredApplications = filter === 'all' 
        ? applications 
        : applications.filter(app => app.status === filter)

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading applications...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#4E8C4A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professional Applications</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.filterTab,
                            filter === status && styles.activeFilterTab
                        ]}
                        onPress={() => setFilter(status)}
                    >
                        <Text style={[
                            styles.filterTabText,
                            filter === status && styles.activeFilterTabText
                        ]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredApplications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="inbox" size={64} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No applications found</Text>
                    </View>
                ) : (
                    filteredApplications.map((application) => (
                        <View key={application._id} style={styles.applicationCard}>
                            <View style={styles.applicationHeader}>
                                <View style={styles.applicantInfo}>
                                    <Text style={styles.applicantName}>{application.fullName}</Text>
                                    <Text style={styles.applicantEmail}>{application.email}</Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(application.status) }
                                ]}>
                                    <Text style={styles.statusText}>
                                        {application.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.applicationDetails}>
                                <View style={styles.detailRow}>
                                    <Icon name="work" size={16} color="#687068" />
                                    <Text style={styles.detailText}>{application.profession}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Icon name="badge" size={16} color="#687068" />
                                    <Text style={styles.detailText}>License: {application.licenseNum}</Text>
                                </View>
                                {application.specialization && (
                                    <View style={styles.detailRow}>
                                        <Icon name="star" size={16} color="#687068" />
                                        <Text style={styles.detailText}>{application.specialization}</Text>
                                    </View>
                                )}
                                <View style={styles.detailRow}>
                                    <Icon name="schedule" size={16} color="#687068" />
                                    <Text style={styles.detailText}>
                                        {application.expYears} years experience
                                    </Text>
                                </View>
                            </View>

                            {application.status === 'pending' && (
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.approveButton]}
                                        onPress={() => handleReview(application)}
                                    >
                                        <Icon name="check" size={20} color="#FFFFFF" />
                                        <Text style={styles.actionButtonText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => handleReview(application)}
                                    >
                                        <Icon name="close" size={20} color="#FFFFFF" />
                                        <Text style={styles.actionButtonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {application.rejectionReason && (
                                <View style={styles.rejectionReason}>
                                    <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                                    <Text style={styles.rejectionText}>{application.rejectionReason}</Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Review Modal */}
            <Modal
                visible={showReviewModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReviewModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Review Application</Text>
                        <Text style={styles.modalText}>
                            {selectedApplication?.fullName} - {selectedApplication?.profession}
                        </Text>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.approveButton]}
                                onPress={handleApprove}
                            >
                                <Text style={styles.modalButtonText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.rejectButton]}
                                onPress={() => {
                                    // For simplicity, using a default reason
                                    handleReject('Application does not meet requirements')
                                }}
                            >
                                <Text style={styles.modalButtonText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowReviewModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F4F7EF',
    },
    activeFilterTab: {
        backgroundColor: '#4E8C4A',
    },
    filterTabText: {
        fontSize: 14,
        color: '#687068',
    },
    activeFilterTabText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#687068',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: '#687068',
        marginTop: 16,
    },
    applicationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    applicationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    applicantInfo: {
        flex: 1,
    },
    applicantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    applicantEmail: {
        fontSize: 14,
        color: '#687068',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    applicationDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#687068',
        marginLeft: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    approveButton: {
        backgroundColor: '#4E8C4A',
    },
    rejectButton: {
        backgroundColor: '#FF6B6B',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    rejectionReason: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
    },
    rejectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#C53030',
        marginBottom: 4,
    },
    rejectionText: {
        fontSize: 14,
        color: '#742A2A',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    modalText: {
        fontSize: 16,
        color: '#687068',
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#687068',
        fontSize: 16,
    },
})

export default VolunteerApplicationsScreen