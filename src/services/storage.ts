import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../../components/MessageBubble';
import {
  QuizResult,
  StudyDocument,
  StudentProfile,
  SubjectItem,
  AssignmentSolution,
  PresentationDeck,
} from '../types/study';

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  subject?: string;
}

export interface FavoriteItem {
  id: string;
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  text: string;
  sender: 'user' | 'gemini';
  imageUri?: string;
  mimeType?: string;
  timestamp: number;
}

const CONVERSATIONS_KEY = '@study_conversations_v2';
const ACTIVE_CONVERSATION_KEY = '@study_active_conv_v2';
const THEME_KEY = '@study_theme_preference_v2';
const FAVORITES_KEY = '@study_favorites_v2';
const QUIZ_HISTORY_KEY = '@study_quiz_history_v2';
const DOCUMENTS_KEY = '@study_documents_v2';
const PROFILE_KEY = '@study_student_profile_v2';
const SUBJECTS_KEY = '@study_subjects_v2';
const ASSIGNMENTS_KEY = '@study_assignments_v2';
const PRESENTATIONS_KEY = '@study_presentations_v2';

export const DEFAULT_UNIVERSITY_SUBJECTS: SubjectItem[] = [];

/**
 * Returns a scoped storage key for the given student ID.
 */
function getScopedKey(baseKey: string, studentId?: string): string {
  if (!studentId || !studentId.trim()) return baseKey;
  const clean = studentId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
  return `${baseKey}_${clean}`;
}

export async function loadSavedSubjects(studentId?: string): Promise<SubjectItem[]> {
  try {
    const key = getScopedKey(SUBJECTS_KEY, studentId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading subjects:', error);
    return [];
  }
}

export async function saveAllSubjects(subjects: SubjectItem[], studentId?: string): Promise<void> {
  try {
    const key = getScopedKey(SUBJECTS_KEY, studentId);
    await AsyncStorage.setItem(key, JSON.stringify(subjects));
  } catch (error) {
    console.error('Error saving subjects:', error);
  }
}

export async function loadSavedConversations(studentId?: string): Promise<Conversation[]> {
  try {
    const key = getScopedKey(CONVERSATIONS_KEY, studentId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading conversations from storage:', error);
    return [];
  }
}

export async function saveAllConversations(conversations: Conversation[], studentId?: string): Promise<void> {
  try {
    const key = getScopedKey(CONVERSATIONS_KEY, studentId);
    await AsyncStorage.setItem(key, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversations to storage:', error);
  }
}

export async function loadActiveConversationId(studentId?: string): Promise<string | null> {
  try {
    const key = getScopedKey(ACTIVE_CONVERSATION_KEY, studentId);
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function saveActiveConversationId(id: string | null, studentId?: string): Promise<void> {
  try {
    const key = getScopedKey(ACTIVE_CONVERSATION_KEY, studentId);
    if (id) {
      await AsyncStorage.setItem(key, id);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error saving active conversation id:', error);
  }
}

export async function loadSavedFavorites(studentId?: string): Promise<FavoriteItem[]> {
  try {
    const key = getScopedKey(FAVORITES_KEY, studentId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading favorites from storage:', error);
    return [];
  }
}

export async function saveAllFavorites(favorites: FavoriteItem[], studentId?: string): Promise<void> {
  try {
    const key = getScopedKey(FAVORITES_KEY, studentId);
    await AsyncStorage.setItem(key, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites to storage:', error);
  }
}

export async function loadQuizHistory(studentId?: string): Promise<QuizResult[]> {
  try {
    const key = getScopedKey(QUIZ_HISTORY_KEY, studentId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading quiz history:', error);
    return [];
  }
}

export async function saveQuizResult(result: QuizResult, studentId?: string): Promise<QuizResult[]> {
  try {
    const key = getScopedKey(QUIZ_HISTORY_KEY, studentId);
    const existing = await loadQuizHistory(studentId);
    const updated = [result, ...existing];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving quiz result:', error);
    return [];
  }
}

export async function clearQuizHistory(studentId?: string): Promise<void> {
  try {
    const key = getScopedKey(QUIZ_HISTORY_KEY, studentId);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing quiz history:', error);
  }
}

export async function loadStudyDocuments(studentId?: string): Promise<StudyDocument[]> {
  try {
    const key = getScopedKey(DOCUMENTS_KEY, studentId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading study documents:', error);
    return [];
  }
}

export async function saveStudyDocument(doc: StudyDocument, studentId?: string): Promise<StudyDocument[]> {
  try {
    const key = getScopedKey(DOCUMENTS_KEY, studentId);
    const existing = await loadStudyDocuments(studentId);
    const updated = [doc, ...existing.filter((d) => d.id !== doc.id)];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving study document:', error);
    return [];
  }
}

export async function deleteStudyDocument(docId: string, studentId?: string): Promise<StudyDocument[]> {
  try {
    const key = getScopedKey(DOCUMENTS_KEY, studentId);
    const existing = await loadStudyDocuments(studentId);
    const updated = existing.filter((d) => d.id !== docId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error deleting study document:', error);
    return [];
  }
}

export async function loadSavedAssignments(studentId?: string): Promise<AssignmentSolution[]> {
  try {
    const key = getScopedKey(ASSIGNMENTS_KEY, studentId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAssignmentSolution(sol: AssignmentSolution, studentId?: string): Promise<AssignmentSolution[]> {
  try {
    const key = getScopedKey(ASSIGNMENTS_KEY, studentId);
    const existing = await loadSavedAssignments(studentId);
    const updated = [sol, ...existing.filter((s) => s.id !== sol.id)];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function loadSavedPresentations(studentId?: string): Promise<PresentationDeck[]> {
  try {
    const key = getScopedKey(PRESENTATIONS_KEY, studentId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePresentationDeck(deck: PresentationDeck, studentId?: string): Promise<PresentationDeck[]> {
  try {
    const key = getScopedKey(PRESENTATIONS_KEY, studentId);
    const existing = await loadSavedPresentations(studentId);
    const updated = [deck, ...existing.filter((d) => d.id !== deck.id)];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function loadSavedTheme(): Promise<boolean | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (value === 'dark') return true;
    if (value === 'light') return false;
    return null;
  } catch {
    return null;
  }
}

export async function saveThemePreference(isDark: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
}

export async function clearAllLocalData(studentId?: string): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      getScopedKey(CONVERSATIONS_KEY, studentId),
      getScopedKey(ACTIVE_CONVERSATION_KEY, studentId),
      getScopedKey(FAVORITES_KEY, studentId),
      getScopedKey(QUIZ_HISTORY_KEY, studentId),
      getScopedKey(DOCUMENTS_KEY, studentId),
      getScopedKey(SUBJECTS_KEY, studentId),
      getScopedKey(ASSIGNMENTS_KEY, studentId),
      getScopedKey(PRESENTATIONS_KEY, studentId),
    ]);
  } catch (error) {
    console.error('Error clearing local data:', error);
  }
}

export function generateConversationTitle(firstPrompt?: string): string {
  if (!firstPrompt || !firstPrompt.trim()) return 'Study Question';
  const clean = firstPrompt.replace(/[\r\n]+/g, ' ').trim();
  if (clean.length <= 32) return clean;
  return clean.slice(0, 30) + '...';
}
