import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '../../src/context/StudyContext';
import { useChat } from '../../src/context/ChatContext';

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useChat();
  const {
    quizHistory,
    overallAccuracy,
    streakCount,
    clearAllQuizzes,
  } = useStudy();

  // Strict Real User Data (0 default if no history)
  const realQuizzesCount = quizHistory.length;
  const realQuestionsSolved = quizHistory.reduce((acc, q) => acc + q.totalQuestions, 0);
  const realAccuracy = quizHistory.length > 0 ? overallAccuracy : 0;
  const realStreak = streakCount > 0 ? streakCount : 0;

  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    headerBg: isDark ? '#0f172a' : '#ffffff',
    card: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#1e293b' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#6366f1',
    primaryBg: isDark ? '#1e1b4b' : '#eef2ff',
    btnBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 1. Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatarBadge, { backgroundColor: colors.primaryBg }]}>
              <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Your Progress
              </Text>
              <Text numberOfLines={1} style={[styles.headerSub, { color: colors.textMuted }]}>
                Track your learning journey
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              onPress={toggleTheme}
              style={[styles.themeBtn, { backgroundColor: colors.btnBg }]}
              accessibilityLabel="Toggle Theme"
              hitSlop={6}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={14} color={isDark ? '#f59e0b' : '#6366f1'} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* 2. Scrollable Content */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerWrapper}>
          {/* 4 REAL STATISTIC CARDS */}
          <View style={styles.statsGrid}>
            {/* Questions Solved */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>{realQuestionsSolved}</Text>
              <Text style={[styles.statTitle, { color: colors.textPrimary }]}>Questions</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Solved</Text>
            </View>

            {/* Quizzes Completed */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{realQuizzesCount}</Text>
              <Text style={[styles.statTitle, { color: colors.textPrimary }]}>Quizzes</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Completed</Text>
            </View>

            {/* Accuracy */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>{realAccuracy}%</Text>
              <Text style={[styles.statTitle, { color: colors.textPrimary }]}>Accuracy</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Average score</Text>
            </View>

            {/* Study Streak */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{realStreak} days</Text>
              <Text style={[styles.statTitle, { color: colors.textPrimary }]}>Study Streak</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Daily activity</Text>
            </View>
          </View>

          {/* VISUAL PERFORMANCE BREAKDOWN CARD */}
          <View style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.analyticsHeader}>
              <View style={styles.analyticsTitleRow}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={[styles.analyticsTitle, { color: colors.textPrimary }]}>
                  Performance Analytics
                </Text>
              </View>
              <View style={[styles.masteryBadge, { backgroundColor: realAccuracy >= 80 ? '#ecfdf5' : realAccuracy >= 50 ? '#fffbeb' : '#fef2f2' }]}>
                <Text style={[styles.masteryText, { color: realAccuracy >= 80 ? '#059669' : realAccuracy >= 50 ? '#d97706' : '#dc2626' }]}>
                  {realQuizzesCount === 0 ? 'No Data Yet' : realAccuracy >= 80 ? 'Mastered 🌟' : realAccuracy >= 50 ? 'On Track 👍' : 'Needs Practice 🎯'}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Overall Accuracy Level</Text>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>{realAccuracy}%</Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(realAccuracy, 100)}%`,
                      backgroundColor: realAccuracy >= 80 ? '#10b981' : realAccuracy >= 50 ? '#6366f1' : '#f59e0b',
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* RECENT QUIZ RESULTS */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Recent Quiz Results
              </Text>
              {quizHistory.length > 0 && (
                <Pressable onPress={clearAllQuizzes} hitSlop={8}>
                  <Text style={styles.clearText}>Clear History</Text>
                </Pressable>
              )}
            </View>

            {quizHistory.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="clipboard-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No quiz results yet
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Complete your first AI quiz to see your progress here.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/study')}
                  style={[styles.emptyCtaBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.emptyCtaText}>Generate Quiz</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.listGap}>
                {quizHistory.map((q) => (
                  <View
                    key={q.id}
                    style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.historyLeft}>
                      <Text numberOfLines={1} style={[styles.historyTitle, { color: colors.textPrimary }]}>
                        {q.topic}
                      </Text>
                      <Text style={[styles.historySub, { color: colors.textMuted }]}>
                        {q.difficulty} • {new Date(q.timestamp).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>
                        {q.correctAnswers} / {q.totalQuestions} ({q.scorePercentage}%)
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
  },
  headerRow: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 36,
  },
  quizBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 4,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  innerWrapper: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f43f5e',
  },
  listGap: {
    gap: 10,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  emptyCtaBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  historyItem: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flex: 1,
    marginRight: 10,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  historySub: {
    fontSize: 10,
    marginTop: 1,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  analyticsCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyticsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  masteryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  masteryText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressContainer: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
