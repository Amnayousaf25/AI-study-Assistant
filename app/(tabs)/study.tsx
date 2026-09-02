import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DocumentIcon,
  PdfIcon,
  PlusIcon,
  BrainIcon,
  ChatIcon,
  TrashIcon,
  CloseIcon,
  SparklesIcon,
  SendIcon,
  SunIcon,
  MoonIcon,
} from '../../components/Icons';
import { useStudy } from '../../src/context/StudyContext';
import { useChat } from '../../src/context/ChatContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import { StudyDocument } from '../../src/types/study';
import { SummarizerModal } from '../../components/SummarizerModal';
import { askDocumentQuestion } from '../../src/services/aiService';

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isWideScreen } = useResponsive();
  const { isDark, toggleTheme, handleNewChat, handleSend } = useChat();
  const {
    documents,
    isProcessingDoc,
    pickAndUploadDocument,
    createNoteDocument,
    deleteDocument,
  } = useStudy();

  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [selectedDocForSummary, setSelectedDocForSummary] = useState<StudyDocument | null>(null);

  // Create Note Modal
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Ask Doc Modal
  const [selectedDocForQA, setSelectedDocForQA] = useState<StudyDocument | null>(null);
  const [docQuestion, setDocQuestion] = useState('');
  const [docAnswer, setDocAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [qaStatusText, setQaStatusText] = useState('Processing document...');
  const [qaError, setQaError] = useState<string | null>(null);

  const handleUploadPDF = async () => {
    await pickAndUploadDocument();
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    await createNoteDocument(noteTitle.trim(), noteContent.trim());
    setNoteTitle('');
    setNoteContent('');
    setIsCreateNoteOpen(false);
  };

  const handleOpenSummarizerForDoc = (doc: StudyDocument) => {
    setSelectedDocForSummary(doc);
    setIsSummarizerOpen(true);
  };

  const handleChatWithDocInMainChat = (doc: StudyDocument) => {
    handleNewChat();
    router.push('/(tabs)/chat');
    setTimeout(() => {
      handleSend(
        `I am studying the document "${doc.name}". Here is the document content:\n\n"""\n${doc.extractedText || ''}\n"""\n\nPlease provide a clear overview and explain the key concepts.`,
        undefined
      );
    }, 200);
  };

  const handleAskDocDirect = async () => {
    if (!selectedDocForQA || !docQuestion.trim() || isAnswering) return;
    setIsAnswering(true);
    setQaStatusText('Processing document...');
    setQaError(null);

    try {
      setTimeout(() => setQaStatusText('Asking AI...'), 600);
      setTimeout(() => setQaStatusText('Generating answer...'), 1200);

      const docContext = `${selectedDocForQA.name}\n\n${selectedDocForQA.extractedText || ''}`;
      const ans = await askDocumentQuestion(
        docContext,
        docQuestion.trim(),
        selectedDocForQA.base64Data,
        selectedDocForQA.mimeType
      );
      setDocAnswer(ans);
    } catch (err) {
      console.error('Doc Q&A error:', err);
      setQaError('Could not process question with document. Please try again.');
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Pinned Top Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 pt-3 pb-3 shadow-xs z-10"
      >
        <View className="w-full max-w-md mx-auto flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5 gap-2.5 flex-1 mr-2">
            <View className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/70 border border-sky-100 dark:border-sky-800/60 items-center justify-center">
              <DocumentIcon size={20} color="#0284c7" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                Study Materials
              </Text>
              <Text numberOfLines={1} className="text-xs text-slate-400 font-medium">
                Your notes, PDFs and learning resources
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2 gap-2">
            <Pressable
              onPress={handleUploadPDF}
              disabled={isProcessingDoc}
              className="flex-row items-center bg-indigo-600 active:bg-indigo-700 px-3 py-2 rounded-xl shadow-xs min-h-[36px] active:scale-95 transition-all"
              accessibilityLabel="Upload Material"
            >
              {isProcessingDoc ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <PlusIcon size={14} color="#ffffff" />
                  <Text className="text-xs font-bold text-white ml-1.5 whitespace-nowrap">Upload</Text>
                </>
              )}
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

      {/* Main Scrollable Area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 90, // Tab bar clearance
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-md mx-auto space-y-5 gap-5">
          {/* Quick Action Upload Tiles */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleUploadPDF}
              disabled={isProcessingDoc}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex-row items-center space-x-2.5 gap-2.5 active:scale-[0.98] transition-all min-h-[48px]"
            >
              <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 items-center justify-center">
                <PdfIcon size={22} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-xs font-bold text-slate-900 dark:text-slate-50">
                  Upload Material
                </Text>
                <Text numberOfLines={1} className="text-[10px] text-slate-400">PDF, DOC, TXT</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setIsCreateNoteOpen(true)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex-row items-center space-x-2.5 gap-2.5 active:scale-[0.98] transition-all min-h-[48px]"
            >
              <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 items-center justify-center">
                <BrainIcon size={22} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-xs font-bold text-slate-900 dark:text-slate-50">
                  Create Note
                </Text>
                <Text numberOfLines={1} className="text-[10px] text-slate-400">Type or paste</Text>
              </View>
            </Pressable>
          </View>

          {/* Library Cards List */}
          <View>
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 px-1">
              Your Library ({documents.length})
            </Text>

            {documents.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-8 items-center text-center">
                <View className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 items-center justify-center mb-3">
                  <DocumentIcon size={32} color="#6366f1" />
                </View>
                <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No Study Materials
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1 max-w-xs leading-4">
                  Your study library is empty. Upload your first PDF or note to get started.
                </Text>
                <Pressable
                  onPress={handleUploadPDF}
                  className="mt-4 bg-indigo-600 active:bg-indigo-700 px-5 py-2.5 rounded-xl shadow-xs"
                >
                  <Text className="text-xs font-bold text-white">+ Upload Material</Text>
                </Pressable>
              </View>
            ) : (
              <View className="space-y-3 gap-3">
                {documents.map((doc) => (
                  <View
                    key={doc.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-center space-x-3 gap-3 flex-1 mr-2">
                        <View className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/70 items-center justify-center">
                          {doc.mimeType?.includes('pdf') ? (
                            <PdfIcon size={24} color="#ef4444" />
                          ) : (
                            <DocumentIcon size={20} color="#0284c7" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text numberOfLines={1} className="text-sm font-bold text-slate-900 dark:text-slate-50">
                            {doc.name}
                          </Text>
                          <Text numberOfLines={1} className="text-[10px] text-slate-400 mt-0.5">
                            {doc.mimeType?.includes('pdf') ? 'PDF' : 'Note'} •{' '}
                            {doc.sizeBytes ? `${(doc.sizeBytes / (1024 * 1024)).toFixed(1)} MB • ` : ''}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => deleteDocument(doc.id)}
                        className="w-8 h-8 rounded-full items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/60"
                        hitSlop={8}
                      >
                        <TrashIcon size={15} color="#94a3b8" />
                      </Pressable>
                    </View>

                    {/* Action Buttons: Ask AI, Summarize, Chat */}
                    <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Pressable
                        onPress={() => {
                          setSelectedDocForQA(doc);
                          setDocQuestion('');
                          setDocAnswer(null);
                          setQaError(null);
                        }}
                        className="flex-1 flex-row items-center justify-center bg-indigo-600 active:bg-indigo-700 py-2 rounded-xl shadow-xs min-h-[36px] active:scale-95 transition-all"
                      >
                        <ChatIcon size={13} color="#ffffff" />
                        <Text className="text-xs font-bold text-white ml-1.5">Ask AI</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleOpenSummarizerForDoc(doc)}
                        className="flex-1 flex-row items-center justify-center bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 py-2 rounded-xl active:bg-indigo-100 min-h-[36px] active:scale-95 transition-all"
                      >
                        <BrainIcon size={13} color="#6366f1" />
                        <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">
                          Summarize
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleChatWithDocInMainChat(doc)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 active:bg-slate-200 min-h-[36px] justify-center"
                      >
                        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Chat →
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 1. Create Note Dialog */}
      <Modal visible={isCreateNoteOpen} animationType="slide" transparent={true} onRequestClose={() => setIsCreateNoteOpen(false)}>
        <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-0 sm:p-4">
          <TouchableWithoutFeedback onPress={() => setIsCreateNoteOpen(false)}>
            <View className="absolute inset-0" />
          </TouchableWithoutFeedback>
          <View className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-10">
            <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Create Study Note
              </Text>
              <Pressable onPress={() => setIsCreateNoteOpen(false)} hitSlop={8}>
                <CloseIcon size={16} color="#64748b" />
              </Pressable>
            </View>

            <TextInput
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Title (e.g. Operating Systems Chapter 3)"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 mb-2.5 min-h-[40px]"
            />

            <TextInput
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Paste or type lecture notes, definitions, or study text..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 min-h-[120px] mb-3"
              style={{ textAlignVertical: 'top' }}
            />

            <Pressable
              onPress={handleSaveNote}
              disabled={!noteTitle.trim() || !noteContent.trim()}
              className="w-full bg-indigo-600 active:bg-indigo-700 py-3 rounded-xl items-center shadow-sm min-h-[44px] justify-center"
            >
              <Text className="text-xs font-bold text-white">Save Note</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 2. Ask Document Q&A Modal */}
      <Modal
        visible={Boolean(selectedDocForQA)}
        animationType="slide"
        onRequestClose={() => setSelectedDocForQA(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View
            style={{
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 12),
            }}
            className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}
          >
            {/* Modal Header */}
            <View className="px-5 pt-3 pb-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-2.5 gap-2.5 flex-1 mr-2">
                  <View className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-100 dark:border-sky-800/60 items-center justify-center">
                    <ChatIcon size={18} color="#0284c7" />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      Ask Document
                    </Text>
                    <Text numberOfLines={1} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {selectedDocForQA?.name}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setSelectedDocForQA(null)}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 min-h-[36px] min-w-[36px]"
                  hitSlop={8}
                >
                  <CloseIcon size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                </Pressable>
              </View>
            </View>

            {/* Answer Display Area */}
            <ScrollView
              className="flex-1 px-5 py-4"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View className="w-full max-w-lg mx-auto space-y-3 gap-3">
                {isAnswering ? (
                  <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 items-center py-8">
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5">
                      {qaStatusText}
                    </Text>
                    <Text className="text-[10px] text-slate-400 mt-0.5">
                      Analyzing context and generating explanation
                    </Text>
                  </View>
                ) : docAnswer ? (
                  <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                    <View className="flex-row items-center space-x-1.5 gap-1.5 mb-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
                      <SparklesIcon size={14} color="#6366f1" />
                      <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        AI Tutor Answer
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-800 dark:text-slate-200 leading-5">
                      {docAnswer}
                    </Text>
                  </View>
                ) : (
                  <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 items-center py-8">
                    <ChatIcon size={28} color="#94a3b8" />
                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
                      Ask anything from "{selectedDocForQA?.name}"
                    </Text>
                    <Text className="text-[10px] text-slate-400 text-center mt-0.5 max-w-xs">
                      e.g., "Explain deadlock from these notes", "Summarize section 2"
                    </Text>
                  </View>
                )}

                {qaError && (
                  <View className="bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                    <Text className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      ⚠️ {qaError}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Input Row */}
            <View className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
              <View className="w-full max-w-lg mx-auto flex-row items-center space-x-2 gap-2">
                <TextInput
                  value={docQuestion}
                  onChangeText={setDocQuestion}
                  placeholder="Ask a question from this document..."
                  placeholderTextColor="#94a3b8"
                  className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 min-h-[42px]"
                />
                <Pressable
                  onPress={handleAskDocDirect}
                  disabled={!docQuestion.trim() || isAnswering}
                  className={`w-10 h-10 rounded-xl items-center justify-center min-h-[40px] min-w-[40px] ${
                    docQuestion.trim() && !isAnswering
                      ? 'bg-indigo-600 active:bg-indigo-700 shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 opacity-60'
                  }`}
                >
                  <SendIcon size={16} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. Summarizer Modal */}
      <SummarizerModal
        visible={isSummarizerOpen}
        onClose={() => {
          setIsSummarizerOpen(false);
          setSelectedDocForSummary(null);
        }}
        initialText={selectedDocForSummary?.extractedText || ''}
        document={selectedDocForSummary || undefined}
      />
    </View>
  );
}
