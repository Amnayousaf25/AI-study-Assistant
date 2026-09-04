import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  QuizQuestion,
  QuizResult,
  StudyDocument,
  StudentProfile,
  StudySubject,
  QuizDifficulty,
  SummaryResult,
  SummaryLength,
  SubjectStats,
  SubjectItem,
  AssignmentSolution,
  PresentationDeck,
} from '../types/study';
import {
  loadQuizHistory,
  saveQuizResult,
  clearQuizHistory,
  loadStudyDocuments,
  saveStudyDocument,
  deleteStudyDocument,
  loadSavedSubjects,
  saveAllSubjects,
  loadSavedAssignments,
  saveAssignmentSolution,
  loadSavedPresentations,
  savePresentationDeck,
  DEFAULT_UNIVERSITY_SUBJECTS,
} from '../services/storage';
import {
  generateQuiz,
  generateSummary,
  solveAssignment,
  generatePresentation,
  askDocumentQuestion,
} from '../services/aiService';
import {
  getSavedSession,
  saveStudentSession,
  logoutUniversityStudent,
} from '../services/authService';

const defaultEmptyProfile: StudentProfile = {
  id: '',
  studentId: '',
  name: 'Student',
  email: 'student@university.edu',
  university: 'University',
  department: 'General Studies',
  program: 'AI Study Program',
  semester: 'Semester 1',
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  quizzesTaken: 0,
  averageScore: 0,
  studyGoalHoursWeekly: 0,
  isLoggedIn: false,
};

interface StudyContextType {
  // University Profile
  profile: StudentProfile;
  updateProfileData: (updates: Partial<StudentProfile>) => Promise<void>;
  logInUser: (studentProfileOrId: StudentProfile | string) => Promise<void>;
  logOutUser: () => Promise<void>;

  // Subjects & Topics
  subjects: SubjectItem[];
  addSubject: (name: string, description?: string, color?: string, code?: string) => Promise<SubjectItem>;
  updateSubject: (id: string, updates: Partial<SubjectItem>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  toggleTopicCompletion: (subjectId: string, topicId: string) => Promise<void>;

  // Quizzes & Dedicated Quiz Flow
  quizHistory: QuizResult[];
  activeQuiz: {
    subject: string;
    topic: string;
    difficulty: QuizDifficulty;
    questions: QuizQuestion[];
    currentIndex: number;
    userAnswers: number[];
  } | null;
  isGeneratingQuiz: boolean;
  startQuiz: (
    topicOrSubject: string,
    difficultyOrTopic?: any,
    countOrDifficulty?: any,
    optionalCount?: number,
    docContent?: string,
    base64Data?: string,
    mimeType?: string
  ) => Promise<QuizQuestion[]>;
  selectQuizAnswer: (questionIndex: number, optionIndex: number) => void;
  finishActiveQuiz: () => Promise<QuizResult | null>;
  cancelActiveQuiz: () => void;
  clearAllQuizzes: () => Promise<void>;

  // Assignments
  assignments: AssignmentSolution[];
  isSolvingAssignment: boolean;
  solveAndSaveProblem: (questionText: string, subject?: string, imageBase64?: string, mimeType?: string) => Promise<AssignmentSolution>;

  // Presentations
  presentations: PresentationDeck[];
  isGeneratingPresentation: boolean;
  createAndSavePresentation: (subject: string, topic: string, slideCount?: number, detailLevel?: string) => Promise<PresentationDeck>;

  // Documents & Study Summaries
  documents: StudyDocument[];
  isProcessingDoc: boolean;
  pickAndUploadDocument: () => Promise<StudyDocument | null>;
  createNoteDocument: (title: string, content: string, subject?: string) => Promise<StudyDocument>;
  saveSummaryAsDocument: (summary: SummaryResult) => Promise<StudyDocument>;
  saveFlashcardsAsDocument: (topic: string, cards: { front: string; back: string }[]) => Promise<StudyDocument>;
  deleteDocument: (id: string) => Promise<void>;
  isSummarizing: boolean;
  createSummary: (
    text: string,
    length?: SummaryLength,
    subject?: string,
    base64Data?: string,
    mimeType?: string,
    docName?: string
  ) => Promise<SummaryResult>;

  // Computed Real Metrics
  subjectStats: SubjectStats[];
  totalQuizzesTaken: number;
  overallAccuracy: number;
  streakCount: number;
  overallProgressPercentage: number;
  totalCompletedTopics: number;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const PALETTE = ['#6366f1', '#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#f97316', '#14b8a6'];

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile>(defaultEmptyProfile);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<StudyContextType['activeQuiz']>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const isSavingQuizRef = useRef(false);

  const [assignments, setAssignments] = useState<AssignmentSolution[]>([]);
  const [isSolvingAssignment, setIsSolvingAssignment] = useState(false);

  const [presentations, setPresentations] = useState<PresentationDeck[]>([]);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);

  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const loadUserDataForStudent = useCallback(async (sid?: string) => {
    const savedProfile = await getSavedSession();
    const cleanSid = sid || savedProfile?.studentId;

    const [
      savedSubjects,
      savedQuizzes,
      savedDocs,
      savedAssignments,
      savedPresentations,
    ] = await Promise.all([
      loadSavedSubjects(cleanSid),
      loadQuizHistory(cleanSid),
      loadStudyDocuments(cleanSid),
      loadSavedAssignments(cleanSid),
      loadSavedPresentations(cleanSid),
    ]);

    setProfile(savedProfile || defaultEmptyProfile);
    setSubjects(savedSubjects);
    setQuizHistory(savedQuizzes);
    setDocuments(savedDocs);
    setAssignments(savedAssignments);
    setPresentations(savedPresentations);
  }, []);

