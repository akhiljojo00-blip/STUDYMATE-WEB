import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Subject, DailyTask } from '../../types/index.ts';
import { calculateStudyMetrics, getGreeting, formatStudyDate } from '../../utils/dashboard.ts';
import { COLOR_SCHEMES, renderSubjectIcon } from '../../utils/palette.ts';

interface OverviewViewProps {
  displayName: string;
  subjects: Subject[];
  loading: boolean;
  onNavigateToSubjects: () => void;
  onAddSubject: () => void;
}

const INITIAL_TASKS: DailyTask[] = [
  {
    id: 'task-1',
    title: 'Review key concept definitions & formulas',
    completed: false,
    priority: 'high',
  },
  {
    id: 'task-2',
    title: 'Attempt 3 self-retrieval practice questions',
    completed: false,
    priority: 'medium',
  },
  {
    id: 'task-3',
    title: 'Flag any confusing topics for deeper revision',
    completed: false,
    priority: 'low',
  },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  displayName,
  subjects,
  loading,
  onNavigateToSubjects,
  onAddSubject,
}) => {
  const [tasks, setTasks] = useState<DailyTask[]>(INITIAL_TASKS);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const metrics = calculateStudyMetrics(subjects);
  const greeting = getGreeting();
  const currentDate = formatStudyDate();

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      title: newTaskInput.trim(),
      completed: false,
      priority: 'medium',
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskInput('');
    setShowAddTask(false);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#FAF8F5] border-b border-[#EAE3D9] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#BA4E29] mb-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{currentDate}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#153225] tracking-tight">
            {greeting}, {displayName.split(' ')[0] || 'Scholar'}.
          </h1>
          <p className="text-xs sm:text-sm text-[#646E68] mt-1.5 max-w-xl">
            Welcome back to your StudyMate workspace. Every session built on concept clarity and spaced retrieval compounds over time.
          </p>
        </div>

        <button
          onClick={onAddSubject}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Progress & Real Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Subjects */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-medium text-[#646E68] block">
            Curated Subjects
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-serif text-3xl font-semibold text-[#153225]">
              {loading ? '-' : metrics.totalSubjects}
            </span>
            <span className="text-xs text-[#88938C]">active courses</span>
          </div>
          <p className="text-[11px] text-[#88938C] mt-2 border-t border-[#F4EFEA] pt-2">
            {metrics.totalSubjects === 0
              ? 'Add your first subject below'
              : `Organized across ${metrics.totalSubjects} syllabus area${
                  metrics.totalSubjects > 1 ? 's' : ''
                }`}
          </p>
        </div>

        {/* Metric 2: Target Study Hours */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-medium text-[#646E68] block">
            Weekly Target Allocation
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-serif text-3xl font-semibold text-[#153225]">
              {loading ? '-' : metrics.totalWeeklyHours}
            </span>
            <span className="text-xs text-[#88938C]">hours / week</span>
          </div>
          <p className="text-[11px] text-[#88938C] mt-2 border-t border-[#F4EFEA] pt-2">
            ~{metrics.estimatedDailyHours} hrs daily focus target
          </p>
        </div>

        {/* Metric 3: Daily Tasks Status */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-medium text-[#646E68] block">
            Today's Focus Checklist
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-serif text-3xl font-semibold text-[#BA4E29]">
              {tasks.filter((t) => t.completed).length} / {tasks.length}
            </span>
            <span className="text-xs text-[#88938C]">tasks checked</span>
          </div>
          <p className="text-[11px] text-[#88938C] mt-2 border-t border-[#F4EFEA] pt-2">
            Active daily study intentions
          </p>
        </div>

        {/* Metric 4: Spaced Revision Engine */}
        <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-medium text-[#646E68] block">
            Spaced Revision Engine
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-serif text-xl font-semibold text-[#153225]">
              Milestone 2
            </span>
          </div>
          <p className="text-[11px] text-[#88938C] mt-2 border-t border-[#F4EFEA] pt-2">
            Scheduled retrieval drills activate next
          </p>
        </div>
      </div>

      {/* Main Grid: Subjects Overview + Today's Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Subjects Snapshot (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[#153225]">
              Your Subjects
            </h2>
            {subjects.length > 0 && (
              <button
                onClick={onNavigateToSubjects}
                className="text-xs font-medium text-[#153225] hover:text-[#BA4E29] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>View all ({subjects.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* If Zero Subjects: Honest Warm Empty State */}
          {!loading && subjects.length === 0 && (
            <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-8 text-center shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-[#E1EFE7] text-[#153225] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#153225]">
                Your study deck is empty
              </h3>
              <p className="text-xs sm:text-sm text-[#646E68] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Add your courses to begin structuring study notes, target hours, and upcoming revision topics.
              </p>
              <button
                onClick={onAddSubject}
                className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#153225] hover:bg-[#1C3D2E] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Subject</span>
              </button>
            </div>
          )}

          {/* If Subjects Exist: Display Top Cards */}
          {!loading && subjects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.slice(0, 4).map((sub) => {
                const scheme =
                  COLOR_SCHEMES[sub.color || 'forest'] || COLOR_SCHEMES.forest;
                return (
                  <div
                    key={sub.id}
                    onClick={onNavigateToSubjects}
                    className="bg-[#FFFFFF] border border-[#D8CEBF] hover:border-[#153225] rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${scheme.badgeBg} ${scheme.badgeText}`}
                        >
                          {renderSubjectIcon(sub.icon, 'w-4 h-4')}
                        </div>
                        {sub.code && (
                          <span className="font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-[#F4EFEA] text-[#153225] border border-[#EAE3D9]">
                            {sub.code}
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-base font-semibold text-[#153225] line-clamp-1">
                        {sub.name}
                      </h4>

                      <p className="text-xs text-[#646E68] mt-1 line-clamp-2">
                        {sub.description || 'Target study allocation set.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F4EFEA] flex items-center justify-between text-xs text-[#88938C]">
                      <span className="flex items-center space-x-1 font-medium text-[#333935]">
                        <Clock className="w-3 h-3 text-[#1C3D2E]" />
                        <span>{sub.targetHours || 0} hrs/wk</span>
                      </span>
                      <span className="text-[11px] text-[#153225] underline underline-offset-2">
                        Manage &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Today's Study Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[#153225]">
              Today's Checklist
            </h2>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="text-xs font-medium text-[#153225] hover:text-[#BA4E29] transition-colors cursor-pointer"
            >
              {showAddTask ? 'Cancel' : '+ Add Item'}
            </button>
          </div>

          <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-5 shadow-2xs space-y-3">
            {showAddTask && (
              <form onSubmit={handleAddTask} className="pb-3 border-b border-[#EAE3D9] flex gap-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="e.g. Solve Chapter 4 practice set..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] focus:outline-hidden focus:ring-1 focus:ring-[#153225]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#153225] text-[#FAF8F5] text-xs font-medium cursor-pointer"
                >
                  Save
                </button>
              </form>
            )}

            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    task.completed
                      ? 'bg-[#F4EFEA]/50 border-[#EAE3D9] opacity-75'
                      : 'bg-[#FAF8F5] border-[#EAE3D9] hover:border-[#153225]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors ${
                      task.completed
                        ? 'bg-[#153225] border-[#153225] text-[#FAF8F5]'
                        : 'border-[#88938C] bg-[#FFFFFF]'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1">
                    <span
                      className={`text-xs sm:text-sm ${
                        task.completed
                          ? 'line-through text-[#88938C]'
                          : 'text-[#1E2320] font-medium'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#88938C] pt-2 border-t border-[#F4EFEA] text-center">
              Active retrieval & concept verification checklist
            </p>
          </div>
        </div>
      </div>

      {/* Revision Section: Honest Empty State */}
      <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-[#BA4E29]" />
              <h3 className="font-serif text-xl font-semibold text-[#153225]">
                Revision Room
              </h3>
              <span className="text-[10px] font-mono uppercase bg-[#FBE4DD] text-[#9B3D1E] px-1.5 py-0.5 rounded-sm">
                Milestone 2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#646E68] max-w-2xl leading-relaxed">
              No active recall drills are due today. The Revision Room will automatically compute spaced retrieval intervals, schedule active recall prompts, and analyze concept gaps once study materials are attached in Milestone 2.
            </p>
          </div>

          <div className="shrink-0">
            <span className="text-xs text-[#88938C] italic bg-[#F4EFEA] px-3 py-1.5 rounded-lg border border-[#EAE3D9]">
              Milestone 1 foundation ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
