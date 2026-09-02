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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageBubble, Message } from '../../components/MessageBubble';
import { TypingIndicator } from '../../components/TypingIndicator';
import { EmptyChat } from '../../components/EmptyChat';
import { ChatInput, ImageAttachment } from '../../components/ChatInput';
import { ScrollToBottomButton } from '../../components/ScrollToBottomButton';
import { ImageAttachmentModal } from '../../components/ImageAttachmentModal';
import { ImageViewerModal } from '../../components/ImageViewerModal';
import {
  ArrowLeftIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
} from '../../components/Icons';
import { useChat } from '../../src/context/ChatContext';
import { useResponsive } from '../../src/hooks/useResponsive';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();

  const {
    activeConversation,
    activeConversationId,
    conversations,
    messages,
    isLoading,
    isDark,
    toggleTheme,
    handleSend,
    handleStopGeneration,
    handleRegenerate,
    handleNewChat,
    handleSelectConversation,
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

  // Sync route param with active conversation
  useEffect(() => {
    if (id === 'new') {
      if (activeConversationId) {
        handleNewChat();
      }
    } else if (id && id !== activeConversationId) {
      if (conversations.some((c) => c.id === id)) {
        handleSelectConversation(id);
      }
    }
  }, [id, activeConversationId, conversations, handleNewChat, handleSelectConversation]);

  // Auto-scroll when messages change
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

  // Auto-scroll when keyboard opens on Android/iOS
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

      if (!textToSend) setInput('');
      setAttachedImage(null);

      const targetId = id && id !== 'new' ? id : activeConversationId || undefined;
      await handleSend(text, targetId, imageToSend);
    },
    [input, attachedImage, isLoading, id, activeConversationId, handleSend],
  );

  const handleImageSelected = useCallback(
    (img: ImageAttachment) => {
      setIsAttachModalVisible(false);
      setAttachedImage(img);
    },
    [],
  );

  const onNewChatPress = useCallback(() => {
    handleNewChat();
    setInput('');
    setAttachedImage(null);
    router.push('/(tabs)');
  }, [handleNewChat, router]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 120;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setShowScrollBottom(!isCloseToBottom && contentSize.height > layoutMeasurement.height);
  }, []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isLatestGemini = item.sender === 'gemini' && index === messages.length - 1;
      const isFavorited = isMessageFavorited(item.id);

      return (
        <MessageBubble
          message={item}
          isLatestGemini={isLatestGemini}
          isLoading={isLoading}
          isFavorited={isFavorited}
          onRegenerate={handleRegenerate}
          onOpenImage={(uri) => setPreviewImageUri(uri)}
          onToggleFavorite={() =>
            toggleFavoriteMessage(
              item,
              activeConversationId || undefined,
              activeConversation?.title || undefined,
            )
          }
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
    ],
  );

  const listFooterComponent = useMemo(() => {
    if (!isLoading) return null;
    return <TypingIndicator />;
  }, [isLoading]);

  const listEmptyComponent = useMemo(() => {
    return (
      <EmptyChat
        onSelectPrompt={(prompt) => onSendPress(prompt)}
        onAttachImage={() => setIsAttachModalVisible(true)}
      />
    );
  }, [onSendPress]);

  const currentTitle =
    id === 'new'
      ? 'New Conversation'
      : activeConversation?.title ||
        conversations.find((c) => c.id === id)?.title ||
        'Gemini Assistant';

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{ paddingTop: Math.max(insets.top, 12) }}
          className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-3 shadow-xs"
        >
          <View className="w-full max-w-4xl mx-auto flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2.5 gap-2.5 flex-1 mr-2">
              <Pressable
                onPress={() => router.push('/(tabs)')}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
                accessibilityRole="button"
                accessibilityLabel="Back to Tabs"
                hitSlop={8}
              >
                <ArrowLeftIcon size={18} color={isDark ? '#cbd5e1' : '#475569'} />
              </Pressable>

              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className="text-base font-bold text-slate-900 dark:text-slate-50 tracking-tight"
                >
                  {currentTitle}
                </Text>
                <Text className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                  Direct Session Viewer
                </Text>
              </View>
            </View>

            {/* Header Actions */}
            <View className="flex-row items-center space-x-1.5 gap-1.5">
              <Pressable
                onPress={onNewChatPress}
                className="flex-row items-center bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 px-3 py-2 rounded-xl active:bg-indigo-100 dark:active:bg-indigo-900"
                accessibilityRole="button"
                accessibilityLabel="New Chat"
                hitSlop={6}
              >
                <PlusIcon size={14} color="#6366f1" />
                <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">
                  New
                </Text>
              </Pressable>

              <Pressable
                onPress={toggleTheme}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
                accessibilityRole="button"
                accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                hitSlop={6}
              >
                {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Message FlatList Centered Column */}
        <View className="flex-1 w-full max-w-4xl mx-auto self-center">
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={
              messages.length === 0
                ? { flexGrow: 1 }
                : {
                    paddingHorizontal: isWideScreen ? 24 : 16,
                    paddingTop: 16,
                    paddingBottom: 24,
                  }
            }
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={100}
            ListEmptyComponent={listEmptyComponent}
            ListFooterComponent={listFooterComponent}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            updateCellsBatchingPeriod={50}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Floating Scroll to Bottom Button */}
        <ScrollToBottomButton
          visible={showScrollBottom}
          onPress={scrollToLatest}
        />

        {/* Multiline Multimodal Chat Input */}
        <ChatInput
          input={input}
          onChangeText={setInput}
          onSend={() => onSendPress()}
          onStop={handleStopGeneration}
          isLoading={isLoading}
          isDark={isDark}
          attachedImage={attachedImage}
          onAttachPress={() => setIsAttachModalVisible(true)}
          onRemoveAttachment={() => setAttachedImage(null)}
        />
      </KeyboardAvoidingView>

      {/* Attachment Action Sheet Modal */}
      <ImageAttachmentModal
        visible={isAttachModalVisible}
        onClose={() => setIsAttachModalVisible(false)}
        onImageSelected={handleImageSelected}
        isDark={isDark}
      />

      {/* Fullscreen Image Inspection Modal */}
      <ImageViewerModal
        visible={Boolean(previewImageUri)}
        imageUri={previewImageUri}
        onClose={() => setPreviewImageUri(null)}
      />
    </View>
  );
}
