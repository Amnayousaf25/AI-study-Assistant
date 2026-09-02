import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudy } from '../src/context/StudyContext';
import { CloseIcon, UserCircleIcon, GraduationCapIcon } from './Icons';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'edit';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode = 'login',
}) => {
  const insets = useSafeAreaInsets();
  const { profile, logInUser, updateProfileData } = useStudy();

  const [mode, setMode] = useState<'login' | 'signup' | 'edit'>(initialMode);
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetExam, setTargetExam] = useState(profile.targetExam || 'College & AP Prep');
  const [gradeLevel, setGradeLevel] = useState(profile.gradeLevel || 'Undergraduate');

  const handleSubmit = async () => {
    if (mode === 'edit') {
      await updateProfileData({
        name: name.trim() || profile.name,
        email: email.trim() || profile.email,
        targetExam,
        gradeLevel,
      });
    } else {
      await logInUser(name.trim() || 'ST-2024-8891');
      await updateProfileData({ name: name.trim() || profile.name, email: email.trim() || profile.email, targetExam, gradeLevel });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-0 sm:p-4"
      >
        <View
          style={{
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            maxHeight: '90%',
          }}
          className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex-col"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pb-3 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center space-x-2 gap-2">
              <View className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 items-center justify-center">
                <GraduationCapIcon size={18} color="#6366f1" />
              </View>
              <View>
                <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {mode === 'login'
                    ? 'Student Sign In'
                    : mode === 'signup'
                    ? 'Create Student Account'
                    : 'Edit Study Profile'}
                </Text>
                <Text className="text-xs text-slate-400 font-medium">
                  {mode === 'edit' ? 'Update your learning preferences' : 'Sync your notes, quizzes and progress'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200"
              hitSlop={8}
            >
              <CloseIcon size={14} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="space-y-3.5 gap-3.5">
              {(mode === 'signup' || mode === 'edit') && (
                <View>
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    Full Name
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Alex Johnson"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                  />
                </View>
              )}

              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="student@study.edu"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                />
              </View>

              {mode !== 'edit' && (
                <View>
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Password
                    </Text>
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Text className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                  />
                </View>
              )}

              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Target Exam / Focus
                </Text>
                <TextInput
                  value={targetExam}
                  onChangeText={setTargetExam}
                  placeholder="e.g. AP Physics, SAT, Engineering, Med School"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                className="w-full bg-indigo-600 active:bg-indigo-700 py-3.5 rounded-2xl items-center shadow-sm shadow-indigo-500/25 mt-2"
              >
                <Text className="text-sm font-bold text-white">
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Save Changes'}
                </Text>
              </Pressable>

              {mode !== 'edit' && (
                <View className="flex-row justify-center items-center mt-2">
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  </Text>
                  <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                    <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {mode === 'login' ? 'Sign Up' : 'Log In'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
