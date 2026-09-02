import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Conversation } from '../src/services/storage';
import {
  CloseIcon,
  PlusIcon,
  SearchIcon,
  ChatIcon,
  TrashIcon,
  SparklesIcon,
} from './Icons';

interface HistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  isDark: boolean;
}

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

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  visible,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onClearAll,
  isDark,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const confirmDelete = (id: string, title: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete conversation "${title}"?`)) {
        onDeleteConversation(id);
      }
      return;
    }

    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteConversation(id) },
      ]
    );
  };

  const confirmClearAll = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Clear all conversation history? This cannot be undone.')) {
        onClearAll();
      }
      return;
    }

    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all saved conversations?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearAll },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 flex-row">
        {/* Main Drawer Panel */}
        <View
          style={{
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          }}
          className="w-[85%] max-w-[340px] h-full bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200/80 dark:border-slate-800 flex-col"
        >
          {/* Header */}
          <View className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2 gap-2">
              <View className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center">
                <SparklesIcon size={16} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
                Chat History
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
              accessibilityLabel="Close drawer"
              hitSlop={8}
            >
              <CloseIcon size={14} color={isDark ? '#cbd5e1' : '#64748b'} />
            </Pressable>
          </View>

          {/* New Chat Button */}
          <View className="p-3">
            <Pressable
              onPress={() => {
                onNewChat();
                onClose();
              }}
              className="w-full flex-row items-center justify-center py-2.5 px-4 rounded-xl bg-indigo-600 active:bg-indigo-700 shadow-xs"
              accessibilityLabel="Start a new chat"
            >
              <PlusIcon size={16} color="#ffffff" />
              <Text className="text-sm font-semibold text-white ml-2">New Chat</Text>
            </Pressable>
          </View>

          {/* Search Bar */}
          {conversations.length > 3 && (
            <View className="px-3 pb-2">
              <View className="flex-row items-center bg-slate-100 dark:bg-slate-800/90 rounded-xl px-3 py-1.5 border border-slate-200/80 dark:border-slate-700/60">
                <SearchIcon size={14} color={isDark ? '#64748b' : '#94a3b8'} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search conversations..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="flex-1 ml-2 text-xs text-slate-900 dark:text-slate-100 p-0"
                />
              </View>
            </View>
          )}

          {/* Conversation List */}
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center p-6">
                <Text className="text-2xl mb-2">💬</Text>
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
                  No conversations
                </Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1">
                  {searchQuery ? 'No chats match your search' : 'Start chatting to create history'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isActive = item.id === activeConversationId;

              return (
                <Pressable
                  onPress={() => {
                    onSelectConversation(item.id);
                    onClose();
                  }}
                  className={`flex-row items-center justify-between p-2.5 my-1 rounded-xl border ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60'
                      : 'bg-transparent border-transparent active:bg-slate-100 dark:active:bg-slate-800/60'
                  }`}
                      accessibilityLabel={`Open conversation: ${item.title}`}
                >
                  <View className="flex-row items-center flex-1 mr-2 space-x-2 gap-2">
                    <ChatIcon
                      size={14}
                      color={isActive ? '#6366f1' : isDark ? '#64748b' : '#94a3b8'}
                    />
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className={`text-xs font-semibold ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatRelativeDate(item.updatedAt)} • {item.messages.length} msg
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      confirmDelete(item.id, item.title);
                    }}
                    className="w-7 h-7 rounded-lg items-center justify-center active:bg-rose-100 dark:active:bg-rose-950/40"
                          accessibilityLabel="Delete this conversation"
                    hitSlop={6}
                  >
                    <TrashIcon size={13} color={isDark ? '#64748b' : '#94a3b8'} />
                  </Pressable>
                </Pressable>
              );
            }}
          />

          {/* Footer Bar */}
          <View className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
            {conversations.length > 0 && (
              <Pressable
                onPress={confirmClearAll}
                className="py-2 px-3 rounded-lg items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/30 mb-2"
                  accessibilityLabel="Clear all conversation history"
              >
                <Text className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  Clear All Conversations
                </Text>
              </Pressable>
            )}

            <View className="flex-row items-center justify-between px-1">
              <Text className="text-[11px] text-slate-400 dark:text-slate-500">
                Gemini 3.5 Flash Lite
              </Text>
              <Text className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                v1.0
              </Text>
            </View>
          </View>
        </View>

        {/* Backdrop clickable to close */}
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close backdrop" />
      </View>
    </Modal>
  );
};
