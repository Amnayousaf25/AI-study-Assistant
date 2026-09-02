import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '../../src/context/StudyContext';
import { useChat } from '../../src/context/ChatContext';
import { QuizDifficulty } from '../../src/types/study';

const DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard'];
const QUESTION_COUNTS = [5, 10];

export default function TabQuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useChat();
  const { startQuiz } = useStudy();

  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    const topicToUse = topic.trim() || 'General Knowledge';
    setErrorMsg(null);
    setIsGenerating(true);

    try {
      await startQuiz(topicToUse, difficulty, questionCount);
      setIsGenerating(false);
      router.push('/quiz/session');
    } catch (err) {
      console.error('Quiz generation failed:', err);
      setIsGenerating(false);
      setErrorMsg('Failed to generate quiz. Please check your connection and try again.');
    }
  };

  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    headerBg: isDark ? '#0f172a' : '#ffffff',
    card: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#1e293b' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#6366f1',
    primaryBg: isDark ? '#1e1b4b' : '#eef2ff',
    inputBg: isDark ? '#0f172a' : '#ffffff',
    btnBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      {/* Top Header */}
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
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: colors.btnBg }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.headerTitleCol}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Create a Quiz
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              AI-powered practice MCQs
            </Text>
          </View>

          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: colors.btnBg }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerWrapper}>
          {/* Banner Card */}
          <View style={[styles.bannerCard, { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[styles.bannerText, { color: colors.textPrimary }]}>
              Practice any topic with instant AI multiple-choice questions & explanations.
            </Text>
          </View>

          {/* 1. Topic Input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
              What topic do you want to practice?
            </Text>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="Enter topic (e.g. Kinematics, Derivatives, World History)..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              autoFocus
            />
          </View>

          {/* 2. Difficulty Selection */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
              Difficulty
            </Text>
            <View style={styles.optionRow}>
              {DIFFICULTIES.map((diff) => {
                const isSelected = difficulty === diff;
                return (
                  <Pressable
                    key={diff}
                    onPress={() => setDifficulty(diff)}
                    style={[
                      styles.choiceCard,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        { color: isSelected ? '#ffffff' : colors.textPrimary },
                      ]}
                    >
                      {diff}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 3. Number of Questions */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
              Number of Questions
            </Text>
            <View style={styles.optionRow}>
              {QUESTION_COUNTS.map((cnt) => {
                const isSelected = questionCount === cnt;
                return (
                  <Pressable
                    key={cnt}
                    onPress={() => setQuestionCount(cnt)}
                    style={[
                      styles.choiceCard,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        { color: isSelected ? '#ffffff' : colors.textPrimary },
                      ]}
                    >
                      {cnt} Questions
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <Pressable
            onPress={handleGenerate}
            disabled={isGenerating}
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: isGenerating ? 0.7 : 1 },
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Generate Quiz</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
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
    gap: 20,
  },
  bannerCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 48,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  errorText: {
    fontSize: 12,
    color: '#e11d48',
    textAlign: 'center',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
