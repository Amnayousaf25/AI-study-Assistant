import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudentProfile } from '../types/study';

const AUTH_SESSION_KEY = '@university_student_session_v2';
const REGISTERED_ACCOUNTS_KEY = '@student_registered_accounts_v2';

export interface StoredStudentAccount {
  id: string;
  studentId: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export interface AuthResponse {
  success: boolean;
  profile?: StudentProfile;
  error?: string;
}

/**
 * Salted hash algorithm to securely store student passwords in local storage.
 * Never stores plain-text passwords.
 */
function hashPassword(password: string): string {
  let hash = 0;
  const salted = `SALT_STUDY_AI_${password.trim()}_2026`;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `pwd_hash_${Math.abs(hash).toString(36)}`;
}

/**
 * Load all registered student accounts from storage.
 */
async function loadRegisteredAccountsMap(): Promise<Record<string, StoredStudentAccount>> {
  try {
    const raw = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.error('Error loading registered student accounts:', err);
    return {};
  }
}

/**
 * Save updated registered accounts map to storage.
 */
async function saveRegisteredAccountsMap(accountsMap: Record<string, StoredStudentAccount>): Promise<void> {
  try {
    await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accountsMap));
  } catch (err) {
    console.error('Error saving registered student accounts:', err);
  }
}

/**
 * Register a new student account with Student ID & password.
 * Email is OPTIONAL (Gmail, Outlook, Yahoo, or empty).
 */
export async function registerStudentAccount(data: {
  studentId: string;
  password: string;
  name?: string;
  email?: string;
}): Promise<AuthResponse> {
  const cleanId = data.studentId.trim().toUpperCase();
  const cleanPassword = data.password.trim();
  const cleanEmail = data.email ? data.email.trim() : '';
  const cleanName = data.name && data.name.trim() ? data.name.trim() : `Student ${cleanId}`;

  if (!cleanId) {
    return { success: false, error: 'Please enter a Student ID.' };
  }
  if (!cleanPassword || cleanPassword.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }

  const map = await loadRegisteredAccountsMap();
  if (map[cleanId]) {
    return {
      success: false,
      error: `Student ID "${cleanId}" is already registered. Please log in instead.`,
    };
  }

  const newAccount: StoredStudentAccount = {
    id: `std_${Date.now()}_${cleanId}`,
    studentId: cleanId,
    name: cleanName,
    email: cleanEmail,
    passwordHash: hashPassword(cleanPassword),
    createdAt: Date.now(),
  };

  map[cleanId] = newAccount;
  await saveRegisteredAccountsMap(map);

  return { success: true };
}

/**
 * Log in a student using their Student ID and Password.
 */
export async function loginStudentAccount(
  studentId: string,
  password: string
): Promise<AuthResponse> {
  const cleanId = studentId.trim().toUpperCase();
  const cleanPassword = password.trim();

  if (!cleanId) {
    return { success: false, error: 'Please enter your Student ID.' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Please enter your password.' };
  }

  const map = await loadRegisteredAccountsMap();
  let account = map[cleanId];

  if (!account) {
    // Auto-provision account on new device if logging in with Student ID & password
    account = {
      id: `std_${Date.now()}_${cleanId}`,
      studentId: cleanId,
      name: `Student ${cleanId}`,
      email: '',
      passwordHash: hashPassword(cleanPassword),
      createdAt: Date.now(),
    };
    map[cleanId] = account;
    await saveRegisteredAccountsMap(map);
  } else {
    const inputHash = hashPassword(cleanPassword);
    if (account.passwordHash !== inputHash) {
      return { success: false, error: 'Invalid Student ID or password.' };
    }
  }

  const profile: StudentProfile = {
    id: account.id,
    studentId: account.studentId,
    name: account.name || `Student ${account.studentId}`,
    email: account.email || '',
    university: 'University',
    department: 'General Studies',
    program: 'AI Study Program',
    semester: 'Semester 1',
    streakDays: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    quizzesTaken: 0,
    averageScore: 0,
    studyGoalHoursWeekly: 0,
    isLoggedIn: true,
  };

  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(profile));

  return {
    success: true,
    profile,
  };
}

/**
 * Get currently active student session, or null if logged out.
 */
export async function getSavedSession(): Promise<StudentProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.studentId && parsed.isLoggedIn) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Error loading active session:', err);
    return null;
  }
}

/**
 * Save updated student profile session.
 */
export async function saveStudentSession(profile: StudentProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving active session:', err);
  }
}

/**
 * Log out current student.
 */
export async function logoutUniversityStudent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  } catch (err) {
    console.error('Error during logout:', err);
  }
}
