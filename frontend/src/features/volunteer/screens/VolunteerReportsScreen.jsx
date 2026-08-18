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
import { getVolunteerReports, updateReportStatus as updateReportStatusAPI } from '../services/volunteerService'
import { useAuth } from '../../context/AuthContext'

const VolunteerReportsScreen = ({ navigation }) => {
    const { token } = useAuth()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedReport, setSelectedReport] = useState(null)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [filter, setFilter] = useState('all')

    const fetchReports = async () => {
        try {
            const response = await getVolunteerReports(token, filter)
            setReports(response.reports)
        } catch (error) {
            console.error('Error fetching reports:', error)
            // Fallback to mock data if API fails
            setReports([
                {
                    _id: '1',
                    reporterName: 'Anonymous Reporter',
                    targetType: 'User',
                    targetTitle: 'Inappropriate behavior',
                    reason: 'Harassment',
                    details: 'User has been sending inappropriate messages',
                    status: 'open',
                    createdAt: new Date().toISOString()
                },
                {
                    _id: '2',
                    reporterName: 'Community Member',
                    targetType: 'Post',
                    targetTitle: 'Spam content',
                    reason: 'Spam',
                    details: 'Post contains spam links and inappropriate content',
                    status: 'investigating',
                    createdAt: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    _id: '3',
                    reporterName: 'User123',
                    targetType: 'Professional',
                    targetTitle: 'Fake credentials',
                    reason: 'Fraud',
                    details: 'Professional appears to have fake credentials',
                    status: 'resolved',
                    actionTaken: 'Account suspended pending verification',
                    resolvedBy: 'Admin',
                    createdAt: new Date(Date.now() - 345600000).toISOString()
                }
            ])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [filter])

    const onRefresh = () => {
        setRefreshing(true)
        fetchReports()
    }

    const handleStatusChange = (report) => {
        setSelectedReport(report)
        setShowStatusModal(true)
    }

    const handleUpdateStatus = async (newStatus, actionTaken = '') => {
        try {
            await updateReportStatusAPI(token, selectedReport._id, { 
                status: newStatus, 
                actionTaken 
            })
            setReports(reports.map(report => 
                report._id === selectedReport._id 
                    ? { ...report, status: newStatus, actionTaken }
                    : report
            ))
            setShowStatusModal(false)
            setSelectedReport(null)
        } catch (error) {
            console.error('Error updating report status:', error)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'open':
                return '#FF6B6B'
            case 'investigating':
                return '#FFA500'
            case 'resolved':
                return '#4E8C4A'
            case 'dismissed':
                return '#687068'
            default:
                return '#687068'
        }
    }

    const filteredReports = filter === 'all' 
        ? reports 
        : reports.filter(report => report.status === filter)

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading reports...</Text>
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
                <Text style={styles.headerTitle}>Reports Management</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {['all', 'open', 'investigating', 'resolved', 'dismissed'].map((status) => (
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
                {filteredReports.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="inbox" size={64} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No reports found</Text>
                    </View>
                ) : (
                    filteredReports.map((report) => (
                        <View key={report._id} style={styles.reportCard}>
                            <View style={styles.reportHeader}>
                                <View style={styles.reporterInfo}>
                                    <Text style={styles.reporterName}>{report.reporterName}</Text>
                                    <Text style={styles.reportDate}>
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(report.status) }
                                ]}>
                                    <Text style={styles.statusText}>
                                        {report.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.reportContent}>
                                <View style={styles.targetInfo}>
                                    <Icon name="label" size={16} color="#4E8C4A" />
                                    <Text style={styles.targetType}>{report.targetType}</Text>
                                    {report.targetTitle && (
                                        <Text style={styles.targetTitle}>: {report.targetTitle}</Text>
                                    )}
                                </View>
                                
                                <View style={styles.reasonSection}>
                                    <Text style={styles.reasonLabel}>Reason:</Text>
                                    <Text style={styles.reasonText}>{report.reason}</Text>
                                </View>
                                
                                {report.details && (
                                    <View style={styles.detailsSection}>
                                        <Text style={styles.detailsLabel}>Details:</Text>
                                        <Text style={styles.detailsText}>{report.details}</Text>
                                    </View>
                                )}
                            </View>

                            {report.actionTaken && (
                                <View style={styles.actionTakenSection}>
                                    <Text style={styles.actionTakenLabel}>Action Taken:</Text>
                                    <Text style={styles.actionTakenText}>{report.actionTaken}</Text>
                                    {report.resolvedBy && (
                                        <Text style={styles.resolvedByText}>
                                            Resolved by: {report.resolvedBy}
                                        </Text>
                                    )}
                                </View>
                            )}

                            {report.status === 'open' || report.status === 'investigating' ? (
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.investigateButton]}
                                        onPress={() => handleStatusChange(report)}
                                    >
                                        <Icon name="search" size={18} color="#FFFFFF" />
                                        <Text style={styles.actionButtonText}>Investigate</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.resolveButton]}
                                        onPress={() => handleStatusChange(report)}
                                    >
                                        <Icon name="check_circle" size={18} color="#FFFFFF" />
                                        <Text style={styles.actionButtonText}>Resolve</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Status Change Modal */}
            <Modal
                visible={showStatusModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowStatusModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Report Status</Text>
                        <Text style={styles.modalText}>
                            {selectedReport?.targetType} - {selectedReport?.reason}
                        </Text>
                        
                        <View style={styles.statusOptions}>
                            {selectedReport?.status === 'open' && (
                                <TouchableOpacity
                                    style={[styles.statusOptionButton, styles.investigateButton]}
                                    onPress={() => handleUpdateStatus('investigating')}
                                >
                                    <Text style={styles.statusOptionText}>Mark as Investigating</Text>
                                </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity
                                style={[styles.statusOptionButton, styles.resolveButton]}
                                onPress={() => handleUpdateStatus('resolved', 'Issue resolved after review')}
                            >
                                <Text style={styles.statusOptionText}>Mark as Resolved</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.statusOptionButton, styles.dismissButton]}
                                onPress={() => handleUpdateStatus('dismissed', 'No action required')}
                            >
                                <Text style={styles.statusOptionText}>Dismiss Report</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowStatusModal(false)}
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
        flexWrap: 'wrap',
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F4F7EF',
    },
    activeFilterTab: {
        backgroundColor: '#4E8C4A',
    },
    filterTabText: {
        fontSize: 12,
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
    reportCard: {
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
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    reporterInfo: {
        flex: 1,
    },
    reporterName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
    },
    reportDate: {
        fontSize: 12,
        color: '#687068',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    reportContent: {
        marginBottom: 12,
    },
    targetInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    targetType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4E8C4A',
        marginLeft: 8,
    },
    targetTitle: {
        fontSize: 14,
        color: '#2D3748',
    },
    reasonSection: {
        marginBottom: 8,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#687068',
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 14,
        color: '#2D3748',
    },
    detailsSection: {
        marginBottom: 8,
    },
    detailsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#687068',
        marginBottom: 4,
    },
    detailsText: {
        fontSize: 14,
        color: '#2D3748',
        lineHeight: 20,
    },
    actionTakenSection: {
        padding: 12,
        backgroundColor: '#F0FFF4',
        borderRadius: 8,
        marginBottom: 12,
    },
    actionTakenLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4E8C4A',
        marginBottom: 4,
    },
    actionTakenText: {
        fontSize: 14,
        color: '#2D3748',
    },
    resolvedByText: {
        fontSize: 12,
        color: '#687068',
        marginTop: 4,
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
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    investigateButton: {
        backgroundColor: '#FFA500',
    },
    resolveButton: {
        backgroundColor: '#4E8C4A',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
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
    statusOptions: {
        gap: 12,
        marginBottom: 16,
    },
    statusOptionButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    statusOptionText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    dismissButton: {
        backgroundColor: '#687068',
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

export default VolunteerReportsScreen