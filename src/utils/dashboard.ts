import type { Subject } from '../types/index.ts';

export interface DashboardMetrics {
  totalSubjects: number;
  totalWeeklyHours: number;
  estimatedDailyHours: number;
  hasSubjects: boolean;
}

export function calculateStudyMetrics(subjects: Subject[]): DashboardMetrics {
  const totalSubjects = subjects.length;
  const totalWeeklyHours = subjects.reduce((sum, s) => sum + (s.targetHours || 0), 0);
  const estimatedDailyHours = Math.round((totalWeeklyHours / 7) * 10) / 10;

  return {
    totalSubjects,
    totalWeeklyHours: Math.round(totalWeeklyHours * 10) / 10,
    estimatedDailyHours,
    hasSubjects: totalSubjects > 0,
  };
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function formatStudyDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
