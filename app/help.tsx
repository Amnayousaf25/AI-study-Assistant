import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '../src/context/ChatContext';
import { useResponsive } from '../src/hooks/useResponsive';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  ChatIcon,
} from '../components/Icons';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Multimodal Vision',
    question: 'How do I analyze images or photos with Gemini?',
    answer:
      'Tap the Camera/Attachment icon [ 📷 ] next to the chat input to either take a photo with your device camera or choose an existing picture from your gallery. You can then ask questions about the image or send it directly for visual reasoning.',
  },
  {
    category: 'Getting Started',
    question: 'How do I start a conversation?',
    answer:
      'Tap the "New Chat" button in the navigation sidebar or top header. You can also tap any of the suggested topic chips on the welcome screen to start instantly.',
  },
  {
    category: 'Conversations & Privacy',
    question: 'Where is my conversation history stored?',
    answer:
      'All your conversations and messages are stored 100% locally on your device using AsyncStorage. Your data is never uploaded to third-party databases.',
  },
  {
    category: 'Favorites & Bookmarks',
    question: 'How do I save favorite responses?',
    answer:
      'Tap the "Save" star button on any AI response in chat. You can review all your saved responses anytime in the dedicated Favorites tab.',
  },
  {
    category: 'Features',
    question: 'How do I copy messages and code blocks?',
    answer:
      'Every AI message has a "Copy" button. Additionally, code blocks rendered with syntax formatting include a dedicated "Copy" button in the code block header.',
  },
  {
    category: 'Appearance',
    question: 'How do I switch between Light and Dark mode?',
    answer:
      'Tap the Sun/Moon icon in the top header or sidebar, or navigate to Settings and toggle the Dark Mode switch. Your preference is automatically remembered.',
  },
  {
    category: 'Troubleshooting',
    question: 'What should I do if I get a Network or Gemini error?',
    answer:
      'Ensure you have an active internet connection and that EXPO_PUBLIC_GEMINI_API_KEY is configured in your .env.local file. If a request times out, tap the "Retry" button on the error bubble to resubmit.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const { isDark } = useChat();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

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
            Help & Documentation
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
          {/* Intro Card */}
          <View className="bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 rounded-3xl p-5 mb-5 shadow-xs">
            <View className="flex-row items-center space-x-2.5 gap-2.5 mb-2">
              <View className="w-8 h-8 rounded-xl bg-indigo-600 items-center justify-center">
                <SparklesIcon size={16} color="#ffffff" />
              </View>
              <Text className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Frequently Asked Questions
              </Text>
            </View>
            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-5">
              Quick answers about multimodal features, local persistence, favorites, and performance.
            </Text>
          </View>

          {/* Accordion List */}
          <View className="space-y-3 gap-3">
            {FAQS.map((faq, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <View
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
                >
                  <Pressable
                    onPress={() => toggleExpand(index)}
                    className="p-4 flex-row items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50"
                    accessibilityRole="button"
                    accessibilityLabel={faq.question}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                        {faq.category}
                      </Text>
                      <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {faq.question}
                      </Text>
                    </View>

                    <View className="w-6 h-6 items-center justify-center">
                      {isExpanded ? (
                        <ChevronDownIcon size={14} color="#6366f1" />
                      ) : (
                        <ChevronRightIcon size={14} color="#94a3b8" />
                      )}
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <Text className="text-xs text-slate-600 dark:text-slate-300 leading-5">
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
