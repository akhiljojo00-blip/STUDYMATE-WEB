import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  BookOpen,
  Layers,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  ChevronRight,
  Brain,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Subject, Topic, Flashcard, TopicStatus } from '../../types/index.ts';
import { COLOR_SCHEMES, renderSubjectIcon } from '../../utils/palette.ts';

interface SubjectDetailViewProps {
  subject: Subject;
  topics: Topic[];
  cards: Flashcard[];
  loading: boolean;
  onBack: () => void;
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topic: Topic) => void;
  onOpenTopicCards: (topic: Topic) => void;
  onStartSubjectStudy: (subjectCards: Flashcard[], title: string) => void;
  onUpdateTopicStatus: (topic: Topic, newStatus: TopicStatus) => void;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  topics,
  cards,
  loading,
  onBack,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onOpenTopicCards,
  onStartSubjectStudy,
  onUpdateTopicStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');

  const scheme = COLOR_SCHEMES[subject.color || 'forest'] || COLOR_SCHEMES.forest;

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const notStartedCount = topics.filter((t) => t.status === 'not_started').length;
  const learningCount = topics.filter((t) => t.status === 'learning').length;
  const reviewedCount = topics.filter((t) => t.status === 'reviewed').length;

  const subjectCards = cards.filter((c) => c.subjectId === subject.id);

  const statusConfig: Record<TopicStatus, { label: string; bg: string; text: string; dot: string }> = {
    not_started: {
      label: 'Not Started',
      bg: 'bg-[#F4EFEA]',
      text: 'text-[#646E68]',
      dot: 'bg-[#88938C]',
    },
    learning: {
      label: 'Learning',
      bg: 'bg-[#FAECD4]',
      text: 'text-[#8F5513]',
      dot: 'bg-[#A7661E]',
    },
    reviewed: {
      label: 'Reviewed',
      bg: 'bg-[#D2F2E2]',
      text: 'text-[#12683E]',
      dot: 'bg-[#1B7A4B]',
    },
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation & Back Button */}
      <div className="flex items-center space-x-2 text-xs text-[#88938C]">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 text-[#153225] hover:text-[#BA4E29] font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Subjects</span>
        </button>
        <span>/</span>
        <span className="text-[#333935] font-semibold truncate max-w-xs sm:max-w-md">
          {subject.name}
        </span>
      </div>

      {/* Subject Header Card */}
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-6 shadow-2xs relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: scheme.accent }}
        />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${scheme.badgeBg} ${scheme.badgeText}`}
            >
              {renderSubjectIcon(subject.icon, 'w-6 h-6')}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#153225]">
                  {subject.name}
                </h1>
                {subject.code && (
                  <span className="font-mono text-xs font-semibold uppercase px-2 py-0.5 rounded-md bg-[#F4EFEA] text-[#153225] border border-[#EAE3D9]">
                    {subject.code}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#646E68] mt-1.5 max-w-2xl leading-relaxed">
                {subject.description || 'No detailed syllabus description provided yet.'}
              </p>

              <div className="mt-3 flex items-center space-x-4 text-xs text-[#88938C]">
                <span className="flex items-center space-x-1 font-medium text-[#333935]">
                  <Clock className="w-3.5 h-3.5 text-[#1C3D2E]" />
                  <span>{subject.targetHours || 0} hrs/week target</span>
                </span>
                <span>&bull;</span>
                <span>{topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
                <span>&bull;</span>
                <span>{subjectCards.length} flashcard{subjectCards.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 self-start">
            {subjectCards.length > 0 && (
              <button
                onClick={() => onStartSubjectStudy(subjectCards, `${subject.name} (All Cards)`)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#D8CEBF] text-[#153225] text-xs font-medium transition-colors cursor-pointer"
              >
                <Brain className="w-4 h-4 text-[#BA4E29]" />
                <span>Study Cards ({subjectCards.length})</span>
              </button>
            )}

            <button
              onClick={onAddTopic}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Topic</span>
            </button>
          </div>
        </div>

        {/* Topic Progress Bar */}
        {topics.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#F4EFEA] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1E2320]">
                Curriculum Mastery Progress
              </span>
              <span className="text-[#646E68]">
                {reviewedCount} of {topics.length} topics reviewed ({Math.round((reviewedCount / topics.length) * 100)}%)
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-[#EAE3D9] overflow-hidden flex">
              <div
                className="h-full bg-[#1B7A4B] transition-all"
                style={{ width: `${(reviewedCount / topics.length) * 100}%` }}
                title={`Reviewed: ${reviewedCount}`}
              />
              <div
                className="h-full bg-[#A7661E] transition-all"
                style={{ width: `${(learningCount / topics.length) * 100}%` }}
                title={`Learning: ${learningCount}`}
              />
              <div
                className="h-full bg-[#D8CEBF] transition-all"
                style={{ width: `${(notStartedCount / topics.length) * 100}%` }}
                title={`Not Started: ${notStartedCount}`}
              />
            </div>

            <div className="flex items-center space-x-4 text-[11px] text-[#646E68] pt-1">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#1B7A4B]" />
                <span>Reviewed ({reviewedCount})</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#A7661E]" />
                <span>Learning ({learningCount})</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#D8CEBF]" />
                <span>Not Started ({notStartedCount})</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Topics Search & Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#88938C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syllabus topics..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-[#EAE3D9] bg-[#FAF8F5] text-xs sm:text-sm text-[#1E2320] placeholder-[#88938C] focus:outline-hidden focus:ring-2 focus:ring-[#153225]"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#153225] text-[#FAF8F5]'
                : 'bg-[#F4EFEA] text-[#646E68] hover:text-[#1E2320]'
            }`}
          >
            All ({topics.length})
          </button>
          <button
            onClick={() => setStatusFilter('learning')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'learning'
                ? 'bg-[#A7661E] text-[#FAF8F5]'
                : 'bg-[#F4EFEA] text-[#646E68] hover:text-[#1E2320]'
            }`}
          >
            Learning ({learningCount})
          </button>
          <button
            onClick={() => setStatusFilter('reviewed')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'reviewed'
                ? 'bg-[#1B7A4B] text-[#FAF8F5]'
                : 'bg-[#F4EFEA] text-[#646E68] hover:text-[#1E2320]'
            }`}
          >
            Reviewed ({reviewedCount})
          </button>
          <button
            onClick={() => setStatusFilter('not_started')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'not_started'
                ? 'bg-[#646E68] text-[#FAF8F5]'
                : 'bg-[#F4EFEA] text-[#646E68] hover:text-[#1E2320]'
            }`}
          >
            Not Started ({notStartedCount})
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && topics.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-[#FFFFFF] border border-[#EAE3D9] rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="w-1/3 h-5 bg-[#EAE3D9] rounded-md" />
              <div className="w-2/3 h-4 bg-[#F4EFEA] rounded-md" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State: Zero Topics */}
      {!loading && topics.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#E1EFE7] text-[#153225] flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[#153225]">
            No topics defined yet
          </h3>
          <p className="text-xs sm:text-sm text-[#646E68] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Deconstruct this subject into bite-sized syllabus units. You can then attach active-recall flashcards and track spaced retrieval for each topic.
          </p>
          <button
            onClick={onAddTopic}
            className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Topic</span>
          </button>
        </div>
      )}

      {/* Empty Search Results */}
      {!loading && topics.length > 0 && filteredTopics.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#EAE3D9] rounded-xl p-8 text-center max-w-md mx-auto">
          <p className="font-serif text-base text-[#153225] font-semibold">
            No topics match "{searchQuery}"
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-3 px-3 py-1 rounded-md bg-[#F4EFEA] text-xs text-[#153225] cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Topics List */}
      {!loading && filteredTopics.length > 0 && (
        <div className="space-y-3">
          {filteredTopics.map((topic) => {
            const topicCards = cards.filter((c) => c.topicId === topic.id);
            const statusInfo = statusConfig[topic.status || 'not_started'];

            return (
              <div
                key={topic.id}
                className="group bg-[#FFFFFF] border border-[#D8CEBF] hover:border-[#153225] rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    {/* Status Badge with quick cycle toggle */}
                    <button
                      onClick={() => {
                        const next: TopicStatus =
                          topic.status === 'not_started'
                            ? 'learning'
                            : topic.status === 'learning'
                            ? 'reviewed'
                            : 'not_started';
                        onUpdateTopicStatus(topic, next);
                      }}
                      title="Click to toggle status"
                      className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${statusInfo.bg} ${statusInfo.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                      <span>{statusInfo.label}</span>
                    </button>

                    <h3 className="font-serif text-lg font-semibold text-[#153225] group-hover:text-[#BA4E29] transition-colors">
                      {topic.title}
                    </h3>
                  </div>

                  {topic.description && (
                    <p className="text-xs text-[#646E68] leading-relaxed line-clamp-2">
                      {topic.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-3 text-[11px] text-[#88938C] pt-1">
                    <span className="font-medium text-[#333935]">
                      {topicCards.length} flashcard{topicCards.length !== 1 ? 's' : ''}
                    </span>
                    <span>&bull;</span>
                    <span>
                      Updated{' '}
                      {topic.updatedAt?.toDate
                        ? new Date(topic.updatedAt.toDate()).toLocaleDateString()
                        : 'Saved'}
                    </span>
                  </div>
                </div>

                {/* Topic Actions */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onOpenTopicCards(topic)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#D8CEBF] text-xs font-medium text-[#153225] transition-colors cursor-pointer"
                  >
                    <span>Flashcards</span>
                    <span className="font-mono text-[10px] bg-[#EAE3D9] px-1.5 rounded-sm">
                      {topicCards.length}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#88938C]" />
                  </button>

                  <div className="flex items-center space-x-1 border-l border-[#EAE3D9] pl-2">
                    <button
                      onClick={() => onEditTopic(topic)}
                      className="p-1.5 rounded-lg text-[#646E68] hover:text-[#153225] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                      title="Edit topic"
                      aria-label={`Edit ${topic.title}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTopic(topic)}
                      className="p-1.5 rounded-lg text-[#646E68] hover:text-[#BA4E29] hover:bg-[#FAF2EF] transition-colors cursor-pointer"
                      title="Delete topic"
                      aria-label={`Delete ${topic.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
