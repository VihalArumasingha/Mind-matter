import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';
import { updateProfile, deleteAccount } from '../../profile/services/profileService';
import { profileStyles } from '../styles/volunteerProfileStyles';
import { COLORS } from '../styles/volunteerDashboardStyles';

export default function VolunteerProfileScreen({ navigation, onTabChange }) {
  const { user, token, logout, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form States
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('Emotional Support, Peer Counseling');
  const [languages, setLanguages] = useState('English, Sinhala');

  useEffect(() => {
    if (user) {
      setName(user.fullName || user.name || 'Dewmini Costa');
      setBio(user.bio || 'Passionate volunteer dedicated to supporting youth and students through empathetic listening and peer support.');
      setPhone(user.phone || '+94 77 123 4567');
      if (user.specialties) setSpecialties(user.specialties);
      if (user.languages) setLanguages(user.languages);
    }
  }, [user]);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'DC';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);

      const updatedPayload = {
        name: name.trim(),
        fullName: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        specialties: specialties.trim(),
        languages: languages.trim(),
      };

      if (token) {
        try {
          const res = await updateProfile(token, updatedPayload);
          if (res?.user) {
            updateUser(res.user);
          } else {
            updateUser({ ...user, ...updatedPayload });
          }
        } catch (apiErr) {
          console.log('Update profile API fallback:', apiErr.message);
          updateUser({ ...user, ...updatedPayload });
        }
      } else {
        updateUser({ ...user, ...updatedPayload });
      }

      setIsEditing(false);
      Alert.alert('Success', 'Volunteer profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and will remove all your volunteer records. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (token) {
                await deleteAccount(token);
              }
              await logout();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={profileStyles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={profileStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={profileStyles.container}
          contentContainerStyle={profileStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View style={profileStyles.navBar}>
            <TouchableOpacity
              style={profileStyles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
            </TouchableOpacity>

            <Text style={profileStyles.navTitle}>Volunteer Profile</Text>

            <TouchableOpacity
              style={[
                profileStyles.editToggleBtn,
                isEditing && profileStyles.editToggleBtnActive,
              ]}
              onPress={() => setIsEditing(!isEditing)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  profileStyles.editToggleText,
                  isEditing && profileStyles.editToggleTextActive,
                ]}
              >
                {isEditing ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Header Card */}
          <View style={profileStyles.profileHeaderCard}>
            <View style={profileStyles.avatarContainer}>
              <View style={profileStyles.avatarLarge}>
                <Text style={profileStyles.avatarLargeText}>{initials}</Text>
              </View>
              {isEditing && (
                <View style={profileStyles.avatarEditBadge}>
                  <Ionicons name="pencil" size={14} color={COLORS.green} />
                </View>
              )}
            </View>

            <Text style={profileStyles.userName}>{name}</Text>

            <View style={profileStyles.roleBadgeRow}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.green} />
              <Text style={profileStyles.roleBadgeText}>Active Volunteer</Text>
            </View>

            <Text style={profileStyles.userEmail}>{user?.email || 'volunteer@mindmatter.org'}</Text>

            {/* Mini Stats */}
            <View style={profileStyles.miniStatsRow}>
              <View style={[profileStyles.miniStatCol, profileStyles.miniStatBorder]}>
                <Text style={profileStyles.miniStatValue}>18</Text>
                <Text style={profileStyles.miniStatLabel}>Sessions</Text>
              </View>
              <View style={[profileStyles.miniStatCol, profileStyles.miniStatBorder]}>
                <Text style={profileStyles.miniStatValue}>24h</Text>
                <Text style={profileStyles.miniStatLabel}>Contributed</Text>
              </View>
              <View style={profileStyles.miniStatCol}>
                <Text style={profileStyles.miniStatValue}>4.9 ★</Text>
                <Text style={profileStyles.miniStatLabel}>Rating</Text>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={profileStyles.sectionCard}>
            <Text style={profileStyles.sectionTitle}>Volunteer Information</Text>

            {/* Full Name */}
            <View style={profileStyles.fieldGroup}>
              <Text style={profileStyles.fieldLabel}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={profileStyles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.textMuted}
                />
              ) : (
                <View style={profileStyles.fieldValueBox}>
                  <Text style={profileStyles.fieldValueText}>{name}</Text>
                </View>
              )}
            </View>

            {/* Bio */}
            <View style={profileStyles.fieldGroup}>
              <Text style={profileStyles.fieldLabel}>About / Bio</Text>
              {isEditing ? (
                <TextInput
                  style={[profileStyles.fieldInput, profileStyles.fieldInputMultiline]}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  placeholder="Describe your background and volunteer passion"
                  placeholderTextColor={COLORS.textMuted}
                />
              ) : (
                <View style={profileStyles.fieldValueBox}>
                  <Text style={profileStyles.fieldValueText}>{bio}</Text>
                </View>
              )}
            </View>

            {/* Phone */}
            <View style={profileStyles.fieldGroup}>
              <Text style={profileStyles.fieldLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={profileStyles.fieldInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter contact number"
                  placeholderTextColor={COLORS.textMuted}
                />
              ) : (
                <View style={profileStyles.fieldValueBox}>
                  <Text style={profileStyles.fieldValueText}>{phone}</Text>
                </View>
              )}
            </View>

            {/* Specialties */}
            <View style={profileStyles.fieldGroup}>
              <Text style={profileStyles.fieldLabel}>Specialties & Focus</Text>
              {isEditing ? (
                <TextInput
                  style={profileStyles.fieldInput}
                  value={specialties}
                  onChangeText={setSpecialties}
                  placeholder="e.g. Peer Counseling, Emotional Support"
                  placeholderTextColor={COLORS.textMuted}
                />
              ) : (
                <View style={profileStyles.fieldValueBox}>
                  <Text style={profileStyles.fieldValueText}>{specialties}</Text>
                </View>
              )}
            </View>

            {/* Languages */}
            <View style={profileStyles.fieldGroup}>
              <Text style={profileStyles.fieldLabel}>Languages Spoken</Text>
              {isEditing ? (
                <TextInput
                  style={profileStyles.fieldInput}
                  value={languages}
                  onChangeText={setLanguages}
                  placeholder="e.g. English, Sinhala"
                  placeholderTextColor={COLORS.textMuted}
                />
              ) : (
                <View style={profileStyles.fieldValueBox}>
                  <Text style={profileStyles.fieldValueText}>{languages}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Save & Cancel Buttons when editing */}
          {isEditing && (
            <View>
              <TouchableOpacity
                style={profileStyles.saveButton}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />
                    <Text style={profileStyles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={profileStyles.cancelButton}
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Text style={profileStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Account Actions */}
          {!isEditing && (
            <View style={profileStyles.accountActionsCard}>
              <TouchableOpacity
                style={profileStyles.actionRow}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.7}
              >
                <View style={profileStyles.actionRowLeft}>
                  <View style={[profileStyles.actionIconContainer, { backgroundColor: COLORS.greenBg }]}>
                    <Ionicons name="pencil-outline" size={18} color={COLORS.green} />
                  </View>
                  <Text style={profileStyles.actionText}>Edit Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.navInactive} />
              </TouchableOpacity>

              <View style={profileStyles.divider} />

              <TouchableOpacity
                style={profileStyles.actionRow}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={profileStyles.actionRowLeft}>
                  <View style={[profileStyles.actionIconContainer, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name="logout" size={18} color="#DC2626" />
                  </View>
                  <Text style={profileStyles.actionTextDanger}>Log Out</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.navInactive} />
              </TouchableOpacity>

              <View style={profileStyles.divider} />

              <TouchableOpacity
                style={profileStyles.actionRow}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <View style={profileStyles.actionRowLeft}>
                  <View style={[profileStyles.actionIconContainer, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </View>
                  <Text style={profileStyles.actionTextDanger}>Delete Account</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.navInactive} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Nav */}
        <View style={profileStyles.bottomNav}>
          <TouchableOpacity
            style={profileStyles.navItem}
            onPress={() => onTabChange?.('dashboard')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="view-dashboard-outline" size={22} color={COLORS.navInactive} />
            <Text style={[profileStyles.navLabel, { color: COLORS.navInactive }]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={profileStyles.navItem}
            onPress={() => onTabChange?.('requests')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="clipboard-list-outline" size={22} color={COLORS.navInactive} />
            <Text style={[profileStyles.navLabel, { color: COLORS.navInactive }]}>Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={profileStyles.navItem}
            onPress={() => onTabChange?.('availability')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="calendar-blank-outline" size={22} color={COLORS.navInactive} />
            <Text style={[profileStyles.navLabel, { color: COLORS.navInactive }]}>Availability</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={profileStyles.navItem}
            onPress={() => onTabChange?.('messages')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="message-outline" size={22} color={COLORS.navInactive} />
            <Text style={[profileStyles.navLabel, { color: COLORS.navInactive }]}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[profileStyles.navItem, profileStyles.activeNavIndicator]}
            onPress={() => onTabChange?.('profile')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-outline" size={22} color={COLORS.green} />
            <Text style={[profileStyles.navLabel, { color: COLORS.green }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
