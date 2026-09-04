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
  loadSavedApiKey,
  saveApiKeyPreference,
  generateConversationTitle,
  clearAllLocalData,
} from '../services/storage';

import { getSavedSession } from '../services/authService';

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

type GeminiErrorKind =
  | 'configuration'
  | 'empty-response'
  | 'http'
  | 'network'
  | 'response'
  | 'timeout'
  | 'rate-limit'
  | 'unauthorized';

export class GeminiRequestError extends Error {
  readonly kind: GeminiErrorKind;
  readonly status?: number;
  readonly statusText?: string;
  readonly apiMessage?: string;

  constructor(
    kind: GeminiErrorKind,
    status?: number,
    statusText?: string,
    apiMessage?: string
  ) {
    let msg = `Gemini Request Failed (${kind})`;
    if (status) msg += ` [HTTP ${status}]`;
    if (statusText) msg += ` ${statusText}`;
    if (apiMessage) msg += `: ${apiMessage}`;
    super(msg);

    this.kind = kind;
    this.status = status;
    this.statusText = statusText;
    this.apiMessage = apiMessage;
  }
}

let runtimeCustomApiKey: string | null = null;

export function setRuntimeApiKey(key: string | null): void {
  runtimeCustomApiKey = key && key.trim() ? key.trim() : null;
}

export function getEffectiveApiKey(): string {
  if (runtimeCustomApiKey) return runtimeCustomApiKey;
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return envKey ? envKey.trim() : '';
}

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
export const GEMINI_MODEL = 'gemini-2.0-flash';
export const GEMINI_MODEL_FALLBACKS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
export const API_KEY_PLACEHOLDER = 'YOUR_GEMINI_API_KEY';
const MAX_CONVERSATION_MESSAGES = 12;
const GEMINI_CONFIGURATION_MESSAGE =
  'Gemini API key is not configured. Enter a valid API key in Settings or add EXPO_PUBLIC_GEMINI_API_KEY to your environment.';

export const STUDY_ASSISTANT_SYSTEM_PROMPT = `You are an expert AI Study Assistant designed to help students, learners, researchers, and professionals with ANY educational, academic, study, exam, or research topic across ALL fields of study.

### CORE OPERATING RULE: BROAD EDUCATIONAL & STUDY SCOPE
1. INTENT EVALUATION:
   Determine the user's intent. You MUST assist with ANY request that is genuinely related to learning, education, studying, academics, school/college/university courses, professional qualifications, exams, research papers, writing, problem-solving, coding, or skill development.

2. SUPPORT ALL SUBJECTS & FIELDS (Do NOT restrict by subject list):
   - You MUST help with ANY academic or educational subject, including Mathematics, Physics, Chemistry, Biology, Medicine, Engineering, Computer Science, Programming, AI/ML, Business, Economics, Accounting, Finance, Law, History, Geography, Psychology, Sociology, Literature, Languages, Arts, Architecture, Education, Research, Academic writing, and any other school, college, university, or professional subject.
   - The restriction is strictly based on the INTENT of the user's question, NOT on a fixed subject list. Support new, unlisted, and custom subjects automatically.

3. NON-EDUCATIONAL / UNRELATED REQUESTS:
   If a user asks a question that is clearly UNRELATED to learning, education, studying, academics, exams, assignments, or research (for example: weather updates, celebrity gossip, casual funny stories, restaurant recommendations, movies/entertainment advice, etc.), you MUST respond naturally with:
   "I'm your AI Study Assistant, so I can help with learning, education, exams, assignments, research, and study-related questions. Please ask me something you'd like to learn."

4. EXCELLENCE & CLARITY:
   For all study-related questions, provide thorough, accurate, step-by-step responses formatted with clear Markdown.`;

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
      parts.push({ text: `Please analyze this attached document "${message.fileName || 'file'}" in detail and provide a comprehensive explanation.` });
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
  completedAt: number,
  modelName: string,
) {
  const ttfb = responseReceivedAt - fetchStartedAt;
  const totalDuration = completedAt - startedAt;
  console.log(
    `[Gemini Timing] Model: ${modelName} | TTFB: ${ttfb}ms | Total: ${totalDuration}ms`,
  );
}

export function getUserErrorMessage(error: unknown): string {
  if (error instanceof GeminiRequestError) {
    if (error.kind === 'configuration') return 'AI service configuration is unavailable. Please check your API configuration.';
    if (error.kind === 'rate-limit' || error.status === 429) return 'AI is temporarily busy. Please try again in a moment.';
    if (error.kind === 'unauthorized' || error.status === 401 || error.status === 403) {
      return 'AI service authorization failed. Please check the API configuration.';
    }
    if (error.status === 400) return 'The AI request could not be processed. Please try again.';
    if (error.kind === 'network') return 'Unable to connect to the AI service. Check your internet connection.';
    if (error.status && error.status >= 500) return 'The AI service is temporarily unavailable. Please try again later.';
    if (error.kind === 'timeout') return 'The AI request timed out. Please try again.';
    if (error.kind === 'empty-response') return 'The AI returned an empty response. Please try again.';
  }

  if (error instanceof Error) {
    const msg = error.message || '';
    if (msg.includes('429')) return 'AI is temporarily busy. Please try again in a moment.';
    if (msg.includes('401') || msg.includes('403')) return 'AI service authorization failed. Please check the API configuration.';
    if (msg.includes('400')) return 'The AI request could not be processed. Please try again.';
    if (msg.includes('Network') || msg.includes('fetch')) return 'Unable to connect to the AI service. Check your internet connection.';
  }

  return 'Something went wrong while generating this content. Please try again.';
}

