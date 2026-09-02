import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text,
  Pressable,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble, Message } from '../../components/MessageBubble';
import { TypingIndicator } from '../../components/TypingIndicator';
import { EmptyChat } from '../../components/EmptyChat';
import { ChatInput, ImageAttachment } from '../../components/ChatInput';
import { ScrollToBottomButton } from '../../components/ScrollToBottomButton';
import { ImageAttachmentModal } from '../../components/ImageAttachmentModal';
import { ImageViewerModal } from '../../components/ImageViewerModal';
import { useChat, GEMINI_MODEL } from '../../src/context/ChatContext';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    messages,
    isLoading,
    activeConversationId,
    activeConversation,
    handleSend,
    handleRegenerate,
    handleStopGeneration,
    handleNewChat,
    isDark,
    toggleTheme,
    toggleFavoriteMessage,
    isMessageFavorited,
  } = useChat();

  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<ImageAttachment | null>(null);
  const [isAttachModalVisible, setIsAttachModalVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const listRef = useRef<FlatList<Message>>(null);
  const isInitialMount = useRef(true);

  // Auto-scroll on new message
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  // Auto-scroll when isLoading changes (thinking state appears/disappears)
  useEffect(() => {
    if (isLoading) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [isLoading]);

  // Auto-scroll when keyboard opens
  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const sub = Keyboard.addListener(showEvent, () => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    });
    return () => sub.remove();
  }, []);

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const onSendPress = useCallback(
    async (textToSend?: string) => {
      const text = textToSend ?? input;
      const imageToSend = attachedImage;

      if ((!text.trim() && !imageToSend) || isLoading) return;

      setInput('');
      setAttachedImage(null);

      try {
        await handleSend(text.trim(), activeConversationId || undefined, imageToSend);
      } catch (err) {
        console.error('Error sending message:', err);
      }
    },
    [input, attachedImage, isLoading, handleSend, activeConversationId]
  );

  const onNewChatPress = useCallback(() => {
    setInput('');
    setAttachedImage(null);
    handleNewChat();
  }, [handleNewChat]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const paddingToBottom = 80;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setShowScrollBottom(!isCloseToBottom && contentOffset.y > 100);
  }, []);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isLatestGemini =
        item.sender === 'gemini' &&
        index === messages.length - 1 &&
        !isLoading &&
        !item.isError;

      return (
        <MessageBubble
          message={item}
          isLatestGemini={isLatestGemini}
          isLoading={isLoading}
          isFavorited={isMessageFavorited(item.id)}
          onRegenerate={handleRegenerate}
          onToggleFavorite={() =>
            toggleFavoriteMessage(item, activeConversationId || undefined, activeConversation?.title || 'Study Session')
          }
          onOpenImage={(uri) => setPreviewImageUri(uri)}
        />
      );
    },
    [
      messages.length,
      isLoading,
      isMessageFavorited,
      handleRegenerate,
      toggleFavoriteMessage,
      activeConversationId,
      activeConversation?.title,
    ]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const listEmptyComponent = useMemo(
    () => (
      <EmptyChat
        onSelectPrompt={(prompt) => onSendPress(prompt)}
        onAttachImage={() => setIsAttachModalVisible(true)}
      />
    ),
    [onSendPress]
  );

  const listFooterComponent = useMemo(
    () => (isLoading ? <TypingIndicator /> : null),
    [isLoading]
  );

  const displayTitle = activeConversation?.title || 'AI Study Tutor';

  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    headerBg: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#1e293b' : '#e2e8f0',
    titleText: isDark ? '#f8fafc' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    iconBg: isDark ? '#1e293b' : '#eef2ff',
    btnBg: isDark ? '#1e293b' : '#f1f5f9',
    btnText: isDark ? '#cbd5e1' : '#475569',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      >
        {/* Pinned Top Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.headerBg,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top, 12),
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatarBadge, { backgroundColor: colors.iconBg }]}>
                <Ionicons name="school-outline" size={20} color="#6366f1" />
              </View>
              <View style={styles.headerTextCol}>
                <View style={styles.titleStatusRow}>
                  <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.titleText }]}>
                    {displayTitle}
                  </Text>
                  <View style={styles.onlineDot} />
                </View>
                <Text numberOfLines={1} style={[styles.headerSubtitle, { color: colors.subText }]}>
                  {GEMINI_MODEL} • Multimodal Study Tutor
                </Text>
              </View>
            </View>

            {/* Header Actions */}
            <View style={styles.headerActions}>
              <Pressable
                onPress={onNewChatPress}
                style={[styles.headerBtn, { backgroundColor: colors.btnBg, borderColor: colors.border }]}
                accessibilityLabel="New Chat"
                hitSlop={6}
              >
                <Ionicons name="add" size={16} color={colors.btnText} />
                <Text style={[styles.newBtnText, { color: colors.btnText }]}>New</Text>
              </Pressable>

              <Pressable
                onPress={toggleTheme}
                style={[styles.themeBtn, { backgroundColor: colors.btnBg }]}
                accessibilityLabel="Toggle Theme"
                hitSlop={6}
              >
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={14} color={isDark ? '#f59e0b' : '#6366f1'} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Scrollable Chat Area */}
        <View style={styles.chatArea}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            ListEmptyComponent={listEmptyComponent}
            ListFooterComponent={listFooterComponent}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Scroll To Bottom Floating Button */}
        <ScrollToBottomButton
          visible={showScrollBottom}
          onPress={scrollToLatest}
        />

        {/* Pinned Bottom Message Input */}
        <View style={styles.inputWrapper}>
          <ChatInput
            input={input}
            onChangeText={setInput}
            attachedImage={attachedImage}
            onRemoveAttachment={() => setAttachedImage(null)}
            isLoading={isLoading}
            isDark={isDark}
            onSend={() => onSendPress()}
            onAttachPress={() => setIsAttachModalVisible(true)}
            onStop={handleStopGeneration}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Attach Image Modal */}
      <ImageAttachmentModal
        visible={isAttachModalVisible}
        onClose={() => setIsAttachModalVisible(false)}
        onImageSelected={(img) => setAttachedImage(img)}
        isDark={isDark}
      />

      {/* Image Full-screen Preview Modal */}
      <ImageViewerModal
        visible={!!previewImageUri}
        imageUri={previewImageUri}
        onClose={() => setPreviewImageUri(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  titleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 36,
  },
  newBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  inputWrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
