import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Brain,
  HelpCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { Flashcard, Subject, Topic } from '../../types/index.ts';
import { ReviewRating, calculateSM2 } from '../../utils/sm2.ts';
import { computeSessionMetrics } from '../../utils/sessionMetrics.ts';
import { AfterSessionView, CardReviewDetail } from './AfterSessionView.tsx';

interface ActiveRecallSessionProps {
  cards: Flashcard[];
  title: string;
  onRecordReview: (card: Flashcard, rating: ReviewRating) => Promise<void>;
  onExit: () => void;
  subjectsMap: Record<string, Subject>;
  topicsMap: Record<string, Topic>;
  onReturnToOverview?: () => void;
  onReturnToRevision?: () => void;
  onDrillHardCards?: (cards: Flashcard[]) => void;
  onOpenStudyBuddy?: (subjectId?: string, topicId?: string) => void;
}

export const ActiveRecallSession: React.FC<ActiveRecallSessionProps> = ({
  cards,
  title,
  onRecordReview,
  onExit,
  subjectsMap,
  topicsMap,
  onReturnToOverview,
  onReturnToRevision,
  onDrillHardCards,
  onOpenStudyBuddy,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionReviews, setSessionReviews] = useState<CardReviewDetail[]>([]);
  const sessionStartTimeRef = React.useRef<number>(Date.now());
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState<number>(0);
  const [reviewStats, setReviewStats] = useState<{
    again: number;
    hard: number;
    good: number;
    easy: number;
  }>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  // Reset session state whenever a new card queue or session title is loaded
  useEffect(() => {
    setCurrentIndex(0);
    setRevealed(false);
    setSessionCompleted(false);
    setSessionReviews([]);
    sessionStartTimeRef.current = Date.now();
    setSessionDurationSeconds(0);
    setReviewStats({
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    });
  }, [cards, title]);

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (!revealed) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setRevealed(true);
        }
      } else if (!submitting && !sessionCompleted) {
        if (e.key === '1') {
          handleRate('again');
        } else if (e.key === '2') {
          handleRate('hard');
        } else if (e.key === '3') {
          handleRate('good');
        } else if (e.key === '4') {
          handleRate('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, submitting, sessionCompleted, currentCard]);

  const handleRate = async (rating: ReviewRating) => {
    if (!currentCard || submitting) return;

    try {
      setSubmitting(true);
      await onRecordReview(currentCard, rating);

      // Compute SM-2 outcome for session ledger
      const sm2Outcome = calculateSM2(
        {
          repetition: currentCard.repetition,
          interval: currentCard.interval,
          easeFactor: currentCard.easeFactor,
          lapses: currentCard.lapses,
          dueDate: currentCard.dueDate,
          lastReviewedAt: currentCard.lastReviewedAt,
        },
        rating,
        new Date()
      );

      const reviewRecord: CardReviewDetail = {
        cardId: currentCard.id,
        card: currentCard,
        rating,
        quality: sm2Outcome.quality,
        newInterval: sm2Outcome.interval,
        frontSnippet: currentCard.front.slice(0, 80),
        subjectId: currentCard.subjectId,
        topicId: currentCard.topicId,
      };

      setSessionReviews((prev) => [...prev, reviewRecord]);

      setReviewStats((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
        setRevealed(false);
      } else {
        const finalDuration = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
        setSessionDurationSeconds(finalDuration);
        setSessionCompleted(true);
      }
    } catch (err) {
      console.error('Failed to record review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Empty cards passed
  if (!cards || cards.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4">
        <h3 className="font-serif text-2xl text-[#153225]">
          No cards in this study queue
        </h3>
        <p className="text-xs text-[#646E68]">
          There are no cards matching this review session.
        </p>
        <button
          onClick={onExit}
          className="px-4 py-2 rounded-xl bg-[#153225] text-[#FAF8F5] text-xs font-medium cursor-pointer"
        >
          Return
        </button>
      </div>
    );
  }

  // Session Completed: Render Full After-Session Debrief View
  if (sessionCompleted) {
    const finalDuration =
      sessionDurationSeconds > 0
        ? sessionDurationSeconds
        : Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));

    const metrics = computeSessionMetrics(sessionReviews, finalDuration);

    return (
      <AfterSessionView
        sessionTitle={title}
        metrics={metrics}
        reviews={sessionReviews}
        subjectsMap={subjectsMap}
        topicsMap={topicsMap}
        onReturnToOverview={onReturnToOverview || onExit}
        onReturnToRevision={onReturnToRevision || onExit}
        onDrillHardCards={onDrillHardCards}
        onOpenStudyBuddy={onOpenStudyBuddy}
      />
    );
  }

  const subject = currentCard ? subjectsMap[currentCard.subjectId] : undefined;
  const topic = currentCard ? topicsMap[currentCard.topicId] : undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4">
      {/* Top Session Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-semibold text-[#153225] bg-[#EAE3D9] px-2 py-0.5 rounded-sm">
            Card {currentIndex + 1} of {cards.length}
          </span>
          {subject && (
            <span className="text-xs font-medium text-[#646E68] truncate max-w-xs">
              {subject.name} {topic ? `› ${topic.title}` : ''}
            </span>
          )}
        </div>

        <button
          onClick={onExit}
          className="flex items-center space-x-1 text-xs text-[#88938C] hover:text-[#1E2320] px-2.5 py-1 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-[#EAE3D9] overflow-hidden">
        <div
          className="h-full bg-[#153225] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Flashcard Container */}
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-6 sm:p-10 shadow-sm min-h-[380px] flex flex-col justify-between transition-all">
        {/* Front Question */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#BA4E29] font-medium">
              Active-Recall Prompt
            </span>
            <span className="text-[11px] font-mono text-[#88938C]">
              Rep: {currentCard.repetition || 0} &bull; EF: {(currentCard.easeFactor || 2.5).toFixed(2)}
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#153225] leading-relaxed pt-2">
            {currentCard.front}
          </h2>
        </div>

        {/* Answer Section */}
        <div className="pt-6 border-t border-[#F4EFEA] mt-6">
          {!revealed ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-[#88938C] italic">
                Try to articulate the concept in your mind before flipping.
              </p>
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Reveal Answer (Space)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 sm:p-5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#1C3D2E] font-semibold block">
                  Answer / Core Mechanism
                </span>
                <p className="text-sm sm:text-base text-[#1E2320] leading-relaxed whitespace-pre-wrap">
                  {currentCard.back}
                </p>
              </div>

              {/* 4-Choice SM-2 Rating Controls */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#646E68] text-center block">
                  How well did you recall this concept?
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Again (1) */}
                  <button
                    type="button"
                    onClick={() => handleRate('again')}
                    disabled={submitting}
                    className="p-3 rounded-xl border border-[#F2C5B6] bg-[#FAF2EF] hover:bg-[#FBE4DD] text-center transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="font-serif text-sm font-semibold text-[#9B3D1E] block">
                      Again
                    </span>
                    <span className="text-[10px] text-[#BA4E29] block mt-0.5">
                      Failed (1 day)
                    </span>
                    <span className="text-[9px] font-mono text-[#88938C] block mt-1">
                      [Key 1]
                    </span>
                  </button>

                  {/* Hard (3) */}
                  <button
                    type="button"
                    onClick={() => handleRate('hard')}
                    disabled={submitting}
                    className="p-3 rounded-xl border border-[#F3DCB4] bg-[#FCF6EE] hover:bg-[#FAECD4] text-center transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="font-serif text-sm font-semibold text-[#8F5513] block">
                      Hard
                    </span>
                    <span className="text-[10px] text-[#8F5513] block mt-0.5">
                      Effortful recall
                    </span>
                    <span className="text-[9px] font-mono text-[#88938C] block mt-1">
                      [Key 2]
                    </span>
                  </button>

                  {/* Good (4) */}
                  <button
                    type="button"
                    onClick={() => handleRate('good')}
                    disabled={submitting}
                    className="p-3 rounded-xl border border-[#BDD6C8] bg-[#F2F7F4] hover:bg-[#E1EFE7] text-center transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="font-serif text-sm font-semibold text-[#153225] block">
                      Good
                    </span>
                    <span className="text-[10px] text-[#1C3D2E] block mt-0.5">
                      Optimal SM-2
                    </span>
                    <span className="text-[9px] font-mono text-[#88938C] block mt-1">
                      [Key 3]
                    </span>
                  </button>

                  {/* Easy (5) */}
                  <button
                    type="button"
                    onClick={() => handleRate('easy')}
                    disabled={submitting}
                    className="p-3 rounded-xl border border-[#A3E4C4] bg-[#EDF9F3] hover:bg-[#D2F2E2] text-center transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="font-serif text-sm font-semibold text-[#12683E] block">
                      Easy
                    </span>
                    <span className="text-[10px] text-[#1B7A4B] block mt-0.5">
                      Interval bonus
                    </span>
                    <span className="text-[9px] font-mono text-[#88938C] block mt-1">
                      [Key 4]
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
