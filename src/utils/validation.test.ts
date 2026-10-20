import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubjectInput } from './validation.ts';

test('validates correct subject payload', () => {
  const result = validateSubjectInput({
    name: 'Cell Biology',
    code: 'BIO-201',
    description: 'Cellular processes, genetics, and molecular biochemistry',
    color: 'emerald',
    icon: 'FlaskConical',
    targetHours: 6,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.sanitized.name, 'Cell Biology');
  assert.equal(result.sanitized.code, 'BIO-201');
  assert.equal(result.sanitized.targetHours, 6);
  assert.equal(Object.keys(result.errors).length, 0);
});

test('rejects empty or whitespace-only subject name', () => {
  const result = validateSubjectInput({
    name: '   ',
    targetHours: 3,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.name, 'Subject title is required.');
});

test('rejects subject title less than 2 characters', () => {
  const result = validateSubjectInput({
    name: 'A',
    targetHours: 2,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.name, 'Subject title must be at least 2 characters.');
});

test('rejects subject title exceeding 60 characters', () => {
  const longName = 'A'.repeat(61);
  const result = validateSubjectInput({
    name: longName,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.name, 'Subject title cannot exceed 60 characters.');
});

test('clamps and validates targetHours bounds', () => {
  const negativeResult = validateSubjectInput({
    name: 'Physics',
    targetHours: -10,
  });
  assert.equal(negativeResult.isValid, false);

  const excessiveResult = validateSubjectInput({
    name: 'Physics',
    targetHours: 200,
  });
  assert.equal(excessiveResult.isValid, false);
  assert.equal(excessiveResult.errors.targetHours, 'Target hours cannot exceed 168 hours per week.');
});

test('falls back to safe default color and icon when invalid input passed', () => {
  const result = validateSubjectInput({
    name: 'World History',
    color: 'neon-rainbow' as any,
    icon: 'InvalidIcon' as any,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.sanitized.color, 'forest');
  assert.equal(result.sanitized.icon, 'BookOpen');
});
