import React from 'react';
import { RotateCcw, Library, Brain, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { NavTab } from '../../types/index.ts';

interface ComingSoonViewProps {
  tab: NavTab;
  onNavigateHome: () => void;
}

const SECTION_METADATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    milestone: string;
    icon: React.ReactNode;
    features: string[];
    architectureNote: string;
  }
> = {
  revision: {
    title: 'Revision Room',
    subtitle: 'Mathematically optimal spaced retrieval & active recall drills',
    milestone: 'Milestone 2',
    icon: <RotateCcw className="w-8 h-8 text-[#BA4E29]" />,
    features: [
      'SM-2 and FSRS spaced repetition scheduling based on memory decay curves',
      'Active recall drill sessions with honest difficulty ratings (Easy, Good, Hard, Again)',
      'Mistake Archaeology: automatically categorizes missed concepts for targeted re-drilling',
      'Daily revision queue dynamically synchronized with student subject targets',
    ],
    architectureNote:
      'Backed by planned Firestore sub-collections: `/subjects/{id}/topics` and `/users/{uid}/revision_logs` with zero-trust security rules.',
  },
  library: {
    title: 'Study Library',
    subtitle: 'Central repository for lecture notes, synthesis summaries, and concept glossaries',
    milestone: 'Milestone 2',
    icon: <Library className="w-8 h-8 text-[#1C3D2E]" />,
    features: [
      'Concept maps linking foundational ideas to advanced syllabus topics',
      'Structured note synthesis with markdown and LaTeX formula rendering',
      'Key term flashcard decks auto-generated from subject syllabus items',
      'Downloadable offline revision sheets and study guides',
    ],
    architectureNote:
      'Stores encrypted student study materials and revision cards in Cloud Firestore.',
  },
  buddy: {
    title: 'AI Study Buddy',
    subtitle: 'Socratic dialogue tutor with deep conceptual reasoning',
    milestone: 'Milestone 3',
    icon: <Brain className="w-8 h-8 text-[#BA4E29]" />,
    features: [
      'High-thinking mode powered by Gemini reasoning models (thinkingLevel: HIGH)',
      'Socratic dialogue: guides students to identify errors rather than giving rote answers',
      'Step-by-step problem deconstruction with multi-modal diagrams and formulas',
      'Direct integration with your subjects to explain confusing curriculum topics',
    ],
    architectureNote:
      'Server-side proxy routes with MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API and zero client-exposed keys.',
  },
};

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({
  tab,
  onNavigateHome,
}) => {
  const meta = SECTION_METADATA[tab] || SECTION_METADATA.revision;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-6 sm:p-10 shadow-2xs">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F4EFEA] flex items-center justify-center">
            {meta.icon}
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#BA4E29] bg-[#FBE4DD] px-2 py-0.5 rounded-sm font-semibold">
              {meta.milestone}
            </span>
            <h1 className="font-serif text-3xl font-semibold text-[#153225] mt-1">
              {meta.title}
            </h1>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#333935] leading-relaxed">
          {meta.subtitle}
        </p>

        {/* Feature Preview List */}
        <div className="mt-8 pt-6 border-t border-[#EAE3D9] space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#88938C]">
            Planned Capabilities for {meta.milestone}
          </h2>

          <div className="space-y-2.5">
            {meta.features.map((feat, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-[#1E2320]">
                <CheckCircle className="w-4 h-4 text-[#1C3D2E] shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Note */}
        <div className="mt-6 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] text-xs text-[#646E68]">
          <span className="font-semibold text-[#153225] block mb-0.5">
            Architectural Preparation:
          </span>
          {meta.architectureNote}
        </div>

        <div className="mt-8 flex items-center justify-between pt-6 border-t border-[#EAE3D9]">
          <span className="text-xs text-[#88938C]">
            Currently active: Milestone 1 Web Foundation & Subject Management
          </span>
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Return to Overview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
