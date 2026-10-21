/**
 * AI Output and Document Validation Utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates multiple-choice question structure
 */
export function validateMCQStructure(q: any): ValidationResult {
  if (!q || typeof q !== 'object') {
    return { isValid: false, error: 'Question must be an object' };
  }

  if (typeof q.question !== 'string' || q.question.trim().length < 5) {
    return { isValid: false, error: 'Question prompt must be at least 5 characters' };
  }

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return { isValid: false, error: 'MCQ must contain exactly 4 options' };
  }

  for (let i = 0; i < q.options.length; i++) {
    if (typeof q.options[i] !== 'string' || !q.options[i].trim()) {
      return { isValid: false, error: `Option ${i + 1} cannot be empty` };
    }
  }

  if (typeof q.correctIndex !== 'number' || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
    return { isValid: false, error: 'correctIndex must be an integer between 0 and 3' };
  }

  if (typeof q.explanation !== 'string' || q.explanation.trim().length < 5) {
    return { isValid: false, error: 'Explanation must provide educational rationale' };
  }

  return { isValid: true };
}

/**
 * Validates short-answer question structure
 */
export function validateShortAnswerStructure(q: any): ValidationResult {
  if (!q || typeof q !== 'object') {
    return { isValid: false, error: 'Question must be an object' };
  }

  if (typeof q.question !== 'string' || q.question.trim().length < 5) {
    return { isValid: false, error: 'Question prompt is required' };
  }

  if (typeof q.modelAnswer !== 'string' || q.modelAnswer.trim().length < 5) {
    return { isValid: false, error: 'Model answer is required' };
  }

  if (typeof q.explanation !== 'string' || q.explanation.trim().length < 5) {
    return { isValid: false, error: 'Explanation is required' };
  }

  return { isValid: true };
}

/**
 * Validates exam-style question structure
 */
export function validateExamQuestionStructure(q: any): ValidationResult {
  if (!q || typeof q !== 'object') {
    return { isValid: false, error: 'Question must be an object' };
  }

  if (typeof q.question !== 'string' || q.question.trim().length < 5) {
    return { isValid: false, error: 'Question prompt is required' };
  }

  if (typeof q.marks !== 'number' || q.marks <= 0) {
    return { isValid: false, error: 'Marks must be greater than zero' };
  }

  if (typeof q.modelAnswer !== 'string' || q.modelAnswer.trim().length < 5) {
    return { isValid: false, error: 'Model answer is required' };
  }

  if (!Array.isArray(q.rubric) || q.rubric.length === 0) {
    return { isValid: false, error: 'Rubric criteria list is required' };
  }

  return { isValid: true };
}

/**
 * Prompt injection defense: sanitize and neutralize untrusted student reference material
 */
export function sanitizeDocumentContext(text: string, maxLength: number = 25000): string {
  if (!text || typeof text !== 'string') return '';
  const truncated = text.slice(0, maxLength);
  return truncated
    .replace(/<\/?[a-z][a-z0-9]*[^<>]*>/gi, '') // Strip suspicious raw HTML tags
    .replace(/`{3,}/g, "'''") // Normalize triple-backticks
    .replace(/\[\s*system\s*instruction\s*\]/gi, '[Reference Note]') // Strip directive tags
    .trim();
}

/**
 * Validates uploaded document properties
 */
export function validateDocumentInput(input: {
  filename: string;
  fileSize?: number;
  textContent?: string;
  maxSizeBytes?: number;
}): ValidationResult {
  const { filename, fileSize, textContent, maxSizeBytes = 10 * 1024 * 1024 } = input;

  if (!filename || typeof filename !== 'string' || !filename.trim()) {
    return { isValid: false, error: 'Filename is required' };
  }

  const validExts = ['.pdf', '.txt', '.md', '.markdown'];
  const hasValidExt = validExts.some((ext) => filename.toLowerCase().endsWith(ext));
  if (!hasValidExt) {
    return { isValid: false, error: 'Unsupported file format. Please upload PDF, TXT, or Markdown.' };
  }

  if (fileSize !== undefined && fileSize > maxSizeBytes) {
    return { isValid: false, error: `File size exceeds ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit.` };
  }

  if (textContent !== undefined && !textContent.trim()) {
    return { isValid: false, error: 'Document text content cannot be empty.' };
  }

  return { isValid: true };
}

/**
 * Parse and clean model JSON output
 */
export function parseModelQuestionsJson(rawOutput: string): { success: boolean; data?: any[]; error?: string } {
  if (!rawOutput || typeof rawOutput !== 'string' || !rawOutput.trim()) {
    return { success: false, error: 'Empty model output' };
  }

  try {
    // Strip markdown code block wrapping if present
    const cleaned = rawOutput
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'Expected JSON array of question objects' };
    }
    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: `Malformed JSON: ${err.message}` };
  }
}
