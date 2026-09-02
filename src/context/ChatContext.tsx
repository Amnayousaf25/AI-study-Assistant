import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Message } from '../../components/MessageBubble';
import {
  Conversation,
  FavoriteItem,
  loadSavedConversations,
  saveAllConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSavedFavorites,
  saveAllFavorites,
  loadSavedTheme,
  saveThemePreference,
  generateConversationTitle,
  clearAllLocalData,
} from '../services/storage';

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

type GeminiErrorKind = 'configuration' | 'empty-response' | 'http' | 'network' | 'response' | 'timeout';

export class GeminiRequestError extends Error {
  constructor(
    readonly kind: GeminiErrorKind,
    readonly status?: number,
  ) {
    super(kind);
  }
}

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
export const GEMINI_MODEL = 'gemini-3.6-flash';
export const GEMINI_MODEL_FALLBACKS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];
export const API_KEY_PLACEHOLDER = 'YOUR_GEMINI_API_KEY';
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
  return conversation.map((message) => {
    const parts: GeminiPart[] = [];

    let base64Data = message.imageBase64;
    let mimeType = message.mimeType || 'image/jpeg';

    if (!base64Data && message.imageUri && message.imageUri.startsWith('data:')) {
      const match = message.imageUri.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        const commaIdx = message.imageUri.indexOf(',');
        if (commaIdx !== -1) {
          base64Data = message.imageUri.slice(commaIdx + 1);
        }
      }
    }

    if (base64Data) {
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      base64Data = base64Data.replace(/[\r\n\s]/g, '');

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    if (message.text && message.text.trim()) {
      parts.push({ text: message.text });
    } else if (base64Data) {
      parts.push({ text: 'Please analyze this image in detail and describe what you see.' });
    } else {
      parts.push({ text: message.text || '' });
    }

    return {
      role: message.sender === 'user' ? 'user' : 'model',
      parts,
    };
  });
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

