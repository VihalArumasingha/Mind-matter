import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  RefreshControl,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminStyles, COLORS } from '../styles/adminStyles';
import { postsManagementStyles as styles } from '../styles/postsManagementStyles';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PostsManagementView = ({ 
  posts = [], 
  onKeepPost, 
  onRestrictPost, 
  onRemovePost, 
  onRefresh,
  loading = false 
}) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [restrictReason, setRestrictReason] = useState('');
  const [localPosts, setLocalPosts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); 

  useEffect(() => {
    let filtered = [...posts];
    
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(p => new Date(p.createdAt) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(p => new Date(p.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      filtered = filtered.filter(p => new Date(p.createdAt) >= monthAgo);
    }
    
    const sorted = filtered.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    setLocalPosts(sorted);
    
    if (selectedPost) {
      const updatedPost = sorted.find(p => p._id === selectedPost._id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    }
  }, [posts, dateFilter]);

  const handleOpenRestrict = (post) => {
    setSelectedPost(post);
    setRestrictReason('');
    setModalType('restrict');
  };

  const handleConfirmRestrict = () => {
    if (!selectedPost || !restrictReason.trim()) return;
    handleRestrictPost(selectedPost._id, restrictReason.trim());
  };

  const handleKeepPost = async (postId) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await onKeepPost(postId);
      
      const updatedPosts = localPosts.map(post => 
        post._id === postId 
          ? { ...post, status: 'active', restrictionReason: null }
          : post
      );
      const sorted = updatedPosts.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setLocalPosts(sorted);
      
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost({ ...selectedPost, status: 'active', restrictionReason: null });
      }
      
      setModalType(null);
      
      if (onRefresh) {
        setTimeout(() => onRefresh(), 300);
      }
      
    } catch (error) {
      console.error('Error keeping post:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestrictPost = async (postId, reason) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await onRestrictPost(postId, reason);
      
      const updatedPosts = localPosts.map(post => 
        post._id === postId 
          ? { ...post, status: 'restricted', restrictionReason: reason }
          : post
      );
      const sorted = updatedPosts.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setLocalPosts(sorted);
      
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost({ ...selectedPost, status: 'restricted', restrictionReason: reason });
      }
      
      setModalType(null);
      
      if (onRefresh) {
        setTimeout(() => onRefresh(), 300);
      }
      
    } catch (error) {
      console.error('Error restricting post:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePost = async (postId) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await onRemovePost(postId);
      
      const filtered = localPosts.filter(post => post._id !== postId);
      const sorted = filtered.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setLocalPosts(sorted);
      
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(null);
      }
      
      setModalType(null);
      
      if (onRefresh) {
        setTimeout(() => onRefresh(), 300);
      }
      
    } catch (error) {
      console.error('Error removing post:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBadge = (status) => {
    if (status === 'active') {
      return (
        <View style={[styles.badge, styles.badgeActive]}>
          <Text style={styles.badgeTextActive}>ACTIVE</Text>
        </View>
      );
    } else if (status === 'restricted') {
      return (
        <View style={[styles.badge, styles.badgeRestricted]}>
          <Text style={styles.badgeTextRestricted}>RESTRICTED</Text>
        </View>
      );
    } else if (status === 'pending') {
      return (
        <View style={[styles.badge, styles.badgePending]}>
          <Text style={styles.badgeTextPending}>PENDING</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeDefault]}>
        <Text style={styles.badgeTextDefault}>ACTIVE</Text>
      </View>
    );
  };

  // ✅ Helper function to format date
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  const getTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const renderPostCard = (post) => (
    <TouchableOpacity
      key={post._id}
      style={styles.postCard}
      activeOpacity={0.7}
      onPress={() => {
        setSelectedPost(post);
        setModalType('review');
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {post.authorName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.authorName || 'Unknown User'}
              </Text>
              <Text style={styles.timeAgo}>
                {getTimeAgo(post.createdAt)}
              </Text>
            </View>
            <View style={styles.authorMeta}>
              <Text style={styles.authorRole}>
                {post.authorRole === 'therapist' || post.authorRole === 'professional' ? '🩺 Professional' : '👤 User'}
              </Text>
              <Text style={styles.authorDot}>•</Text>
              <Text style={styles.authorCommunity}>{post.communityName || 'General'}</Text>
            </View>
          </View>
        </View>
        {renderBadge(post.status)}
      </View>

      {post.imageUrl ? (
        <Image 
          source={{ uri: post.imageUrl }} 
          style={styles.postImage} 
          resizeMode="cover"
        />
      ) : null}
      {post.title ? (
        <Text style={styles.postTitle} numberOfLines={1}>
        {post.title}
        </Text>
      ) : null}

      <Text style={styles.postContent} numberOfLines={2}>
        "{post.content}"
      </Text>

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Icon name="chat-bubble-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.statText}>{post.comments?.length || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="favorite-border" size={14} color={COLORS.textMuted} />
          <Text style={styles.statText}>{post.likes?.length || 0}</Text>
        </View>
        {post.reportsCount > 0 && (
          <View style={[styles.statItem, styles.reportBadge]}>
            <Icon name="report" size={14} color={COLORS.danger} />
            <Text style={[styles.statText, { color: COLORS.danger }]}>
              {post.reportsCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.categoryText}>Category: {post.category || 'General'}</Text>
        <View style={styles.reviewAction}>
          <Text style={styles.reviewText}>Tap to Review</Text>
          <Icon name="chevron-right" size={16} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const closeModal = () => {
    setModalType(null);
  };
  const totalPosts = localPosts.length;
  const activePosts = localPosts.filter(p => p.status === 'active').length;
  const restrictedPosts = localPosts.filter(p => p.status === 'restricted').length;
  const pendingPosts = localPosts.filter(p => p.status === 'pending' || p.status === 'pending_approval' || !p.status).length;

  const filterAndSort = (filterFn) => {
    let filtered = posts.filter(filterFn);
    
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(p => new Date(p.createdAt) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(p => new Date(p.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      filtered = filtered.filter(p => new Date(p.createdAt) >= monthAgo);
    }
    
    const sorted = filtered.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    setLocalPosts(sorted);
  };

  const handleDateFilter = (filter) => {
    setDateFilter(filter);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={adminStyles.bodyArea} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        } >
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Posts Management</Text>
          </View>
        </View>
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity 
            style={[styles.dateFilterButton, dateFilter === 'all' && styles.dateFilterActive]}
            onPress={() => handleDateFilter('all')}
          >
            <Text style={[styles.dateFilterText, dateFilter === 'all' && styles.dateFilterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateFilterButton, dateFilter === 'today' && styles.dateFilterActive]}
            onPress={() => handleDateFilter('today')}
          >
            <Text style={[styles.dateFilterText, dateFilter === 'today' && styles.dateFilterTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateFilterButton, dateFilter === 'week' && styles.dateFilterActive]}
            onPress={() => handleDateFilter('week')}
          >
            <Text style={[styles.dateFilterText, dateFilter === 'week' && styles.dateFilterTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateFilterButton, dateFilter === 'month' && styles.dateFilterActive]}
            onPress={() => handleDateFilter('month')}
          >
            <Text style={[styles.dateFilterText, dateFilter === 'month' && styles.dateFilterTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsHeader}>
          <TouchableOpacity 
            style={styles.statsItem}
            onPress={() => {
              let filtered = [...posts];
              const now = new Date();
              if (dateFilter === 'today') {
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);
                filtered = filtered.filter(p => new Date(p.createdAt) >= today);
              } else if (dateFilter === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                filtered = filtered.filter(p => new Date(p.createdAt) >= weekAgo);
              } else if (dateFilter === 'month') {
                const monthAgo = new Date(now);
                monthAgo.setDate(monthAgo.getDate() - 30);
                filtered = filtered.filter(p => new Date(p.createdAt) >= monthAgo);
              }
              const sorted = filtered.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
              );
              setLocalPosts(sorted);
            }}
          >
            <Text style={styles.statsNumber}>{totalPosts}</Text>
            <Text style={styles.statsLabel}>Total</Text>
          </TouchableOpacity>
          <View style={styles.statsDivider} />
          <TouchableOpacity 
            style={styles.statsItem}
            onPress={() => filterAndSort(p => p.status === 'active')}
          >
            <Text style={[styles.statsNumber, { color: COLORS.success }]}>
              {activePosts}
            </Text>
            <Text style={styles.statsLabel}>Active</Text>
          </TouchableOpacity>
          <View style={styles.statsDivider} />
          <TouchableOpacity 
            style={styles.statsItem}
            onPress={() => filterAndSort(p => p.status === 'restricted')}
          >
            <Text style={[styles.statsNumber, { color: COLORS.warning }]}>
              {restrictedPosts}
            </Text>
            <Text style={styles.statsLabel}>Restricted</Text>
          </TouchableOpacity>
          
        </View>

        {dateFilter !== 'all' && (
          <View style={styles.filterInfoContainer}>
            <Text style={styles.filterInfoText}>
              Showing: {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} posts
            </Text>
            <TouchableOpacity onPress={() => handleDateFilter('all')}>
              <Text style={styles.filterClearText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
        )}
        {localPosts.length !== posts.length && dateFilter === 'all' && (
          <TouchableOpacity 
            style={styles.filterReset}
            onPress={() => {
              const sorted = [...posts].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
              );
              setLocalPosts(sorted);
            }}
          >
            <Text style={styles.filterResetText}>Show All Posts</Text>
          </TouchableOpacity>
        )}
        {localPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="post-add" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No posts found</Text>
            <Text style={styles.emptySubtext}>
              {dateFilter !== 'all' ? `No posts for ${dateFilter}` : 'Posts will appear here once created'}
            </Text>
          </View>
        ) : (
          localPosts.map(renderPostCard)
        )}
        <Modal visible={modalType === 'review'} transparent animationType="slide">
          <View style={adminStyles.modalOverlay}>
            <View style={[adminStyles.modalBox, styles.modalBox]}>
              <View style={adminStyles.modalHeader}>
                <Text style={adminStyles.modalTitle}>Post Review</Text>
                <TouchableOpacity style={adminStyles.closeButton} onPress={closeModal}>
                  <Icon name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {selectedPost && (
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalAuthorSection}>
                    <View style={styles.modalAuthorInfo}>
                      <View style={[styles.avatarContainer, styles.modalAvatar]}>
                        <Text style={styles.avatarText}>
                          {selectedPost.authorName?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.modalAuthorName}>{selectedPost.authorName}</Text>
                        <Text style={styles.modalAuthorMeta}>
                          {selectedPost.authorRole === 'therapist' ? '🩺 Professional' : '👤 User'} 
                          {' • '}
                          {selectedPost.communityName || 'General'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.modalStatusSection}>
                      {renderBadge(selectedPost.status)}
                      <Text style={styles.modalDate}>
                        {new Date(selectedPost.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalContentCard}>
                    {selectedPost.imageUrl ? (
                      <Image 
                        source={{ uri: selectedPost.imageUrl }} 
                        style={styles.modalImage} 
                        resizeMode="cover"
                      />
                    ) : null}
                    {selectedPost.title ? (
                      <Text style={styles.modalTitleText}>{selectedPost.title}</Text>
                    ) : null}
                    <Text style={styles.modalContentText}>{selectedPost.content}</Text>
                  </View>
                  <View style={styles.modalEngagement}>
                    <View style={styles.modalEngagementItem}>
                      <Icon name="favorite-border" size={18} color={COLORS.textMuted} />
                      <Text style={styles.modalEngagementText}>
                        {selectedPost.likes?.length || 0} likes
                      </Text>
                    </View>
                    <View style={styles.modalEngagementItem}>
                      <Icon name="chat-bubble-outline" size={18} color={COLORS.textMuted} />
                      <Text style={styles.modalEngagementText}>
                        {selectedPost.comments?.length || 0} comments
                      </Text>
                    </View>
                    {selectedPost.reportsCount > 0 && (
                      <View style={[styles.modalEngagementItem, styles.modalReportItem]}>
                        <Icon name="report" size={18} color={COLORS.danger} />
                        <Text style={[styles.modalEngagementText, { color: COLORS.danger }]}>
                          {selectedPost.reportsCount} reports
                        </Text>
                      </View>
                    )}
                  </View>
                  {selectedPost.restrictionReason && (
                    <View style={styles.restrictionCard}>
                      <View style={styles.restrictionContent}>
                        <Text style={styles.restrictionLabel}>Restriction Reason</Text>
                        <Text style={styles.restrictionText}>{selectedPost.restrictionReason}</Text>
                      </View>
                    </View>
                  )}
                  {selectedPost.comments && selectedPost.comments.length > 0 && (
                    <View style={styles.commentsSection}>
                      <Text style={styles.commentsTitle}>
                        Comments ({selectedPost.comments.length})
                      </Text>
                      {selectedPost.comments.map((comment, index) => (
                        <View key={comment._id || index} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <View style={styles.commentAuthorInfo}>
                              <View style={styles.commentAvatar}>
                                <Text style={styles.commentAvatarText}>
                                  {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                              </View>
                              <Text style={styles.commentAuthor}>
                                {comment.user?.name || 'Unknown User'}
                              </Text>
                            </View>
                            <Text style={styles.commentDate}>
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                            </Text>
                          </View>
                          <Text style={styles.commentContent}>{comment.content}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.modalActions}>
                    {selectedPost.status !== 'active' && selectedPost.status !== 'removed' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionKeep]}
                        onPress={() => handleKeepPost(selectedPost._id)}
                        disabled={isProcessing}
                      >
                        <Text style={styles.actionButtonText}>
                          {isProcessing ? 'Processing...' : 'Keep Active'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedPost.status !== 'restricted' && selectedPost.status !== 'removed' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionRestrict]}
                        onPress={() => {
                          setModalType(null);
                          handleOpenRestrict(selectedPost);
                        }}
                        disabled={isProcessing}
                      >
                        <Text style={styles.actionButtonText}>Restrict</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedPost.status !== 'removed' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionRemove]}
                        onPress={() => handleRemovePost(selectedPost._id)}
                        disabled={isProcessing}
                      >
                        <Text style={styles.actionButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Status Message */}
                  {selectedPost.status === 'active' && (
                    <View style={styles.statusMessageActive}>
                      <Text style={styles.statusMessageText}>Post is Active - No action needed</Text>
                    </View>
                  )}
                  {selectedPost.status === 'restricted' && (
                    <View style={styles.statusMessageRestricted}>
                      <Text style={[styles.statusMessageText, { color: COLORS.warning }]}>
                        Post is Restricted
                      </Text>
                    </View>
                  )}
                  {selectedPost.status === 'pending' && (
                    <View style={styles.statusMessagePending}>
                      <Icon name="hourglass-empty" size={20} color={COLORS.info} />
                      <Text style={[styles.statusMessageText, { color: COLORS.info }]}>
                        Post is Pending Review
                      </Text>
                    </View>
                  )}
                  {selectedPost.status === 'removed' && (
                    <View style={styles.statusMessageRemoved}>
                      <Icon name="cancel" size={20} color={COLORS.danger} />
                      <Text style={[styles.statusMessageText, { color: COLORS.danger }]}>
                        Post is Removed
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
        <Modal visible={modalType === 'restrict'} transparent animationType="slide">
          <View style={adminStyles.modalOverlay}>
            <View style={[adminStyles.modalBox, styles.modalBox]}>
              <View style={adminStyles.modalHeader}>
                <Text style={adminStyles.modalTitle}>Apply Restriction</Text>
                <TouchableOpacity style={adminStyles.closeButton} onPress={() => setModalType(null)}>
                  <Icon name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.restrictModalContent}>
                <Text style={styles.restrictModalTitle}>Content Warning</Text>
                <Text style={styles.restrictModalSubtext}>
                  This post will be marked with a warning label. Users will see the restriction reason.
                </Text>

                <View style={adminStyles.inputGroup}>
                  <Text style={adminStyles.inputLabel}>Restriction Reason</Text>
                  <TextInput
                    style={[adminStyles.textInput, styles.restrictInput]}
                    multiline
                    numberOfLines={4}
                    placeholder="Specify the reason for restriction..."
                    placeholderTextColor={COLORS.textMuted}
                    value={restrictReason}
                    onChangeText={setRestrictReason}
                  />
                </View>

                <View style={styles.restrictActions}>
                  <TouchableOpacity
                    style={[styles.restrictButton, styles.restrictCancel]}
                    onPress={() => setModalType(null)}
                  >
                    <Text style={styles.restrictCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.restrictButton, 
                      styles.restrictConfirm,
                      (!restrictReason.trim() || isProcessing) && styles.restrictDisabled
                    ]}
                    onPress={handleConfirmRestrict}
                    disabled={!restrictReason.trim() || isProcessing}
                  >
                    <Text style={styles.restrictConfirmText}>
                      {isProcessing ? 'Processing...' : 'Confirm Restriction'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostsManagementView;