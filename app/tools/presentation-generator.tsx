import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  LayersIcon,
} from '../../components/Icons';
import { useStudy } from '../../src/context/StudyContext';
import { useChat } from '../../src/context/ChatContext';
import { PresentationDeck } from '../../src/types/study';

const SLIDE_OPTIONS = [4, 6, 8, 10];
const DETAIL_LEVELS = ['Standard', 'In-Depth', 'Executive'];

export default function PresentationGeneratorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useChat();
  const { subjects, createAndSavePresentation, isGeneratingPresentation, createNoteDocument } = useStudy();

  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.name || 'Artificial Intelligence');
  const [topic, setTopic] = useState<string>('');
  const [slideCount, setSlideCount] = useState<number>(6);
  const [detailLevel, setDetailLevel] = useState<string>('Standard');

  const [deck, setDeck] = useState<PresentationDeck | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerateDeck = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please enter a presentation topic or chapter.');
      return;
    }

    setErrorMsg(null);
    try {
      const res = await createAndSavePresentation(selectedSubject, topic.trim(), slideCount, detailLevel);
      setDeck(res);
    } catch (err: any) {
      console.error('Presentation error:', err);
      setErrorMsg('Could not generate presentation. Please try again.');
    }
  };

  const handleCopyOutline = async () => {
    if (!deck) return;
    const text = `# ${deck.title} (${deck.subject})\n\n` +
      deck.slides.map((s) => `## Slide ${s.slideNumber}: ${s.title}\n${s.bulletPoints.map((b) => `- ${b}`).join('\n')}\n\n*Speaker Notes*: ${s.speakerNotes}\n*Visual Suggestion*: ${s.visualSuggestion}`).join('\n\n---\n\n');

    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = async () => {
    if (!deck || saved) return;
    const text = `# ${deck.title}\n\n` +
      deck.slides.map((s) => `## Slide ${s.slideNumber}: ${s.title}\n${s.bulletPoints.map((b) => `- ${b}`).join('\n')}\n\nNotes: ${s.speakerNotes}`).join('\n\n');
    await createNoteDocument(`${deck.title} (Slides)`, text, deck.subject);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
      className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}
    >
      {/* Top Header */}
      <View className="px-4 pb-3 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2.5 gap-2.5 flex-1 mr-2">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200"
            hitSlop={8}
          >
            <ArrowLeftIcon size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
          </Pressable>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-bold text-slate-900 dark:text-slate-50">
              AI Presentation Generator
            </Text>
            <Text numberOfLines={1} className="text-xs text-slate-400">
              Structured university slide decks & speaker notes
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-md mx-auto space-y-4 gap-4">
          {deck ? (
            /* SLIDE DECK PREVIEW */
            <View className="space-y-4 gap-4">
              {/* Actions Header */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleCopyOutline}
                  className="flex-1 flex-row items-center justify-center bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 py-2.5 rounded-xl min-h-[40px]"
                >
                  {copied ? <CheckIcon size={14} color="#10b981" /> : <CopyIcon size={14} color="#6366f1" />}
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">
                    {copied ? 'Copied' : 'Copy Outline'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveToNotes}
                  className="flex-1 flex-row items-center justify-center bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 py-2.5 rounded-xl min-h-[40px]"
                >
                  <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {saved ? '✓ Saved' : '💾 Save to Notes'}
                  </Text>
                </Pressable>
              </View>

              {/* Title Card */}
              <View className="bg-indigo-600 rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-black text-white">{deck.title}</Text>
                <Text className="text-xs text-indigo-100 mt-1 font-medium">
                  {deck.subject} • {deck.slides.length} Slides Deck
                </Text>
              </View>

              {/* Slide Cards */}
              <View className="space-y-3.5 gap-3.5">
                {deck.slides.map((slide) => (
                  <View
                    key={slide.slideNumber}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs"
                  >
                    <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Slide {slide.slideNumber}
                      </Text>
                      <Text numberOfLines={1} className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1 ml-2 text-right">
                        {slide.title}
                      </Text>
                    </View>

                    {/* Bullet points */}
                    <View className="space-y-1.5 gap-1.5 mb-3">
                      {slide.bulletPoints.map((pt, pIdx) => (
                        <View key={pIdx} className="flex-row items-start space-x-2 gap-2">
                          <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                          <Text className="text-xs text-slate-700 dark:text-slate-300 leading-4 flex-1">
                            {pt}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Speaker Notes */}
                    {slide.speakerNotes && (
                      <View className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-2">
                        <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          🗣️ Speaker Notes
                        </Text>
                        <Text className="text-xs text-slate-600 dark:text-slate-300 leading-4">
                          {slide.speakerNotes}
                        </Text>
                      </View>
                    )}

                    {/* Visual Suggestion */}
                    {slide.visualSuggestion && (
                      <View className="bg-amber-50/60 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                        <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-0.5">
                          📊 Suggested Visual
                        </Text>
                        <Text className="text-xs text-slate-700 dark:text-slate-300 leading-4">
                          {slide.visualSuggestion}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => setDeck(null)}
                className="w-full bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center active:bg-slate-200 min-h-[40px] justify-center"
              >
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ← Generate Another Presentation
                </Text>
              </Pressable>
            </View>
          ) : (
            /* CONFIGURATION FORM */
            <View className="space-y-4 gap-4">
              {/* 1. Subject */}
              <View>
                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  1. University Course
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {subjects.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => setSelectedSubject(s.name)}
                      className={`px-3 py-2 rounded-xl border min-h-[36px] justify-center ${
                        selectedSubject === s.name
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selectedSubject === s.name ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* 2. Topic Input */}
              <View>
                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  2. Presentation Topic
                </Text>
                <TextInput
                  value={topic}
                  onChangeText={setTopic}
                  placeholder="e.g. Convolutional Neural Networks, ACID Guarantees..."
                  placeholderTextColor="#94a3b8"
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-3 text-xs text-slate-900 dark:text-slate-100 min-h-[44px]"
                />
              </View>

              {/* 3. Number of Slides */}
              <View>
                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  3. Number of Slides
                </Text>
                <View className="flex-row gap-2">
                  {SLIDE_OPTIONS.map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => setSlideCount(num)}
                      className={`flex-1 py-2 rounded-xl border items-center min-h-[36px] justify-center ${
                        slideCount === num
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          slideCount === num ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {num} Slides
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 4. Detail Level */}
              <View>
                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  4. Detail Level
                </Text>
                <View className="flex-row gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {DETAIL_LEVELS.map((lvl) => (
                    <Pressable
                      key={lvl}
                      onPress={() => setDetailLevel(lvl)}
                      className={`flex-1 py-2 rounded-lg items-center min-h-[36px] justify-center ${
                        detailLevel === lvl ? 'bg-white dark:bg-slate-900 shadow-xs' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          detailLevel === lvl ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {lvl}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {errorMsg && (
                <View className="bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  <Text className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ {errorMsg}
                  </Text>
                </View>
              )}

              {/* Generate CTA */}
              <Pressable
                onPress={handleGenerateDeck}
                disabled={isGeneratingPresentation}
                className="w-full bg-indigo-600 active:bg-indigo-700 py-3.5 rounded-2xl items-center shadow-sm shadow-indigo-500/25 min-h-[44px] justify-center active:scale-[0.99]"
              >
                {isGeneratingPresentation ? (
                  <View className="flex-row items-center space-x-2 gap-2">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-xs font-bold text-white">
                      AI is generating presentation slide deck...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs font-bold text-white">Generate Presentation Deck 📊</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
