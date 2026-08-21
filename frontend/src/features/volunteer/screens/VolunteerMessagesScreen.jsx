import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../styles/volunteerDashboardStyles';

const initialConversations = [
  {
    id: 'conv_1',
    name: 'Chamodi P.',
    initials: 'CP',
    category: 'Student support',
    lastMessage: "Thank you so much! Looking forward to our session tomorrow at 4:00 PM.",
    time: '10:42 AM',
    unread: 1,
    online: true,
    avatarBg: '#EAF3ED',
    avatarColor: '#2F6B47',
  },
  {
    id: 'conv_2',
    name: 'Isuru M.',
    initials: 'IM',
    category: 'Listening session',
    lastMessage: 'Hi Dewmini, is it possible to adjust the time to 7:00 PM?',
    time: 'Yesterday',
    unread: 0,
    online: false,
    avatarBg: '#F3E8FF',
    avatarColor: '#7C3AED',
  },
  {
    id: 'conv_3',
    name: 'Ravindu K.',
    initials: 'RK',
    category: 'Emotional support',
    lastMessage: 'Hello, I sent a request for a support session on Saturday.',
    time: 'May 18',
    unread: 0,
    online: true,
    avatarBg: '#FCE7D6',
    avatarColor: '#B45309',
  },
];

export default function VolunteerMessagesScreen({ navigation, onTabChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations] = useState(initialConversations);

  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS?.bg || '#F6F9F6'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <TouchableOpacity style={styles.createChatBtn} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={TEXT_MUTED} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={TEXT_MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
          </TouchableOpacity>
        )}
      </View>

      {/* Conversation List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={TEXT_MUTED} />
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptySubtitle}>
              When users connect with you for sessions, your chat conversations will appear here.
            </Text>
          </View>
        ) : (
          filteredConversations.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatCard}
              activeOpacity={0.7}
            >
              <View style={styles.avatarWrapper}>
                <View style={[styles.avatarCircle, { backgroundColor: chat.avatarBg }]}>
                  <Text style={[styles.avatarText, { color: chat.avatarColor }]}>
                    {chat.initials}
                  </Text>
                </View>
                {chat.online && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.chatContent}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <Text style={styles.chatCategory}>{chat.category}</Text>
                <Text
                  style={[
                    styles.lastMessageText,
                    chat.unread > 0 && styles.unreadMessageText,
                  ]}
                  numberOfLines={1}
                >
                  {chat.lastMessage}
                </Text>
              </View>

              {chat.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{chat.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <NavItem
          icon="view-dashboard-outline"
          label="Dashboard"
          onPress={() => onTabChange?.('dashboard')}
        />
        <NavItem
          icon="clipboard-list-outline"
          label="Requests"
          onPress={() => onTabChange?.('requests')}
        />
        <NavItem
          icon="calendar-blank-outline"
          label="Availability"
          onPress={() => onTabChange?.('availability')}
        />
        <NavItem
          icon="message-outline"
          label="Messages"
          active
          onPress={() => onTabChange?.('messages')}
        />
        <NavItem
          icon="account-outline"
          label="Profile"
          onPress={() => onTabChange?.('profile')}
        />
      </View>
    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress }) {
  const color = active ? GREEN : TEXT_MUTED;
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.activeNavIndicator]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const GREEN = '#2F6B47';
const GREEN_BG = '#EAF3ED';
const TEXT_DARK = '#1B3A24';
const TEXT_MUTED = '#6B8072';
const BORDER = '#E1EAE3';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  createChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    marginHorizontal: 18,
    marginBottom: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: TEXT_DARK,
    paddingVertical: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  chatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  chatTime: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  chatCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
    marginTop: 1,
    marginBottom: 3,
  },
  lastMessageText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  unreadMessageText: {
    fontWeight: '700',
    color: TEXT_DARK,
  },
  unreadBadge: {
    backgroundColor: GREEN,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  activeNavIndicator: {
    backgroundColor: GREEN_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
});
