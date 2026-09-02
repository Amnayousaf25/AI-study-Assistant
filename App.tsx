import './global.css';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatHeader } from './components/ChatHeader';
import { MessageBubble, Message } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { EmptyChat } from './components/EmptyChat';
import { ChatInput } from './components/ChatInput';
import { ScrollToBottomButton } from './components/ScrollToBottomButton';
import { HistoryDrawer } from './components/HistoryDrawer';
import {
  Conversation,
  loadSavedConversations,
  saveAllConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSavedTheme,
  saveThemePreference,
  generateConversationTitle,
} from './src/services/storage';

type GeminiContent = {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
};

type GeminiErrorKind = 'configuration' | 'empty-response' | 'http' | 'network' | 'response';

class GeminiRequestError extends Error {
  constructor(
    readonly kind: GeminiErrorKind,
    readonly status?: number,
  ) {
    super(kind);
  }
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const API_KEY_PLACEHOLDER = 'YOUR_GEMINI_API_KEY';
const MAX_CONVERSATION_MESSAGES = 12;
const GEMINI_CONFIGURATION_MESSAGE =
  'Gemini API key is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to .env.local and restart Expo.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractGeminiText(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.candidates)) return null;

  const textParts: string[] = [];
  for (const candidate of data.candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) continue;
    for (const part of candidate.content.parts) {
      if (isRecord(part) && typeof part.text === 'string' && part.text.trim()) textParts.push(part.text);
    }
  }
  return textParts.length > 0 ? textParts.join('\n').trim() : null;
}

function toGeminiContents(conversation: Message[]): GeminiContent[] {
  return conversation.map((message) => ({
    role: message.sender === 'user' ? 'user' : 'model',
    parts: [{ text: message.text }],
  }));
}

function getRecentConversation(conversation: Message[]): Message[] {
  const recentMessages = conversation.slice(-MAX_CONVERSATION_MESSAGES);
  return recentMessages[0]?.sender === 'gemini' ? recentMessages.slice(1) : recentMessages;
}

function logGeminiTiming(
  startedAt: number,
  fetchStartedAt: number,
  responseReceivedAt: number,
  parsedAt: number,
  messageCount: number,
): void {
  console.log(
    `Gemini timing: prepare=${fetchStartedAt - startedAt}ms, request=${responseReceivedAt - fetchStartedAt}ms, parse=${parsedAt - responseReceivedAt}ms, total=${parsedAt - startedAt}ms, messages=${messageCount}`,
  );
}

function getUserErrorMessage(error: unknown): string {
  if (!(error instanceof GeminiRequestError)) return 'Sorry, something went wrong. Please try again.';

  if (error.kind === 'configuration') return GEMINI_CONFIGURATION_MESSAGE;
  if (error.kind === 'empty-response') return 'Gemini returned an empty response. Please try again.';
  if (error.kind === 'network') return 'Network error. Check your connection and try again.';
  if (error.kind === 'response') return 'Gemini returned an unexpected response. Please try again.';

  switch (error.status) {
    case 400:
      return 'Gemini rejected this request (HTTP 400). Please try again.';
    case 401:
    case 403:
      return `Gemini rejected the API key (HTTP ${error.status}). Check your key and its permissions.`;
    case 404:
      return 'The configured Gemini model was not found (HTTP 404).';
    case 429:
      return 'Gemini rate limit reached (HTTP 429). Please try again shortly.';
    case 500:
      return 'Gemini had an internal error (HTTP 500). Please try again shortly.';
    case 503:
      return 'Gemini is temporarily unavailable (HTTP 503). Please try again shortly.';
    default:
      return `Gemini request failed (HTTP ${error.status ?? 'unknown'}). Please try again.`;
  }
}

