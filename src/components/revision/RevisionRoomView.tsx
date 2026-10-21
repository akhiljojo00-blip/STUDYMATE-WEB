import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Brain,
  History,
  TrendingDown,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Flashcard, Subject, Topic, ReviewLog } from '../../types/index.ts';
import { categorizeCards, formatDateISO } from '../../utils/sm2.ts';
import { COLOR_SCHEMES, renderSubjectIcon } from '../../utils/palette.ts';

interface RevisionRoomViewProps {
  cards: Flashcard[];
  subjects: Subject[];
  topics: Topic[];
  reviewLogs: ReviewLog[];
  loading: boolean;
  onStartReview: (cardsToStudy: Flashcard[], title: string) => void;
  onNavigateToSubjects: () => void;
}

export const RevisionRoomView: React.FC<RevisionRoomViewProps> = ({
  cards,
  subjects,
  topics,
  reviewLogs,
  loading,
  onStartReview,
  onNavigateToSubjects,
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'mistakes' | 'history'>('queue');

  const now = new Date();
  const categorized = categorizeCards(cards, now);

  // Filter cards by subject if selected
  const activeSubjectCards =
    selectedSubjectFilter === 'all'
      ? cards
      : cards.filter((c) => c.subjectId === selectedSubjectFilter);

  const activeCategorized = categorizeCards(activeSubjectCards, now);

  // Identify difficult cards (Mistake Archaeology: lapses > 0 or EF < 2.0)
  const difficultCards = [...cards]
    .filter((c) => (c.lapses || 0) > 0 || (c.easeFactor || 2.5) < 2.1)
    .sort((a, b) => (b.lapses || 0) - (a.lapses || 0));

  // Build subject lookup map
  const subjectsMap = subjects.reduce<Record<string, Subject>>((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const topicsMap = topics.reduce<Record<string, Topic>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  // Group due cards by subject
  const dueBySubject: Record<string, Flashcard[]> = {};
  for (const card of activeCategorized.allDue) {
    if (!dueBySubject[card.subjectId]) {
      dueBySubject[card.subjectId] = [];
    }
    dueBySubject[card.subjectId].push(card);
  }

  const ratingBadge: Record<string, { label: string; bg: string; text: string }> = {
    again: { label: 'Again (Reset)', bg: 'bg-[#FAF2EF]', text: 'text-[#9B3D1E]' },
    hard: { label: 'Hard', bg: 'bg-[#FCF6EE]', text: 'text-[#8F5513]' },
    good: { label: 'Good', bg: 'bg-[#F2F7F4]', text: 'text-[#153225]' },
    easy: { label: 'Easy (Bonus)', bg: 'bg-[#EDF9F3]', text: 'text-[#12683E]' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D9]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#153225]">
              Revision Room
            </h1>
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded-sm bg-[#E1EFE7] text-[#153225] font-semibold">
              SM-2 Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#646E68] mt-1">
            Deterministic spaced retrieval scheduling based on your memory retention decay curves
          </p>
        </div>

        {activeCategorized.allDue.length > 0 && (
          <button
            onClick={() =>
              onStartReview(
                activeCategorized.allDue,
                selectedSubjectFilter === 'all'
                  ? "Today's Full Revision Queue"
                  : `${subjectsMap[selectedSubjectFilter]?.name || 'Subject'} Due Cards`
              )
            }
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Brain className="w-4 h-4 text-[#BA4E29]" />
            <span>Start Review Session ({activeCategorized.allDue.length})</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Due Today */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-medium text-[#646E68] block">
            Due Today
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-serif text-3xl font-semibold text-[#BA4E29]">
              {loading ? '-' : categorized.dueToday.length}
            </span>
            <span className="text-xs text-[#88938C]">cards</span>
          </div>
          <p className="text-[11px] text-[#88938C] mt-2 border-t border-[#F4EFEA] pt-2">
            Optimal retrieval window
          </p>
        </div>

        {/* Overdue */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-medium text-[#646E68] block">
            Overdue Cards
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-serif text-3xl font-semibold text-[#9B3D1E]">
              {loading ? '-' : categorized.overdue.length}
            </span>
            <span className="text-xs text-[#88938C]">past due</span>
          </div>
          <p className="text-[11px] text-[#88938C] mt-2 border-t border-[#F4EFEA] pt-2">
            {categorized.overdue.length > 0
              ? 'Prioritised in review'
              : 'Zero backlog'}
          </p>
        </div>

        {/* New Cards */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-medium text-[#646E68] block">
            New Unstudied Cards
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-serif text-3xl font-semibold text-[#153225]">
              {loading ? '-' : categorized.newCards.length}
            </span>
            <span className="text-xs text-[#88938C]">ready</span>
          </div>
          <p className="text-[11px] text-[#88938C] mt-2 border-t border-[#F4EFEA] pt-2">
            Repetition count 0
          </p>
        </div>

        {/* Total Deck Health */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-medium text-[#646E68] block">
            Total Cards Tracked
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-serif text-3xl font-semibold text-[#333935]">
              {loading ? '-' : cards.length}
            </span>
            <span className="text-xs text-[#88938C]">in deck</span>
          </div>
          <p className="text-[11px] text-[#88938C] mt-2 border-t border-[#F4EFEA] pt-2">
            {difficultCards.length} in mistake tracking
          </p>
        </div>
      </div>

      {/* Sub Tabs: Queue | Mistake Archaeology | Review History */}
      <div className="flex items-center space-x-2 border-b border-[#EAE3D9] text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 font-semibold ${
            activeSubTab === 'queue'
              ? 'border-[#153225] text-[#153225]'
              : 'border-transparent text-[#646E68] hover:text-[#1E2320]'
          }`}
        >
          Active Queue ({activeCategorized.allDue.length})
        </button>

        <button
          onClick={() => setActiveSubTab('mistakes')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 font-semibold flex items-center space-x-1.5 ${
            activeSubTab === 'mistakes'
              ? 'border-[#BA4E29] text-[#BA4E29]'
              : 'border-transparent text-[#646E68] hover:text-[#1E2320]'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Mistake Archaeology ({difficultCards.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 font-semibold flex items-center space-x-1.5 ${
            activeSubTab === 'history'
              ? 'border-[#153225] text-[#153225]'
              : 'border-transparent text-[#646E68] hover:text-[#1E2320]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Review History ({reviewLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Active Queue */}
      {activeSubTab === 'queue' && (
        <div className="space-y-6">
          {/* Subject Filter Bar */}
          {subjects.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[#88938C] font-medium shrink-0">Filter:</span>
              <button
                onClick={() => setSelectedSubjectFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedSubjectFilter === 'all'
                    ? 'bg-[#153225] text-[#FAF8F5]'
                    : 'bg-[#F4EFEA] text-[#646E68] hover:text-[#1E2320]'
                }`}
              >
                All Subjects ({categorized.allDue.length})
              </button>

              {subjects.map((sub) => {
                const count = cards.filter(
                  (c) => c.subjectId === sub.id && (c.repetition === 0 || c.dueDate <= formatDateISO(now))
                ).length;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectFilter(sub.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                      selectedSubjectFilter === sub.id
                        ? 'bg-[#153225] text-[#FAF8F5]'
                        : 'bg-[#F4EFEA] text-[#646E68] hover:text-[#1E2320]'
                    }`}
                  >
                    <span>{sub.name}</span>
                    <span className="ml-1 opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Honest Empty State: Zero cards due */}
          {!loading && activeCategorized.allDue.length === 0 && (
            <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E1EFE7] text-[#153225] flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-[#153225]">
                All caught up for today!
              </h3>
              <p className="text-xs sm:text-sm text-[#646E68] max-w-sm mx-auto leading-relaxed">
                No active recall drills are due today. The SM-2 spaced repetition engine will schedule cards as memory intervals decay.
              </p>
              <div className="pt-3">
                <button
                  onClick={onNavigateToSubjects}
                  className="px-4 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <span>Add More Cards in My Subjects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Grouped by Subject Due Cards */}
          {!loading && activeCategorized.allDue.length > 0 && (
            <div className="space-y-4">
              {Object.keys(dueBySubject).map((subId) => {
                const sub = subjectsMap[subId];
                const subDueCards = dueBySubject[subId];
                const scheme = COLOR_SCHEMES[sub?.color || 'forest'] || COLOR_SCHEMES.forest;

                return (
                  <div
                    key={subId}
                    className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${scheme.badgeBg} ${scheme.badgeText}`}
                        >
                          {renderSubjectIcon(sub?.icon, 'w-4 h-4')}
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-semibold text-[#153225]">
                            {sub?.name || 'Subject'}
                          </h3>
                          <span className="text-xs text-[#88938C]">
                            {subDueCards.length} card{subDueCards.length !== 1 ? 's' : ''} ready for review
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onStartReview(subDueCards, `${sub?.name || 'Subject'} Deck`)
                        }
                        className="px-4 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                      >
                        Review Subject ({subDueCards.length})
                      </button>
                    </div>

                    {/* Preview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-[#F4EFEA]">
                      {subDueCards.slice(0, 4).map((card) => {
                        const topic = topicsMap[card.topicId];
                        return (
                          <div
                            key={card.id}
                            className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] flex flex-col justify-between"
                          >
                            <div>
                              {topic && (
                                <span className="text-[10px] font-mono text-[#88938C] uppercase block mb-1">
                                  {topic.title}
                                </span>
                              )}
                              <p className="text-xs font-medium text-[#1E2320] line-clamp-2">
                                {card.front}
                              </p>
                            </div>
                            <div className="mt-2 text-[10px] text-[#88938C] flex justify-between items-center">
                              <span>
                                {card.repetition === 0 ? 'New Card' : `Rep ${card.repetition} • ${card.interval}d`}
                              </span>
                              <span>Due: {card.dueDate}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Mistake Archaeology */}
      {activeSubTab === 'mistakes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] text-xs text-[#646E68]">
            <span className="font-semibold text-[#153225] block mb-0.5">
              Mistake Archaeology Engine
            </span>
            Cards flagged here have repeated failed recall attempts (Again) or a low Ease Factor (&lt; 2.1). Study these concepts closely to break the forgetting curve.
          </div>

          {difficultCards.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-8 text-center text-xs text-[#88938C]">
              No difficult cards recorded yet. As you rate cards 'Again' or 'Hard' in review sessions, they will be gathered here.
            </div>
          ) : (
            <div className="space-y-3">
              {difficultCards.map((card) => {
                const sub = subjectsMap[card.subjectId];
                const topic = topicsMap[card.topicId];

                return (
                  <div
                    key={card.id}
                    className="bg-[#FFFFFF] border border-[#F2C5B6] rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-md bg-[#FAF2EF] text-[#9B3D1E] font-semibold">
                          Lapses: {card.lapses || 0}
                        </span>
                        <span className="font-mono text-[10px] text-[#88938C]">
                          EF: {(card.easeFactor || 2.5).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#646E68]">
                        {sub?.name} {topic ? `› ${topic.title}` : ''}
                      </span>
                    </div>

                    <p className="font-serif text-base text-[#153225]">
                      {card.front}
                    </p>

                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EAE3D9] text-xs text-[#333935]">
                      <span className="font-mono text-[10px] uppercase text-[#1C3D2E] block font-semibold mb-0.5">
                        Answer
                      </span>
                      {card.back}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Review History */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] text-xs text-[#646E68]">
            <span className="font-semibold text-[#153225] block mb-0.5">
              Review Event Logs
            </span>
            Immutable audit logs written to Firestore after each active recall review event.
          </div>

          {reviewLogs.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-8 text-center text-xs text-[#88938C]">
              No review history recorded yet. Complete your first study session to populate historical logs.
            </div>
          ) : (
            <div className="space-y-2.5">
              {reviewLogs.slice(0, 20).map((log) => {
                const sub = subjectsMap[log.subjectId];
                const badge = ratingBadge[log.rating] || ratingBadge.good;
                const reviewDate = log.reviewedAt?.toDate
                  ? new Date(log.reviewedAt.toDate()).toLocaleString()
                  : 'Recent';

                return (
                  <div
                    key={log.id}
                    className="bg-[#FFFFFF] border border-[#EAE3D9] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                        <span className="font-semibold text-[#153225]">
                          {sub?.name || 'Subject'}
                        </span>
                      </div>
                      <p className="text-[#646E68] text-xs line-clamp-1">
                        {log.frontSnippet || 'Flashcard prompt'}
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-[#88938C] shrink-0">
                      <div>
                        Rep: {log.previousRepetition} &rarr; {log.newRepetition} &bull; Interval: {log.newInterval}d
                      </div>
                      <div>{reviewDate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
