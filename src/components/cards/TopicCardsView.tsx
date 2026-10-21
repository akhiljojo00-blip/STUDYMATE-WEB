import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Brain,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { Subject, Topic, Flashcard } from '../../types/index.ts';
import { isCardDue, isCardOverdue, formatDateISO } from '../../utils/sm2.ts';

interface TopicCardsViewProps {
  subject: Subject;
  topic: Topic;
  cards: Flashcard[];
  loading: boolean;
  onBackToTopic: () => void;
  onAddCard: () => void;
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (card: Flashcard) => void;
  onStartStudy: (cards: Flashcard[], title: string) => void;
}

export const TopicCardsView: React.FC<TopicCardsViewProps> = ({
  subject,
  topic,
  cards,
  loading,
  onBackToTopic,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onStartStudy,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (cardId: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const dueCount = cards.filter((c) => isCardDue(c.dueDate)).length;
  const overdueCount = cards.filter((c) => isCardOverdue(c.dueDate)).length;
  const newCount = cards.filter((c) => (c.repetition ?? 0) === 0).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-[#88938C]">
        <button
          onClick={onBackToTopic}
          className="flex items-center space-x-1 text-[#153225] hover:text-[#BA4E29] font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{subject.name}</span>
        </button>
        <span>/</span>
        <span className="text-[#333935] font-semibold truncate max-w-xs sm:max-w-md">
          {topic.title}
        </span>
        <span>/</span>
        <span className="text-[#88938C]">Flashcards</span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded-md bg-[#F4EFEA] text-[#153225] border border-[#EAE3D9]">
              {subject.code || subject.name}
            </span>
            <span className="text-xs text-[#88938C]">&bull;</span>
            <span className="text-xs text-[#646E68]">Active-Recall Deck</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#153225] mt-1">
            {topic.title}
          </h1>

          <div className="mt-2.5 flex items-center space-x-3 text-xs text-[#88938C]">
            <span className="font-medium text-[#1E2320]">
              {cards.length} card{cards.length !== 1 ? 's' : ''} total
            </span>
            <span>&bull;</span>
            <span className="text-[#BA4E29] font-medium">
              {dueCount} due for review
            </span>
            {overdueCount > 0 && (
              <>
                <span>&bull;</span>
                <span className="text-[#9B3D1E]">
                  ({overdueCount} overdue)
                </span>
              </>
            )}
            <span>&bull;</span>
            <span>{newCount} new</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 self-start md:self-center">
          {cards.length > 0 && (
            <button
              onClick={() => onStartStudy(cards, `${topic.title} Deck`)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#D8CEBF] text-[#153225] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <Brain className="w-4 h-4 text-[#BA4E29]" />
              <span>Study Deck ({cards.length})</span>
            </button>
          )}

          <button
            onClick={onAddCard}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && cards.length === 0 && (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="bg-[#FFFFFF] border border-[#EAE3D9] rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="w-1/2 h-5 bg-[#EAE3D9] rounded-md" />
              <div className="w-full h-8 bg-[#F4EFEA] rounded-md" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State: Zero cards */}
      {!loading && cards.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#E1EFE7] text-[#153225] flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[#153225]">
            No flashcards in this topic yet
          </h3>
          <p className="text-xs sm:text-sm text-[#646E68] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Create your first question and answer pair. Active retrieval challenges your memory and anchors foundational concepts into long-term recall.
          </p>
          <button
            onClick={onAddCard}
            className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Flashcard</span>
          </button>
        </div>
      )}

      {/* Cards List */}
      {!loading && cards.length > 0 && (
        <div className="space-y-3">
          {cards.map((card, idx) => {
            const isDue = isCardDue(card.dueDate);
            const isOverdue = isCardOverdue(card.dueDate);
            const isExpanded = expandedCards[card.id];

            return (
              <div
                key={card.id}
                className="bg-[#FFFFFF] border border-[#D8CEBF] hover:border-[#153225] rounded-xl p-4 sm:p-5 shadow-2xs transition-all space-y-3"
              >
                {/* Header row: Index & SM-2 Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F4EFEA]">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-[#88938C]">
                      #{idx + 1}
                    </span>

                    {/* Due Badge */}
                    {isOverdue ? (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#FAF2EF] text-[#9B3D1E] border border-[#F2C5B6]">
                        Overdue ({card.dueDate})
                      </span>
                    ) : isDue ? (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#FBE4DD] text-[#BA4E29] border border-[#F2C5B6]">
                        Due Today
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#E1EFE7] text-[#153225]">
                        Due in {card.interval}d ({card.dueDate})
                      </span>
                    )}

                    {/* Repetition & Ease */}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#F4EFEA] text-[#646E68]">
                      Rep: {card.repetition || 0}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#F4EFEA] text-[#646E68]">
                      EF: {(card.easeFactor || 2.5).toFixed(2)}
                    </span>
                    {(card.lapses || 0) > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#FAF2EF] text-[#BA4E29]">
                        Lapses: {card.lapses}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleExpand(card.id)}
                      className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs text-[#646E68] hover:bg-[#F4EFEA] transition-colors cursor-pointer mr-2"
                      title={isExpanded ? 'Hide answer' : 'Reveal answer'}
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide Answer</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show Answer</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onEditCard(card)}
                      className="p-1 rounded-md text-[#646E68] hover:text-[#153225] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                      title="Edit card"
                      aria-label="Edit flashcard"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCard(card)}
                      className="p-1 rounded-md text-[#646E68] hover:text-[#BA4E29] hover:bg-[#FAF2EF] transition-colors cursor-pointer"
                      title="Delete card"
                      aria-label="Delete flashcard"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prompt Question */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#88938C] block mb-0.5">
                    Question / Prompt
                  </span>
                  <p className="font-serif text-base sm:text-lg text-[#153225] leading-relaxed">
                    {card.front}
                  </p>
                </div>

                {/* Answer (Expandable) */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] animate-in fade-in duration-100">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#1C3D2E] font-semibold block mb-1">
                      Answer / Explanation
                    </span>
                    <p className="text-xs sm:text-sm text-[#333935] leading-relaxed whitespace-pre-wrap">
                      {card.back}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
