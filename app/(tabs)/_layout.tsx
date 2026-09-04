import React, { useState, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, Platform, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useChat, GEMINI_MODEL } from '../../src/context/ChatContext';
import { useStudy } from '../../src/context/StudyContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import {
  HomeIcon,
  BookOpenIcon,
  ChatIcon,
  QuizIcon,
  ChartBarIcon,
  UserCircleIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  GraduationCapIcon,
  FireIcon,
  LayersIcon,
  SparklesIcon,
} from '../../components/Icons';

function ResponsiveTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, handleNewChat } = useChat();
  const { streakCount, subjects } = useStudy();
  const { isWideScreen } = useResponsive();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 5 Tab Model: Home, Chat, Study, Progress, Profile
  const tabItems = [
    {
      name: 'index',
      label: 'Home',
      icon: (focused: boolean, color: string) => (
        <HomeIcon size={20} color={focused ? '#6366f1' : color} />
      ),
      badge: undefined,
    },
    {
      name: 'chat',
      label: 'Chat',
      icon: (focused: boolean, color: string) => (
        <ChatIcon size={20} color={focused ? '#6366f1' : color} />
      ),
      badge: undefined,
    },
    {
      name: 'study',
      label: 'Study',
      icon: (focused: boolean, color: string) => (
        <BookOpenIcon size={20} color={focused ? '#6366f1' : color} />
      ),
      badge: undefined,
    },
    {
      name: 'progress',
      label: 'Progress',
      icon: (focused: boolean, color: string) => (
        <ChartBarIcon size={20} color={focused ? '#6366f1' : color} />
      ),
      badge: undefined,
    },
    {
      name: 'profile',
      label: 'Profile',
      icon: (focused: boolean, color: string) => (
        <UserCircleIcon size={20} color={focused ? '#6366f1' : color} />
      ),
      badge: undefined,
    },
  ];

  // 1. DESKTOP / TABLET SIDEBAR (>= 768px)
  if (isWideScreen) {
    return (
      <View
        className={`w-64 lg:w-72 h-full border-r ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
        } p-4 flex-col justify-between`}
      >
        <View>
          {/* Brand Header */}
          <View className="flex-row items-center space-x-2.5 gap-2.5 mb-6 px-1">
            <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 items-center justify-center shadow-xs">
              <GraduationCapIcon size={22} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                AI Study Assistant
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium">
                {GEMINI_MODEL}
              </Text>
            </View>
          </View>

          {/* Start New Chat CTA */}
          <Pressable
            onPress={() => {
              handleNewChat();
              navigation.navigate('chat');
            }}
            className="flex-row items-center justify-center bg-indigo-600 active:bg-indigo-700 py-3 px-4 rounded-2xl mb-6 shadow-sm shadow-indigo-500/25 active:scale-[0.98] transition-all min-h-[44px]"
            accessibilityLabel="Start a new study chat"
          >
            <PlusIcon size={16} color="#ffffff" />
            <Text className="text-sm font-bold text-white ml-2">Ask AI Tutor</Text>
          </Pressable>

          {/* Navigation Links */}
          <View className="space-y-1.5 gap-1.5">
            <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">
              Main Menu
            </Text>

            {tabItems.map((item) => {
              const route = state.routes.find((r) => r.name === item.name);
              if (!route) return null;
              const routeIndex = state.routes.findIndex((r) => r.name === item.name);
              const focused = state.index === routeIndex;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={item.name}
                  onPress={onPress}
                  className={`flex-row items-center justify-between px-3.5 py-3 rounded-2xl min-h-[44px] transition-all ${
                    focused
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800/60'
                  }`}
                >
                  <View className="flex-row items-center space-x-3 gap-3">
                    <View
                      className={`w-8 h-8 rounded-xl items-center justify-center ${
                        focused
                          ? 'bg-indigo-100 dark:bg-indigo-900/60'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {item.icon(focused, focused ? '#6366f1' : isDark ? '#94a3b8' : '#64748b')}
                    </View>
                    <Text
                      className={`text-sm font-semibold ${
                        focused
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </View>

                  {item.badge !== undefined && (
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        focused
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          focused ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sidebar Bottom */}
        <View className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 gap-2">
          <View className="flex-row items-center justify-between px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60">
            <View className="flex-row items-center space-x-2 gap-2">
              <FireIcon size={16} color="#f97316" />
              <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {streakCount} Day Streak 🔥
              </Text>
            </View>
          </View>

          <Pressable
            onPress={toggleTheme}
            className="flex-row items-center justify-between px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 active:bg-slate-200 min-h-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Toggle Theme"
          >
            <View className="flex-row items-center space-x-2 gap-2">
              {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {isDark ? 'Light Appearance' : 'Dark Appearance'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  // Hide bottom tab bar if keyboard is open on mobile
  if (isKeyboardVisible) {
    return null;
  }

  // 2. MOBILE BOTTOM NAVIGATION (5 Tabs: Home, Subjects, Quiz, Progress, Profile)
  return (
    <View
      style={{
        backgroundColor: isDark ? '#090d16' : '#ffffff',
        borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
        borderTopWidth: 1,
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10),
        paddingTop: 6,
      }}
      className="flex-row justify-around items-center shadow-lg"
    >
      {tabItems.map((item) => {
        const route = state.routes.find((r) => r.name === item.name);
        if (!route) return null;
        const routeIndex = state.routes.findIndex((r) => r.name === item.name);
        const focused = state.index === routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={item.name}
            onPress={onPress}
            className="items-center justify-center flex-1 py-1 min-h-[48px] relative active:opacity-75"
            accessibilityLabel={`${item.label} tab`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View className="relative items-center justify-center">
              <View
                className={`w-10 h-8 rounded-xl items-center justify-center transition-all ${
                  focused
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80'
                    : ''
                }`}
              >
                {item.icon(focused, focused ? '#6366f1' : isDark ? '#64748b' : '#94a3b8')}
              </View>

              {item.badge !== undefined && (
                <View className="absolute -top-1 -right-1.5 bg-indigo-600 min-w-[15px] h-3.5 rounded-full px-1 items-center justify-center border border-white dark:border-slate-900">
                  <Text className="text-[8.5px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </View>

            <Text
              numberOfLines={1}
              className={`text-[10px] mt-1 tracking-tight ${
                focused
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium'
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { isWideScreen } = useResponsive();

  return (
    <View style={{ flex: 1, flexDirection: isWideScreen ? 'row' : 'column' }}>
      <Tabs
        tabBar={(props) => <ResponsiveTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
        <Tabs.Screen name="study" options={{ title: 'Study' }} />
        <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        {/* Hidden routes */}
        <Tabs.Screen name="subjects" options={{ href: null }} />
        <Tabs.Screen name="quiz" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="history" options={{ href: null }} />
        <Tabs.Screen name="favorites" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
