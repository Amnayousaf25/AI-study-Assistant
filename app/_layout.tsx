import '../global.css';
import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChatProvider, useChat } from '../src/context/ChatContext';
import { StudyProvider } from '../src/context/StudyContext';

function RootLayoutContent() {
  const { isDark } = useChat();

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: isDark ? '#020617' : '#f8fafc',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="quiz/config" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="quiz/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="subject/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="tools/assignment-solver" options={{ headerShown: false }} />
        <Stack.Screen name="tools/presentation-generator" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
        <Stack.Screen
          name="profile"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="help"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ChatProvider>
        <StudyProvider>
          <RootLayoutContent />
        </StudyProvider>
      </ChatProvider>
    </SafeAreaProvider>
  );
}
