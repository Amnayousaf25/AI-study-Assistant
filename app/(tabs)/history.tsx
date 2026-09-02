import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '../../src/context/ChatContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import {
  PlusIcon,
  SearchIcon,
  ChatIcon,
  TrashIcon,
  ChevronRightIcon,
  ClockIcon,
} from '../../components/Icons';

function formatRelativeDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function HistoryTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const {
    conversations,
    activeConversationId,
    handleSelectConversation,
    handleNewChat,
    handleDeleteConversation,
    handleClearAllConversations,
    isDark,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const confirmDelete = useCallback(
    (id: string, title: string) => {
      if (Platform.OS === 'web') {
        if (window.confirm(`Delete conversation "${title}"?`)) {
          handleDeleteConversation(id);
        }
        return;
      }

      Alert.alert(
        'Delete Conversation',
        `Are you sure you want to delete "${title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteConversation(id) },
        ]
      );
    },
    [handleDeleteConversation],
  );

  const confirmClearAll = useCallback(() => {
    if (Platform.OS === 'web') {
      if (window.confirm('Clear all conversation history? This cannot be undone.')) {
        handleClearAllConversations();
      }
      return;
    }

    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all saved conversations? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: handleClearAllConversations },
      ]
    );
  }, [handleClearAllConversations]);

  const onSelect = useCallback(
    (id: string) => {
      handleSelectConversation(id);
      router.push('/(tabs)');
    },
    [handleSelectConversation, router],
  );

  const onNewChat = useCallback(() => {
    handleNewChat();
    router.push('/(tabs)');
  }, [handleNewChat, router]);

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-3 shadow-xs"
      >
        <View className="w-full max-w-4xl mx-auto flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5 gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 items-center justify-center">
              <ClockIcon size={20} color="#6366f1" />
            </View>
            <View>
              <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
                Chat History
              </Text>
              <Text className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2 gap-2">
            {!isWideScreen && (
              <Pressable
                onPress={onNewChat}
                className="flex-row items-center bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 px-3 py-2 rounded-xl active:bg-indigo-100 dark:active:bg-indigo-900"
                accessibilityRole="button"
                accessibilityLabel="New Conversation"
                hitSlop={6}
              >
                <PlusIcon size={14} color="#6366f1" />
                <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">
                  New
                </Text>
              </Pressable>
            )}

            {conversations.length > 0 && (
              <Pressable
                onPress={confirmClearAll}
                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 active:bg-rose-100"
                accessibilityRole="button"
                accessibilityLabel="Clear all history"
                hitSlop={6}
              >
                <TrashIcon size={14} color="#f43f5e" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Search Bar */}
        {conversations.length > 1 && (
          <View className="w-full max-w-4xl mx-auto mt-3">
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800/90 rounded-2xl px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700/60">
              <SearchIcon size={16} color={isDark ? '#64748b' : '#94a3b8'} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search conversations..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                className="flex-1 ml-2 text-sm text-slate-900 dark:text-slate-100 p-0"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <Text className="text-xs font-bold text-slate-400 dark:text-slate-500">Clear</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      {/* History List Centered Column */}
      <View className="flex-1 w-full max-w-4xl mx-auto self-center">
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: isWideScreen ? 24 : 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8">
              <View className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 items-center justify-center mb-4">
                <ClockIcon size={26} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-slate-800 dark:text-slate-200 text-center">
                {searchQuery ? 'No matching conversations' : 'No history yet'}
              </Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1.5 max-w-[240px] leading-5">
                {searchQuery
                  ? 'Try searching with different keywords.'
                  : 'Start a new conversation with Gemini to see your chats recorded here.'}
              </Text>
              {!searchQuery && (
                <Pressable
                  onPress={onNewChat}
                  className="mt-5 bg-indigo-600 active:bg-indigo-700 px-5 py-2.5 rounded-2xl shadow-sm shadow-indigo-500/20"
                >
                  <Text className="text-xs font-bold text-white">Start New Chat</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isActive = item.id === activeConversationId;
            const lastMsg = item.messages[item.messages.length - 1];

            return (
              <Pressable
                onPress={() => onSelect(item.id)}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 my-1.5 flex-row items-center justify-between active:scale-[0.99] transition-all shadow-xs ${
                  isActive
                    ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-slate-200/80 dark:border-slate-800/80'
                }`}
                accessibilityRole="button"
                accessibilityLabel={`Open conversation ${item.title}`}
              >
                <View className="flex-row items-center flex-1 mr-3 space-x-3 gap-3">
                  <View
                    className={`w-10 h-10 rounded-2xl items-center justify-center ${
                      isActive
                        ? 'bg-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <ChatIcon size={18} color={isActive ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'} />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text
                        numberOfLines={1}
                        className={`text-sm font-bold flex-1 mr-2 ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {formatRelativeDate(item.updatedAt)}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={1}
                      className="text-xs text-slate-400 dark:text-slate-400 mt-1"
                    >
                      {lastMsg
                        ? `${lastMsg.sender === 'user' ? 'You: ' : 'Gemini: '}${lastMsg.text || 'Image attached'}`
                        : `${item.messages.length} messages`}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row items-center space-x-1.5 gap-1.5">
                  <Pressable
                    onPress={() => confirmDelete(item.id, item.title)}
                    className="w-8 h-8 rounded-xl items-center justify-center active:bg-rose-100 dark:active:bg-rose-950/60"
                    accessibilityRole="button"
                    accessibilityLabel="Delete conversation"
                    hitSlop={6}
                  >
                    <TrashIcon size={14} color="#94a3b8" />
                  </Pressable>
                  <ChevronRightIcon size={14} color="#cbd5e1" />
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}
