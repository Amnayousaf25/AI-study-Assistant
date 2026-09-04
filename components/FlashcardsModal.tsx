import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../src/hooks/useResponsive';
import { useChat } from '../src/context/ChatContext';
import { useStudy } from '../src/context/StudyContext';
import { generateFlashcards, getFriendlyErrorMessage } from '../src/services/aiService';
import {
  CloseIcon,
  SparklesIcon,
  CheckIcon,
  LayersIcon,
} from './Icons';

interface Flashcard {
  id: string;
  front: string; // Question / Concept
  back: string;  // Answer / Explanation
  mastered?: boolean;
}

interface FlashcardsModalProps {
  visible: boolean;
  onClose: () => void;
  initialTopic?: string;
  documentText?: string;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  visible,
  onClose,
  initialTopic = '',
  documentText,
}) => {
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const { isDark } = useChat();
  const { saveFlashcardsAsDocument } = useStudy();

  const [topic, setTopic] = useState<string>(initialTopic);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [knownCount, setKnownCount] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTopic) setTopic(initialTopic);

    if (visible && documentText && (documentText.includes('### Card ') || documentText.includes('Flashcard Deck'))) {
      const parsedCards: Flashcard[] = [];
      const sections = documentText.split(/### Card \d+:/);
      sections.forEach((sec, idx) => {
        if (!sec.trim() || idx === 0) return;
        const parts = sec.split('**Answer / Explanation**:');
        const front = parts[0]?.trim() || `Card ${idx}`;
        const back = parts[1]?.replace(/^[\s\-]+/, '').replace(/---$/, '').trim() || 'No description.';
        parsedCards.push({
          id: `fc-saved-${idx}`,
          front,
          back,
        });
      });

      if (parsedCards.length > 0) {
        setCards(parsedCards);
        setIsFinished(false);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsSaved(true);
      }
    }
  }, [initialTopic, documentText, visible]);

  const handleSaveDeck = async () => {
    if (cards.length === 0 || isSaved) return;
    try {
      await saveFlashcardsAsDocument(topic || 'Study Flashcards', cards);
      setIsSaved(true);
    } catch (e) {
      console.warn('Error saving deck:', e);
    }
  };

  const handleGenerateCards = async () => {
    if (isGenerating) return;
    const topicToUse = topic.trim() || 'General Science & Concepts';
    setIsGenerating(true);
    setError(null);
    setIsSaved(false);
    setIsFinished(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setReviewCount(0);

    try {
      const generatedCards = await generateFlashcards(
        topicToUse,
        documentText
      );

      const parsedCards: Flashcard[] = generatedCards.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
      }));

      setCards(parsedCards);
    } catch (err: any) {
      console.warn('Flashcard generation notice:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssessCard = (knowIt: boolean) => {
    if (knowIt) {
      setKnownCount((prev) => prev + 1);
    } else {
      setReviewCount((prev) => prev + 1);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  const currentCard = cards[currentIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Dimmed Backdrop */}
        <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-0 sm:p-4">
          <TouchableWithoutFeedback onPress={onClose}>
            <View className="absolute inset-0" />
          </TouchableWithoutFeedback>

          {/* Modal Container: Guaranteed height on mobile */}
          <View
            style={{
              height: isWideScreen ? undefined : '85%',
              maxHeight: '92%',
              paddingBottom: Math.max(insets.bottom, 16),
            }}
            className="w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex-col overflow-hidden z-10"
          >
            {/* Modal Header */}
            <View className="px-5 pt-3 pb-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-2.5 gap-2.5 flex-1 mr-2">
                  <View className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/70 border border-purple-100 dark:border-purple-800/60 items-center justify-center">
                    <LayersIcon size={18} color="#9333ea" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
                      AI Study Flashcards
                    </Text>
                    <Text className="text-xs text-slate-400 font-medium">
                      {cards.length > 0 ? `Card ${currentIndex + 1} of ${cards.length}` : 'Interactive revision cards'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 min-h-[36px] min-w-[36px]"
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                  hitSlop={8}
                >
                  <CloseIcon size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                </Pressable>
              </View>
            </View>

            {/* Scrollable Body */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, flexGrow: 1 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
            {isGenerating ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#9333ea" />
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3">
                  Generating AI Flashcards...
                </Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">
                  Creating high-yield Q&A cards for {topic || 'your topic'}
                </Text>
              </View>
            ) : cards.length === 0 ? (
              /* Generator Setup View */
              <View className="space-y-4 gap-4 py-2">
                <View className="bg-purple-50 dark:bg-purple-950/50 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/60 flex-row items-center space-x-3 gap-3">
                  <SparklesIcon size={20} color="#9333ea" />
                  <Text className="text-xs text-purple-950 dark:text-purple-200 flex-1 leading-5">
                    Generate instant AI flashcards to memorize definitions, key formulas, and exam concepts.
                  </Text>
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Enter Study Topic or Subject
                  </Text>
                  <TextInput
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g. Organic Chemistry, Photosynthesis, Calculus Derivatives..."
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 min-h-[42px]"
                  />
                </View>

                {error && (
                  <Text className="text-xs text-rose-500 font-medium">{error}</Text>
                )}

                <Pressable
                  onPress={handleGenerateCards}
                  className="bg-purple-600 active:bg-purple-700 py-3 rounded-xl items-center shadow-xs min-h-[44px] justify-center mt-2"
                >
                  <Text className="text-xs font-bold text-white">
                    ✨ Generate Flashcards Deck
                  </Text>
                </Pressable>
              </View>
            ) : isFinished ? (
              /* Session Finished View */
              <View className="py-8 items-center text-center space-y-4 gap-4">
                <View className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/70 items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <CheckIcon size={32} color="#10b981" />
                </View>

                <View>
                  <Text className="text-base font-bold text-slate-900 dark:text-slate-50 text-center">
                    Deck Completed! 🎉
                  </Text>
                  <Text className="text-xs text-slate-400 text-center mt-1">
                    You reviewed all {cards.length} flashcards in this deck.
                  </Text>
                </View>

                <View className="flex-row gap-3 w-full my-2">
                  <View className="flex-1 bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 items-center">
                    <Text className="text-lg font-black text-emerald-600">{knownCount}</Text>
                    <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Mastered</Text>
                  </View>

                  <View className="flex-1 bg-amber-50 dark:bg-amber-950/60 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/80 items-center">
                    <Text className="text-lg font-black text-amber-600">{reviewCount}</Text>
                    <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Needs Review</Text>
                  </View>
                </View>

                <View className="flex-row gap-2 w-full">
                  <Pressable
                    onPress={() => {
                      setCurrentIndex(0);
                      setIsFlipped(false);
                      setKnownCount(0);
                      setReviewCount(0);
                      setIsFinished(false);
                    }}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 rounded-xl items-center min-h-[40px] justify-center"
                  >
                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Practice Again</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setCards([])}
                    className="flex-1 bg-purple-600 py-2.5 rounded-xl items-center min-h-[40px] justify-center"
                  >
                    <Text className="text-xs font-bold text-white">New Topic</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Active Card View */
              <View className="space-y-4 gap-4 py-1">
                {/* Progress Bar */}
                <View className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <View
                    className="bg-purple-600 h-full rounded-full"
                    style={{ width: `${cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0}%` }}
                  />
                </View>

                {/* Flip Flashcard Card */}
                <Pressable
                  onPress={() => setIsFlipped(!isFlipped)}
                  style={{
                    backgroundColor: isFlipped ? (isDark ? '#3b0764' : '#faf5ff') : (isDark ? '#1e293b' : '#ffffff'),
                    borderColor: isFlipped ? (isDark ? '#6b21a8' : '#e9d5ff') : (isDark ? '#334155' : '#e2e8f0'),
                  }}
                  className="min-h-[200px] p-6 rounded-2xl border items-center justify-center text-center shadow-xs"
                >
                  <Text className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">
                    {isFlipped ? 'Answer / Explanation (Tap to Flip back)' : 'Question / Concept (Tap to Flip)'}
                  </Text>

                  <Text
                    style={{
                      color: isFlipped ? (isDark ? '#f3e8ff' : '#3b0764') : (isDark ? '#f8fafc' : '#0f172a'),
                      fontSize: isFlipped ? 14 : 16,
                    }}
                    className="text-center font-bold leading-6"
                  >
                    {isFlipped ? currentCard?.back : currentCard?.front}
                  </Text>

                  <Text className="text-[10px] text-slate-400 mt-4 italic">
                    💡 Click card to flip
                  </Text>
                </Pressable>

                {/* Assessment Buttons */}
                <View className="flex-row gap-3 pt-2">
                  <Pressable
                    onPress={() => handleAssessCard(false)}
                    className="flex-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 py-3 rounded-xl items-center min-h-[44px] justify-center"
                  >
                    <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      🤔 Still Learning
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleAssessCard(true)}
                    className="flex-1 bg-emerald-600 active:bg-emerald-700 py-3 rounded-xl items-center shadow-xs min-h-[44px] justify-center"
                  >
                    <Text className="text-xs font-bold text-white">
                      ✅ Know It!
                    </Text>
                  </Pressable>
                </View>

                {/* Save Deck CTA Button */}
                <Pressable
                  onPress={handleSaveDeck}
                  disabled={isSaved}
                  style={{
                    backgroundColor: isSaved ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#3b0764' : '#faf5ff'),
                    borderColor: isSaved ? (isDark ? '#065f46' : '#a7f3d0') : (isDark ? '#6b21a8' : '#e9d5ff'),
                  }}
                  className="w-full py-2.5 rounded-xl items-center justify-center border"
                >
                  <Text style={{ color: isSaved ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#d8b4fe' : '#6b21a8') }} className="text-xs font-bold">
                    {isSaved ? '✓ Saved to Your Library in Study Tab' : '💾 Save Flashcard Deck to Library'}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
};
