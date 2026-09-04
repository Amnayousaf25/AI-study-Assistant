import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeftIcon,
  CameraIcon,
  PhotoIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  CloseIcon,
  BrainIcon,
  DocumentIcon,
} from '../../components/Icons';
import { useStudy } from '../../src/context/StudyContext';
import { useChat } from '../../src/context/ChatContext';
import { AssignmentSolution } from '../../src/types/study';

export default function AssignmentSolverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useChat();
  const { subjects, solveAndSaveProblem, isSolvingAssignment, createNoteDocument } = useStudy();

  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.name || 'Artificial Intelligence');
  const [questionText, setQuestionText] = useState<string>('');
  const [attachedImageUri, setAttachedImageUri] = useState<string | null>(null);
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | undefined>(undefined);
  const [attachedMimeType, setAttachedMimeType] = useState<string>('image/jpeg');

  const [solution, setSolution] = useState<AssignmentSolution | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSimple, setShowSimple] = useState(false);

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setAttachedImageUri(asset.uri);
        setAttachedImageBase64(asset.base64 || undefined);
        setAttachedMimeType(asset.mimeType || 'image/jpeg');
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take a photo of your question.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setAttachedImageUri(asset.uri);
        setAttachedImageBase64(asset.base64 || undefined);
        setAttachedMimeType(asset.mimeType || 'image/jpeg');
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const handleSolve = async () => {
    if (!questionText.trim() && !attachedImageBase64) {
      setErrorMsg('Please enter a question or upload an image of the problem.');
      return;
    }

    setErrorMsg(null);
    try {
      const prompt = questionText.trim() || 'Solve and explain the problem in the attached textbook image.';
      const res = await solveAndSaveProblem(prompt, selectedSubject, attachedImageBase64, attachedMimeType);
      setSolution(res);
    } catch (err: any) {
      console.error('Solver error:', err);
      setErrorMsg('Could not solve assignment problem. Please try again.');
    }
  };

  const handleCopySolution = async () => {
    if (!solution) return;
    const text = `# ${solution.title} (${solution.subject})

## Question
${solution.question}

## Step-by-Step Solution
${solution.stepByStepSolution.map((s) => `### Step ${s.stepNumber}: ${s.title}\n${s.explanation}`).join('\n\n')}

## Final Answer
${solution.finalAnswer}

## Intuitive Explanation
${solution.simpleExplanation}`;

    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = async () => {
    if (!solution || saved) return;
    const text = `# ${solution.title} (${solution.subject})\n\n## Final Answer\n${solution.finalAnswer}\n\n## Detailed Steps\n${solution.stepByStepSolution.map((s) => `Step ${s.stepNumber} - ${s.title}: ${s.explanation}`).join('\n\n')}`;
    await createNoteDocument(solution.title, text, solution.subject);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
      className={`flex-1 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}
    >
      {/* Top Navigation Header */}
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
              AI Assignment Solver
            </Text>
            <Text numberOfLines={1} className="text-xs text-slate-400">
              Step-by-step textbook & code derivations
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-md mx-auto space-y-4 gap-4">
          {solution ? (
            /* SOLUTION VIEW */
            <View className="space-y-4 gap-4">
              {/* Action Buttons */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleCopySolution}
                  className="flex-1 flex-row items-center justify-center bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 py-2.5 rounded-xl min-h-[40px]"
                >
                  {copied ? <CheckIcon size={14} color="#10b981" /> : <CopyIcon size={14} color="#6366f1" />}
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveToNotes}
                  className="flex-1 flex-row items-center justify-center bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 py-2.5 rounded-xl min-h-[40px]"
                >
                  <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {saved ? '✓ Saved' : '💾 Save to Notes'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowSimple(!showSimple)}
                  className="flex-1 flex-row items-center justify-center bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 py-2.5 rounded-xl min-h-[40px]"
                >
                  <BrainIcon size={14} color="#d97706" />
                  <Text className="text-xs font-bold text-amber-700 dark:text-amber-300 ml-1.5">
                    {showSimple ? 'Full Steps' : 'Explain Simply'}
                  </Text>
                </Pressable>
              </View>

              {/* Boxed Final Answer */}
              <View className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 shadow-xs">
                <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">
                  🎯 Final Answer
                </Text>
                <Text className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-6">
                  {solution.finalAnswer}
                </Text>
              </View>

              {/* Simple Explanation mode or Step-by-Step */}
              {showSimple ? (
                <View className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4">
                  <Text className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1.5">
                    💡 Plain Language Explanation
                  </Text>
                  <Text className="text-xs text-slate-800 dark:text-slate-200 leading-5">
                    {solution.simpleExplanation}
                  </Text>
                </View>
              ) : (
                <View className="space-y-3 gap-3">
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                    Step-by-Step Solution Breakdown
                  </Text>

                  {solution.stepByStepSolution.map((step, idx) => (
                    <View
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs"
                    >
                      <View className="flex-row items-center space-x-2 gap-2 mb-2">
                        <View className="w-6 h-6 rounded-lg bg-indigo-600 items-center justify-center">
                          <Text className="text-xs font-black text-white">{step.stepNumber}</Text>
                        </View>
                        <Text className="text-xs font-bold text-slate-900 dark:text-slate-50">
                          {step.title}
                        </Text>
                      </View>
                      <Text className="text-xs text-slate-700 dark:text-slate-300 leading-5">
                        {step.explanation}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Academic Disclaimer */}
              <View className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-4">
                  ⚠️ AI-generated solutions are provided for study and revision assistance. Please verify with your university course textbook.
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setSolution(null);
                  setQuestionText('');
                  setAttachedImageUri(null);
                  setAttachedImageBase64(undefined);
                }}
                className="w-full bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center active:bg-slate-200 min-h-[40px] justify-center"
              >
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ← Solve Another Question
                </Text>
              </Pressable>
            </View>
          ) : (
            /* INPUT FORM */
            <View className="space-y-4 gap-4">
              {/* 1. Subject */}
              <View>
                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  1. University Subject
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {subjects.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => setSelectedSubject(s.name)}
                      className={`px-3 py-2 rounded-xl border min-h-[36px] justify-center ${
                        selectedSubject === s.name
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selectedSubject === s.name ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* 2. Question Input */}
              <View>
                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  2. Question / Problem Text
                </Text>
                <TextInput
                  value={questionText}
                  onChangeText={setQuestionText}
                  placeholder="Type your question, math equation, or code problem here..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-100 min-h-[100px]"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              {/* 3. Image / Camera Upload */}
              <View>
                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  3. Attach Photo / Diagram (Optional)
                </Text>

                {attachedImageUri ? (
                  <View className="relative bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 items-center">
                    <Image
                      source={{ uri: attachedImageUri }}
                      className="w-full h-44 rounded-xl object-contain"
                      resizeMode="contain"
                    />
                    <Pressable
                      onPress={() => {
                        setAttachedImageUri(null);
                        setAttachedImageBase64(undefined);
                      }}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/70 items-center justify-center"
                    >
                      <CloseIcon size={14} color="#ffffff" />
                    </Pressable>
                  </View>
                ) : (
                  <View className="flex-row gap-2.5">
                    <Pressable
                      onPress={handleCaptureCamera}
                      className="flex-1 flex-row items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 py-3 rounded-2xl min-h-[44px] active:bg-slate-50 dark:active:bg-slate-800"
                    >
                      <CameraIcon size={16} color="#6366f1" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5">
                        Take Photo
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handlePickImage}
                      className="flex-1 flex-row items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 py-3 rounded-2xl min-h-[44px] active:bg-slate-50 dark:active:bg-slate-800"
                    >
                      <PhotoIcon size={16} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5">
                        Gallery Image
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {errorMsg && (
                <View className="bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  <Text className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ {errorMsg}
                  </Text>
                </View>
              )}

              {/* Solve CTA */}
              <Pressable
                onPress={handleSolve}
                disabled={isSolvingAssignment}
                className="w-full bg-indigo-600 active:bg-indigo-700 py-3.5 rounded-2xl items-center shadow-sm shadow-indigo-500/25 min-h-[44px] justify-center active:scale-[0.99]"
              >
                {isSolvingAssignment ? (
                  <View className="flex-row items-center space-x-2 gap-2">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-xs font-bold text-white">
                      AI is deriving step-by-step solution...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs font-bold text-white">Solve Problem Step-by-Step ✨</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
