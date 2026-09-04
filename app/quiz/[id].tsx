import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '../../src/context/StudyContext';
import { useChat } from '../../src/context/ChatContext';
import { QuizResult } from '../../src/types/study';

export default function DedicatedQuizScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useChat();
  const {
    activeQuiz,
    selectQuizAnswer,
    finishActiveQuiz,
    cancelActiveQuiz,
    startQuiz,
  } = useStudy();

  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(true);

  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    card: isDark ? '#0f172a' : '#ffffff',
    cardBorder: isDark ? '#1e293b' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#6366f1',
    primaryBg: isDark ? '#1e1b4b' : '#eef2ff',
    success: '#10b981',
    successBg: isDark ? '#064e3b' : '#ecfdf5',
    error: '#f43f5e',
    errorBg: isDark ? '#881337' : '#fff1f2',
    warning: '#f59e0b',
    warningBg: isDark ? '#78350f' : '#fffbeb',
  };

  // 1. NO ACTIVE QUIZ & NO RESULT
  if (!activeQuiz && !result) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bg,
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View style={styles.emptyContent}>
          <Ionicons name="clipboard-outline" size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Active Quiz Session
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Please generate a quiz or select a topic to begin testing.
          </Text>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(tabs)/study')}
          >
            <Text style={styles.primaryButtonText}>Go to Study Hub</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleExitQuiz = () => {
    if (result) {
      router.replace('/(tabs)');
      return;
    }

    Alert.alert(
      'Exit Quiz Session?',
      'Are you sure you want to exit? Your progress will not be saved.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Exit Quiz',
          style: 'destructive',
          onPress: () => {
            cancelActiveQuiz();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleSelectOption = (optionIndex: number) => {
    selectQuizAnswer(currentStep, optionIndex);
  };

  const doSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await finishActiveQuiz();
      if (res) {
        setResult(res);
      } else if (activeQuiz) {
        let correctCount = 0;
        activeQuiz.questions.forEach((q, idx) => {
          if (activeQuiz.userAnswers[idx] === q.correctAnswerIndex) {
            correctCount += 1;
          }
        });
        const total = activeQuiz.questions.length;
        const fallbackResult: QuizResult = {
          id: `quiz_${Date.now()}`,
          title: `${activeQuiz.subject}: ${activeQuiz.topic}`,
          subject: activeQuiz.subject,
          topic: activeQuiz.topic,
          difficulty: activeQuiz.difficulty,
          totalQuestions: total,
          correctAnswers: correctCount,
          scorePercentage: Math.round((correctCount / (total || 1)) * 100),
          timestamp: Date.now(),
          questions: activeQuiz.questions,
          userAnswers: activeQuiz.userAnswers,
        };
        setResult(fallbackResult);
      }
    } catch (err) {
      console.error('Submit quiz error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    const unansweredCount = activeQuiz.userAnswers.filter((a) => a === -1).length;
    if (unansweredCount > 0) {
      Alert.alert(
        'Unanswered Questions',
        `You have ${unansweredCount} unanswered question(s). Do you want to submit anyway?`,
        [
          { text: 'Review Quiz', style: 'cancel' },
          {
            text: 'Submit Anyway',
            onPress: doSubmit,
          },
        ]
      );
      return;
    }
    doSubmit();
  };

  const handleRetry = async () => {
    if (!result) return;
    const { subject, topic, difficulty, totalQuestions } = result;
    setResult(null);
    setCurrentStep(0);
    setShowReview(true);
    await startQuiz(subject, topic, difficulty, totalQuestions);
  };

  // 2. RESULT VIEW (Completed Scorecard)
  if (result) {
    const isPassing = result.scorePercentage >= 60;
    const incorrectCount = result.totalQuestions - result.correctAnswers;

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bg,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconBadge, { backgroundColor: colors.warningBg }]}>
              <Ionicons name="trophy" size={18} color="#d97706" />
            </View>
            <View style={styles.headerTextCol}>
              <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Quiz Completed 🎉
              </Text>
              <Text numberOfLines={1} style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {result.topic}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={[styles.closeButton, { backgroundColor: colors.cardBorder }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Result Content */}
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Score Banner */}
          <View
            style={[
              styles.scoreBanner,
              {
                backgroundColor: isPassing ? colors.successBg : colors.warningBg,
                borderColor: isPassing ? colors.success : colors.warning,
              },
            ]}
          >
            <View
              style={[
                styles.scoreCircle,
                { backgroundColor: isPassing ? colors.success : colors.warning },
              ]}
            >
              <Text style={styles.scoreCircleText}>{result.scorePercentage}%</Text>
            </View>
            <Text style={[styles.resultHeadline, { color: colors.textPrimary }]}>
              {isPassing ? 'Excellent Work! 🎉' : 'Keep Practicing! 📚'}
            </Text>
            <Text style={[styles.resultSubhead, { color: colors.textMuted }]}>
              {isPassing
                ? 'You have demonstrated good mastery of this topic.'
                : 'Review the detailed explanations below to improve your score.'}
            </Text>

            {/* Progress track */}
            <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(result.scorePercentage, 6)}%`,
                    backgroundColor: isPassing ? colors.success : colors.warning,
                  },
                ]}
              />
            </View>
          </View>

          {/* Metric Boxes */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>SCORE</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {result.correctAnswers}/{result.totalQuestions}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textMuted }]}>Total Points</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.metricLabel, { color: colors.success }]}>CORRECT</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {result.correctAnswers}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textMuted }]}>Answers ✅</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.metricLabel, { color: colors.error }]}>INCORRECT</Text>
              <Text style={[styles.metricValue, { color: colors.error }]}>
                {incorrectCount}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textMuted }]}>Answers ❌</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setShowReview(!showReview)}
              style={[styles.actionBtn, { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}
            >
              <Ionicons name="eye-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                {showReview ? 'Hide Review' : 'Review Answers'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRetry}
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.textPrimary} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>
                Retry Quiz
              </Text>
            </Pressable>
          </View>

          {/* Question Breakdown */}
          {showReview && result.questions && result.questions.length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Question-by-Question Review
              </Text>

              {result.questions.map((q, qIdx) => {
                const userChoice = result.userAnswers[qIdx];
                const isCorrect = userChoice === q.correctAnswerIndex;
                const userChoiceText =
                  userChoice >= 0 && userChoice < q.options.length
                    ? q.options[userChoice]
                    : 'Unanswered';
                const correctAnswerText = q.options[q.correctAnswerIndex];

                return (
                  <View
                    key={q.id || `q_${qIdx}`}
                    style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  >
                    <View style={styles.qCardHeader}>
                      <Text style={[styles.qCardTitle, { color: colors.primary }]}>
                        Question {qIdx + 1}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: isCorrect ? colors.successBg : colors.errorBg,
                            borderColor: isCorrect ? colors.success : colors.error,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: isCorrect ? colors.success : colors.error },
                          ]}
                        >
                          {isCorrect ? 'Correct ✅' : 'Incorrect ❌'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.qText, { color: colors.textPrimary }]}>
                      {q.question}
                    </Text>

                    {/* Answer comparison */}
                    <View style={[styles.comparisonBox, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                      <View style={styles.compRow}>
                        <Text style={[styles.compLabel, { color: colors.textMuted }]}>
                          Your answer:
                        </Text>
                        <Text
                          style={[
                            styles.compVal,
                            { color: isCorrect ? colors.success : colors.error },
                          ]}
                        >
                          {userChoice >= 0 ? `${String.fromCharCode(65 + userChoice)}. ` : ''}
                          {userChoiceText}
                        </Text>
                      </View>

                      {!isCorrect && (
                        <View style={styles.compRow}>
                          <Text style={[styles.compLabel, { color: colors.success }]}>
                            Correct answer:
                          </Text>
                          <Text style={[styles.compVal, { color: colors.success, fontWeight: '700' }]}>
                            {String.fromCharCode(65 + q.correctAnswerIndex)}. {correctAnswerText}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Options list */}
                    <View style={styles.optList}>
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userChoice === optIdx;
                        const isAnswer = q.correctAnswerIndex === optIdx;

                        let optBg = colors.bg;
                        let optBorder = colors.cardBorder;
                        let optColor = colors.textPrimary;

                        if (isAnswer) {
                          optBg = colors.successBg;
                          optBorder = colors.success;
                          optColor = colors.success;
                        } else if (isSelected && !isAnswer) {
                          optBg = colors.errorBg;
                          optBorder = colors.error;
                          optColor = colors.error;
                        }

                        return (
                          <View
                            key={optIdx}
                            style={[
                              styles.optItem,
                              { backgroundColor: optBg, borderColor: optBorder },
                            ]}
                          >
                            <Text style={[styles.optItemText, { color: optColor }]}>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </Text>
                            {isAnswer && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
                          </View>
                        );
                      })}
                    </View>

                    {q.explanation ? (
                      <View style={[styles.expBox, { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}>
                        <Text style={[styles.expTitle, { color: colors.primary }]}>💡 EXPLANATION</Text>
                        <Text style={[styles.expText, { color: colors.textPrimary }]}>{q.explanation}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 12, marginBottom: 24 }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.primaryButtonText}>Back to Dashboard 🏠</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // 3. ACTIVE QUIZ RUNNER (Safe bounds indexing)
  if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Loading quiz...</Text>
      </View>
    );
  }

  const safeStep = Math.min(Math.max(currentStep, 0), activeQuiz.questions.length - 1);
  const currentQuestion = activeQuiz.questions[safeStep];
  const userSelected = activeQuiz.userAnswers ? activeQuiz.userAnswers[safeStep] : -1;
  const isFinalStep = safeStep === activeQuiz.questions.length - 1;
  const progressPercent = ((safeStep + 1) / (activeQuiz.questions.length || 1)) * 100;
  const answeredCount = activeQuiz.userAnswers ? activeQuiz.userAnswers.filter((a) => a !== -1).length : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.headerTextCol}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {activeQuiz.topic || 'Practice Quiz'}
            </Text>
            <Text numberOfLines={1} style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {activeQuiz.difficulty} Level
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleExitQuiz}
          style={[styles.closeButton, { backgroundColor: colors.cardBorder }]}
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Question Runner Content */}
      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.innerWrapper}>
          {/* Progress Header */}
          <View style={styles.progressHeader}>
            <View style={styles.progressTextRow}>
              <Text style={[styles.stepText, { color: colors.primary }]}>
                Question {safeStep + 1} of {activeQuiz.questions.length}
              </Text>
              <Text style={[styles.answeredText, { color: colors.textMuted }]}>
                {answeredCount}/{activeQuiz.questions.length} Answered
              </Text>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>

          {/* Question Text Box */}
          <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.questionText, { color: colors.textPrimary }]}>
              {currentQuestion.question}
            </Text>
          </View>

          {/* 4 Options (A, B, C, D) */}
          <View style={styles.optionsList}>
            {currentQuestion.options.map((option, optIdx) => {
              const isSelected = userSelected === optIdx;

              return (
                <Pressable
                  key={optIdx}
                  onPress={() => handleSelectOption(optIdx)}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected ? colors.primaryBg : colors.card,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionLetterBadge,
                        { backgroundColor: isSelected ? colors.primary : colors.cardBorder },
                      ]}
                    >
                      <Text style={[styles.optionLetterText, { color: isSelected ? '#ffffff' : colors.textPrimary }]}>
                        {String.fromCharCode(65 + optIdx)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: isSelected ? colors.primary : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.textMuted,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Pinned Controls */}
      <View
        style={[
          styles.bottomBar,
          {
            borderTopColor: colors.cardBorder,
            backgroundColor: colors.card,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.bottomBarRow}>
          <Pressable
            onPress={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            disabled={safeStep === 0}
            style={[
              styles.navBtn,
              {
                backgroundColor: colors.bg,
                borderColor: colors.cardBorder,
                opacity: safeStep === 0 ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>← Previous</Text>
          </Pressable>

          {isFinalStep ? (
            <Pressable
              onPress={handleSubmitQuiz}
              disabled={isSubmitting}
              style={[styles.navBtn, { backgroundColor: colors.success, borderColor: colors.success }]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.navBtnText, { color: '#ffffff' }]}>Submit Quiz ✨</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setCurrentStep((prev) => Math.min(prev + 1, activeQuiz.questions.length - 1))}
              style={[styles.navBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={[styles.navBtnText, { color: '#ffffff' }]}>Next →</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  innerWrapper: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
  },
  answeredText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  optionLetterBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  optionLabel: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  bottomBarRow: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreBanner: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreCircleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  resultHeadline: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultSubhead: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  reviewSection: {
    marginTop: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  qCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  qText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 10,
  },
  comparisonBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  compLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 95,
  },
  compVal: {
    fontSize: 11,
    flex: 1,
    fontWeight: '600',
  },
  optList: {
    gap: 6,
  },
  optItem: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optItemText: {
    fontSize: 12,
    flex: 1,
  },
  expBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  expTitle: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  expText: {
    fontSize: 12,
    lineHeight: 16,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
