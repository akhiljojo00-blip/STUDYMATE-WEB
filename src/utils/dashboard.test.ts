import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStudyMetrics, getGreeting } from './dashboard.ts';
import type { Subject } from '../types/index.ts';

test('calculates correct study metrics for empty subjects list', () => {
  const metrics = calculateStudyMetrics([]);
  assert.equal(metrics.totalSubjects, 0);
  assert.equal(metrics.totalWeeklyHours, 0);
  assert.equal(metrics.estimatedDailyHours, 0);
  assert.equal(metrics.hasSubjects, false);
});

test('calculates aggregated target hours accurately', () => {
  const dummySubjects: Subject[] = [
    {
      id: 'sub-1',
      userId: 'usr-1',
      name: 'Organic Chemistry',
      targetHours: 6.5,
      createdAt: null,
      updatedAt: null,
    },
    {
      id: 'sub-2',
      userId: 'usr-1',
      name: 'Algorithms',
      targetHours: 7.5,
      createdAt: null,
      updatedAt: null,
    },
    {
      id: 'sub-3',
      userId: 'usr-1',
      name: 'Modern Literature',
      targetHours: 4,
      createdAt: null,
      updatedAt: null,
    },
  ];

  const metrics = calculateStudyMetrics(dummySubjects);
  assert.equal(metrics.totalSubjects, 3);
  assert.equal(metrics.totalWeeklyHours, 18);
  assert.equal(metrics.estimatedDailyHours, 2.6); // 18 / 7 ~ 2.57 -> 2.6
  assert.equal(metrics.hasSubjects, true);
});

test('returns appropriate greeting based on hour of day', () => {
  const morning = new Date('2026-10-19T09:00:00');
  const afternoon = new Date('2026-10-19T14:00:00');
  const evening = new Date('2026-10-19T20:00:00');

  assert.equal(getGreeting(morning), 'Good morning');
  assert.equal(getGreeting(afternoon), 'Good afternoon');
  assert.equal(getGreeting(evening), 'Good evening');
});
