import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat, GEMINI_MODEL } from '../src/context/ChatContext';
import { useResponsive } from '../src/hooks/useResponsive';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  SettingsIcon,
  ChatIcon,
  ChevronRightIcon,
  SparklesIcon,
  StarFilledIcon,
} from '../components/Icons';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const { isDark, conversations, favorites, totalMessagesCount } = useChat();

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-3 shadow-xs"
      >
        <View className="w-full max-w-3xl mx-auto flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <ArrowLeftIcon size={18} color={isDark ? '#cbd5e1' : '#475569'} />
          </Pressable>

          <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
            Workspace Profile
          </Text>

          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: isWideScreen ? 24 : 16,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-3xl mx-auto self-center">
          {/* Workspace Identity Card */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 mb-5 shadow-xs items-center">
            <View className="w-20 h-20 rounded-full bg-indigo-600 items-center justify-center mb-3 shadow-md shadow-indigo-500/25">
              <UserCircleIcon size={44} color="#ffffff" />
            </View>

            <Text className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              Local Assistant Workspace
            </Text>
            <View className="flex-row items-center mt-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Connected & Ready
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View className="grid grid-cols-3 gap-3 flex-row mb-5">
            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 items-center">
              <Text className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {conversations.length}
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium mt-0.5">Sessions</Text>
            </View>

            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 items-center">
              <Text className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {totalMessagesCount}
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium mt-0.5">Messages</Text>
            </View>

            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 items-center">
              <Text className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {favorites.length}
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium mt-0.5">Saved</Text>
            </View>
          </View>

          {/* Details Section */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3 gap-3">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Environment & Runtime
            </Text>

            <View className="flex-row items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs text-slate-500 dark:text-slate-400">AI Model</Text>
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{GEMINI_MODEL}</Text>
            </View>

            <View className="flex-row items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs text-slate-500 dark:text-slate-400">Storage Engine</Text>
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">AsyncStorage v2</Text>
            </View>

            <View className="flex-row items-center justify-between py-1.5">
              <Text className="text-xs text-slate-500 dark:text-slate-400">Multimodal Vision</Text>
              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Supported (PNG/JPEG)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
