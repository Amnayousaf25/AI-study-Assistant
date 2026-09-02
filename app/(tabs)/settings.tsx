import React, { useCallback } from 'react';
import { View, Text, Pressable, Switch, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useChat,
  GEMINI_MODEL,
  GEMINI_API_KEY,
  API_KEY_PLACEHOLDER,
} from '../../src/context/ChatContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import {
  SunIcon,
  MoonIcon,
  InfoIcon,
  HelpIcon,
  UserCircleIcon,
  ChevronRightIcon,
  TrashIcon,
  SettingsIcon,
  StarFilledIcon,
  ChatIcon,
} from '../../components/Icons';

export default function SettingsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const {
    isDark,
    toggleTheme,
    conversations,
    favorites,
    totalMessagesCount,
    handleClearAllConversations,
  } = useChat();

  const isConfigured = Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== API_KEY_PLACEHOLDER);

  const confirmResetData = useCallback(() => {
    if (Platform.OS === 'web') {
      if (window.confirm('Reset all conversation history and clear local data?')) {
        handleClearAllConversations();
      }
      return;
    }

    Alert.alert(
      'Reset Data',
      'This will delete all saved chats from your device storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: handleClearAllConversations },
      ]
    );
  }, [handleClearAllConversations]);

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-3 shadow-xs"
      >
        <View className="w-full max-w-3xl mx-auto flex-row items-center space-x-2.5 gap-2.5">
          <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 items-center justify-center">
            <SettingsIcon size={20} color="#6366f1" />
          </View>
          <View>
            <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
              Settings & Storage
            </Text>
            <Text className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
              Preferences & AI configuration
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: isWideScreen ? 24 : 16,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-3xl mx-auto self-center space-y-5 gap-5">
          {/* Storage & Usage Metrics */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-xs">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Storage & Stats
            </Text>
            <View className="flex-row items-center justify-around py-2">
              <View className="items-center">
                <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 items-center justify-center mb-1">
                  <ChatIcon size={18} color="#6366f1" />
                </View>
                <Text className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {conversations.length}
                </Text>
                <Text className="text-[11px] text-slate-400">Chats</Text>
              </View>

              <View className="w-px h-10 bg-slate-200 dark:bg-slate-800" />

              <View className="items-center">
                <View className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 items-center justify-center mb-1">
                  <Text className="text-sm font-bold text-emerald-600">💬</Text>
                </View>
                <Text className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {totalMessagesCount}
                </Text>
                <Text className="text-[11px] text-slate-400">Messages</Text>
              </View>

              <View className="w-px h-10 bg-slate-200 dark:bg-slate-800" />

              <View className="items-center">
                <View className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/70 items-center justify-center mb-1">
                  <StarFilledIcon size={18} color="#eab308" />
                </View>
                <Text className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {favorites.length}
                </Text>
                <Text className="text-[11px] text-slate-400">Saved</Text>
              </View>
            </View>
          </View>

          {/* Appearance Section */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-xs">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Appearance
            </Text>

            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center space-x-3 gap-3">
                <View className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center">
                  {isDark ? <MoonIcon size={18} /> : <SunIcon size={18} />}
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Dark Appearance
                  </Text>
                  <Text className="text-xs text-slate-400 dark:text-slate-500">
                    {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* AI Engine Status */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-xs">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              AI Engine Diagnostics
            </Text>

            <View className="space-y-2.5 gap-2.5">
              <View className="flex-row items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Model</Text>
                <View className="bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-lg">
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {GEMINI_MODEL}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  API Key Status
                </Text>
                <View
                  className={`px-2 py-0.5 rounded-lg flex-row items-center ${
                    isConfigured
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <View
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      isConfigured
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isConfigured ? 'Active & Ready' : 'Key Missing'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Multimodal Input
                </Text>
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Text + Camera / Gallery
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Links / Help */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-2 shadow-xs">
            <Pressable
              onPress={() => router.push('/profile')}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-slate-50 dark:active:bg-slate-800/60"
              accessibilityRole="button"
              accessibilityLabel="Workspace Profile"
            >
              <View className="flex-row items-center space-x-3 gap-3">
                <View className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 items-center justify-center">
                  <UserCircleIcon size={18} color="#6366f1" />
                </View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Workspace Profile
                </Text>
              </View>
              <ChevronRightIcon size={14} color="#94a3b8" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/help')}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-slate-50 dark:active:bg-slate-800/60"
              accessibilityRole="button"
              accessibilityLabel="Help and FAQs"
            >
              <View className="flex-row items-center space-x-3 gap-3">
                <View className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 items-center justify-center">
                  <HelpIcon size={18} color="#6366f1" />
                </View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Help & Documentation
                </Text>
              </View>
              <ChevronRightIcon size={14} color="#94a3b8" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/about')}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-slate-50 dark:active:bg-slate-800/60"
              accessibilityRole="button"
              accessibilityLabel="About App"
            >
              <View className="flex-row items-center space-x-3 gap-3">
                <View className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 items-center justify-center">
                  <InfoIcon size={18} color="#6366f1" />
                </View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  About & Architecture
                </Text>
              </View>
              <ChevronRightIcon size={14} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Danger Zone: Reset Data */}
          <Pressable
            onPress={confirmResetData}
            className="flex-row items-center justify-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-4 rounded-3xl active:bg-rose-100 dark:active:bg-rose-900/60"
            accessibilityRole="button"
            accessibilityLabel="Reset all data"
          >
            <TrashIcon size={16} color="#f43f5e" />
            <Text className="text-sm font-bold text-rose-600 dark:text-rose-400 ml-2">
              Reset Local Storage & History
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
