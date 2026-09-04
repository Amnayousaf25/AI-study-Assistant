import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckIcon,
  QuizIcon,
  BrainIcon,
  CameraIcon,
  LayersIcon,
  TrashIcon,
} from '../../components/Icons';
import { useStudy } from '../../src/context/StudyContext';
import { useChat } from '../../src/context/ChatContext';
import { SummarizerModal } from '../../components/SummarizerModal';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, handleNewChat, handleSend } = useChat();
  const {
    subjects,
    deleteSubject,
    toggleTopicCompletion,
    startQuiz,
    documents,
  } = useStudy();

  const subject = useMemo(() => {
    return subjects.find((s) => s.id === id) || subjects[0];
  }, [subjects, id]);

  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [summarizerTopic, setSummarizerTopic] = useState<string>('');

  if (!subject) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Subject not found
        </Text>
      </View>
    );
  }

  const completionRate = Math.round((subject.completedTopicsCount / (subject.topicsCount || 1)) * 100);

  const subjectDocuments = documents.filter(
    (d) => d.subject?.toLowerCase() === subject.name.toLowerCase()
  );

  const handleStudyTopic = (topicName: string) => {
    handleNewChat();
    router.push('/(tabs)/chat');
    setTimeout(() => {
      handleSend(
        `I am studying the topic "${topicName}" in ${subject.name}. Please explain the governing theory, core formulas, key exam traps, and real-world examples.`,
        undefined
      );
    }, 250);
  };

  const handleStartSubjectQuiz = async () => {
    await startQuiz(subject.name, 'Comprehensive Course Review', 'Medium', 5);
    router.push('/quiz/session');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to remove ${subject.name} from your active courses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSubject(subject.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
      className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}
    >
      {/* Header */}
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
              {subject.name}
            </Text>
            <Text numberOfLines={1} className="text-xs text-slate-400">
              {subject.code || 'Course'} • {completionRate}% Mastered
            </Text>
          </View>
        </View>

        {!subject.isDefault && (
          <Pressable
            onPress={handleDelete}
            className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center active:bg-rose-100"
            hitSlop={8}
          >
            <TrashIcon size={15} color="#f43f5e" />
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-md mx-auto space-y-5 gap-5">
          {/* Course Hero Banner */}
          <View
            style={{ backgroundColor: `${subject.color}15` }}
            className="rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg">
                <Text style={{ color: subject.color }} className="text-xs font-black">
                  {subject.code || 'CS-COURSE'}
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {subject.completedTopicsCount}/{subject.topicsCount} Topics Complete
              </Text>
            </View>

            <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
              {subject.name}
            </Text>
            {subject.description && (
              <Text className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-5">
                {subject.description}
              </Text>
            )}

            {/* Progress Bar */}
            <View className="w-full h-2.5 bg-white/70 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
              <View
                style={{
                  width: `${Math.max(completionRate, 8)}%`,
                  backgroundColor: subject.color,
                }}
                className="h-full rounded-full"
              />
            </View>
          </View>

          {/* Quick Subject Tools */}
          <View>
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 px-1">
              Course Study Tools
            </Text>

            <View className="grid grid-cols-2 gap-2.5 flex-row flex-wrap">
              <Pressable
                onPress={() => {
                  setSummarizerTopic('');
                  setIsSummarizerOpen(true);
                }}
                className="flex-1 min-w-[140px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs active:scale-[0.98]"
              >
                <BrainIcon size={18} color="#059669" />
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-50 mt-2">
                  Generate Summary
                </Text>
                <Text className="text-[10px] text-slate-400">Key concepts & cards</Text>
              </Pressable>

              <Pressable
                onPress={handleStartSubjectQuiz}
                className="flex-1 min-w-[140px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs active:scale-[0.98]"
              >
                <QuizIcon size={18} color="#d97706" />
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-50 mt-2">
                  Take Exam Quiz
                </Text>
                <Text className="text-[10px] text-slate-400">Full-screen practice</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/tools/assignment-solver')}
                className="flex-1 min-w-[140px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs active:scale-[0.98]"
              >
                <CameraIcon size={18} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-50 mt-2">
                  Solve Assignment
                </Text>
                <Text className="text-[10px] text-slate-400">Step-by-step problem</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/tools/presentation-generator')}
                className="flex-1 min-w-[140px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs active:scale-[0.98]"
              >
                <LayersIcon size={18} color="#8b5cf6" />
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-50 mt-2">
                  Make Presentation
                </Text>
                <Text className="text-[10px] text-slate-400">Slide deck & notes</Text>
              </Pressable>
            </View>
          </View>

          {/* Syllabus Topics & Completion Checkboxes */}
          <View>
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 px-1">
              Course Syllabus Topics ({subject.topics.length})
            </Text>

            <View className="space-y-2 gap-2">
              {subject.topics.map((top, idx) => (
                <View
                  key={top.id}
                  className="flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs"
                >
                  <Pressable
                    onPress={() => toggleTopicCompletion(subject.id, top.id)}
                    className="flex-row items-center space-x-3 gap-3 flex-1 mr-2"
                  >
                    <View
                      className={`w-6 h-6 rounded-lg border items-center justify-center ${
                        top.isCompleted
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      {top.isCompleted && <CheckIcon size={12} color="#ffffff" />}
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className={`text-xs font-bold ${
                          top.isCompleted
                            ? 'text-slate-400 line-through'
                            : 'text-slate-900 dark:text-slate-50'
                        }`}
                      >
                        {top.name}
                      </Text>
                      <Text className="text-[10px] text-slate-400">
                        Topic {idx + 1}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => handleStudyTopic(top.name)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800"
                  >
                    <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Study
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Saved Subject Notes */}
          {subjectDocuments.length > 0 && (
            <View>
              <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                Saved Course Notes & Summaries ({subjectDocuments.length})
              </Text>
              <View className="space-y-2 gap-2">
                {subjectDocuments.map((doc) => (
                  <View
                    key={doc.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs"
                  >
                    <Text numberOfLines={1} className="text-xs font-bold text-slate-900 dark:text-slate-50">
                      {doc.name}
                    </Text>
                    <Text numberOfLines={2} className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-4">
                      {doc.extractedText?.slice(0, 140)}...
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Summarizer Modal */}
      <SummarizerModal
        visible={isSummarizerOpen}
        onClose={() => setIsSummarizerOpen(false)}
        initialSubject={subject.name}
        initialTopic={summarizerTopic}
        onTakeQuizOnTopic={async (subj, top) => {
          await startQuiz(subj, top, 'Medium', 5);
          router.push('/quiz/session');
        }}
      />
    </View>
  );
}
