import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../src/hooks/useResponsive';

interface EmptyChatProps {
  onSelectPrompt: (prompt: string) => void;
  onAttachImage?: () => void;
}

const STUDY_PILLS = [
  {
    icon: '📸',
    label: 'Scan & Solve Question',
    prompt: 'Please solve and explain this textbook question step-by-step with clear reasoning and formulas.',
    isImageAction: true,
  },
  {
    icon: '🧠',
    label: 'Explain Complex Concept',
    prompt: 'Explain this study topic from fundamentals using simple analogies, intuitive examples, and visual diagrams.',
  },
  {
    icon: '⚡',
    label: 'Generate Formula Sheet',
    prompt: 'Create a comprehensive revision cheat sheet listing all core formulas, SI units, and key laws for this topic.',
  },
  {
    icon: '📝',
    label: 'Practice Quiz MCQs',
    prompt: 'Generate 5 challenging multiple choice exam questions with detailed answer explanations.',
  },
];

export const EmptyChat: React.FC<EmptyChatProps> = ({ onSelectPrompt, onAttachImage }) => {
  const { isWideScreen } = useResponsive();

  const handlePillPress = (pill: typeof STUDY_PILLS[0]) => {
    if (pill.isImageAction && onAttachImage) {
      onAttachImage();
      return;
    }
    onSelectPrompt(pill.prompt);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        {
          paddingHorizontal: isWideScreen ? 32 : 20,
          paddingVertical: isWideScreen ? 48 : 24,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerBox}>
        {/* Brand Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="school-outline" size={32} color="#6366f1" />
        </View>

        {/* Title */}
        <Text style={styles.title}>AI Study Assistant</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Ask any study question, attach textbook photos, or choose a learning action below.
        </Text>

        {/* Action Chips */}
        <View style={styles.pillsRow}>
          {STUDY_PILLS.map((pill, idx) => (
            <Pressable
              key={idx}
              onPress={() => handlePillPress(pill)}
              style={styles.pillBtn}
            >
              <Text style={styles.pillEmoji}>{pill.icon}</Text>
              <Text style={styles.pillLabel}>{pill.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 360,
  },
  pillsRow: {
    width: '100%',
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
});
