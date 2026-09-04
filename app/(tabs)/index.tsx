import React, { useState } from 'react';
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
import { useChat } from '../../src/context/ChatContext';
import { useStudy } from '../../src/context/StudyContext';
import { SummarizerModal } from '../../components/SummarizerModal';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggleTheme, handleNewChat } = useChat();
  const {
    profile,
    quizHistory,
    documents,
    overallAccuracy,
    streakCount,
    startQuiz,
  } = useStudy();

  const [isSummarizerVisible, setIsSummarizerVisible] = useState(false);

  const studentFirstName = profile.name ? profile.name.split(' ')[0] : 'Student';

  // Real data only (0 if no activity recorded)
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
    heroBg: isDark ? '#1e1b4b' : '#4338ca',
    streakBg: isDark ? '#78350f' : '#fffbeb',
    streakBorder: isDark ? '#b45309' : '#fef3c7',
    streakText: '#d97706',
    btnBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 1. Header */}
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
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={[styles.avatarBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.avatarText}>
                {studentFirstName.slice(0, 1).toUpperCase()}
              </Text>
            </Pressable>
            <View style={styles.headerTextCol}>
              <Text numberOfLines={1} style={[styles.headerGreeting, { color: colors.textPrimary }]}>
                {getGreeting()}, {studentFirstName} 👋
              </Text>
              <Text numberOfLines={1} style={[styles.headerSub, { color: colors.textMuted }]}>
                Ready to learn something new?
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Streak Badge */}
            <View style={[styles.streakBadge, { backgroundColor: colors.streakBg, borderColor: colors.streakBorder }]}>
              <Ionicons name="flame" size={15} color="#f97316" />
              <Text style={[styles.streakText, { color: colors.streakText }]}>
                {realStreak} Day Streak
              </Text>
            </View>

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
          {/* Main AI Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: colors.heroBg }]}>
            <View style={styles.heroHeaderTag}>
              <Ionicons name="sparkles" size={14} color="#fbbf24" />
              <Text style={styles.heroTagText}>AI STUDY ASSISTANT</Text>
            </View>

            <Text style={styles.heroTitle}>AI Study Assistant</Text>
            <Text style={styles.heroSubtitle}>
              Ask questions, solve problems, understand your lessons and prepare for exams.
            </Text>

            <Pressable
              onPress={() => {
                handleNewChat();
                router.push('/(tabs)/chat');
              }}
              style={styles.heroCtaBtn}
            >
              <View style={styles.heroCtaLeft}>
                <Ionicons name="chatbubbles" size={16} color="#4f46e5" />
                <Text style={styles.heroCtaText}>Ask AI</Text>
              </View>
              <Text style={styles.heroCtaArrow}>→</Text>
            </Pressable>
          </View>

          {/* Quick Study Tools Grid (2x2) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              Quick Study Tools
            </Text>

            <View style={styles.gridRow}>
              {/* Scan Question */}
              <Pressable
                onPress={() => {
                  handleNewChat();
                  router.push('/(tabs)/chat');
                }}
                style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.toolIconBadge, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="camera" size={20} color="#0284c7" />
                </View>
                <Text numberOfLines={1} style={[styles.toolTitle, { color: colors.textPrimary }]}>
                  Scan Question
                </Text>
                <Text numberOfLines={1} style={[styles.toolSub, { color: colors.textMuted }]}>
                  Photo & textbook solver
                </Text>
              </Pressable>

              {/* Study Notes */}
              <Pressable
                onPress={() => router.push('/(tabs)/study')}
                style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.toolIconBadge, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="document-text" size={20} color="#9333ea" />
                </View>
                <Text numberOfLines={1} style={[styles.toolTitle, { color: colors.textPrimary }]}>
                  Study Notes
                </Text>
                <Text numberOfLines={1} style={[styles.toolSub, { color: colors.textMuted }]}>
                  PDFs & documents
                </Text>
              </Pressable>
            </View>

            <View style={styles.gridRow}>
              {/* Quiz */}
              <Pressable
                onPress={() => router.push('/(tabs)/study')}
                style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.toolIconBadge, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="clipboard" size={20} color="#d97706" />
                </View>
                <Text numberOfLines={1} style={[styles.toolTitle, { color: colors.textPrimary }]}>
                  Quiz
                </Text>
                <Text numberOfLines={1} style={[styles.toolSub, { color: colors.textMuted }]}>
                  Practice exam MCQs
                </Text>
              </Pressable>

              {/* Summarize */}
              <Pressable
                onPress={() => setIsSummarizerVisible(true)}
                style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.toolIconBadge, { backgroundColor: '#d1fae5' }]}>
                  <Ionicons name="sparkles" size={20} color="#059669" />
                </View>
                <Text numberOfLines={1} style={[styles.toolTitle, { color: colors.textPrimary }]}>
                  Summarize
                </Text>
                <Text numberOfLines={1} style={[styles.toolSub, { color: colors.textMuted }]}>
                  Revision cards
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Recent Activity
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/progress')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>View Analytics →</Text>
              </Pressable>
            </View>

            {quizHistory.length === 0 && documents.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="clipboard-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No recent activity yet.
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Start by asking AI a question.
                </Text>
              </View>
            ) : (
              <View style={styles.activityList}>
                {quizHistory.slice(0, 3).map((quiz) => (
                  <Pressable
                    key={quiz.id}
                    onPress={() => router.push('/(tabs)/progress')}
                    style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.activityLeft}>
                      <View style={[styles.activityIconBadge, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="clipboard" size={16} color="#d97706" />
                      </View>
                      <View style={styles.activityTextCol}>
                        <Text numberOfLines={1} style={[styles.activityTitle, { color: colors.textPrimary }]}>
                          {quiz.title}
                        </Text>
                        <Text style={[styles.activitySub, { color: colors.textMuted }]}>
                          {new Date(quiz.timestamp).toLocaleDateString()} • {quiz.correctAnswers}/{quiz.totalQuestions} Correct
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>{quiz.scorePercentage}%</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Summarizer Modal */}
      <SummarizerModal
        visible={isSummarizerVisible}
        onClose={() => setIsSummarizerVisible(false)}
        initialSubject="Physics"
        onTakeQuizOnTopic={async (subj, top) => {
          await startQuiz(subj, top, 'Medium', 5);
          router.push('/quiz/session');
        }}
      />
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
    maxWidth: 720,
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
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerTextCol: {
    flex: 1,
  },
  headerGreeting: {
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
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
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  heroCard: {
    padding: 20,
    borderRadius: 24,
  },
  heroHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#e0e7ff',
    marginTop: 4,
    lineHeight: 18,
  },
  heroCtaBtn: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  heroCtaArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
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
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toolCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  toolIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toolSub: {
    fontSize: 10,
    marginTop: 2,
  },
  progressSectionCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  progressStatBox: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  activityIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityTextCol: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  activitySub: {
    fontSize: 10,
    marginTop: 1,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
});
