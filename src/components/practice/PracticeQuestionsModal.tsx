import React, { useState } from 'react';
import {
  Zap,
  X,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  FileText,
  RotateCcw,
  Plus,
  BookOpen,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  PracticeQuestion,
  QuestionType,
  Subject,
  Topic,
  StudyDocument,
} from '../../types/index.ts';
import { aiService } from '../../services/aiService.ts';
import { createCard } from '../../services/cardService.ts';

interface PracticeQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  documents: StudyDocument[];
  userId: string;
  initialSubjectId?: string;
  initialTopicId?: string;
  initialDocumentId?: string;
  onCardSaved?: () => void;
  onSaveCard?: (subjectId: string, topicId: string, data: { front: string; back: string }) => Promise<void>;
}

export const PracticeQuestionsModal: React.FC<PracticeQuestionsModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  documents,
  userId,
  initialSubjectId,
  initialTopicId,
  initialDocumentId,
  onCardSaved,
  onSaveCard,
}) => {
  // Form setup
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || '');
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || '');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [questionCount, setQuestionCount] = useState<number>(3);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<PracticeQuestion[]>([]);
  const [savingCardId, setSavingCardId] = useState<string | null>(null);
  const [savedCardIds, setSavedCardIds] = useState<Set<string>>(new Set());

  // Interactive user testing states
  const [userSelectedChoices, setUserSelectedChoices] = useState<Record<string, number>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const availableTopics = topics.filter(
    (t) => !selectedSubjectId || t.subjectId === selectedSubjectId
  );

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const activeTopic = topics.find((t) => t.id === selectedTopicId);
  const activeDoc = documents.find((d) => d.id === selectedDocId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId && !selectedDocId) {
      setError('Please select either a Topic or a Study Material Document.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setUserSelectedChoices({});
    setRevealedAnswers({});

    try {
      const questions = await aiService.generateQuestions(
        {
          subjectName: activeSubject?.name,
          topicTitle: activeTopic?.title,
          type: questionType,
          count: questionCount,
          documentText: activeDoc?.textContent,
          documentTitle: activeDoc?.title,
        },
        userId
      );

      setGeneratedQuestions(questions);
    } catch (err: any) {
      console.error('Question generation failed:', err);
      setError(err.message || 'Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDeck = async (question: PracticeQuestion) => {
    const targetSubjectId = selectedSubjectId || activeDoc?.subjectId || subjects[0]?.id;
    const targetTopicId = selectedTopicId || activeDoc?.topicId || availableTopics[0]?.id;

    if (!targetSubjectId || !targetTopicId) {
      setError('Please select a Subject and Topic to save this card into your revision deck.');
      return;
    }

    setSavingCardId(question.id);
    setError(null);

    try {
      let front = question.question;
      let back = '';

      if (question.type === 'mcq' && question.options && question.correctIndex !== undefined) {
        front = `${question.question}\n\n` +
          question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
        back = `**Correct Answer:** ${String.fromCharCode(65 + question.correctIndex)}. ${question.options[question.correctIndex]}\n\n**Explanation:** ${question.explanation}`;
      } else if (question.type === 'short') {
        back = `**Model Answer:**\n${question.modelAnswer}\n\n` +
          (question.keyPoints ? `**Key Points:**\n${question.keyPoints.map((k) => `• ${k}`).join('\n')}\n\n` : '') +
          `**Explanation:** ${question.explanation}`;
      } else {
        front = (question.scenario ? `*Scenario:* ${question.scenario}\n\n` : '') +
          `${question.question} (${question.marks || 5} Marks)`;
        back = `**Model Answer:**\n${question.modelAnswer}\n\n` +
          (question.rubric ? `**Marking Rubric:**\n${question.rubric.map((r) => `• ${r}`).join('\n')}\n\n` : '') +
          `**Explanation:** ${question.explanation}`;
      }

      if (onSaveCard) {
        await onSaveCard(targetSubjectId, targetTopicId, { front, back });
      } else {
        await createCard(userId, targetSubjectId, targetTopicId, { front, back });
      }

      setSavedCardIds((prev) => new Set([...prev, question.id]));
      if (onCardSaved) onCardSaved();
    } catch (err: any) {
      console.error('Save card error:', err);
      setError('Failed to save flashcard to deck.');
    } finally {
      setSavingCardId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#EBE5DF] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#FAF7F2] border-b border-[#EBE5DF] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0EA] text-[#C85A32] flex items-center justify-center border border-[#F0D5C7]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1C1917]">
                Practice Questions Generator
              </h2>
              <p className="text-xs text-[#6B6560]">
                Generate AI exam-style questions, test your recall immediately, and save to flashcards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8C827A] hover:text-[#1C1917] hover:bg-[#EBE5DF]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Form */}
        <div className="bg-[#FAF7F2]/60 border-b border-[#EBE5DF] p-5">
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-[#4A453E] mb-1">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedTopicId('');
                }}
                className="w-full bg-white border border-[#DCD5CE] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
              >
                <option value="">Select Subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-semibold text-[#4A453E] mb-1">
                Topic
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-white border border-[#DCD5CE] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
              >
                <option value="">Select Topic...</option>
                {availableTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Grounding Doc (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#4A453E] mb-1">
                Document Grounding (Optional)
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full bg-white border border-[#DCD5CE] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
              >
                <option value="">None (General Topic)</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    📄 {d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-xs font-semibold text-[#4A453E] mb-1">
                Format
              </label>
              <div className="flex rounded-lg border border-[#DCD5CE] overflow-hidden bg-white">
                {(['mcq', 'short', 'exam'] as QuestionType[]).map((qt) => (
                  <button
                    key={qt}
                    type="button"
                    onClick={() => setQuestionType(qt)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors capitalize ${
                      questionType === qt
                        ? 'bg-[#1E3A2F] text-white'
                        : 'text-[#6B6560] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {qt}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Submit Button */}
            <div className="md:col-span-4 flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B6560]">Count:</span>
                {[1, 3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`w-7 h-7 rounded-md text-xs font-semibold ${
                      questionCount === cnt
                        ? 'bg-[#1E3A2F] text-white'
                        : 'bg-white border border-[#DCD5CE] text-[#4A453E]'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="px-5 py-2 rounded-xl bg-[#1E3A2F] text-white hover:bg-[#2A4E40] text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Generating Questions with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#F3E5AB]" />
                    Generate Practice Questions
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-3 bg-[#FDF2F0] border border-[#F8C8C2] rounded-xl p-3 text-xs text-[#B33A2B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Questions Display & Interactive Testing */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FCFAF7]">
          {generatedQuestions.length === 0 && !isGenerating && (
            <div className="text-center py-12 text-[#8C827A]">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-serif text-base font-medium text-[#1C1917]">
                Ready to Generate Practice Questions
              </p>
              <p className="text-xs text-[#6B6560] max-w-sm mx-auto mt-1">
                Select your topic or study document above and click &ldquo;Generate Practice Questions&rdquo; to test your active recall.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-[#1E3A2F] border-t-transparent animate-spin mx-auto" />
              <p className="font-serif text-sm font-semibold text-[#1C1917]">
                Formulating rigorous questions with plausible distractors...
              </p>
              <p className="text-xs text-[#8C827A]">
                Validated schema with accurate model answers and explanations.
              </p>
            </div>
          )}

          {generatedQuestions.map((q, idx) => {
            const isSaved = savedCardIds.has(q.id);
            const userChoice = userSelectedChoices[q.id];
            const isRevealed = revealedAnswers[q.id];

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-[#EBE5DF] p-5 shadow-xs space-y-4"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1E3A2F] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C85A32] bg-[#FAF0EA] px-2 py-0.5 rounded">
                      {q.type.toUpperCase()}
                    </span>
                    {q.marks && (
                      <span className="text-xs text-[#8C827A] font-medium">
                        [{q.marks} Marks]
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSaveToDeck(q)}
                    disabled={isSaved || savingCardId === q.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isSaved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-[#1E3A2F] text-white hover:bg-[#2A4E40]'
                    } disabled:opacity-70`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Added to Flashcard Deck
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Save to Flashcard Deck
                      </>
                    )}
                  </button>
                </div>

                {/* Scenario for Exam-style */}
                {q.scenario && (
                  <div className="bg-[#FAF7F2] border-l-3 border-[#1E3A2F] p-3 text-xs text-[#4A453E] italic">
                    {q.scenario}
                  </div>
                )}

                {/* Question Prompt */}
                <p className="font-serif text-sm font-semibold text-[#1C1917] leading-relaxed">
                  {q.question}
                </p>

                {/* MCQ Interactive Options */}
                {q.type === 'mcq' && q.options && (
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userChoice === optIdx;
                      const hasChosen = userChoice !== undefined;
                      const isCorrect = q.correctIndex === optIdx;

                      let btnStyle = 'bg-[#FAF7F2] border-[#DCD5CE] text-[#1C1917] hover:bg-[#F3EFEA]';

                      if (hasChosen) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                        } else {
                          btnStyle = 'bg-white border-[#EBE5DF] text-[#8C827A] opacity-60';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            if (!hasChosen) {
                              setUserSelectedChoices((prev) => ({ ...prev, [q.id]: optIdx }));
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-white border border-[#DCD5CE] text-[11px] font-bold flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {hasChosen && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {hasChosen && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short-Answer / Exam Interactive Recall */}
                {q.type !== 'mcq' && (
                  <div className="space-y-2 pt-1">
                    {!isRevealed ? (
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedAnswers((prev) => ({ ...prev, [q.id]: true }))
                        }
                        className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] text-[#1E3A2F] border border-[#DCD5CE] text-xs font-semibold hover:bg-[#E9F0EC] transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Attempt Recall & Reveal Model Answer
                      </button>
                    ) : (
                      <div className="space-y-3 bg-[#FAF7F2] rounded-xl p-4 border border-[#E8DFC8]">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A2F] mb-1">
                            Model Answer:
                          </p>
                          <p className="text-xs text-[#1C1917] leading-relaxed">
                            {q.modelAnswer}
                          </p>
                        </div>

                        {q.keyPoints && (
                          <div className="pt-2 border-t border-[#E8DFC8]/60">
                            <p className="text-[11px] font-bold text-[#4A453E] mb-1">
                              Key Points Checklist:
                            </p>
                            <ul className="list-disc list-inside text-xs text-[#6B6560] space-y-0.5">
                              {q.keyPoints.map((pt, i) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {q.rubric && (
                          <div className="pt-2 border-t border-[#E8DFC8]/60">
                            <p className="text-[11px] font-bold text-[#4A453E] mb-1">
                              Marking Rubric:
                            </p>
                            <ul className="list-disc list-inside text-xs text-[#6B6560] space-y-0.5">
                              {q.rubric.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Educational Explanation Box (Shown if MCQ attempted or Answer revealed) */}
                {(userChoice !== undefined || isRevealed) && q.explanation && (
                  <div className="bg-[#FAF7F2] border border-[#E0D8D0] rounded-xl p-3 text-xs text-[#4A453E] flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#C85A32] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#1C1917]">Explanation: </strong>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