export function getUserErrorMessage(error: unknown): string {
  if (!(error instanceof GeminiRequestError)) return 'Sorry, something went wrong. Please try again.';

  if (error.kind === 'configuration') return GEMINI_CONFIGURATION_MESSAGE;
  if (error.kind === 'timeout') return 'AI response timed out. Please try again.';
  if (error.kind === 'empty-response') return 'The AI returned an empty response. Please try again.';
  if (error.kind === 'network') return 'Network error. Check your connection and try again.';
  if (error.kind === 'response') return 'Gemini returned an unexpected response. Please try again.';

  switch (error.status) {
    case 400:
      return 'Gemini rejected this request (HTTP 400). Please try again.';
    case 401:
      return 'Gemini API key is invalid or unauthorized (HTTP 401).';
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

export async function sendMessageToGemini(
  conversation: Message[],
  outerSignal?: AbortSignal,
): Promise<string> {
  if (!GEMINI_API_KEY?.trim() || GEMINI_API_KEY === API_KEY_PLACEHOLDER) {
    throw new GeminiRequestError('configuration');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  if (outerSignal) {
    outerSignal.addEventListener('abort', () => controller.abort());
  }

  const recentConversation = getRecentConversation(conversation);
  const requestBody = JSON.stringify({ contents: toGeminiContents(recentConversation) });
  let lastError: any = null;

  try {
    for (const modelName of GEMINI_MODEL_FALLBACKS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
          signal: controller.signal,
        });

        if (response.status === 404) {
          continue;
        }

        if (!response.ok) {
          throw new GeminiRequestError('http', response.status);
        }

        const responseData = (await response.json()) as unknown;
        const text = extractGeminiText(responseData);
        if (text) return text;
        throw new GeminiRequestError('empty-response');
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          throw new GeminiRequestError('timeout');
        }
        if (err instanceof GeminiRequestError && err.kind === 'http' && err.status !== 404) {
          throw err;
        }
        lastError = err;
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (lastError instanceof GeminiRequestError) throw lastError;
  throw new GeminiRequestError('network');
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | undefined;
  messages: Message[];
  favorites: FavoriteItem[];
  isLoading: boolean;
  isDark: boolean;
  totalMessagesCount: number;
  toggleTheme: () => void;
  handleSend: (
    textToSend: string,
    targetConversationId?: string,
    imageAttachment?: { uri: string; base64: string; mimeType: string; width?: number; height?: number } | null
  ) => Promise<void>;
  handleStopGeneration: () => void;
  handleRegenerate: () => Promise<void>;
  handleNewChat: () => string;
  startNewChatWithPrompt: (prompt: string) => Promise<string>;
  handleSelectConversation: (id: string) => void;
  handleDeleteConversation: (id: string) => void;
  handleClearAllConversations: () => void;
  toggleFavoriteMessage: (message: Message, conversationId?: string, conversationTitle?: string) => void;
  isMessageFavorited: (messageId: string) => boolean;
  removeFavorite: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Initialize storage
  useEffect(() => {
    async function initApp() {
      const [savedTheme, savedConversations, savedActiveId, savedFavorites] = await Promise.all([
        loadSavedTheme(),
        loadSavedConversations(),
        loadActiveConversationId(),
        loadSavedFavorites(),
      ]);

      if (savedTheme !== null) {
        setIsDark(savedTheme);
      }

      // Filter out empty conversation clutter on load
      const validConversations = savedConversations.filter((c) => c.messages && c.messages.length > 0);
      setConversations(validConversations);
      setFavorites(savedFavorites);

      if (savedActiveId && validConversations.some((c) => c.id === savedActiveId)) {
        const active = validConversations.find((c) => c.id === savedActiveId);
        setActiveConversationId(savedActiveId);
        setMessages(active?.messages ?? []);
      } else if (validConversations.length > 0) {
        setActiveConversationId(validConversations[0].id);
        setMessages(validConversations[0].messages);
      } else {
        const initialId = `${Date.now()}`;
        setActiveConversationId(initialId);
        setMessages([]);
      }
    }

    initApp();
  }, []);

  const totalMessagesCount = useMemo(() => {
    return conversations.reduce((total, c) => total + c.messages.length, 0);
  }, [conversations]);

  const syncConversationMessages = useCallback(
    (nextMessages: Message[], convId?: string) => {
      setMessages(nextMessages);
      const targetId = convId || activeConversationId;

      if (!targetId || !conversations.some((c) => c.id === targetId)) {
        const firstUserMsg = nextMessages.find((m) => m.sender === 'user');
        const title = firstUserMsg
          ? generateConversationTitle(firstUserMsg.text || 'Image Analysis')
          : 'New Conversation';
        const newId = targetId || `${Date.now()}`;
        const newConv: Conversation = {
          id: newId,
          title,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: nextMessages,
        };

        const updated = [newConv, ...conversations.filter((c) => c.id !== newId && c.messages.length > 0)];
        setConversations(updated);
        setActiveConversationId(newId);
        saveAllConversations(updated);
        saveActiveConversationId(newId);
      } else {
        const updated = conversations.map((c) => {
          if (c.id === targetId) {
            const firstUserMsg = nextMessages.find((m) => m.sender === 'user');
            const title =
              c.title === 'New Conversation' && firstUserMsg
                ? generateConversationTitle(firstUserMsg.text || 'Image Analysis')
                : c.title;
            return {
              ...c,
              title,
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

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const handleSend = useCallback(
    async (
      textToSend: string,
      targetConversationId?: string,
      imageAttachment?: { uri: string; base64: string; mimeType: string; width?: number; height?: number } | null
    ) => {
      const text = textToSend.trim();
      if ((!text && !imageAttachment) || isLoading) return;

      const userMessage: Message = {
        id: `${Date.now()}-user`,
        text,
        sender: 'user',
        imageUri: imageAttachment?.uri,
        imageBase64: imageAttachment?.base64,
        mimeType: imageAttachment?.mimeType,
        imageWidth: imageAttachment?.width,
        imageHeight: imageAttachment?.height,
        timestamp: Date.now(),
      };

      const targetId = targetConversationId || activeConversationId;
      const currentMessages =
        targetId && targetId === activeConversationId
          ? messages
          : (conversations.find((c) => c.id === targetId)?.messages ?? []);
      const nextConversation = [...currentMessages, userMessage];

      syncConversationMessages(nextConversation, targetId || undefined);
      setIsLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 25000);

      abortControllerRef.current = controller;

      try {
        const geminiText = await sendMessageToGemini(nextConversation, controller.signal);
        
        const finalConversation: Message[] = [
          ...nextConversation,
          {
            id: `${Date.now()}-gemini`,
            text: geminiText,
            sender: 'gemini',
            timestamp: Date.now(),
          },
        ];
        syncConversationMessages(finalConversation, targetId || undefined);
      } catch (error: unknown) {
        console.error('Gemini request failed:', error);
        const errText = controller.signal.aborted
          ? 'AI response timed out. Please tap Retry to try again.'
          : getUserErrorMessage(error);

        const finalConversation: Message[] = [
          ...nextConversation,
          {
            id: `${Date.now()}-gemini-error`,
            text: errText,
            sender: 'gemini',
            isError: true,
            timestamp: Date.now(),
          },
        ];
        syncConversationMessages(finalConversation, targetId || undefined);
      } finally {
        clearTimeout(timeoutId);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsLoading(false);
      }
    },
    [activeConversationId, conversations, isLoading, messages, syncConversationMessages],
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 25000);

    abortControllerRef.current = controller;

    try {
      const geminiText = await sendMessageToGemini(conversation, controller.signal);

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
      const errText = controller.signal.aborted
        ? 'AI response timed out. Please tap Retry to try again.'
        : getUserErrorMessage(error);

      const finalConversation: Message[] = [
        ...conversation,
        {
          id: `${Date.now()}-gemini-error`,
          text: errText,
          sender: 'gemini',
          isError: true,
          timestamp: Date.now(),
        },
      ];
      syncConversationMessages(finalConversation);
    } finally {
      clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  }, [isLoading, messages, syncConversationMessages]);

  const handleNewChat = useCallback((): string => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    // Filter out any 0-message ghost conversations
    const cleanConversations = conversations.filter((c) => c.messages.length > 0);
    const newId = `${Date.now()}`;

    setConversations(cleanConversations);
    setActiveConversationId(newId);
    setMessages([]);
    saveAllConversations(cleanConversations);
    saveActiveConversationId(newId);
    return newId;
  }, [conversations]);

  const startNewChatWithPrompt = useCallback(
    async (prompt: string): Promise<string> => {
      const newId = `${Date.now()}`;
      const userMessage: Message = {
        id: `${Date.now()}-user`,
        text: prompt,
        sender: 'user',
        timestamp: Date.now(),
      };
      const title = generateConversationTitle(prompt);
      const initialMessages = [userMessage];
      const newConv: Conversation = {
        id: newId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: initialMessages,
      };

      const updated = [newConv, ...conversations];
      setConversations(updated);
      setActiveConversationId(newId);
      setMessages(initialMessages);
      saveAllConversations(updated);
      saveActiveConversationId(newId);

      setIsLoading(true);
      try {
        const geminiText = await sendMessageToGemini(initialMessages);
        const finalMessages: Message[] = [
          ...initialMessages,
          {
            id: `${Date.now()}-gemini`,
            text: geminiText,
            sender: 'gemini',
            timestamp: Date.now(),
          },
        ];
        const updatedFinal = updated.map((c) =>
          c.id === newId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c
        );
        setConversations(updatedFinal);
        setMessages(finalMessages);
        saveAllConversations(updatedFinal);
      } catch (error: unknown) {
        console.error('Gemini request failed:', error);
        const finalMessages: Message[] = [
          ...initialMessages,
          {
            id: `${Date.now()}-gemini-error`,
            text: getUserErrorMessage(error),
            sender: 'gemini',
            isError: true,
            timestamp: Date.now(),
          },
        ];
        const updatedFinal = updated.map((c) =>
          c.id === newId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c
        );
        setConversations(updatedFinal);
        setMessages(finalMessages);
        saveAllConversations(updatedFinal);
      } finally {
        setIsLoading(false);
      }

      return newId;
    },
    [conversations],
  );

  const handleSelectConversation = useCallback(
    (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (conv) {
        setActiveConversationId(id);
        setMessages(conv.messages);
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
          setActiveConversationId(null);
          setMessages([]);
          saveActiveConversationId(null);
        }
      }
    },
    [activeConversationId, conversations],
  );

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId);
  }, [activeConversationId, conversations]);

  const toggleFavoriteMessage = useCallback(
    (message: Message, conversationId?: string, conversationTitle?: string) => {
      setFavorites((prev) => {
        const existingIndex = prev.findIndex((f) => f.messageId === message.id);
        let updated: FavoriteItem[];
        if (existingIndex >= 0) {
          updated = prev.filter((f) => f.messageId !== message.id);
        } else {
          const newItem: FavoriteItem = {
            id: `${Date.now()}-${message.id}`,
            messageId: message.id,
            conversationId: conversationId || activeConversationId || 'unknown',
            conversationTitle:
              conversationTitle ||
              activeConversation?.title ||
              generateConversationTitle(message.text || 'Image Analysis'),
            text: message.text,
            sender: message.sender,
            imageUri: message.imageUri,
            mimeType: message.mimeType,
            timestamp: message.timestamp || Date.now(),
          };
          updated = [newItem, ...prev];
        }
        saveAllFavorites(updated);
        return updated;
      });
    },
    [activeConversation, activeConversationId],
  );

  const isMessageFavorited = useCallback(
    (messageId: string): boolean => {
      return favorites.some((f) => f.messageId === messageId);
    },
    [favorites],
  );

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id && f.messageId !== id);
      saveAllFavorites(updated);
      return updated;
    });
  }, []);

  const handleClearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    saveAllConversations([]);
    saveActiveConversationId(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      saveThemePreference(next);
      return next;
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        favorites,
        isLoading,
        isDark,
        totalMessagesCount,
        toggleTheme,
        handleSend,
        handleStopGeneration,
        handleRegenerate,
        handleNewChat,
        startNewChatWithPrompt,
        handleSelectConversation,
        handleDeleteConversation,
        handleClearAllConversations,
        toggleFavoriteMessage,
        isMessageFavorited,
        removeFavorite,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
