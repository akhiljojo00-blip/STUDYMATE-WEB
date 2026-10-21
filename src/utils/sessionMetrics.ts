import { QUALITY_MAP } from './sm2.ts';
import type { ReviewRating } from './sm2.ts';

export interface CardReviewRecord {
  cardId: string;
  rating: ReviewRating;
  quality: number;
  newInterval?: number;
  frontSnippet?: string;
  subjectId?: string;
  topicId?: string;
}

export interface SessionMetricsSummary {
  totalReviewed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  retentionRate: number; // percentage (0 - 100)
  averageQuality: number; // 0.0 - 5.0
  averageSecondsPerCard: number;
  durationSeconds: number;
  qualityLabel: string;
  qualityTier: 'exceptional' | 'strong' | 'moderate' | 'needs_work';
  scheduledTomorrowCount: number;
  scheduledWeekCount: number;
  scheduledLongTermCount: number;
}

/**
 * Formats a duration in seconds into human-readable compact time
 * e.g. 45s, 3m 12s, 1h 24m
 */
export function formatSessionDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  if (safeSeconds < 60) {
    return `${safeSeconds}s`;
  }
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return remainingSeconds > 0
      ? `${hours}h ${minutes}m ${remainingSeconds}s`
      : `${hours}h ${minutes}m`;
  }

  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

/**
 * Determines qualitative tier and descriptive label for average response quality
 */
export function getQualityTier(averageQuality: number): {
  label: string;
  tier: 'exceptional' | 'strong' | 'moderate' | 'needs_work';
} {
  if (averageQuality >= 4.5) {
    return { label: 'Exceptional Mastery', tier: 'exceptional' };
  }
  if (averageQuality >= 3.8) {
    return { label: 'Strong Retention', tier: 'strong' };
  }
  if (averageQuality >= 3.0) {
    return { label: 'Solid Grasp', tier: 'moderate' };
  }
  return { label: 'Needs Reinforcement', tier: 'needs_work' };
}

/**
 * Computes deterministic after-session metrics from review records and total elapsed duration
 */
export function computeSessionMetrics(
  reviews: CardReviewRecord[],
  durationSeconds: number
): SessionMetricsSummary {
  const totalReviewed = reviews.length;

  if (totalReviewed === 0) {
    return {
      totalReviewed: 0,
      againCount: 0,
      hardCount: 0,
      goodCount: 0,
      easyCount: 0,
      retentionRate: 0,
      averageQuality: 0,
      averageSecondsPerCard: 0,
      durationSeconds: Math.max(0, durationSeconds),
      qualityLabel: 'No Reviews Recorded',
      qualityTier: 'needs_work',
      scheduledTomorrowCount: 0,
      scheduledWeekCount: 0,
      scheduledLongTermCount: 0,
    };
  }

  let againCount = 0;
  let hardCount = 0;
  let goodCount = 0;
  let easyCount = 0;
  let qualitySum = 0;
  let scheduledTomorrowCount = 0;
  let scheduledWeekCount = 0;
  let scheduledLongTermCount = 0;

  for (const r of reviews) {
    const q = r.quality ?? QUALITY_MAP[r.rating] ?? 1;
    qualitySum += q;

    switch (r.rating) {
      case 'again':
        againCount++;
        break;
      case 'hard':
        hardCount++;
        break;
      case 'good':
        goodCount++;
        break;
      case 'easy':
        easyCount++;
        break;
    }

    const interval = r.newInterval ?? (r.rating === 'again' ? 1 : 1);
    if (interval <= 1) {
      scheduledTomorrowCount++;
    } else if (interval <= 7) {
      scheduledWeekCount++;
    } else {
      scheduledLongTermCount++;
    }
  }

  const passCount = hardCount + goodCount + easyCount;
  const retentionRate = Math.round((passCount / totalReviewed) * 100);
  const averageQuality = Math.round((qualitySum / totalReviewed) * 10) / 10;
  const averageSecondsPerCard =
    durationSeconds > 0 ? Math.round((durationSeconds / totalReviewed) * 10) / 10 : 0;

  const { label: qualityLabel, tier: qualityTier } = getQualityTier(averageQuality);

  return {
    totalReviewed,
    againCount,
    hardCount,
    goodCount,
    easyCount,
    retentionRate,
    averageQuality,
    averageSecondsPerCard,
    durationSeconds: Math.max(0, durationSeconds),
    qualityLabel,
    qualityTier,
    scheduledTomorrowCount,
    scheduledWeekCount,
    scheduledLongTermCount,
  };
}
