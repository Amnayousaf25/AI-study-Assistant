import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useChat } from '../../src/context/ChatContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import {
  StarFilledIcon,
  StarIcon,
  SearchIcon,
  CopyIcon,
  CheckIcon,
  ChatIcon,
  TrashIcon,
  ExpandIcon,
} from '../../components/Icons';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { ImageViewerModal } from '../../components/ImageViewerModal';

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

export default function FavoritesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const { favorites, removeFavorite, handleSelectConversation, isDark } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    const q = searchQuery.toLowerCase();
    return favorites.filter(
      (f) =>
        f.text.toLowerCase().includes(q) ||
        f.conversationTitle.toLowerCase().includes(q),
    );
  }, [favorites, searchQuery]);

  const handleCopy = useCallback(async (id: string, text: string) => {
    try {
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(text);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleOpenConversation = useCallback(
    (conversationId: string) => {
      if (conversationId && conversationId !== 'unknown') {
        handleSelectConversation(conversationId);
        router.push('/(tabs)');
      }
    },
    [handleSelectConversation, router],
  );

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-3 shadow-xs"
      >
        <View className="w-full max-w-4xl mx-auto flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5 gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 items-center justify-center">
              <StarFilledIcon size={20} color="#eab308" />
            </View>
            <View>
              <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
                Favorites
              </Text>
              <Text className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                {favorites.length} saved response{favorites.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}
        {favorites.length > 1 && (
          <View className="w-full max-w-4xl mx-auto mt-3">
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800/90 rounded-2xl px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700/60">
              <SearchIcon size={16} color={isDark ? '#64748b' : '#94a3b8'} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search saved responses..."
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

      {/* Favorites List Centered Column */}
      <View className="flex-1 w-full max-w-4xl mx-auto self-center">
        <FlatList
          data={filteredFavorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: isWideScreen ? 24 : 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8">
              <View className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 items-center justify-center mb-4">
                <StarIcon size={26} color="#eab308" />
              </View>
              <Text className="text-base font-bold text-slate-800 dark:text-slate-200 text-center">
                {searchQuery ? 'No matching saved items' : 'No favorites yet'}
              </Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1.5 max-w-[250px] leading-5">
                {searchQuery
                  ? 'Try searching with different keywords.'
                  : 'Tap the star/save icon on any AI response in your chats to bookmark it here.'}
              </Text>
              {!searchQuery && (
                <Pressable
                  onPress={() => router.push('/(tabs)')}
                  className="mt-5 bg-indigo-600 active:bg-indigo-700 px-5 py-2.5 rounded-2xl shadow-sm shadow-indigo-500/20"
                >
                  <Text className="text-xs font-bold text-white">Go to Chat</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isCopied = copiedId === item.id;
            const hasImage = Boolean(item.imageUri);

            return (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 my-2 shadow-xs">
                {/* Card Header: Source title & Time */}
                <View className="flex-row items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <View className="flex-row items-center flex-1 mr-2 space-x-1.5 gap-1.5">
                    <View className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center">
                      <ChatIcon size={12} color="#6366f1" />
                    </View>
                    <Text
                      numberOfLines={1}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1"
                    >
                      {item.conversationTitle}
                    </Text>
                  </View>

                  <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {formatRelativeDate(item.timestamp)}
                  </Text>
                </View>

                {/* Attached Image if present */}
                {hasImage && item.imageUri && (
                  <Pressable
                    onPress={() => setPreviewImageUri(item.imageUri!)}
                    className="mb-2.5 rounded-2xl overflow-hidden relative max-w-[560px]"
                  >
                    <Image
                      source={{ uri: item.imageUri }}
                      style={{
                        width: '100%',
                        height: isWideScreen ? 220 : 160,
                      }}
                      className="rounded-2xl"
                      resizeMode="cover"
                    />
                    <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-lg flex-row items-center">
                      <ExpandIcon size={10} color="#ffffff" />
                      <Text className="text-[10px] font-semibold text-white ml-1">View</Text>
                    </View>
                  </Pressable>
                )}

                {/* Rendered content */}
                {Boolean(item.text && item.text.trim()) && (
                  <View className="my-1">
                    <MarkdownRenderer content={item.text} isUser={false} />
                  </View>
                )}

                {/* Action Toolbar */}
                <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <Pressable
                    onPress={() => handleOpenConversation(item.conversationId)}
                    className="flex-row items-center px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 active:bg-indigo-100 dark:active:bg-indigo-900"
                    accessibilityRole="button"
                    accessibilityLabel="Open related conversation"
                  >
                    <ChatIcon size={12} color="#6366f1" />
                    <Text className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">
                      Open Chat
                    </Text>
                  </Pressable>

                  <View className="flex-row items-center space-x-2 gap-2">
                    <Pressable
                      onPress={() => handleCopy(item.id, item.text)}
                      className="flex-row items-center px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700"
                      accessibilityRole="button"
                      accessibilityLabel={isCopied ? 'Copied' : 'Copy'}
                      hitSlop={6}
                    >
                      {isCopied ? (
                        <>
                          <CheckIcon size={12} color="#10b981" />
                          <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ml-1">
                            Copied
                          </Text>
                        </>
                      ) : (
                        <>
                          <CopyIcon size={12} color="#64748b" />
                          <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300 ml-1">
                            Copy
                          </Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => removeFavorite(item.id)}
                      className="w-8 h-8 rounded-xl items-center justify-center bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 active:bg-rose-100"
                      accessibilityRole="button"
                      accessibilityLabel="Remove from favorites"
                      hitSlop={6}
                    >
                      <TrashIcon size={14} color="#f43f5e" />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Fullscreen Image Inspection Modal */}
      <ImageViewerModal
        visible={Boolean(previewImageUri)}
        imageUri={previewImageUri}
        onClose={() => setPreviewImageUri(null)}
      />
    </View>
  );
}