async function sendMessageToGemini(conversation: Message[]): Promise<string> {
  if (!GEMINI_API_KEY?.trim() || GEMINI_API_KEY === API_KEY_PLACEHOLDER) {
    throw new GeminiRequestError('configuration');
  }

  const requestStartedAt = Date.now();
  const recentConversation = getRecentConversation(conversation);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const requestBody = JSON.stringify({ contents: toGeminiContents(recentConversation) });
  const fetchStartedAt = Date.now();
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });
  } catch {
    console.log(`Gemini timing: request failed after ${Date.now() - requestStartedAt}ms, messages=${recentConversation.length}`);
    throw new GeminiRequestError('network');
  }

  const responseReceivedAt = Date.now();
  let responseData: unknown;
  try {
    responseData = (await response.json()) as unknown;
  } catch {
    logGeminiTiming(requestStartedAt, fetchStartedAt, responseReceivedAt, Date.now(), recentConversation.length);
    throw new GeminiRequestError('response', response.status);
  }

  logGeminiTiming(requestStartedAt, fetchStartedAt, responseReceivedAt, Date.now(), recentConversation.length);

  if (!response.ok) throw new GeminiRequestError('http', response.status);
  const text = extractGeminiText(responseData);
  if (!text) throw new GeminiRequestError('empty-response');
  return text;
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const listRef = useRef<FlatList<Message>>(null);
  const isInitialMount = useRef(true);

  // Initialize storage
  useEffect(() => {
    async function initApp() {
      const [savedTheme, savedConversations, savedActiveId] = await Promise.all([
        loadSavedTheme(),
        loadSavedConversations(),
        loadActiveConversationId(),
      ]);

      if (savedTheme !== null) {
        setIsDark(savedTheme);
      }

      setConversations(savedConversations);

      if (savedActiveId && savedConversations.some((c) => c.id === savedActiveId)) {
        const active = savedConversations.find((c) => c.id === savedActiveId);
        setActiveConversationId(savedActiveId);
        setMessages(active?.messages ?? []);
      } else if (savedConversations.length > 0) {
        setActiveConversationId(savedConversations[0].id);
        setMessages(savedConversations[0].messages);
      }
    }

    initApp();
  }, []);

  // Smooth auto-scroll when a new message arrives
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

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  // Update conversation in state & storage
  const syncConversationMessages = useCallback(
    (nextMessages: Message[]) => {
      setMessages(nextMessages);

      if (!activeConversationId) {
        // Create new conversation
        const firstUserMsg = nextMessages.find((m) => m.sender === 'user');
        const title = firstUserMsg ? generateConversationTitle(firstUserMsg.text) : 'New Conversation';
        const newId = `${Date.now()}`;
        const newConv: Conversation = {
          id: newId,
          title,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: nextMessages,
        };

        const updated = [newConv, ...conversations];
        setConversations(updated);
        setActiveConversationId(newId);
        saveAllConversations(updated);
        saveActiveConversationId(newId);
      } else {
        // Update existing conversation
        const updated = conversations.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              updatedAt: Date.now(),
              messages: nextMessages,
            };
          }
          return c;
        });

        setConversations(updated);
        saveAllConversations(updated);
      }
    },
    [activeConversationId, conversations],
  );

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text || isLoading) return;

      const userMessage: Message = {
        id: `${Date.now()}-user`,
        text,
        sender: 'user',
        timestamp: Date.now(),
      };

      const nextConversation = [...messages, userMessage];
      syncConversationMessages(nextConversation);
      if (!textToSend) setInput('');
      setIsLoading(true);

      try {
        const geminiText = await sendMessageToGemini(nextConversation);
        const finalConversation: Message[] = [
          ...nextConversation,
          {
            id: `${Date.now()}-gemini`,
            text: geminiText,
            sender: 'gemini',
            timestamp: Date.now(),
          },
        ];
        syncConversationMessages(finalConversation);
      } catch (error: unknown) {
        console.error('Gemini request failed:', error);
        const finalConversation: Message[] = [
          ...nextConversation,
          {
            id: `${Date.now()}-gemini-error`,
            text: getUserErrorMessage(error),
            sender: 'gemini',
            isError: true,
            timestamp: Date.now(),
          },
        ];
        syncConversationMessages(finalConversation);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, syncConversationMessages],
  );

  const handleRegenerate = useCallback(async () => {
    if (isLoading || messages.length === 0) return;

    let conversation = [...messages];
    if (conversation[conversation.length - 1]?.sender === 'gemini') {
      conversation.pop();
    }

    if (conversation.length === 0) return;

    syncConversationMessages(conversation);
    setIsLoading(true);

    try {
      const geminiText = await sendMessageToGemini(conversation);
      const finalConversation: Message[] = [
        ...conversation,
        {
          id: `${Date.now()}-gemini`,
          text: geminiText,
          sender: 'gemini',
          timestamp: Date.now(),
        },
      ];
      syncConversationMessages(finalConversation);
    } catch (error: unknown) {
      console.error('Gemini retry failed:', error);
      const finalConversation: Message[] = [
        ...conversation,
        {
          id: `${Date.now()}-gemini-error`,
          text: getUserErrorMessage(error),
          sender: 'gemini',
          isError: true,
          timestamp: Date.now(),
        },
      ];
      syncConversationMessages(finalConversation);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, syncConversationMessages]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    saveActiveConversationId(null);
  }, []);

  const handleSelectConversation = useCallback(
    (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (conv) {
        setActiveConversationId(id);
        setMessages(conv.messages);
        setInput('');
        saveActiveConversationId(id);
      }
    },
    [conversations],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      saveAllConversations(updated);

      if (activeConversationId === id) {
        if (updated.length > 0) {
          setActiveConversationId(updated[0].id);
          setMessages(updated[0].messages);
          saveActiveConversationId(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    },
    [activeConversationId, conversations, handleNewChat],
  );

  const handleClearAllConversations = useCallback(() => {
    setConversations([]);
    saveAllConversations([]);
    handleNewChat();
    setIsDrawerOpen(false);
  }, [handleNewChat]);

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      saveThemePreference(next);
      return next;
    });
  }, []);

  const handleSelectPrompt = useCallback(
    (promptText: string) => {
      handleSend(promptText);
    },
    [handleSend],
  );

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

      return (
        <MessageBubble
          message={item}
          isLatestGemini={isLatestGemini}
          isLoading={isLoading}
          onRegenerate={handleRegenerate}
        />
      );
    },
    [messages.length, isLoading, handleRegenerate],
  );

  const listFooterComponent = useMemo(() => {
    if (!isLoading) return null;
    return <TypingIndicator />;
  }, [isLoading]);

  const listEmptyComponent = useMemo(() => {
    return <EmptyChat onSelectPrompt={handleSelectPrompt} />;
  }, [handleSelectPrompt]);

  const activeConversationTitle = useMemo(() => {
    if (!activeConversationId) return undefined;
    return conversations.find((c) => c.id === activeConversationId)?.title;
  }, [activeConversationId, conversations]);

  return (
    <SafeAreaProvider>
      <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <ChatHeader
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onNewChat={handleNewChat}
            conversationTitle={activeConversationTitle}
            isNewChat={!activeConversationId && messages.length === 0}
          />

          {/* High-Performance FlatList without layout loop warnings */}
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={
              messages.length === 0
                ? { flexGrow: 1 }
                : { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }
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

          {/* Floating Scroll to Bottom Action Button */}
          <ScrollToBottomButton
            visible={showScrollBottom}
            onPress={scrollToLatest}
          />

          {/* Chat Input */}
          <ChatInput
            input={input}
            onChangeText={setInput}
            onSend={() => handleSend()}
            isLoading={isLoading}
            isDark={isDark}
          />

          {/* Navigation & History Drawer */}
          <HistoryDrawer
            visible={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
            onClearAll={handleClearAllConversations}
            isDark={isDark}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaProvider>
  );
}
