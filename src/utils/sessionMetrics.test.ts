import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSessionDuration,
  getQualityTier,
  computeSessionMetrics,
  type CardReviewRecord,
} from './sessionMetrics.ts';

describe('formatSessionDuration', () => {
  test('formats seconds under 1 minute', () => {
    assert.equal(formatSessionDuration(0), '0s');
    assert.equal(formatSessionDuration(42), '42s');
    assert.equal(formatSessionDuration(59.4), '59s');
  });

  test('formats minutes and seconds', () => {
    assert.equal(formatSessionDuration(60), '1m');
    assert.equal(formatSessionDuration(125), '2m 5s');
    assert.equal(formatSessionDuration(3599), '59m 59s');
  });

  test('formats hours and minutes', () => {
    assert.equal(formatSessionDuration(3600), '1h 0m');
    assert.equal(formatSessionDuration(3665), '1h 1m 5s');
  });
});

describe('getQualityTier', () => {
  test('classifies tiers accurately based on score', () => {
    assert.equal(getQualityTier(4.8).tier, 'exceptional');
    assert.equal(getQualityTier(4.0).tier, 'strong');
    assert.equal(getQualityTier(3.4).tier, 'moderate');
    assert.equal(getQualityTier(2.1).tier, 'needs_work');
  });
});

describe('computeSessionMetrics', () => {
  test('handles empty reviews array gracefully', () => {
    const res = computeSessionMetrics([], 30);
    assert.equal(res.totalReviewed, 0);
    assert.equal(res.averageQuality, 0);
    assert.equal(res.retentionRate, 0);
    assert.equal(res.durationSeconds, 30);
  });

  test('computes correct averages and distributions', () => {
    const reviews: CardReviewRecord[] = [
      { cardId: 'c1', rating: 'good', quality: 4, newInterval: 6 },
      { cardId: 'c2', rating: 'easy', quality: 5, newInterval: 12 },
      { cardId: 'c3', rating: 'hard', quality: 3, newInterval: 2 },
      { cardId: 'c4', rating: 'again', quality: 1, newInterval: 1 },
    ];

    const metrics = computeSessionMetrics(reviews, 80);

    assert.equal(metrics.totalReviewed, 4);
    assert.equal(metrics.againCount, 1);
    assert.equal(metrics.hardCount, 1);
    assert.equal(metrics.goodCount, 1);
    assert.equal(metrics.easyCount, 1);
    // (4 + 5 + 3 + 1) / 4 = 13 / 4 = 3.25 -> rounded to 3.3
    assert.equal(metrics.averageQuality, 3.3);
    // 3 passed out of 4 = 75%
    assert.equal(metrics.retentionRate, 75);
    // 80 seconds / 4 cards = 20s / card
    assert.equal(metrics.averageSecondsPerCard, 20);
    // scheduled: c4 (<=1) -> 1, c1 (6) & c3 (2) (<=7) -> 2, c2 (12) (>7) -> 1
    assert.equal(metrics.scheduledTomorrowCount, 1);
    assert.equal(metrics.scheduledWeekCount, 2);
    assert.equal(metrics.scheduledLongTermCount, 1);
    assert.equal(metrics.qualityTier, 'moderate');
  });
});