  // Initial Load from Persistent AsyncStorage
  useEffect(() => {
    loadUserDataForStudent();
  }, [loadUserDataForStudent]);

  // 1. SUBJECT & TOPIC ACTIONS
  const addSubject = useCallback(
    async (name: string, description?: string, color?: string, code?: string): Promise<SubjectItem> => {
      const colorToUse = color || PALETTE[subjects.length % PALETTE.length];
      const newSubject: SubjectItem = {
        id: `subj_${Date.now()}`,
        name: name.trim(),
        code: code?.trim() || `CS-${400 + subjects.length + 1}`,
        description: description?.trim() || `Course notes, quizzes and materials for ${name.trim()}`,
        color: colorToUse,
        topics: [
          { id: `top_${Date.now()}_1`, name: 'Introduction & Core Fundamentals', isCompleted: false },
          { id: `top_${Date.now()}_2`, name: 'Key Principles & Theoretical Models', isCompleted: false },
          { id: `top_${Date.now()}_3`, name: 'Advanced Concepts & Applications', isCompleted: false },
          { id: `top_${Date.now()}_4`, name: 'Exam Case Studies & Problem Solving', isCompleted: false },
        ],
        topicsCount: 4,
        completedTopicsCount: 0,
        quizzesCount: 0,
        averageScore: 0,
        createdAt: Date.now(),
        isDefault: false,
      };

      const updated = [...subjects, newSubject];
      setSubjects(updated);
      await saveAllSubjects(updated);
      return newSubject;
    },
    [subjects]
  );

  const updateSubject = useCallback(
    async (id: string, updates: Partial<SubjectItem>) => {
      const updated = subjects.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setSubjects(updated);
      await saveAllSubjects(updated);
    },
    [subjects]
  );

  const deleteSubject = useCallback(
    async (id: string) => {
      const updated = subjects.filter((s) => s.id !== id);
      setSubjects(updated);
      await saveAllSubjects(updated);
    },
    [subjects]
  );

  const toggleTopicCompletion = useCallback(
    async (subjectId: string, topicId: string) => {
      const updated = subjects.map((s) => {
        if (s.id !== subjectId) return s;
        const newTopics = s.topics.map((t) =>
          t.id === topicId ? { ...t, isCompleted: !t.isCompleted } : t
        );
        const completedCount = newTopics.filter((t) => t.isCompleted).length;
        return {
          ...s,
          topics: newTopics,
          completedTopicsCount: completedCount,
          topicsCount: newTopics.length,
        };
      });
      setSubjects(updated);
      await saveAllSubjects(updated);
    },
    [subjects]
  );

  // 2. QUIZ ACTIONS
  const startQuiz = useCallback(
    async (
      topicOrSubject: string,
      difficultyOrTopic: any = 'Medium',
      countOrDifficulty: any = 5,
      optionalCount: number = 5,
      docContent?: string,
      base64Data?: string,
      mimeType?: string
    ): Promise<QuizQuestion[]> => {
      setIsGeneratingQuiz(true);
      let realTopic = topicOrSubject;
      let realDifficulty: QuizDifficulty = 'Medium';
      let realCount = 5;

      if (typeof difficultyOrTopic === 'string' && (difficultyOrTopic === 'Easy' || difficultyOrTopic === 'Medium' || difficultyOrTopic === 'Hard')) {
        realTopic = topicOrSubject;
        realDifficulty = difficultyOrTopic as QuizDifficulty;
        realCount = typeof countOrDifficulty === 'number' ? countOrDifficulty : 5;
      } else if (typeof difficultyOrTopic === 'string') {
        realTopic = difficultyOrTopic;
        realDifficulty = (typeof countOrDifficulty === 'string' ? countOrDifficulty : 'Medium') as QuizDifficulty;
        realCount = typeof optionalCount === 'number' ? optionalCount : 5;
      }

      try {
        const questions = await generateQuiz(realTopic, realDifficulty, realCount, docContent, base64Data, mimeType);
        setActiveQuiz({
          subject: '',
          topic: realTopic,
          difficulty: realDifficulty,
          questions,
          currentIndex: 0,
          userAnswers: new Array(questions.length).fill(-1),
        });
        return questions;
      } finally {
        setIsGeneratingQuiz(false);
      }
    },
    []
  );

