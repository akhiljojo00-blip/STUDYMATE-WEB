export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export const QUALITY_MAP: Record<ReviewRating, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

export interface SM2State {
  repetition: number;
  interval: number;
  easeFactor: number;
  lapses: number;
  dueDate: string; // YYYY-MM-DD
  lastReviewedAt: string | null;
}

export interface SM2ReviewResult extends SM2State {
  quality: number;
  rating: ReviewRating;
}

/**
 * Format date to YYYY-MM-DD in local time
 */
export function formatDateISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds integer days to a given Date safely
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Initialize a brand new flashcard's SM-2 state
 */
export function createInitialSM2State(now: Date = new Date()): SM2State {
  return {
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    lapses: 0,
    dueDate: formatDateISO(now),
    lastReviewedAt: null,
  };
}

/**
 * Calculate the next review schedule using the SuperMemo SM-2 algorithm.
 *
 * Recall Quality:
 * - Again (1): Failed recall. Resets repetitions to 0, adds lapse, sets interval to 1 day.
 * - Hard  (3): Passed recall with significant effort. Interval advances, ease factor drops.
 * - Good  (4): Passed recall with normal effort. Standard interval growth.
 * - Easy  (5): Passed recall with minimal effort. Maximum interval growth, ease factor rises.
 *
 * Ease Factor update:
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * Min EF is clamped to 1.3.
 *
 * @param current Current SM-2 state of the card
 * @param rating User rating: 'again' | 'hard' | 'good' | 'easy'
 * @param now Clock injection for deterministic testing
 */
export function calculateSM2(
  current: Partial<SM2State>,
  rating: ReviewRating,
  now: Date = new Date()
): SM2ReviewResult {
  const quality = QUALITY_MAP[rating] ?? 1;
  const currentRep = current.repetition ?? 0;
  const currentInterval = current.interval ?? 0;
  const currentEF = current.easeFactor ?? 2.5;
  const currentLapses = current.lapses ?? 0;

  // Calculate new Ease Factor (clamped to minimum 1.3)
  // SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const deltaEF = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const rawEF = currentEF + deltaEF;
  const newEaseFactor = Math.max(1.3, Math.round(rawEF * 100) / 100);

  let newRepetition: number;
  let newInterval: number;
  let newLapses = currentLapses;

  if (quality < 3) {
    // FAILED RECALL (Again, quality 1)
    // Repetition count resets to 0
    // Interval resets to 1 day for early retry
    newRepetition = 0;
    newInterval = 1;
    newLapses = currentLapses + 1;
  } else {
    // SUCCESSFUL RECALL (Hard 3, Good 4, Easy 5)
    if (currentRep === 0) {
      newRepetition = 1;
      newInterval = 1;
    } else if (currentRep === 1) {
      newRepetition = 2;
      // For Hard, initial interval after 1 day is 3 days; for Good/Easy, standard 6 days
      newInterval = quality === 3 ? 3 : 6;
    } else {
      newRepetition = currentRep + 1;
      // Interval growth based on ease factor
      if (quality === 3) {
        // Hard: growth dampened (1.2x or interval * (newEaseFactor * 0.8))
        newInterval = Math.max(currentInterval + 1, Math.round(currentInterval * 1.2));
      } else if (quality === 5) {
        // Easy: bonus growth
        newInterval = Math.max(currentInterval + 1, Math.round(currentInterval * newEaseFactor * 1.15));
      } else {
        // Good: standard SM-2
        newInterval = Math.max(currentInterval + 1, Math.round(currentInterval * newEaseFactor));
      }
    }
  }

  // Ensure interval is never negative or zero for scheduled cards
  newInterval = Math.max(1, newInterval);

  const dueDate = formatDateISO(addDays(now, newInterval));
  const lastReviewedAt = now.toISOString();

  return {
    repetition: newRepetition,
    interval: newInterval,
    easeFactor: newEaseFactor,
    lapses: newLapses,
    dueDate,
    lastReviewedAt,
    quality,
    rating,
  };
}

/**
 * Checks if a card is due for review today or overdue
 */
export function isCardDue(cardDueDate: string, now: Date = new Date()): boolean {
  if (!cardDueDate) return true;
  const todayStr = formatDateISO(now);
  return cardDueDate <= todayStr;
}

/**
 * Checks if a card is strictly overdue (due before today)
 */
export function isCardOverdue(cardDueDate: string, now: Date = new Date()): boolean {
  if (!cardDueDate) return false;
  const todayStr = formatDateISO(now);
  return cardDueDate < todayStr;
}

/**
 * Categorize cards into due, overdue, new, and upcoming
 */
export function categorizeCards<T extends { repetition?: number; dueDate?: string }>(
  cards: T[],
  now: Date = new Date()
): {
  dueToday: T[];
  overdue: T[];
  newCards: T[];
  learning: T[];
  allDue: T[];
  upcoming: T[];
} {
  const todayStr = formatDateISO(now);
  const dueToday: T[] = [];
  const overdue: T[] = [];
  const newCards: T[] = [];
  const learning: T[] = [];
  const upcoming: T[] = [];

  for (const card of cards) {
    const isNew = (card.repetition ?? 0) === 0;
    const dueDate = card.dueDate || todayStr;

    if (isNew) {
      newCards.push(card);
    } else if (dueDate < todayStr) {
      overdue.push(card);
    } else if (dueDate === todayStr) {
      dueToday.push(card);
    } else {
      upcoming.push(card);
    }

    if (!isNew && (card.repetition ?? 0) > 0 && (card.repetition ?? 0) < 3) {
      learning.push(card);
    }
  }

  // All cards that can be reviewed in today's session: overdue + dueToday + newCards
  const allDue = [...overdue, ...dueToday, ...newCards];

  return {
    dueToday,
    overdue,
    newCards,
    learning,
    allDue,
    upcoming,
  };
}
