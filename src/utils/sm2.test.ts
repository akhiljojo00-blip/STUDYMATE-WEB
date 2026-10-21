import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialSM2State,
  calculateSM2,
  isCardDue,
  isCardOverdue,
  categorizeCards,
  formatDateISO,
  addDays,
} from './sm2.ts';

const FIXED_DATE = new Date('2026-10-20T10:00:00Z');

test('creates correct initial SM-2 state for brand new card', () => {
  const initial = createInitialSM2State(FIXED_DATE);
  assert.equal(initial.repetition, 0);
  assert.equal(initial.interval, 0);
  assert.equal(initial.easeFactor, 2.5);
  assert.equal(initial.lapses, 0);
  assert.equal(initial.dueDate, '2026-10-20');
  assert.equal(initial.lastReviewedAt, null);
});

test('first review with Good rating schedules card for 1 day', () => {
  const initial = createInitialSM2State(FIXED_DATE);
  const result = calculateSM2(initial, 'good', FIXED_DATE);

  assert.equal(result.repetition, 1);
  assert.equal(result.interval, 1);
  assert.equal(result.easeFactor, 2.5); // delta for q=4 is 0.1 - (1 * 0.10) = 0
  assert.equal(result.lapses, 0);
  assert.equal(result.dueDate, '2026-10-21');
  assert.equal(result.quality, 4);
});

test('second consecutive review with Good rating schedules card for 6 days', () => {
  const cardAtRep1 = {
    repetition: 1,
    interval: 1,
    easeFactor: 2.5,
    lapses: 0,
    dueDate: '2026-10-21',
  };
  const result = calculateSM2(cardAtRep1, 'good', new Date('2026-10-21T10:00:00Z'));

  assert.equal(result.repetition, 2);
  assert.equal(result.interval, 6);
  assert.equal(result.dueDate, '2026-10-27');
});

test('third review with Good rating multiplies interval by ease factor', () => {
  const cardAtRep2 = {
    repetition: 2,
    interval: 6,
    easeFactor: 2.5,
    lapses: 0,
    dueDate: '2026-10-27',
  };
  const result = calculateSM2(cardAtRep2, 'good', new Date('2026-10-27T10:00:00Z'));

  assert.equal(result.repetition, 3);
  assert.equal(result.interval, 15); // Math.round(6 * 2.5) = 15
  assert.equal(result.dueDate, '2026-11-11');
});

test('Again rating resets repetition count to 0 and schedules early retry for tomorrow', () => {
  const masteredCard = {
    repetition: 5,
    interval: 45,
    easeFactor: 2.6,
    lapses: 0,
    dueDate: '2026-10-20',
  };
  const result = calculateSM2(masteredCard, 'again', FIXED_DATE);

  assert.equal(result.repetition, 0);
  assert.equal(result.interval, 1);
  assert.equal(result.lapses, 1);
  assert.equal(result.dueDate, '2026-10-21');
  assert.ok(result.easeFactor < 2.6); // EF drops significantly
});

test('ease factor never drops below 1.3 minimum even after multiple Again ratings', () => {
  let state = createInitialSM2State(FIXED_DATE);

  // Apply 6 consecutive Again ratings
  for (let i = 0; i < 6; i++) {
    state = calculateSM2(state, 'again', FIXED_DATE);
  }

  assert.equal(state.easeFactor, 1.3);
  assert.equal(state.lapses, 6);
  assert.equal(state.repetition, 0);
  assert.equal(state.interval, 1);
});

test('Easy rating increases ease factor and gives interval bonus', () => {
  const initial = createInitialSM2State(FIXED_DATE);
  const result = calculateSM2(initial, 'easy', FIXED_DATE);

  assert.equal(result.repetition, 1);
  assert.ok(result.easeFactor > 2.5); // EF increases
  assert.equal(result.interval, 1);
});

test('Hard rating decreases ease factor but counts as passed review', () => {
  const cardAtRep1 = {
    repetition: 1,
    interval: 1,
    easeFactor: 2.5,
    lapses: 0,
    dueDate: '2026-10-20',
  };
  const result = calculateSM2(cardAtRep1, 'hard', FIXED_DATE);

  assert.equal(result.repetition, 2);
  assert.ok(result.easeFactor < 2.5); // EF decreased by -0.14 -> 2.36
  assert.equal(result.interval, 3);
  assert.equal(result.lapses, 0);
});

test('correctly identifies due and overdue cards against injectable clock', () => {
  const today = '2026-10-20';
  const yesterday = '2026-10-19';
  const tomorrow = '2026-10-21';

  assert.equal(isCardDue(yesterday, FIXED_DATE), true);
  assert.equal(isCardDue(today, FIXED_DATE), true);
  assert.equal(isCardDue(tomorrow, FIXED_DATE), false);

  assert.equal(isCardOverdue(yesterday, FIXED_DATE), true);
  assert.equal(isCardOverdue(today, FIXED_DATE), false);
  assert.equal(isCardOverdue(tomorrow, FIXED_DATE), false);
});

test('categorizes collection of cards accurately into due, overdue, and new buckets', () => {
  const cards = [
    { id: '1', repetition: 0, dueDate: '2026-10-20' }, // new
    { id: '2', repetition: 2, dueDate: '2026-10-18' }, // overdue
    { id: '3', repetition: 3, dueDate: '2026-10-20' }, // due today
    { id: '4', repetition: 4, dueDate: '2026-10-25' }, // upcoming
  ];

  const categorized = categorizeCards(cards, FIXED_DATE);

  assert.equal(categorized.newCards.length, 1);
  assert.equal(categorized.overdue.length, 1);
  assert.equal(categorized.dueToday.length, 1);
  assert.equal(categorized.upcoming.length, 1);
  assert.equal(categorized.allDue.length, 3); // overdue + dueToday + newCards
});

test('handles empty card list without throwing errors', () => {
  const categorized = categorizeCards([], FIXED_DATE);
  assert.equal(categorized.allDue.length, 0);
  assert.equal(categorized.overdue.length, 0);
  assert.equal(categorized.dueToday.length, 0);
});
