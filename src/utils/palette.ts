import React from 'react';
import {
  BookOpen,
  FlaskConical,
  Atom,
  Compass,
  Code2,
  Brain,
  Music,
  Landmark,
  Calculator,
  Globe,
  LucideIcon,
} from 'lucide-react';
import { SubjectColor, SubjectIconName } from '../types/index.ts';

export interface ColorScheme {
  id: SubjectColor;
  label: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  accent: string;
  dot: string;
}

export const COLOR_SCHEMES: Record<SubjectColor, ColorScheme> = {
  forest: {
    id: 'forest',
    label: 'Forest Green',
    bgLight: 'bg-[#F2F7F4]',
    badgeBg: 'bg-[#E1EFE7]',
    badgeText: 'text-[#153225]',
    border: 'border-[#BDD6C8]',
    accent: '#1C3D2E',
    dot: 'bg-[#1C3D2E]',
  },
  terracotta: {
    id: 'terracotta',
    label: 'Terracotta',
    bgLight: 'bg-[#FAF2EF]',
    badgeBg: 'bg-[#FBE4DD]',
    badgeText: 'text-[#9B3D1E]',
    border: 'border-[#F2C5B6]',
    accent: '#BA4E29',
    dot: 'bg-[#BA4E29]',
  },
  ochre: {
    id: 'ochre',
    label: 'Warm Ochre',
    bgLight: 'bg-[#FAF6EC]',
    badgeBg: 'bg-[#F7EDD1]',
    badgeText: 'text-[#845E16]',
    border: 'border-[#EBDCB0]',
    accent: '#9E7422',
    dot: 'bg-[#9E7422]',
  },
  slate: {
    id: 'slate',
    label: 'Slate Ink',
    bgLight: 'bg-[#F2F4F7]',
    badgeBg: 'bg-[#E2E6EC]',
    badgeText: 'text-[#2D3748]',
    border: 'border-[#CAD1DC]',
    accent: '#3E4C5E',
    dot: 'bg-[#3E4C5E]',
  },
  mulberry: {
    id: 'mulberry',
    label: 'Mulberry',
    bgLight: 'bg-[#F9F2F6]',
    badgeBg: 'bg-[#F3DEEC]',
    badgeText: 'text-[#7D295F]',
    border: 'border-[#E2BED8]',
    accent: '#8E3670',
    dot: 'bg-[#8E3670]',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    bgLight: 'bg-[#EDF9F3]',
    badgeBg: 'bg-[#D2F2E2]',
    badgeText: 'text-[#12683E]',
    border: 'border-[#A3E4C4]',
    accent: '#1B7A4B',
    dot: 'bg-[#1B7A4B]',
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    bgLight: 'bg-[#FCF6EE]',
    badgeBg: 'bg-[#FAECD4]',
    badgeText: 'text-[#8F5513]',
    border: 'border-[#F3DCB4]',
    accent: '#A7661E',
    dot: 'bg-[#A7661E]',
  },
  teal: {
    id: 'teal',
    label: 'Deep Teal',
    bgLight: 'bg-[#EFF8F8]',
    badgeBg: 'bg-[#D4EFEF]',
    badgeText: 'text-[#195E60]',
    border: 'border-[#AFDCDC]',
    accent: '#217073',
    dot: 'bg-[#217073]',
  },
};

export const ICON_MAP: Record<SubjectIconName, LucideIcon> = {
  BookOpen,
  FlaskConical,
  Atom,
  Compass,
  Code: Code2,
  Brain,
  Music,
  Landmark,
  Calculator,
  Globe,
};

export function renderSubjectIcon(
  name?: SubjectIconName,
  className = 'w-5 h-5'
): React.ReactElement {
  const IconComponent = (name && ICON_MAP[name]) || BookOpen;
  return React.createElement(IconComponent, { className });
}
