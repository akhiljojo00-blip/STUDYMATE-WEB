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