  const selectQuizAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setActiveQuiz((prev) => {
      if (!prev) return null;
      const updatedAnswers = [...prev.userAnswers];
      updatedAnswers[questionIndex] = optionIndex;
      return {
        ...prev,
        userAnswers: updatedAnswers,
      };
    });
  }, []);

  const finishActiveQuiz = useCallback(async (): Promise<QuizResult | null> => {
    if (!activeQuiz || isSavingQuizRef.current) return null;
    isSavingQuizRef.current = true;

    try {
      let correctCount = 0;
      activeQuiz.questions.forEach((q, idx) => {
        const userAns = activeQuiz.userAnswers[idx];
        if (userAns === q.correctAnswerIndex) {
          correctCount += 1;
        }
      });

      const total = activeQuiz.questions.length;
      const scorePercentage = Math.round((correctCount / (total || 1)) * 100);

      const result: QuizResult = {
        id: `quiz_${Date.now()}`,
        title: activeQuiz.topic,
        subject: '',
        topic: activeQuiz.topic,
        difficulty: activeQuiz.difficulty,
        totalQuestions: total,
        correctAnswers: correctCount,
        scorePercentage,
        timestamp: Date.now(),
        questions: activeQuiz.questions,
        userAnswers: activeQuiz.userAnswers,
      };

      const updatedQuizzes = await saveQuizResult(result, profile.studentId);
      setQuizHistory(updatedQuizzes);

      // Recalculate subject mastery & stats
      setSubjects((prev) => {
        const nextSubjects = prev.map((s) => {
          if (s.name.toLowerCase() === activeQuiz.subject.toLowerCase()) {
            const newQuizzesCount = s.quizzesCount + 1;
            const newAvg = Math.round((s.averageScore * s.quizzesCount + scorePercentage) / newQuizzesCount);
            return {
              ...s,
              quizzesCount: newQuizzesCount,
              averageScore: newAvg,
              completedTopicsCount: Math.min(s.completedTopicsCount + 1, s.topicsCount),
            };
          }
          return s;
        });
        saveAllSubjects(nextSubjects, profile.studentId);
        return nextSubjects;
      });

      // Update student profile stats
      setProfile((prev) => {
        const newQuizzes = prev.quizzesTaken + 1;
        const newAvg = Math.round((prev.averageScore * prev.quizzesTaken + scorePercentage) / newQuizzes);
        const updatedProf: StudentProfile = {
          ...prev,
          quizzesTaken: newQuizzes,
          averageScore: newAvg,
        };
        saveStudentSession(updatedProf);
        return updatedProf;
      });

      setActiveQuiz(null);
      return result;
    } finally {
      isSavingQuizRef.current = false;
    }
  }, [activeQuiz, profile.studentId]);

  const cancelActiveQuiz = useCallback(() => {
    setActiveQuiz(null);
  }, []);

  const clearAllQuizzes = useCallback(async () => {
    await clearQuizHistory(profile.studentId);
    setQuizHistory([]);
  }, [profile.studentId]);

  // 3. ASSIGNMENT SOLVER
  const solveAndSaveProblem = useCallback(
    async (
      questionText: string,
      subject: string = 'General',
      imageBase64?: string,
      mimeType?: string
    ): Promise<AssignmentSolution> => {
      setIsSolvingAssignment(true);
      try {
        const solution = await solveAssignment(questionText, subject, imageBase64, mimeType);
        const updated = await saveAssignmentSolution(solution, profile.studentId);
        setAssignments(updated);
        return solution;
      } finally {
        setIsSolvingAssignment(false);
      }
    },
    [profile.studentId]
  );

  // 4. PRESENTATION GENERATOR
  const createAndSavePresentation = useCallback(
    async (
      subject: string,
      topic: string,
      slideCount: number = 6,
      detailLevel: string = 'Standard'
    ): Promise<PresentationDeck> => {
      setIsGeneratingPresentation(true);
      try {
        const deck = await generatePresentation(subject, topic, slideCount, detailLevel);
        const updated = await savePresentationDeck(deck, profile.studentId);
        setPresentations(updated);
        return deck;
      } finally {
        setIsGeneratingPresentation(false);
      }
    },
    [profile.studentId]
  );

  // 5. DOCUMENT & STUDY SUMMARY ACTIONS
  const pickAndUploadDocument = useCallback(async (): Promise<StudyDocument | null> => {
    try {
      setIsProcessingDoc(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets?.[0]) return null;

      const file = res.assets[0];
      let base64Data: string | undefined = undefined;
      let extractedText: string | undefined = undefined;

      try {
        if (file.uri) {
          base64Data = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
          if (file.mimeType?.includes('text') || file.name.endsWith('.txt')) {
            extractedText = await FileSystem.readAsStringAsync(file.uri, { encoding: 'utf8' });
          }
        }
      } catch (readErr) {
        console.warn('Could not read binary file:', readErr);
      }

      const newDoc: StudyDocument = {
        id: `doc_${Date.now()}`,
        name: file.name || 'Uploaded Document',
        uri: file.uri,
        mimeType: file.mimeType || 'application/pdf',
        sizeBytes: file.size,
        base64Data,
        extractedText: extractedText || `Document: ${file.name}`,
        createdAt: Date.now(),
      };

      const updated = await saveStudyDocument(newDoc, profile.studentId);
      setDocuments(updated);
      return newDoc;
    } catch (err) {
      console.error('Error picking document:', err);
      return null;
    } finally {
      setIsProcessingDoc(false);
    }
  }, [profile.studentId]);

  const createNoteDocument = useCallback(
    async (title: string, content: string, subject?: string): Promise<StudyDocument> => {
      const newDoc: StudyDocument = {
        id: `note_${Date.now()}`,
        name: title.trim().endsWith('.txt') ? title.trim() : `${title.trim()}.txt`,
        uri: `text://${Date.now()}`,
        mimeType: 'text/plain',
        sizeBytes: content.length,
        extractedText: content,
        subject,
        createdAt: Date.now(),
      };

      const updated = await saveStudyDocument(newDoc, profile.studentId);
      setDocuments(updated);
      return newDoc;
    },
    [profile.studentId]
  );

  const saveSummaryAsDocument = useCallback(
    async (summary: SummaryResult): Promise<StudyDocument> => {
      const formattedContent = `# ${summary.title}

## Main Concept
${summary.mainConcept}

## Key Takeaways
${summary.keyPoints.map((p) => `- ${p}`).join('\n')}

## Important Terms & Definitions
${summary.importantTerms.map((t) => `- **${t.term}**: ${t.definition}`).join('\n')}

## Quick Revision
${summary.quickRevision}`;

      const newDoc: StudyDocument = {
        id: `summary_doc_${Date.now()}`,
        name: `${summary.title} (Summary).txt`,
        uri: `text://${Date.now()}`,
        mimeType: 'text/plain',
        sizeBytes: formattedContent.length,
        extractedText: formattedContent,
        summary: summary.quickRevision,
        subject: summary.subject,
        createdAt: Date.now(),
      };

      const updated = await saveStudyDocument(newDoc, profile.studentId);
      setDocuments(updated);
      return newDoc;
    },
    [profile.studentId]
  );

  const saveFlashcardsAsDocument = useCallback(
    async (topic: string, cards: { front: string; back: string }[]): Promise<StudyDocument> => {
      const formattedContent = `# 🎴 Flashcard Deck: ${topic}
Total Cards: ${cards.length}

${cards
  .map(
    (c, idx) => `### Card ${idx + 1}: ${c.front}
**Answer / Explanation**:
${c.back}
---`
  )
  .join('\n\n')}`;

      const newDoc: StudyDocument = {
        id: `flashcard_doc_${Date.now()}`,
        name: `🎴 Flashcards - ${topic}.txt`,
        uri: `text://${Date.now()}`,
        mimeType: 'text/plain',
        sizeBytes: formattedContent.length,
        extractedText: formattedContent,
        summary: `Interactive study deck with ${cards.length} flashcards on ${topic}.`,
        createdAt: Date.now(),
      };

      const updated = await saveStudyDocument(newDoc, profile.studentId);
      setDocuments(updated);
      return newDoc;
    },
    [profile.studentId]
  );

  const deleteDocument = useCallback(async (id: string) => {
    const updated = await deleteStudyDocument(id, profile.studentId);
    setDocuments(updated);
  }, [profile.studentId]);

  const createSummary = useCallback(
    async (
      text: string,
      length: SummaryLength = 'medium',
      subject?: string,
      base64Data?: string,
      mimeType: string = 'application/pdf',
      docName?: string
    ): Promise<SummaryResult> => {
      setIsSummarizing(true);
      try {
        const result = await generateSummary(text, length, subject, base64Data, mimeType, docName);
        if (subject) result.subject = subject;
        return result;
      } finally {
        setIsSummarizing(false);
      }
    },
    []
  );

  // 6. PROFILE & AUTH
  const updateProfileData = useCallback(async (updates: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      saveStudentSession(next);
      return next;
    });
  }, []);

  const logInUser = useCallback(async (studentProfileOrId: StudentProfile | string) => {
    let userProfile: StudentProfile;
    if (typeof studentProfileOrId === 'object' && studentProfileOrId.studentId) {
      userProfile = studentProfileOrId;
    } else {
      const sid = String(studentProfileOrId).toUpperCase();
      userProfile = {
        ...defaultEmptyProfile,
        studentId: sid,
        name: `Student ${sid}`,
        email: `${sid.toLowerCase()}@university.edu`,
        isLoggedIn: true,
      };
    }

    await saveStudentSession(userProfile);
    setProfile(userProfile);
    await loadUserDataForStudent(userProfile.studentId);
  }, [loadUserDataForStudent]);

  const logOutUser = useCallback(async () => {
    await logoutUniversityStudent();
    setProfile(defaultEmptyProfile);
    setQuizHistory([]);
    setDocuments([]);
    setSubjects([]);
    setAssignments([]);
    setPresentations([]);
  }, []);

  // 7. COMPUTED METRICS
  const subjectStats: SubjectStats[] = useMemo(() => {
    return subjects.map((subj) => {
      const matchingQuizzes = quizHistory.filter(
        (q) => q.subject.toLowerCase() === subj.name.toLowerCase()
      );

      const realQuizzesCount = matchingQuizzes.length > 0 ? matchingQuizzes.length : subj.quizzesCount;
      const realAvgScore =
        matchingQuizzes.length > 0
          ? Math.round(matchingQuizzes.reduce((acc, q) => acc + q.scorePercentage, 0) / matchingQuizzes.length)
          : subj.averageScore;

      const completionRate = Math.round((subj.completedTopicsCount / (subj.topicsCount || 1)) * 100);
      const progressPercentage = Math.round(completionRate * 0.5 + realAvgScore * 0.5);

      return {
        subject: subj.name,
        quizzesCount: realQuizzesCount,
        averageScore: realAvgScore,
        progressPercentage: Math.min(progressPercentage, 100),
        color: subj.color,
      };
    });
  }, [subjects, quizHistory]);

  const totalQuizzesTaken = useMemo(() => {
    return profile.quizzesTaken + quizHistory.length;
  }, [profile.quizzesTaken, quizHistory.length]);

  const overallAccuracy = useMemo(() => {
    if (quizHistory.length === 0) return profile.averageScore;
    const totalScore = quizHistory.reduce((acc, curr) => acc + curr.scorePercentage, 0);
    return Math.round(totalScore / quizHistory.length);
  }, [profile.averageScore, quizHistory]);

  const totalCompletedTopics = useMemo(() => {
    return subjects.reduce((acc, s) => acc + s.completedTopicsCount, 0);
  }, [subjects]);

  const overallProgressPercentage = useMemo(() => {
    if (subjectStats.length === 0) return 0;
    const sum = subjectStats.reduce((acc, s) => acc + s.progressPercentage, 0);
    return Math.round(sum / subjectStats.length);
  }, [subjectStats]);

  const streakCount = profile.streakDays;

  return (
    <StudyContext.Provider
      value={{
        profile,
        updateProfileData,
        logInUser,
        logOutUser,
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        toggleTopicCompletion,
        quizHistory,
        activeQuiz,
        isGeneratingQuiz,
        startQuiz,
        selectQuizAnswer,
        finishActiveQuiz,
        cancelActiveQuiz,
        clearAllQuizzes,
        assignments,
        isSolvingAssignment,
        solveAndSaveProblem,
        presentations,
        isGeneratingPresentation,
        createAndSavePresentation,
        documents,
        isProcessingDoc,
        pickAndUploadDocument,
        createNoteDocument,
        saveSummaryAsDocument,
        saveFlashcardsAsDocument,
        deleteDocument,
        isSummarizing,
        createSummary,
        subjectStats,
        totalQuizzesTaken,
        overallAccuracy,
        streakCount,
        overallProgressPercentage,
        totalCompletedTopics,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
