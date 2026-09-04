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
import { useStudy } from '../src/context/StudyContext';
import { useChat } from '../src/context/ChatContext';
import { getFriendlyErrorMessage } from '../src/services/aiService';
import { StudySubject, QuizDifficulty, QuizQuestion, QuizResult } from '../src/types/study';
import {
  CloseIcon,
  QuizIcon,
  TrophyIcon,
  SparklesIcon,
  CheckIcon,
  ArrowLeftIcon,
  TargetIcon,
} from './Icons';

interface QuizModalProps {
  visible: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialTopic?: string;
  documentText?: string;
  documentBase64?: string;
  documentMimeType?: string;
}

const DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard'];
const QUESTION_COUNTS = [5, 10, 15, 20];

export const QuizModal: React.FC<QuizModalProps> = ({
  visible,
  onClose,
  initialSubject = 'Physics',
  initialTopic = '',
  documentText,
  documentBase64,
  documentMimeType,
}) => {
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const { isDark } = useChat();
  const {
    subjects,
    activeQuiz,
    isGeneratingQuiz,
    startQuiz,
    selectQuizAnswer,
    finishActiveQuiz,
    cancelActiveQuiz,
  } = useStudy();

  const [subject, setSubject] = useState<string>(initialSubject || (subjects[0]?.name || 'Physics'));
  const [topic, setTopic] = useState<string>(initialTopic);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSubject) setSubject(initialSubject);
    if (initialTopic) setTopic(initialTopic);
  }, [initialSubject, initialTopic, visible]);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [completedResult, setCompletedResult] = useState<QuizResult | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const handleStart = async () => {
    if (isGeneratingQuiz) return;
    const topicToUse = topic.trim() || initialTopic?.trim() || `${subject || 'General'} Practice Quiz`;
    setErrorMsg(null);
    setCurrentStep(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setCompletedResult(null);
    setIsReviewing(false);
    try {
      await startQuiz(
        topicToUse,
        difficulty,
        questionCount,
        5,
        documentText,
        documentBase64,
        documentMimeType
      );
    } catch (err: any) {
      console.error('Quiz start error:', err);
      setErrorMsg(getFriendlyErrorMessage(err));
    }
  };

  const handleSelectOption = (idx: number) => {
    if (showExplanation) return;
    setSelectedOption(idx);
    selectQuizAnswer(currentStep, idx);
    setShowExplanation(true);
  };

  const handleFinishQuizNow = async () => {
    if (!activeQuiz || isFinishing) return;
    setIsFinishing(true);
    try {
      const result = await finishActiveQuiz();
      setCompletedResult(result);
    } catch (err) {
      console.error('Error finishing quiz:', err);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!activeQuiz || isFinishing) return;
    if (currentStep < activeQuiz.questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      await handleFinishQuizNow();
    }
  };

  const handleClose = () => {
    cancelActiveQuiz();
    setCompletedResult(null);
    setIsReviewing(false);
    setCurrentStep(0);
    setSelectedOption(null);
    setShowExplanation(false);
    onClose();
  };

  const activeQuestion: QuizQuestion | undefined = activeQuiz?.questions[currentStep];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Dimmed Backdrop */}
        <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center">
          <TouchableWithoutFeedback onPress={handleClose}>
            <View className="absolute inset-0" />
          </TouchableWithoutFeedback>

          {/* Modal Container: Guaranteed height on mobile */}
          <View
            style={{
              height: isWideScreen ? undefined : '82%',
              maxHeight: '90%',
            }}
            className="w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex-col overflow-hidden z-10"
          >
            {/* Drag Handle & Fixed Header */}
            <View className="px-5 pt-3 pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
              {/* Centered Drag Handle Pill */}
              <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-2.5 gap-2.5 flex-1 mr-2">
                  <View className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 items-center justify-center">
                    <QuizIcon size={18} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-base font-bold text-slate-900 dark:text-slate-50">
                      {completedResult
                        ? 'Quiz Results'
                        : activeQuiz
                        ? `${activeQuiz.subject} Quiz`
                        : 'AI Quiz Generator'}
                    </Text>
                    <Text numberOfLines={1} className="text-xs text-slate-400 font-medium">
                      {completedResult
                        ? completedResult.title
                        : activeQuiz
                        ? `Question ${currentStep + 1} of ${activeQuiz.questions.length} • ${activeQuiz.difficulty}`
                        : 'Create interactive practice MCQs'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleClose}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 min-h-[36px] min-w-[36px]"
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                  hitSlop={8}
                >
                  <CloseIcon size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                </Pressable>
              </View>
            </View>

            {/* Independently Scrollable Body */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, flexGrow: 1 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
            {/* 1. QUIZ COMPLETED SCREEN */}
            {completedResult && !isReviewing ? (
              <View className="py-4 items-center">
                <View className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 items-center justify-center mb-3 shadow-xs">
                  <TrophyIcon size={36} color="#eab308" />
                </View>

                <Text className="text-xl font-black text-slate-900 dark:text-slate-50 text-center">
                  Quiz Completed! 🎉
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5 font-medium">
                  {completedResult.title}
                </Text>

                {/* Score Summary Metrics */}
                <View className="w-full flex-row justify-around bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 my-5 border border-slate-200/80 dark:border-slate-700/60">
                  <View className="items-center flex-1">
                    <Text className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {completedResult.scorePercentage}%
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-semibold mt-0.5">Accuracy</Text>
                  </View>

                  <View className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

                  <View className="items-center flex-1">
                    <Text className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {completedResult.correctAnswers}/{completedResult.totalQuestions}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-semibold mt-0.5">Correct</Text>
                  </View>

                  <View className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

                  <View className="items-center flex-1">
                    <Text className="text-2xl font-black text-amber-500">
                      {completedResult.difficulty}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-semibold mt-0.5">Level</Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="w-full space-y-2.5 gap-2.5">
                  <Pressable
                    onPress={() => setIsReviewing(true)}
                    className="w-full bg-slate-100 dark:bg-slate-800 active:bg-slate-200 py-3 rounded-2xl items-center border border-slate-200 dark:border-slate-700 min-h-[44px] justify-center"
                  >
                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      📖 Review Questions & Explanations
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setCompletedResult(null);
                      handleStart();
                    }}
                    className="w-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 py-3 rounded-2xl items-center min-h-[44px] justify-center"
                  >
                    <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      🔄 Try Another Quiz on this Topic
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleClose}
                    className="w-full bg-indigo-600 active:bg-indigo-700 py-3.5 rounded-2xl items-center shadow-sm shadow-indigo-500/25 min-h-[44px] justify-center"
                  >
                    <Text className="text-xs font-bold text-white">Finish Quiz & Save Result 🎉</Text>
                  </Pressable>
                </View>
              </View>
            ) : completedResult && isReviewing ? (
              /* REVIEW MODE */
              <View className="space-y-4 gap-4 py-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Review ({completedResult.correctAnswers}/{completedResult.totalQuestions} Correct)
                  </Text>
                  <Pressable onPress={() => setIsReviewing(false)}>
                    <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      ← Score Card
                    </Text>
                  </Pressable>
                </View>

                {completedResult.questions.map((q, idx) => {
                  const userAns = completedResult.userAnswers[idx];
                  const isCorrect = userAns === q.correctAnswerIndex;

                  return (
                    <View
                      key={q.id || idx}
                      className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-[11px] font-bold text-slate-400 uppercase">
                          Question {idx + 1}
                        </Text>
                        <Text
                          className={`text-[11px] font-bold ${
                            isCorrect ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                        </Text>
                      </View>

                      <Text className="text-xs font-bold text-slate-900 dark:text-slate-50 mb-2.5">
                        {q.question}
                      </Text>

                      <View className="space-y-1.5 gap-1.5 mb-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isOptCorrect = optIdx === q.correctAnswerIndex;
                          const isOptSelected = optIdx === userAns;

                          return (
                            <View
                              key={optIdx}
                              className={`flex-row items-center p-2 rounded-xl border ${
                                isOptCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                                  : isOptSelected && !isOptCorrect
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500'
                                  : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700/40'
                              }`}
                            >
                              <Text
                                className={`text-[11px] font-bold mr-2 ${
                                  isOptCorrect
                                    ? 'text-emerald-600'
                                    : isOptSelected
                                    ? 'text-rose-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </Text>
                              <Text
                                className={`text-xs flex-1 ${
                                  isOptCorrect
                                    ? 'font-bold text-emerald-900 dark:text-emerald-200'
                                    : isOptSelected
                                    ? 'text-rose-900 dark:text-rose-200'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {opt}
                              </Text>
                            </View>
                          );
                        })}
                      </View>

                      <View className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl p-2.5 border border-indigo-100 dark:border-indigo-900/60">
                        <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">
                          Explanation:
                        </Text>
                        <Text className="text-[11px] text-slate-700 dark:text-slate-300 leading-4">
                          {q.explanation}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : activeQuiz && activeQuestion ? (
              /* 2. ACTIVE QUIZ RUNNER */
              <View className="py-2">
                {/* Progress & Step */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Question {currentStep + 1} of {activeQuiz.questions.length}
                  </Text>
                  <View className="flex-row items-center space-x-2 gap-2">
                    <Pressable
                      onPress={handleFinishQuizNow}
                      disabled={isFinishing}
                      className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full active:bg-amber-100"
                    >
                      <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        {isFinishing ? 'Finishing...' : 'Finish Early 🏁'}
                      </Text>
                    </Pressable>
                    <View className="bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {activeQuiz.subject || activeQuiz.difficulty}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Track */}
                <View className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                  <View
                    style={{
                      width: `${((currentStep + 1) / activeQuiz.questions.length) * 100}%`,
                    }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </View>

                {/* Question */}
                <View className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 mb-4">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-5">
                    {activeQuestion.question}
                  </Text>
                </View>

                {/* Options List */}
                <View className="space-y-2.5 gap-2.5 mb-4">
                  {activeQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === activeQuestion.correctAnswerIndex;
                    const showCorrect = showExplanation && isCorrect;
                    const showWrong = showExplanation && isSelected && !isCorrect;

                    return (
                      <Pressable
                        key={idx}
                        onPress={() => handleSelectOption(idx)}
                        disabled={showExplanation}
                        className={`flex-row items-center p-3.5 rounded-2xl border min-h-[44px] transition-all ${
                          showCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500'
                            : showWrong
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500'
                            : isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 active:bg-slate-50'
                        }`}
                      >
                        <View
                          className={`w-7 h-7 rounded-lg items-center justify-center mr-3 ${
                            showCorrect
                              ? 'bg-emerald-500'
                              : showWrong
                              ? 'bg-rose-500'
                              : isSelected
                              ? 'bg-indigo-600'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              showCorrect || showWrong || isSelected
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>

                        <Text
                          className={`flex-1 text-xs font-medium ${
                            showCorrect
                              ? 'text-emerald-900 dark:text-emerald-200 font-bold'
                              : showWrong
                              ? 'text-rose-900 dark:text-rose-200 font-bold'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Explanation */}
                {showExplanation && (
                  <View className="bg-indigo-50/70 dark:bg-indigo-950/60 rounded-2xl p-3.5 border border-indigo-200/80 dark:border-indigo-800/60 mb-4">
                    <View className="flex-row items-center mb-1">
                      <SparklesIcon size={13} color="#6366f1" />
                      <Text className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 ml-1.5">
                        Explanation
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-700 dark:text-slate-300 leading-4">
                      {activeQuestion.explanation}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* 3. GENERATE QUIZ SETUP FORM */
              <View className="space-y-4 gap-4 py-1">
                {Boolean(documentText || documentBase64) && (
                  <View className="bg-amber-50 dark:bg-amber-950/60 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 flex-row items-center space-x-2 gap-2">
                    <SparklesIcon size={16} color="#d97706" />
                    <Text className="text-xs font-bold text-amber-800 dark:text-amber-300 flex-1">
                      Generating quiz directly from document "{topic}"
                    </Text>
                  </View>
                )}

                {errorMsg && (
                  <View className="bg-rose-50 dark:bg-rose-950/60 p-3 rounded-2xl border border-rose-200 dark:border-rose-800">
                    <Text className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      ⚠️ {errorMsg}
                    </Text>
                  </View>
                )}

                {/* 2. Topic Input */}
                <View>
                  <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Topic or Chapter
                  </Text>
                  <TextInput
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g. Kinematics, Thermodynamics, Limits..."
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-xs text-slate-900 dark:text-slate-100 min-h-[44px]"
                  />
                </View>

                {/* 3. Segmented Difficulty Control */}
                <View>
                  <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Difficulty Level
                  </Text>
                  <View className="flex-row gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {DIFFICULTIES.map((d) => (
                      <Pressable
                        key={d}
                        onPress={() => setDifficulty(d)}
                        className={`flex-1 py-2 rounded-lg items-center min-h-[36px] justify-center ${
                          difficulty === d
                            ? 'bg-white dark:bg-slate-900 shadow-xs'
                            : ''
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            difficulty === d
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* 4. Question Count Segmented Pills */}
                <View>
                  <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Question Count
                  </Text>
                  <View className="flex-row gap-2">
                    {QUESTION_COUNTS.map((num) => (
                      <Pressable
                        key={num}
                        onPress={() => setQuestionCount(num)}
                        className={`flex-1 py-2 rounded-xl border items-center min-h-[36px] justify-center ${
                          questionCount === num
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            questionCount === num ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {num} Qs
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Fixed Footer CTA */}
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            className="px-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            {activeQuiz && (showExplanation || currentStep === activeQuiz.questions.length - 1) ? (
              <Pressable
                onPress={handleNextQuestion}
                disabled={isFinishing}
                className="w-full bg-indigo-600 active:bg-indigo-700 py-3.5 rounded-2xl items-center shadow-sm shadow-indigo-500/25 min-h-[46px] justify-center active:scale-[0.99]"
              >
                {isFinishing ? (
                  <View className="flex-row items-center space-x-2 gap-2">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Saving & Finishing Quiz...</Text>
                  </View>
                ) : (
                  <Text className="text-xs font-bold text-white">
                    {currentStep < activeQuiz.questions.length - 1
                      ? 'Next Question →'
                      : 'Finish Quiz 🎉'}
                  </Text>
                )}
              </Pressable>
            ) : !activeQuiz && !completedResult ? (
              <Pressable
                onPress={handleStart}
                disabled={isGeneratingQuiz}
                className={`w-full py-3.5 rounded-2xl items-center shadow-sm min-h-[46px] justify-center active:scale-[0.99] ${
                  !isGeneratingQuiz
                    ? 'bg-indigo-600 active:bg-indigo-700 shadow-indigo-500/25'
                    : 'bg-indigo-400 opacity-60'
                }`}
              >
                {isGeneratingQuiz ? (
                  <View className="flex-row items-center space-x-2 gap-2">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-xs font-bold text-white">
                      AI is generating your quiz...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs font-bold text-white">Generate Quiz ✨</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
};
