import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
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
import { loginStudentAccount } from '../../src/services/authService';

export default function StudentLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useChat();
  const { logInUser } = useStudy();

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!studentId.trim()) {
      setErrorMsg('Please enter your Student ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginStudentAccount(studentId, password);
      if (res.success && res.profile) {
        await logInUser(res.profile);
        router.replace('/(tabs)');
      } else {
        setErrorMsg(res.error || 'Invalid Student ID or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    card: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#1e293b' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#6366f1',
    inputBg: isDark ? '#0f172a' : '#ffffff',
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerWrapper}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="school-outline" size={32} color="#ffffff" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
              AI Study Assistant
            </Text>
            <Text style={[styles.brandSub, { color: colors.textMuted }]}>
              Student Log In
            </Text>
          </View>

          {/* Login Form Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Student ID */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                STUDENT ID
              </Text>
              <TextInput
                value={studentId}
                onChangeText={setStudentId}
                placeholder="Enter Student ID"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Password with Show/Hide Toggle */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                PASSWORD
              </Text>
              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  placeholder="Enter password"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.passwordInput, { color: colors.textPrimary }]}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error Banner */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {/* Login CTA */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Log In</Text>
              )}
            </Pressable>

            {/* Register Link */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                Don't have an account?
              </Text>
              <Pressable onPress={() => router.push('/auth/register')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Create Account
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  innerWrapper: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    gap: 24,
  },
  brandHeader: {
    alignItems: 'center',
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 46,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 46,
  },
  eyeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
