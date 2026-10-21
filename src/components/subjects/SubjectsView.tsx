import React, { useState } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Clock,
  BookOpen,
  Edit2,
  Trash2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Subject, SubjectColor } from '../../types/index.ts';
import { COLOR_SCHEMES, renderSubjectIcon } from '../../utils/palette.ts';

interface SubjectsViewProps {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
  onSelectSubject: (subject: Subject) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  loading,
  error,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onSelectSubject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<SubjectColor | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'hours'>('updated');

  // Filter and sort subjects
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.code && subject.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (subject.description &&
        subject.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesColor =
      selectedColor === 'all' || subject.color === selectedColor;

    return matchesSearch && matchesColor;
  });

  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'hours') {
      return (b.targetHours || 0) - (a.targetHours || 0);
    }
    // Default 'updated'
    const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
    const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
    return timeB - timeA;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D9]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#153225]">
            My Subjects
          </h1>
          <p className="text-xs sm:text-sm text-[#646E68] mt-1">
            Manage your courses, weekly study targets, and core academic areas
          </p>
        </div>

        <button
          onClick={onAddSubject}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#153225] focus:ring-offset-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FAF2EF] border border-[#F2C5B6] text-[#9B3D1E] text-xs sm:text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load subjects from Firestore</p>
            <p className="text-xs text-[#BA4E29] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Search, Filter & Sort Controls */}
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#88938C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects by name, code, or description..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#EAE3D9] bg-[#FAF8F5] text-xs sm:text-sm text-[#1E2320] placeholder-[#88938C] focus:outline-hidden focus:ring-2 focus:ring-[#153225] focus:bg-[#FFFFFF]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#88938C] hover:text-[#1E2320]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-[#646E68]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-[#EAE3D9] bg-[#FAF8F5] text-xs font-medium text-[#1E2320] focus:outline-hidden focus:ring-2 focus:ring-[#153225] cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="name">Name (A &rarr; Z)</option>
              <option value="hours">Target Hours (High &rarr; Low)</option>
            </select>
          </div>
        </div>

        {/* Color Palette Filters */}
        <div className="flex items-center space-x-2 pt-2 border-t border-[#F4EFEA] overflow-x-auto pb-1 text-xs">
          <span className="text-[#88938C] flex items-center space-x-1 shrink-0 font-medium">
            <Filter className="w-3 h-3" />
            <span>Theme:</span>
          </span>

          <button
            onClick={() => setSelectedColor('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              selectedColor === 'all'
                ? 'bg-[#153225] text-[#FAF8F5]'
                : 'bg-[#F4EFEA] text-[#646E68] hover:text-[#1E2320]'
            }`}
          >
            All ({subjects.length})
          </button>

          {(Object.keys(COLOR_SCHEMES) as SubjectColor[]).map((col) => {
            const count = subjects.filter((s) => s.color === col).length;
            if (count === 0 && selectedColor !== col) return null;
            const scheme = COLOR_SCHEMES[col];
            return (
              <button
                key={col}
                onClick={() => setSelectedColor(col)}
                className={`px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 ${
                  selectedColor === col
                    ? `${scheme.badgeBg} ${scheme.badgeText} ring-1 ring-inset ring-[#153225]`
                    : 'bg-[#F4EFEA] text-[#646E68] hover:text-[#1E2320]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: scheme.accent }}
                />
                <span>{scheme.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && subjects.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-[#FFFFFF] border border-[#EAE3D9] rounded-2xl p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#EAE3D9]" />
                <div className="w-16 h-5 rounded-md bg-[#EAE3D9]" />
              </div>
              <div className="space-y-2">
                <div className="w-3/4 h-5 rounded-md bg-[#EAE3D9]" />
                <div className="w-full h-12 rounded-md bg-[#F4EFEA]" />
              </div>
              <div className="w-1/2 h-4 rounded-md bg-[#EAE3D9]" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State: Zero subjects exist */}
      {!loading && subjects.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#E1EFE7] text-[#153225] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-[#153225]">
            No subjects added yet
          </h3>
          <p className="text-xs sm:text-sm text-[#646E68] mt-2 leading-relaxed">
            Every effective study journey begins with clear academic subjects. Add your first subject to schedule study goals, prepare concept notes, and track revision.
          </p>
          <div className="mt-6">
            <button
              onClick={onAddSubject}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Subject</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty Search Results */}
      {!loading && subjects.length > 0 && sortedSubjects.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#EAE3D9] rounded-2xl p-8 text-center max-w-md mx-auto">
          <p className="font-serif text-lg text-[#153225] font-semibold">
            No subjects match your filter
          </p>
          <p className="text-xs text-[#646E68] mt-1">
            Try adjusting your search query "{searchQuery}" or reset the color filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedColor('all');
            }}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-[#F4EFEA] hover:bg-[#EAE3D9] text-xs font-medium text-[#153225] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Subjects Grid */}
      {!loading && sortedSubjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedSubjects.map((subject) => {
            const scheme = COLOR_SCHEMES[subject.color || 'forest'] || COLOR_SCHEMES.forest;
            return (
              <div
                key={subject.id}
                className="group bg-[#FFFFFF] border border-[#D8CEBF] hover:border-[#153225] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
              >
                {/* Accent Top Border Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: scheme.accent }}
                />

                <div>
                  {/* Card Header: Icon, Code Badge, Actions */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${scheme.badgeBg} ${scheme.badgeText} shadow-2xs`}
                    >
                      {renderSubjectIcon(subject.icon, 'w-5 h-5')}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {subject.code && (
                        <span className="font-mono text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#F4EFEA] text-[#153225] border border-[#EAE3D9]">
                          {subject.code}
                        </span>
                      )}

                      <div className="flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditSubject(subject)}
                          className="p-1.5 rounded-lg text-[#646E68] hover:text-[#153225] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                          title="Edit subject"
                          aria-label={`Edit ${subject.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSubject(subject)}
                          className="p-1.5 rounded-lg text-[#646E68] hover:text-[#BA4E29] hover:bg-[#FAF2EF] transition-colors cursor-pointer"
                          title="Delete subject"
                          aria-label={`Delete ${subject.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subject Name */}
                  <h3
                    onClick={() => onSelectSubject(subject)}
                    className="font-serif text-xl font-semibold text-[#153225] group-hover:text-[#BA4E29] transition-colors line-clamp-1 cursor-pointer"
                  >
                    {subject.name}
                  </h3>

                  {/* Description */}
                  <p
                    onClick={() => onSelectSubject(subject)}
                    className="text-xs text-[#646E68] mt-1.5 line-clamp-2 leading-relaxed min-h-[2rem] cursor-pointer"
                  >
                    {subject.description || 'No specific description added yet.'}
                  </p>
                </div>

                {/* Card Footer: Target Hours, Explore Link, & Timestamp */}
                <div className="mt-4 pt-3.5 border-t border-[#F4EFEA] flex items-center justify-between text-xs text-[#88938C]">
                  <div className="flex items-center space-x-1.5 font-medium text-[#333935]">
                    <Clock className="w-3.5 h-3.5 text-[#1C3D2E]" />
                    <span>
                      {subject.targetHours || 0} hrs/week
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectSubject(subject)}
                    className="text-xs font-semibold text-[#153225] hover:text-[#BA4E29] transition-colors cursor-pointer"
                  >
                    Explore Topics &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