export async function sendMessageToGemini(
  conversation: Message[],
  outerSignal?: AbortSignal,
): Promise<string> {
  const apiKey = getEffectiveApiKey();
  if (!apiKey || apiKey === API_KEY_PLACEHOLDER) {
    throw new GeminiRequestError('configuration');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  if (outerSignal) {
    outerSignal.addEventListener('abort', () => controller.abort());
  }

  const recentConversation = getRecentConversation(conversation);
  const requestBody = JSON.stringify({
    system_instruction: {
      parts: [{ text: STUDY_ASSISTANT_SYSTEM_PROMPT }],
    },
    contents: toGeminiContents(recentConversation),
  });
  let lastError: any = null;

  try {
    for (const modelName of GEMINI_MODEL_FALLBACKS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
          let errKind: GeminiErrorKind = 'http';
          if (response.status === 401 || response.status === 403) errKind = 'unauthorized';
          else if (response.status === 429) errKind = 'rate-limit';
          throw new GeminiRequestError(errKind, response.status);
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
  userApiKey: string;
  totalMessagesCount: number;
  toggleTheme: () => void;
  updateApiKey: (key: string) => Promise<void>;
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
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Initialize storage
  useEffect(() => {
    async function initApp() {
      const session = await getSavedSession();
      const studentId = session?.studentId;

      const [savedTheme, savedConversations, savedActiveId, savedFavorites, savedKey] = await Promise.all([
        loadSavedTheme(),
        loadSavedConversations(studentId),
        loadActiveConversationId(studentId),
        loadSavedFavorites(studentId),
        loadSavedApiKey(studentId),
      ]);

      if (savedTheme !== null) {
        setIsDark(savedTheme);
      }

      if (savedKey) {
        setUserApiKey(savedKey);
        setRuntimeApiKey(savedKey);
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
    async (nextMessages: Message[], convId?: string) => {
      setMessages(nextMessages);
      const targetId = convId || activeConversationId;
      const session = await getSavedSession();
      const studentId = session?.studentId;

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
        await saveAllConversations(updated, studentId);
        await saveActiveConversationId(newId, studentId);
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
        await saveAllConversations(updated, studentId);
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
      imageAttachment?: { uri: string; base64: string; mimeType: string; name?: string; width?: number; height?: number; extractedText?: string } | null
    ) => {
      let text = textToSend.trim();
      if (!text && imageAttachment?.extractedText) {
        text = `Please review and analyze the attached document "${imageAttachment.name || 'document'}":\n\n"""\n${imageAttachment.extractedText.slice(0, 4000)}\n"""`;
      } else if (!text && imageAttachment?.name) {
        text = `Please review and analyze the attached document "${imageAttachment.name}".`;
      }

      if ((!text && !imageAttachment) || isLoading) return;

      const userMessage: Message = {
        id: `${Date.now()}-user`,
        text,
        sender: 'user',
        imageUri: imageAttachment?.uri,
        imageBase64: imageAttachment?.base64,
        mimeType: imageAttachment?.mimeType,
        fileName: imageAttachment?.name,
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
    getSavedSession().then((session) => {
      saveAllConversations(cleanConversations, session?.studentId);
      saveActiveConversationId(newId, session?.studentId);
    });
    return newId;
  }, [conversations]);

  const startNewChatWithPrompt = useCallback(
    async (prompt: string): Promise<string> => {
      const session = await getSavedSession();
      const studentId = session?.studentId;
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
      await saveAllConversations(updated, studentId);
      await saveActiveConversationId(newId, studentId);

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
        await saveAllConversations(updatedFinal, studentId);
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
        await saveAllConversations(updatedFinal, studentId);
      } finally {
        setIsLoading(false);
      }

      return newId;
    },
    [conversations],
  );

  const handleSelectConversation = useCallback(
    async (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (conv) {
        setActiveConversationId(id);
        setMessages(conv.messages);
        const session = await getSavedSession();
        await saveActiveConversationId(id, session?.studentId);
      }
    },
    [conversations],
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      const session = await getSavedSession();
      const studentId = session?.studentId;
      await saveAllConversations(updated, studentId);

      if (activeConversationId === id) {
        if (updated.length > 0) {
          setActiveConversationId(updated[0].id);
          setMessages(updated[0].messages);
          await saveActiveConversationId(updated[0].id, studentId);
        } else {
          setActiveConversationId(null);
          setMessages([]);
          await saveActiveConversationId(null, studentId);
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
        getSavedSession().then((session) => {
          saveAllFavorites(updated, session?.studentId);
        });
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

  const updateApiKey = useCallback(async (key: string) => {
    const session = await getSavedSession();
    const cleanKey = key ? key.trim() : '';
    setUserApiKey(cleanKey);
    setRuntimeApiKey(cleanKey);
    await saveApiKeyPreference(cleanKey, session?.studentId);
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
        userApiKey,
        totalMessagesCount,
        toggleTheme,
        updateApiKey,
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
