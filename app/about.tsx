import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '../src/context/ChatContext';
import { useResponsive } from '../src/hooks/useResponsive';
import { ArrowLeftIcon, SparklesIcon } from '../components/Icons';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const { isDark } = useChat();

  const TECH_STACK = [
    { label: 'Framework', value: 'Expo SDK 54 (~54.0.36)' },
    { label: 'Core Engine', value: 'React Native 0.81.5' },
    { label: 'UI Runtime', value: 'React 19.1.0' },
    { label: 'Styling', value: 'NativeWind v4.2 / Tailwind CSS' },
    { label: 'Routing', value: 'Expo Router v6 (~6.0.24)' },
    { label: 'Media Vision', value: 'expo-image-picker (~16.0.x)' },
    { label: 'AI Model', value: 'Google Gemini 3.5 Flash Lite' },
    { label: 'Local Persistence', value: 'AsyncStorage 2.2.0' },
    { label: 'Animations', value: 'React Native Reanimated ~4.1.1' },
  ];

  const FEATURES = [
    '✨ Full Multimodal AI: text + camera and gallery visual analysis',
    '📱 4-tab native navigation & responsive desktop sidebar',
    '⭐ Save and bookmark important AI responses with 1-tap recall',
    '🎨 Production NativeWind styling with seamless light & dark themes',
    '⚡ Zero-lag FlatList virtualization with memoized component rendering',
    '💾 Multi-conversation management with persistent offline storage',
    '💻 Fenced syntax code blocks with standalone copy-code button',
    '🛡️ Client-side API key protection with zero credential leakage',
  ];

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
            About & Architecture
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
          {/* Hero Banner */}
          <View className="bg-indigo-600 rounded-3xl p-6 mb-5 shadow-lg shadow-indigo-500/20">
            <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mb-3">
              <SparklesIcon size={24} color="#ffffff" />
            </View>
            <Text className="text-xl font-bold text-white tracking-tight">
              Gemini Mobile AI Assistant
            </Text>
            <Text className="text-xs text-indigo-100 mt-1 leading-5">
              A flagship multimodal AI assistant designed for high performance, modular architecture, and responsiveness across all devices.
            </Text>
          </View>

          {/* Tech Stack Table */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 mb-5 shadow-xs">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Technology Stack
            </Text>
            <View className="space-y-2.5 gap-2.5">
              {TECH_STACK.map((item, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0 pb-1.5"
                >
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {item.label}
                  </Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Features Highlights */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Core Architecture Highlights
            </Text>
            <View className="space-y-2.5 gap-2.5">
              {FEATURES.map((feat, index) => (
                <Text
                  key={index}
                  className="text-xs text-slate-700 dark:text-slate-300 leading-5"
                >
                  {feat}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
