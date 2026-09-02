import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../src/context/ChatContext';
import { useStudy } from '../../src/context/StudyContext';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, handleClearAllConversations } = useChat();
  const {
    profile,
    subjects,
    logOutUser,
    clearAllQuizzes,
    streakCount,
    overallAccuracy,
    totalQuizzesTaken,
  } = useStudy();

  const handleClearData = () => {
    Alert.alert(
      'Reset Local Data',
      'This will clear local AI chats, quiz history, and saved materials. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            handleClearAllConversations();
            await clearAllQuizzes();
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await logOutUser();
    router.replace('/auth/login');
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
    btnBg: isDark ? '#1e293b' : '#f1f5f9',
    btnText: isDark ? '#cbd5e1' : '#475569',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
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
            <View style={[styles.avatarBadge, { backgroundColor: colors.primaryBg }]}>
              <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Student Profile
              </Text>
              <Text numberOfLines={1} style={[styles.headerSub, { color: colors.textMuted }]}>
                AI Study Assistant Account
              </Text>
            </View>
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

      {/* Main Content */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerWrapper}>
          {/* Profile Details Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.userRow}>
              <View style={[styles.largeAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.largeAvatarText}>
                  {profile.name ? profile.name.slice(0, 1).toUpperCase() : 'S'}
                </Text>
              </View>
              <View style={styles.userTextCol}>
                <Text numberOfLines={1} style={[styles.userName, { color: colors.textPrimary }]}>
                  {profile.name || 'Student'}
                </Text>
                <Text numberOfLines={1} style={[styles.userStudentId, { color: colors.primary }]}>
                  ID: {profile.studentId}
                </Text>
                <Text numberOfLines={1} style={[styles.userEmail, { color: colors.textMuted }]}>
                  {profile.email || 'student@university.edu'}
                </Text>
              </View>
            </View>
          </View>

          {/* Preferences & Settings */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              Settings & Preferences
            </Text>

            <Pressable onPress={toggleTheme} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBadge, { backgroundColor: colors.btnBg }]}>
                  <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Appearance Theme</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                    {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.settingActionText, { color: colors.primary }]}>Toggle</Text>
            </Pressable>

            <Pressable onPress={handleClearData} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBadge, { backgroundColor: '#fff1f2' }]}>
                  <Ionicons name="trash-outline" size={16} color="#f43f5e" />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: '#f43f5e' }]}>Clear Local Data</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>Reset chats & test history</Text>
                </View>
              </View>
              <Text style={[styles.settingActionText, { color: '#f43f5e' }]}>Reset</Text>
            </Pressable>

            <Pressable onPress={handleLogout} style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBadge, { backgroundColor: colors.btnBg }]}>
                  <Ionicons name="log-out-outline" size={16} color={colors.textMuted} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Sign Out</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>Log out of student account</Text>
                </View>
              </View>
              <Text style={[styles.settingActionText, { color: colors.textMuted }]}>Log out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
    maxWidth: 480,
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
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  largeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  userTextCol: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userStudentId: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  userEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 10,
    marginTop: 1,
  },
  settingActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
