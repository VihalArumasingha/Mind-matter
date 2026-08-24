import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';

export default function ViewProfessionalPostsScreen({ navigation }) {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/posts/my-posts`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts || []);
      } else {
        throw new Error(data.message || 'Failed to fetch posts');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePost(postId),
        },
      ]
    );
  };

  const deletePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Post deleted successfully');
        fetchPosts();
      } else {
        throw new Error(data.message || 'Failed to delete post');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete post');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Post updated successfully');
        setEditingPost(null);
        fetchPosts();
      } else {
        throw new Error(data.message || 'Failed to update post');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update post');
    }
  };

  const renderPost = (post) => {
    if (editingPost && editingPost._id === post._id) {
      return (
        <View key={post._id} style={styles.postCard}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>Edit Post</Text>
            <TouchableOpacity onPress={() => setEditingPost(null)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.editInput}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Title"
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={[styles.editInput, styles.editContent]}
            value={editContent}
            onChangeText={setEditContent}
            placeholder="Content"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={() => setEditingPost(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View key={post._id} style={styles.postCard}>
        <View style={styles.postHeader}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(post)}
            >
              <Ionicons name="create-outline" size={20} color="#4E8C4A" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(post._id)}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.postContent}>{post.content}</Text>
        <View style={styles.postMeta}>
          <View style={styles.categoriesContainer}>
            {post.categories.map((cat, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.postDate}>
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2D5A27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Professional Posts</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4E8C4A" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubtext}>Create your first professional post</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchPosts} />
          }
        >
          {posts.map(renderPost)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECE6',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D5A27',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#EAF3ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4E8C4A',
  },
  postDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  editInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8ECE6',
    marginBottom: 12,
  },
  editContent: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4E8C4A',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});