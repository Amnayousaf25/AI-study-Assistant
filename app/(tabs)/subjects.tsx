import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpenIcon,
  PlusIcon,
  SearchIcon,
  QuizIcon,
  BrainIcon,
  ChatIcon,
  TrashIcon,
  CloseIcon,
  SunIcon,
  MoonIcon,
  GraduationCapIcon,
} from '../../components/Icons';
import { useStudy } from '../../src/context/StudyContext';
import { useChat } from '../../src/context/ChatContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import { SubjectItem } from '../../src/types/study';
import { SummarizerModal } from '../../components/SummarizerModal';

export default function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isWideScreen } = useResponsive();
  const { isDark, toggleTheme, handleNewChat, handleSend } = useChat();
  const { subjects, addSubject, deleteSubject, startQuiz } = useStudy();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjDesc, setNewSubjDesc] = useState('');
  const [subjError, setSubjError] = useState<string | null>(null);

  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [activeSubjectForSummary, setActiveSubjectForSummary] = useState<string>('Artificial Intelligence');

  const handleCreateSubject = async () => {
    if (!newSubjName.trim()) {
      setSubjError('Please enter a course name.');
      return;
    }
    setSubjError(null);
    await addSubject(newSubjName.trim(), newSubjDesc.trim(), undefined, newSubjCode.trim());
    setNewSubjName('');
    setNewSubjCode('');
    setNewSubjDesc('');
    setIsAddSubjectOpen(false);
  };

  const handleOpenSubjectDetail = (subj: SubjectItem) => {
    router.push({
      pathname: '/subject/[id]',
      params: { id: subj.id },
    });
  };

  const handleStartQuizForSubject = async (subj: SubjectItem) => {
    await startQuiz(subj.name, 'Core Course Revision', 'Medium', 5);
    router.push('/quiz/session');
  };

  const handleOpenSummaryForSubject = (subj: SubjectItem) => {
    setActiveSubjectForSummary(subj.name);
    setIsSummarizerOpen(true);
  };

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Pinned Top Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 pt-3 pb-3 shadow-xs z-10"
      >
        <View className="w-full max-w-md mx-auto flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5 gap-2.5 flex-1 mr-2">
            <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 items-center justify-center">
              <BookOpenIcon size={20} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                University Courses
              </Text>
              <Text numberOfLines={1} className="text-xs text-slate-400 font-medium">
                {subjects.length} active courses & modules
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2 gap-2">
            <Pressable
              onPress={() => setIsAddSubjectOpen(true)}
              className="flex-row items-center bg-indigo-600 active:bg-indigo-700 px-3 py-2 rounded-xl shadow-xs min-h-[36px] active:scale-95 transition-all"
              accessibilityLabel="Add Course"
            >
              <PlusIcon size={14} color="#ffffff" />
              <Text className="text-xs font-bold text-white ml-1.5 whitespace-nowrap">+ Add Course</Text>
            </Pressable>

            <Pressable
              onPress={toggleTheme}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200"
              accessibilityLabel="Toggle Theme"
              hitSlop={6}
            >
              {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 90, // Tab bar clearance
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-md mx-auto space-y-4 gap-4">
          {/* Search Bar */}
          <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 shadow-xs">
            <SearchIcon size={16} color="#94a3b8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search courses by code or title..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 text-xs text-slate-900 dark:text-slate-100 min-h-[24px]"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <CloseIcon size={14} color="#94a3b8" />
              </Pressable>
            )}
          </View>

          {/* Subjects List */}
          {filteredSubjects.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 items-center">
              <GraduationCapIcon size={36} color="#94a3b8" />
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2.5">
                No courses found
              </Text>
              <Text className="text-xs text-slate-400 text-center mt-1">
                {searchQuery ? 'Try a different search query.' : 'Tap "+ Add Course" to add your semester subjects.'}
              </Text>
            </View>
          ) : (
            <View className="space-y-3 gap-3">
              {filteredSubjects.map((subj) => {
                const completionRate = Math.round((subj.completedTopicsCount / (subj.topicsCount || 1)) * 100);

                return (
                  <Pressable
                    key={subj.id}
                    onPress={() => handleOpenSubjectDetail(subj)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs active:scale-[0.99] transition-all"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-center space-x-3 gap-3 flex-1 mr-2">
                        <View
                          style={{ backgroundColor: `${subj.color}15` }}
                          className="w-11 h-11 rounded-2xl items-center justify-center border border-slate-100 dark:border-slate-800"
                        >
                          <Text style={{ color: subj.color }} className="font-black text-sm">
                            {subj.code ? subj.code.slice(0, 2) : subj.name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-center space-x-2 gap-2">
                            <Text numberOfLines={1} className="text-base font-bold text-slate-900 dark:text-slate-50">
                              {subj.name}
                            </Text>
                          </View>
                          <Text numberOfLines={1} className="text-xs text-slate-400 mt-0.5">
                            {subj.code || 'Course'} • {subj.completedTopicsCount}/{subj.topicsCount} Topics • {completionRate}% Mastery
                          </Text>
                        </View>
                      </View>

                      {!subj.isDefault && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteSubject(subj.id);
                          }}
                          className="w-8 h-8 rounded-full items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/60"
                          hitSlop={8}
                        >
                          <TrashIcon size={14} color="#94a3b8" />
                        </Pressable>
                      )}
                    </View>

                    {subj.description && (
                      <Text numberOfLines={2} className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-4">
                        {subj.description}
                      </Text>
                    )}

                    {/* Progress Track */}
                    <View className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3 mb-3">
                      <View
                        style={{
                          width: `${Math.max(completionRate, 8)}%`,
                          backgroundColor: subj.color,
                        }}
                        className="h-full rounded-full"
                      />
                    </View>

                    {/* Actions: Study, Summary, Quiz */}
                    <View className="flex-row items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenSubjectDetail(subj);
                        }}
                        className="flex-1 flex-row items-center justify-center bg-indigo-600 active:bg-indigo-700 py-2 rounded-xl min-h-[36px] active:scale-95 transition-all shadow-xs"
                      >
                        <ChatIcon size={13} color="#ffffff" />
                        <Text className="text-xs font-bold text-white ml-1.5">Syllabus</Text>
                      </Pressable>

                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenSummaryForSubject(subj);
                        }}
                        className="flex-1 flex-row items-center justify-center bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 py-2 rounded-xl min-h-[36px] active:scale-95 transition-all"
                      >
                        <BrainIcon size={13} color="#059669" />
                        <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-1.5">
                          Summary
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleStartQuizForSubject(subj);
                        }}
                        className="flex-1 flex-row items-center justify-center bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 py-2 rounded-xl min-h-[36px] active:scale-95 transition-all"
                      >
                        <QuizIcon size={13} color="#d97706" />
                        <Text className="text-xs font-bold text-amber-700 dark:text-amber-300 ml-1.5">
                          Quiz
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Course Modal */}
      <Modal visible={isAddSubjectOpen} animationType="slide" transparent={true} onRequestClose={() => setIsAddSubjectOpen(false)}>
        <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-0 sm:p-4">
          <TouchableWithoutFeedback onPress={() => setIsAddSubjectOpen(false)}>
            <View className="absolute inset-0" />
          </TouchableWithoutFeedback>
          <View className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-10">
            <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Add Semester Course
              </Text>
              <Pressable onPress={() => setIsAddSubjectOpen(false)} hitSlop={8}>
                <CloseIcon size={16} color="#64748b" />
              </Pressable>
            </View>

            <TextInput
              value={newSubjCode}
              onChangeText={setNewSubjCode}
              placeholder="Course Code (e.g. CS-407, EE-201)"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 mb-2.5 min-h-[40px]"
            />

            <TextInput
              value={newSubjName}
              onChangeText={setNewSubjName}
              placeholder="Course Title (e.g. Cloud Computing, Cryptography)"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 mb-2.5 min-h-[40px]"
            />

            <TextInput
              value={newSubjDesc}
              onChangeText={setNewSubjDesc}
              placeholder="Optional course syllabus description or goals..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 min-h-[75px] mb-3"
              style={{ textAlignVertical: 'top' }}
            />

            {subjError && (
              <Text className="text-xs text-rose-500 font-medium mb-3">
                ⚠️ {subjError}
              </Text>
            )}

            <Pressable
              onPress={handleCreateSubject}
              className="w-full bg-indigo-600 active:bg-indigo-700 py-3 rounded-xl items-center shadow-sm min-h-[44px] justify-center"
            >
              <Text className="text-xs font-bold text-white">Save University Course</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Summarizer Modal */}
      <SummarizerModal
        visible={isSummarizerOpen}
        onClose={() => setIsSummarizerOpen(false)}
        initialSubject={activeSubjectForSummary}
        onTakeQuizOnTopic={async (subj, top) => {
          await startQuiz(subj, top, 'Medium', 5);
          router.push('/quiz/session');
        }}
      />
    </View>
  );
}
