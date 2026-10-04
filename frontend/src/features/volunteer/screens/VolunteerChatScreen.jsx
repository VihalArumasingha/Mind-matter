import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';

const GREEN = '#2F6B47';
const GREEN_LIGHT = '#EAF3ED';
const TEXT_DARK = '#1B3A24';
const TEXT_MUTED = '#6B8072';
const DANGER = '#DC2626';

export default function VolunteerChatScreen({ navigation, route }) {
  const { token, authFetch, user } = useAuth();
  const { userId, userName } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  // Selected message for action options (Edit / Delete)
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const scrollViewRef = useRef(null);

  const currentUserId = (user?._id || user?.id)?.toString();

  const loadMessages = useCallback(async (isSilent = false) => {
    if (!userId || !token) return;

    try {
      if (!isSilent) setIsLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/messages/conversation/${userId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!isSilent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, token, authFetch]);

  useEffect(() => {
    loadMessages();

    // Auto-refresh conversation every 5 seconds so updates/deletes retrieve automatically
    const interval = setInterval(() => {
      loadMessages(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [loadMessages]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadMessages(true);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !userId || !token) return;

    const contentToSend = messageText.trim();
    try {
      setSending(true);
      const response = await authFetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        body: JSON.stringify({
          receiverId: userId,
          content: contentToSend,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessageText('');
        loadMessages(true);
        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
      } else {
        Alert.alert('Error', data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleMessagePress = (msg, isSent) => {
    if (!isSent) return; // Only allow editing/deleting own sent messages
    setSelectedMessage(msg);
    setActionModalVisible(true);
  };

  const openEditModal = () => {
    if (!selectedMessage) return;
    setEditText(selectedMessage.content);
    setActionModalVisible(false);
    setEditModalVisible(true);
  };

  const submitEditMessage = async () => {
    if (!editText.trim() || !selectedMessage) return;

    try {
      setIsUpdating(true);
      const response = await authFetch(`${API_BASE_URL}/api/messages/${selectedMessage._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: editText.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === selectedMessage._id ? { ...m, content: editText.trim(), isEdited: true } : m))
        );
        setEditModalVisible(false);
        setSelectedMessage(null);
        setEditText('');
      } else {
        Alert.alert('Error', data.message || 'Failed to update message');
      }
    } catch (error) {
      console.error('Error updating message:', error);
      Alert.alert('Error', 'Could not update message. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteMessage = () => {
    if (!selectedMessage) return;
    setActionModalVisible(false);

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? It will be removed for everyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await authFetch(`${API_BASE_URL}/api/messages/${selectedMessage._id}`, {
                method: 'DELETE',
              });
              const data = await response.json();

              if (data.success) {
                setMessages((prev) => prev.filter((m) => m._id !== selectedMessage._id));
                setSelectedMessage(null);
              } else {
                Alert.alert('Error', data.message || 'Failed to delete message');
              }
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Could not delete message. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F9F6" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{userName || 'Chat'}</Text>
          <View style={styles.onlineStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => loadMessages(true)} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Messages Scroll Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={40} color={GREEN} />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Send a message below to start your conversation with {userName || 'this person'}.
              </Text>
            </View>
          ) : (
            messages.map((msg) => {
              const senderId = (msg.sender?._id || msg.sender?.id || msg.sender)?.toString();
              const isSent = Boolean(currentUserId && senderId && currentUserId === senderId);

              return (
                <View
                  key={msg._id}
                  style={[
                    styles.messageBubbleWrapper,
                    isSent ? styles.sentWrapper : styles.receivedWrapper,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={isSent ? 0.75 : 1}
                    onLongPress={() => handleMessagePress(msg, isSent)}
                    onPress={() => isSent && handleMessagePress(msg, isSent)}
                    style={[
                      styles.messageBubble,
                      isSent ? styles.sentMessage : styles.receivedMessage,
                    ]}
                  >
                    <Text style={[styles.messageText, isSent && styles.sentMessageText]}>
                      {msg.content}
                    </Text>

                    <View style={styles.messageMetaRow}>
                      {msg.isEdited && (
                        <Text style={[styles.editedText, isSent && styles.sentMetaText]}>
                          (edited){' '}
                        </Text>
                      )}
                      <Text style={[styles.messageTime, isSent && styles.sentMetaText]}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {isSent && (
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={12}
                          color="rgba(255, 255, 255, 0.7)"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={TEXT_MUTED}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size={18} color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Message Action Sheet Modal (Edit / Delete) */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.actionSheetContent}>
            <View style={styles.actionSheetHandle} />
            <Text style={styles.actionSheetTitle}>Message Options</Text>

            <TouchableOpacity style={styles.actionSheetButton} onPress={openEditModal}>
              <View style={[styles.actionIconBox, { backgroundColor: GREEN_LIGHT }]}>
                <Ionicons name="pencil" size={18} color={GREEN} />
              </View>
              <Text style={styles.actionSheetButtonText}>Edit Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionSheetButton} onPress={confirmDeleteMessage}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash" size={18} color={DANGER} />
              </View>
              <Text style={[styles.actionSheetButtonText, { color: DANGER }]}>Delete Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetCancelButton}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Message</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.editTextInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
              maxLength={1000}
              placeholder="Edit your message..."
              placeholderTextColor={TEXT_MUTED}
            />

            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.editCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, (!editText.trim() || isUpdating) && styles.editSaveBtnDisabled]}
                onPress={submitEditMessage}
                disabled={!editText.trim() || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.editSaveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1EAE3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  refreshButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  emptySubtext: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  messageBubbleWrapper: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  sentWrapper: {
    justifyContent: 'flex-end',
  },
  receivedWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sentMessage: {
    backgroundColor: GREEN,
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E1EAE3',
  },
  messageText: {
    fontSize: 14,
    color: TEXT_DARK,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#FFFFFF',
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  editedText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: TEXT_MUTED,
  },
  sentMetaText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1EAE3',
  },
  input: {
    flex: 1,
    backgroundColor: '#F6F9F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 10,
    fontSize: 14,
    color: TEXT_DARK,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E1EAE3',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B5C8BA',
  },

  /* Action Sheet Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  actionSheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  actionSheetCancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },

  /* Edit Modal */
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  editTextInput: {
    minHeight: 80,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: TEXT_DARK,
    textAlignVertical: 'top',
    backgroundColor: '#F8FAF8',
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  editCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  editCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  editSaveBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: GREEN,
  },
  editSaveBtnDisabled: {
    backgroundColor: '#B5C8BA',
  },
  editSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
