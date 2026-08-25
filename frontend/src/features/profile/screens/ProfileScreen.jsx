import React, { useState } from 'react';
import { 
  ActivityIndicator,
  Image,
  Alert, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View,
  Modal,        
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { deleteAccount } from '../services/profileService';
import TherapistApplicationForm from '../../admin/therapist/TherapistApplicationForm'; 
import { getMyPosts } from '../../posts/services/postService';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const loadMyPosts = React.useCallback(async () => {
    if (!token) {
      setMyPosts([]);
      setIsLoadingPosts(false);
      return;
    }

    try {
      setIsLoadingPosts(true);
      const data = await getMyPosts(token);
      setMyPosts(data.posts || []);
    } catch (error) {
      Alert.alert('Unable to load posts', error.message);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      loadMyPosts();
    }, [loadMyPosts])
  );

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent. Your account and associated profile data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount(token);
      await logout();
    } catch (error) {
      Alert.alert('Unable to delete account', error.message);
    }
  };

  const handleBecomeVolunteer = () => {
    if (user?.role === 'therapist' || user?.role === 'professional') {
      Alert.alert(
        'Already Verified',
        'You are already a verified therapist/professional on MindMatter.'
      );
      return;
    }
    setShowApplicationForm(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role || 'user'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full name</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bio</Text>
              <Text style={styles.infoValue}>
                {user?.bio || 'No bio added yet'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.postsTitleRow}>
            <Text style={styles.sectionTitle}>My Posts</Text>
            <Pressable onPress={() => navigation.navigate('MyPosts')} hitSlop={10} style={styles.postsLink}>
              <Text style={styles.postCount}>{myPosts.length}</Text>
              <Text style={styles.postsArrow}>›</Text>
            </Pressable>
          </View>

          {isLoadingPosts ? (
            <ActivityIndicator color="#4E8C4A" style={styles.postsLoader} />
          ) : myPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyPostsText}>You have not shared any posts yet.</Text>
            </View>
          ) : (
            myPosts.slice(0, 1).map(post => (
              <View key={post._id} style={styles.postCard}>
                <Text style={styles.postDate}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.postTitle}>{post.title || 'Untitled post'}</Text>
                <Text style={styles.postContent}>{post.description || post.content}</Text>
                {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.postImage} /> : null}
                <Text style={styles.commentCount}>
                  {post.comments?.length || 0} {post.comments?.length === 1 ? 'comment' : 'comments'}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <Pressable 
            style={styles.menuItem}
            onPress={handleBecomeVolunteer}>
            <View>
              <Text style={styles.menuTitle}>Become a Volunteer</Text>
              <Text style={styles.menuDescription}>
                Apply to support the MindMatter community.
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View>
              <Text style={styles.menuTitle}>Become a Community Organizer</Text>
              <Text style={styles.menuDescription}>
                Apply to organize and manage communities.
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
        
        <Pressable
          style={styles.deleteButton}
          onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showApplicationForm}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowApplicationForm(false)}>
        <View style={{ flex: 1, backgroundColor: '#F0FDFA' }}>
          {/* Close button */}
            
          <TherapistApplicationForm 
          userId={user?.id||user?.id}  
            onSubmitted={() => {
              setShowApplicationForm(false);
              Alert.alert(
                'Application Submitted!',
                'Your application has been submitted successfully. You will receive a confirmation email shortly.'
              );
            }}
            onClose={() => setShowApplicationForm(false)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    content: {
        paddingHorizontal: 20,
        paddingBottom: 35,
    },

    header: {
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },

    backArrow: {
        fontSize: 38,
        color: '#273027',
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#252A25',
    },

    headerSpacer: {
        width: 44,
    },

    profileHeader: {
        alignItems: 'center',
        paddingTop: 14,
        paddingBottom: 25,
    },

    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DDEBD8',
        marginBottom: 13,
    },

      avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
      },

    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#4E824D',
    },

    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#252A25',
    },

    email: {
        marginTop: 5,
        fontSize: 14,
        color: '#747B74',
    },

    roleBadge: {
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#E2EEDB',
    },

    roleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4E824D',
        textTransform: 'capitalize',
    },

    section: {
        marginTop: 18,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#343A35',
        marginBottom: 10,
    },

    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: '#E2E9DF',
    },

    infoRow: {
        paddingVertical: 15,
    },

    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#858C85',
        marginBottom: 5,
    },

    infoValue: {
        fontSize: 15,
        color: '#303630',
    },

    divider: {
        height: 1,
        backgroundColor: '#EDF0EB',
    },

    editButton: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#4E8C4A',
        marginTop: 20,
    },

    editButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

      postsTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },

      postsLink: {
        flexDirection: 'row',
        alignItems: 'center',
      },

      postsArrow: {
        marginLeft: 6,
        color: '#4E824D',
        fontSize: 27,
      },

      postCount: {
        minWidth: 26,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        textAlign: 'center',
        backgroundColor: '#E2EEDB',
        color: '#4E824D',
        fontSize: 12,
        fontWeight: '700',
      },

      postsLoader: {
        marginVertical: 20,
      },

      emptyPosts: {
        padding: 18,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E9DF',
      },

      emptyPostsText: {
        color: '#7A827A',
        textAlign: 'center',
      },

      postCard: {
        marginBottom: 10,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E9DF',
      },

      postDate: {
        color: '#858C85',
        fontSize: 12,
      },

      postContent: {
        marginTop: 8,
        color: '#303630',
        fontSize: 15,
        lineHeight: 21,
      },

      postTitle: {
        marginTop: 8,
        color: '#303630',
        fontSize: 16,
        fontWeight: '700',
      },

      postImage: {
        width: '100%',
        height: 160,
        marginTop: 10,
        borderRadius: 10,
      },

      commentCount: {
        marginTop: 12,
        color: '#7A827A',
        fontSize: 12,
      },

    menuItem: {
        minHeight: 72,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 17,
        paddingVertical: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E9DF',
    },

    menuTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#343A35',
    },

    menuDescription: {
        marginTop: 4,
        fontSize: 12,
        color: '#7A827A',
    },

    menuArrow: {
        fontSize: 28,
        color: '#7A827A',
    },

    logoutButton: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9E1D6',
        marginTop: 25,
    },

    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4E824D',
    },
    deleteButton: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },

    deleteText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#B94A48',
    }
})

export default ProfileScreen