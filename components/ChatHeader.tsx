import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MenuIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  SettingsIcon,
} from './Icons';

export interface ChatHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onNewChat: () => void;
  onOpenDrawer?: () => void;
  conversationTitle?: string;
  isNewChat: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isDark,
  onToggleTheme,
  onNewChat,
  onOpenDrawer,
  conversationTitle,
  isNewChat,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleMenuPress = () => {
    if (onOpenDrawer) {
      onOpenDrawer();
    } else {
      router.push('/history');
    }
  };

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 12) }}
      className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-3 shadow-xs"
    >
      <View className="flex-row items-center justify-between">
        {/* Left: History / Menu Button */}
        <Pressable
          onPress={handleMenuPress}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700/80"
          accessibilityLabel="Open conversation history"
          hitSlop={8}
        >
          <MenuIcon size={18} color={isDark ? '#cbd5e1' : '#475569'} />
        </Pressable>

        {/* Center: Title & Model Status */}
        <View className="flex-1 items-center px-2">
          <View className="flex-row items-center space-x-1.5 gap-1.5">
            <Text
              numberOfLines={1}
              className="text-sm font-bold text-slate-900 dark:text-slate-50 max-w-[160px]"
            >
              {isNewChat ? 'Gemini Assistant' : conversationTitle || 'Gemini AI'}
            </Text>
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
          </View>
          <Text className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
            3.5 Flash Lite
          </Text>
        </View>

        {/* Right: Actions */}
        <View className="flex-row items-center space-x-1.5 gap-1.5">
          {!isNewChat && (
            <Pressable
              onPress={onNewChat}
              className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 items-center justify-center active:bg-indigo-100 dark:active:bg-indigo-900/80"
                  accessibilityLabel="Start a new chat"
              hitSlop={8}
            >
              <PlusIcon size={16} color="#6366f1" />
            </Pressable>
          )}

          <Pressable
            onPress={onToggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700/80"
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            hitSlop={8}
          >
            {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </Pressable>

          <Pressable
            onPress={() => router.push('/settings')}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700/80"
              accessibilityLabel="Open settings"
            hitSlop={8}
          >
            <SettingsIcon size={18} color={isDark ? '#cbd5e1' : '#475569'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
