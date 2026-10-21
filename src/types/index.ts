import { ReviewRating } from '../utils/sm2.ts';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type SubjectColor = 
  | 'forest'
  | 'terracotta'
  | 'ochre'
  | 'slate'
  | 'mulberry'
  | 'emerald'
  | 'amber'
  | 'teal';

export type SubjectIconName = 
  | 'BookOpen'
  | 'FlaskConical'
  | 'Atom'
  | 'Compass'
  | 'Code'
  | 'Brain'
  | 'Music'
  | 'Landmark'
  | 'Calculator'
  | 'Globe';

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  description?: string;
  color?: SubjectColor;
  icon?: SubjectIconName;
  targetHours?: number;
  createdAt: any;
  updatedAt: any;
}

export interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  color: SubjectColor;
  icon: SubjectIconName;
  targetHours: number;
}

export interface SubjectValidationErrors {
  name?: string;
  code?: string;
  description?: string;
  targetHours?: string;
}

export type TopicStatus = 'not_started' | 'learning' | 'reviewed';

export interface Topic {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  description?: string;
  status: TopicStatus;
  createdAt: any;
  updatedAt: any;
}

export interface TopicFormData {
  title: string;
  description: string;
  status: TopicStatus;
}

export interface TopicValidationErrors {
  title?: string;
  description?: string;
}

export interface Flashcard {
  id: string;
  userId: string;
  subjectId: string;
  topicId: string;
  front: string;
  back: string;
  repetition: number;
  interval: number;
  easeFactor: number;
  lapses: number;
  dueDate: string; // YYYY-MM-DD
  lastReviewedAt: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface FlashcardFormData {
  front: string;
  back: string;
}

export interface FlashcardValidationErrors {
  front?: string;
  back?: string;
}

export interface ReviewLog {
  id: string;
  userId: string;
  cardId: string;
  subjectId: string;
  topicId: string;
  frontSnippet?: string;
  rating: ReviewRating;
  quality: number;
  previousRepetition: number;
  newRepetition: number;
  previousInterval: number;
  newInterval: number;
  previousEaseFactor: number;
  newEaseFactor: number;
  reviewedAt: any;
}

export interface DailyTask {
  id: string;
  title: string;
  subjectName?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export type NavTab = 
  | 'overview'
  | 'subjects'
  | 'revision'
  | 'library'
  | 'buddy';

export type DocumentStatus = 'ready' | 'processing' | 'error';

export interface StudyDocument {
  id: string;
  userId: string;
  title: string;
  subjectId?: string;
  topicId?: string;
  fileType: string;
  fileSize?: number;
  status: DocumentStatus;
  textContent: string;
  summary?: string;
  keyPoints?: string[];
  wordCount?: number;
  errorMessage?: string;
  createdAt: any;
  updatedAt: any;
}

export type ExplanationStyle = 'concise' | 'detailed' | 'exam';

export interface StudyBuddyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  style?: ExplanationStyle;
  context?: {
    subjectName?: string;
    topicTitle?: string;
    documentTitle?: string;
  };
  isGrounded?: boolean;
  citations?: string[];
}

export type QuestionType = 'mcq' | 'short' | 'exam';

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  subjectId?: string;
  topicId?: string;
  question: string;
  // MCQ specific
  options?: string[]; // 4 options
  correctIndex?: number; // 0 to 3
  // Short / Exam specific
  scenario?: string;
  marks?: number;
  modelAnswer?: string;
  keyPoints?: string[];
  rubric?: string[];
  explanation: string;
  groundedSource?: string;
  // Interactive testing state
  selectedOption?: number;
  userAttempt?: string;
  isAnswerRevealed?: boolean;
  isSavedAsCard?: boolean;
}

export interface GenerateQuestionsRequest {
  subjectName?: string;
  topicTitle?: string;
  type: QuestionType;
  count: number;
  documentText?: string;
  documentTitle?: string;
}

export interface DocumentExtractionResult {
  title: string;
  textContent: string;
  wordCount: number;
  characterCount: number;
  fileType: string;
  sections?: { heading: string; text: string }[];
}
