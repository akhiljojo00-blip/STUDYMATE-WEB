import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Brain,
  Layers,
  Calendar,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
  BarChart3,
  Flame,
} from 'lucide-react';
import { Flashcard, Subject, Topic } from '../../types/index.ts';
import { ReviewRating } from '../../utils/sm2.ts';
import {
  SessionMetricsSummary,
  CardReviewRecord,
  formatSessionDuration,
} from '../../utils/sessionMetrics.ts';
import { renderSubjectIcon, COLOR_SCHEMES } from '../../utils/palette.ts';

export interface CardReviewDetail extends CardReviewRecord {
  card: Flashcard;
}

interface AfterSessionViewProps {
  sessionTitle: string;
  metrics: SessionMetricsSummary;
  reviews: CardReviewDetail[];
  subjectsMap: Record<string, Subject>;
  topicsMap: Record<string, Topic>;
  onReturnToOverview: () => void;
  onReturnToRevision: () => void;
  onDrillHardCards?: (cards: Flashcard[]) => void;
  onOpenStudyBuddy?: (subjectId?: string, topicId?: string) => void;
}

export const AfterSessionView: React.FC<AfterSessionViewProps> = ({
  sessionTitle,
  metrics,
  reviews,
  subjectsMap,
  topicsMap,
  onReturnToOverview,
  onReturnToRevision,
  onDrillHardCards,
  onOpenStudyBuddy,
}) => {
  const [showLedger, setShowLedger] = useState(false);

  // Cards that were marked 'again' or 'hard' (ideal for immediate micro-drill)
  const weakCards = reviews
    .filter((r) => r.rating === 'again' || r.rating === 'hard')
    .map((r) => r.card);

  // Distinct subjects touched in this session
  const subjectIds = Array.from(new Set(reviews.map((r) => r.card.subjectId)));

  // Quality badge styling based on tier
  const tierConfig = {
    exceptional: {
      badgeBg: 'bg-[#EDF9F3]',
      badgeText: 'text-[#12683E]',
      border: 'border-[#A3E4C4]',
      iconColor: 'text-[#12683E]',
    },
    strong: {
      badgeBg: 'bg-[#F2F7F4]',
      badgeText: 'text-[#153225]',
      border: 'border-[#D8CEBF]',
      iconColor: 'text-[#153225]',
    },
    moderate: {
      badgeBg: 'bg-[#FCF6EE]',
      badgeText: 'text-[#8F5513]',
      border: 'border-[#F3DCB4]',
      iconColor: 'text-[#8F5513]',
    },
    needs_work: {
      badgeBg: 'bg-[#FAF2EF]',
      badgeText: 'text-[#9B3D1E]',
      border: 'border-[#F2C5B6]',
      iconColor: 'text-[#9B3D1E]',
    },
  }[metrics.qualityTier];

  const ratingPillStyle: Record<ReviewRating, { bg: string; text: string; label: string }> = {
    again: { bg: 'bg-[#FAF2EF] border-[#F2C5B6]', text: 'text-[#9B3D1E]', label: 'Again' },
    hard: { bg: 'bg-[#FCF6EE] border-[#F3DCB4]', text: 'text-[#8F5513]', label: 'Hard' },
    good: { bg: 'bg-[#F2F7F4] border-[#CDE1D6]', text: 'text-[#153225]', label: 'Good' },
    easy: { bg: 'bg-[#EDF9F3] border-[#A3E4C4]', text: 'text-[#12683E]', label: 'Easy' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in-50 duration-200">
      {/* Session Hero Banner */}
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-sm bg-[#E1EFE7] text-[#153225] font-semibold tracking-wider">
              Session Concluded
            </span>
            <span className="text-xs text-[#88938C]">SM-2 Spaced Retrieval</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#153225]">
            Active Recall Debrief
          </h1>
          <p className="text-sm text-[#646E68]">
            {sessionTitle} &bull; Deterministic spaced intervals updated in memory
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={onReturnToRevision}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-[#D8CEBF] bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#153225] text-xs font-medium transition-colors cursor-pointer"
          >
            Revision Room
          </button>
          <button
            onClick={onReturnToOverview}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Cards Reviewed, Average Response Quality, Time Spent) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Number of Cards Reviewed */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#646E68]">Cards Reviewed</span>
              <div className="w-7 h-7 rounded-lg bg-[#E1EFE7] text-[#153225] flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#153225]">
                {metrics.totalReviewed}
              </span>
              <span className="text-xs text-[#88938C]">flashcards</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs">
            <span className="text-[#646E68]">Retention Success:</span>
            <span className="font-semibold text-[#153225]">{metrics.retentionRate}%</span>
          </div>
        </div>

        {/* KPI 2: Average Response Quality */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#646E68]">Avg Response Quality</span>
              <div className="w-7 h-7 rounded-lg bg-[#FAF0EA] text-[#BA4E29] flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#153225]">
                {metrics.averageQuality.toFixed(1)}
              </span>
              <span className="text-xs text-[#88938C]">/ 5.0</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs">
            <span className="text-[#646E68]">Mastery Tier:</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${tierConfig.badgeBg} ${tierConfig.badgeText} ${tierConfig.border}`}>
              {metrics.qualityLabel}
            </span>
          </div>
        </div>

        {/* KPI 3: Time Spent */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#646E68]">Time Spent</span>
              <div className="w-7 h-7 rounded-lg bg-[#F4EFEA] text-[#153225] flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#153225]">
                {formatSessionDuration(metrics.durationSeconds)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs">
            <span className="text-[#646E68]">Average Pacing:</span>
            <span className="font-semibold text-[#153225]">
              {metrics.averageSecondsPerCard > 0 ? `${metrics.averageSecondsPerCard}s / card` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Response Quality Breakdown & Spaced Repetition Projections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quality Distribution Breakdown */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-[#153225] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1C3D2E]" />
              <span>Response Quality Breakdown</span>
            </h3>
            <span className="text-xs text-[#88938C] font-mono">{metrics.totalReviewed} total</span>
          </div>

          {/* Segmented Distribution Bar */}
          {metrics.totalReviewed > 0 && (
            <div className="w-full h-3 rounded-full bg-[#EAE3D9] overflow-hidden flex shadow-inner">
              {metrics.againCount > 0 && (
                <div
                  style={{ width: `${(metrics.againCount / metrics.totalReviewed) * 100}%` }}
                  className="bg-[#BA4E29] h-full"
                  title={`Again: ${metrics.againCount}`}
                />
              )}
              {metrics.hardCount > 0 && (
                <div
                  style={{ width: `${(metrics.hardCount / metrics.totalReviewed) * 100}%` }}
                  className="bg-[#D97706] h-full"
                  title={`Hard: ${metrics.hardCount}`}
                />
              )}
              {metrics.goodCount > 0 && (
                <div
                  style={{ width: `${(metrics.goodCount / metrics.totalReviewed) * 100}%` }}
                  className="bg-[#153225] h-full"
                  title={`Good: ${metrics.goodCount}`}
                />
              )}
              {metrics.easyCount > 0 && (
                <div
                  style={{ width: `${(metrics.easyCount / metrics.totalReviewed) * 100}%` }}
                  className="bg-[#10B981] h-full"
                  title={`Easy: ${metrics.easyCount}`}
                />
              )}
            </div>
          )}

          {/* Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-3 rounded-xl bg-[#FAF2EF] border border-[#F2C5B6] text-center">
              <span className="font-serif text-xl font-semibold text-[#9B3D1E] block">
                {metrics.againCount}
              </span>
              <span className="text-[11px] text-[#646E68] font-medium block mt-0.5">
                Again (1)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FCF6EE] border border-[#F3DCB4] text-center">
              <span className="font-serif text-xl font-semibold text-[#8F5513] block">
                {metrics.hardCount}
              </span>
              <span className="text-[11px] text-[#646E68] font-medium block mt-0.5">
                Hard (3)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F2F7F4] border border-[#CDE1D6] text-center">
              <span className="font-serif text-xl font-semibold text-[#153225] block">
                {metrics.goodCount}
              </span>
              <span className="text-[11px] text-[#646E68] font-medium block mt-0.5">
                Good (4)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#EDF9F3] border border-[#A3E4C4] text-center">
              <span className="font-serif text-xl font-semibold text-[#12683E] block">
                {metrics.easyCount}
              </span>
              <span className="text-[11px] text-[#646E68] font-medium block mt-0.5">
                Easy (5)
              </span>
            </div>
          </div>
        </div>

        {/* SM-2 Spaced Retrieval Re-scheduling */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-[#153225] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1C3D2E]" />
              <span>Next Retrieval Projections</span>
            </h3>
            <span className="text-xs text-[#88938C]">SuperMemo SM-2</span>
          </div>

          <p className="text-xs text-[#646E68]">
            Card intervals have adapted according to your response ease factor:
          </p>

          <div className="space-y-2 pt-1">
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BA4E29]" />
                <span className="text-[#333935] font-medium">Scheduled for Tomorrow (1 day):</span>
              </div>
              <span className="font-serif text-sm font-semibold text-[#153225]">
                {metrics.scheduledTomorrowCount} card{metrics.scheduledTomorrowCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <span className="text-[#333935] font-medium">Scheduled This Week (2 - 7 days):</span>
              </div>
              <span className="font-serif text-sm font-semibold text-[#153225]">
                {metrics.scheduledWeekCount} card{metrics.scheduledWeekCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#153225]" />
                <span className="text-[#333935] font-medium">Long-Term Retention (&gt; 7 days):</span>
              </div>
              <span className="font-serif text-sm font-semibold text-[#153225]">
                {metrics.scheduledLongTermCount} card{metrics.scheduledLongTermCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Targeted Recommendations & Follow-Up Actions */}
      <div className="bg-[#FAF8F5] border border-[#D8CEBF] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-semibold text-[#153225] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#BA4E29]" />
              <span>Recommended Next Steps</span>
            </h3>
            <p className="text-xs text-[#646E68] mt-0.5">
              Reinforce difficult concepts while neural pathways are actively primed
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {weakCards.length > 0 && onDrillHardCards && (
              <button
                onClick={() => onDrillHardCards(weakCards)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF0EA] hover:bg-[#F5E2D6] text-[#C85A32] text-xs font-medium flex items-center gap-1.5 border border-[#F0D5C7] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Drill {weakCards.length} Strained {weakCards.length === 1 ? 'Card' : 'Cards'}</span>
              </button>
            )}

            {onOpenStudyBuddy && (
              <button
                onClick={() => onOpenStudyBuddy(subjectIds[0])}
                className="px-3.5 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-[#F3E5AB]" />
                <span>Clarify Concepts with AI Buddy</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Review Ledger (Accordion / Toggle) */}
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl overflow-hidden shadow-2xs">
        <button
          onClick={() => setShowLedger(!showLedger)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1C3D2E]" />
            <h3 className="font-serif text-base font-semibold text-[#153225]">
              Detailed Session Ledger ({reviews.length} {reviews.length === 1 ? 'card' : 'cards'})
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#646E68]">
            <span>{showLedger ? 'Collapse' : 'Inspect each card result'}</span>
            {showLedger ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showLedger && (
          <div className="border-t border-[#EAE3D9] divide-y divide-[#F4EFEA] max-h-96 overflow-y-auto">
            {reviews.map((item, idx) => {
              const pill = ratingPillStyle[item.rating] || ratingPillStyle.good;
              const sub = subjectsMap[item.card.subjectId];
              const top = topicsMap[item.card.topicId];

              return (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FCFAF8] transition-colors">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-[#88938C]">#{idx + 1}</span>
                      {sub && (
                        <span className="font-mono text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-[#F4EFEA] text-[#153225]">
                          {sub.code || sub.name}
                        </span>
                      )}
                      {top && (
                        <span className="text-[11px] text-[#646E68]">
                          &bull; {top.title}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#1C1917] font-medium line-clamp-2">
                      {item.card.front}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-[11px] text-[#88938C]">
                      <span>Next interval: </span>
                      <span className="font-semibold text-[#153225]">
                        +{item.newInterval ?? 1} {item.newInterval === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${pill.bg} ${pill.text}`}>
                      {pill.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
