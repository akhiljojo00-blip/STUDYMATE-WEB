import type { SubjectColor, SubjectFormData, SubjectIconName, SubjectValidationErrors } from '../types/index.ts';

export const ALLOWED_COLORS: SubjectColor[] = [
  'forest',
  'terracotta',
  'ochre',
  'slate',
  'mulberry',
  'emerald',
  'amber',
  'teal',
];

export const ALLOWED_ICONS: SubjectIconName[] = [
  'BookOpen',
  'FlaskConical',
  'Atom',
  'Compass',
  'Code',
  'Brain',
  'Music',
  'Landmark',
  'Calculator',
  'Globe',
];

export function validateSubjectInput(input: Partial<SubjectFormData>): {
  isValid: boolean;
  errors: SubjectValidationErrors;
  sanitized: SubjectFormData;
} {
  const errors: SubjectValidationErrors = {};
  
  const rawName = (input.name ?? '').trim();
  const rawCode = (input.code ?? '').trim().toUpperCase();
  const rawDesc = (input.description ?? '').trim();
  
  // Validate Name
  if (!rawName) {
    errors.name = 'Subject title is required.';
  } else if (rawName.length < 2) {
    errors.name = 'Subject title must be at least 2 characters.';
  } else if (rawName.length > 60) {
    errors.name = 'Subject title cannot exceed 60 characters.';
  }

  // Validate Code
  if (rawCode.length > 20) {
    errors.code = 'Course code cannot exceed 20 characters.';
  }

  // Validate Description
  if (rawDesc.length > 280) {
    errors.description = 'Description cannot exceed 280 characters.';
  }

  // Validate Target Hours
  let parsedHours = Number(input.targetHours ?? 0);
  if (isNaN(parsedHours) || parsedHours < 0) {
    errors.targetHours = 'Target study hours must be a positive number.';
    parsedHours = 0;
  } else if (parsedHours > 168) {
    errors.targetHours = 'Target hours cannot exceed 168 hours per week.';
  }

  // Validate Color
  const color: SubjectColor = ALLOWED_COLORS.includes(input.color as SubjectColor)
    ? (input.color as SubjectColor)
    : 'forest';

  // Validate Icon
  const icon: SubjectIconName = ALLOWED_ICONS.includes(input.icon as SubjectIconName)
    ? (input.icon as SubjectIconName)
    : 'BookOpen';

  const sanitized: SubjectFormData = {
    name: rawName,
    code: rawCode,
    description: rawDesc,
    color,
    icon,
    targetHours: Math.round(parsedHours * 10) / 10,
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
