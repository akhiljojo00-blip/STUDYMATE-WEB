import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSubjectInput,
  validateTopicInput,
  validateFlashcardInput,
} from './validation.ts';

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

// Topic validation tests
test('validates valid topic payload', () => {
  const result = validateTopicInput({
    title: 'DNA Replication Mechanisms',
    description: 'Helicase, RNA primers, Okazaki fragments, and DNA polymerase III.',
    status: 'learning',
  });

  assert.equal(result.isValid, true);
  assert.equal(result.sanitized.title, 'DNA Replication Mechanisms');
  assert.equal(result.sanitized.status, 'learning');
  assert.equal(Object.keys(result.errors).length, 0);
});

test('rejects topic with empty or short title', () => {
  const result = validateTopicInput({
    title: ' ',
  });
  assert.equal(result.isValid, false);
  assert.equal(result.errors.title, 'Topic title is required.');

  const shortResult = validateTopicInput({
    title: 'X',
  });
  assert.equal(shortResult.isValid, false);
  assert.equal(shortResult.errors.title, 'Topic title must be at least 2 characters.');
});

test('rejects topic title exceeding 80 characters', () => {
  const result = validateTopicInput({
    title: 'T'.repeat(81),
  });
  assert.equal(result.isValid, false);
  assert.equal(result.errors.title, 'Topic title cannot exceed 80 characters.');
});

// Flashcard validation tests
test('validates valid flashcard prompt and answer', () => {
  const result = validateFlashcardInput({
    front: 'What enzyme synthesizes the RNA primer during DNA replication?',
    back: 'RNA Primase synthesizes a short RNA primer to provide a free 3\'-OH group for DNA polymerase.',
  });

  assert.equal(result.isValid, true);
  assert.ok(result.sanitized.front.startsWith('What enzyme'));
  assert.ok(result.sanitized.back.startsWith('RNA Primase'));
  assert.equal(Object.keys(result.errors).length, 0);
});

test('rejects flashcard with missing front or back', () => {
  const emptyFront = validateFlashcardInput({
    front: '  ',
    back: 'Some answer',
  });
  assert.equal(emptyFront.isValid, false);
  assert.equal(emptyFront.errors.front, 'Question or prompt is required.');

  const emptyBack = validateFlashcardInput({
    front: 'What is mitochondria?',
    back: ' ',
  });
  assert.equal(emptyBack.isValid, false);
  assert.equal(emptyBack.errors.back, 'Answer or explanation is required.');
});
