export type StudySubject = string;

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  explanation: string;
  userSelectedIndex?: number;
}

export interface QuizResult {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: QuizDifficulty;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timestamp: number;
  questions: QuizQuestion[];
  userAnswers: number[];
}

export interface SubjectTopic {
  id: string;
  name: string;
  isCompleted: boolean;
  notesCount?: number;
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color: string;
  topics: SubjectTopic[];
  topicsCount: number;
  completedTopicsCount: number;
  quizzesCount: number;
  averageScore: number;
  createdAt: number;
  isDefault?: boolean;
}

export interface StudyDocument {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes?: number;
  extractedText?: string;
  base64Data?: string;
  summary?: string;
  subject?: string;
  createdAt: number;
}

export interface StudentProfile {
  id: string;
  studentId: string;
  name: string;
  email: string;
  university: string;
  department: string;
  program: string;
  semester: string;
  gradeLevel?: string;
  avatarUrl?: string;
  targetExam?: string;
  streakDays: number;
  lastActiveDate: string;
  quizzesTaken: number;
  averageScore: number;
  studyGoalHoursWeekly: number;
  isLoggedIn: boolean;
}

export type SummaryLength = 'short' | 'medium' | 'detailed';

export interface SummaryResult {
  title: string;
  mainConcept: string;
  keyPoints: string[];
  importantTerms: Array<{ term: string; definition: string }>;
  quickRevision: string;
  subject?: string;
}

export interface SubjectStats {
  subject: string;
  quizzesCount: number;
  averageScore: number;
  progressPercentage: number;
  color: string;
}

export interface AssignmentSolution {
  id: string;
  title: string;
  subject: string;
  question: string;
  imageUri?: string;
  stepByStepSolution: Array<{ stepNumber: number; title: string; explanation: string }>;
  finalAnswer: string;
  simpleExplanation: string;
  timestamp: number;
}

export interface PresentationSlide {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes?: string;
  visualSuggestion?: string;
}

export interface PresentationDeck {
  id: string;
  title: string;
  subject: string;
  topic: string;
  slideCount: number;
  slides: PresentationSlide[];
  timestamp: number;
}
