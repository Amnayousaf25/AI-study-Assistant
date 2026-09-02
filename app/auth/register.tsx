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
import { useChat } from '../../src/context/ChatContext';
import { registerStudentAccount } from '../../src/services/authService';

export default function StudentRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useChat();

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validateEmail = (inputEmail: string) => {
    if (!inputEmail.trim()) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(inputEmail.trim());
  };

  const handleRegister = async () => {
    if (!studentId.trim()) {
      setErrorMsg('Please enter your Student ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (email.trim() && !validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await registerStudentAccount({
        studentId: studentId.trim(),
        password: password.trim(),
        email: email.trim(),
      });

      if (res.success) {
        setSuccessMsg('Account created successfully! Redirecting to Log In...');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 1000);
      } else {
        setErrorMsg(res.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg('Error creating account. Please try again.');
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
            paddingBottom: Math.max(insets.bottom, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerWrapper}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="person-add-outline" size={30} color="#ffffff" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
              Create Student Account
            </Text>
            <Text style={[styles.brandSub, { color: colors.textMuted }]}>
              Sign up with your Student ID & password
            </Text>
          </View>

          {/* Registration Form Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Student ID (Required) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                STUDENT ID <Text style={styles.requiredStar}>*</Text>
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

            {/* Password (Required) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                PASSWORD <Text style={styles.requiredStar}>*</Text>
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
                  textContentType="newPassword"
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

            {/* Confirm Password (Required) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                CONFIRM PASSWORD <Text style={styles.requiredStar}>*</Text>
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
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.passwordInput, { color: colors.textPrimary }]}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Email (Optional - No asterisk, no '(Optional)' string) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                EMAIL
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
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

            {/* Success Banner */}
            {successMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✅ {successMsg}</Text>
              </View>
            ) : null}

            {/* Error Banner */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Create Account</Text>
              )}
            </Pressable>

            {/* Login Link */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                Already have an account?
              </Text>
              <Pressable onPress={() => router.replace('/auth/login')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Log In
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
    gap: 20,
  },
  brandHeader: {
    alignItems: 'center',
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  brandSub: {
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: '#f43f5e',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 44,
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
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 44,
  },
  eyeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
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
    marginTop: 6,
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
