import React, { useState, useEffect } from 'react';
import { X, AlertCircle, HelpCircle } from 'lucide-react';
import { Flashcard, FlashcardFormData } from '../../types/index.ts';
import { validateFlashcardInput } from '../../utils/validation.ts';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FlashcardFormData) => Promise<void>;
  cardToEdit?: Flashcard | null;
  topicTitle: string;
}

const DEFAULT_FORM: FlashcardFormData = {
  front: '',
  back: '',
};

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cardToEdit,
  topicTitle,
}) => {
  const [formData, setFormData] = useState<FlashcardFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (cardToEdit) {
      setFormData({
        front: cardToEdit.front || '',
        back: cardToEdit.back || '',
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setErrors({});
    setServerError(null);
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateFlashcardInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    try {
      setSubmitting(true);
      await onSave(validation.sanitized);
      onClose();
    } catch (err: any) {
      console.error('Error saving flashcard:', err);
      setServerError(err.message || 'Failed to save flashcard.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141715]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAE3D9] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3
              id="card-modal-title"
              className="font-serif text-xl font-semibold text-[#153225]"
            >
              {cardToEdit ? 'Edit Flashcard' : 'Create Active-Recall Flashcard'}
            </h3>
            <p className="text-xs text-[#646E68]">
              Topic: {topicTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#88938C] hover:text-[#1E2320] hover:bg-[#EAE3D9] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {serverError && (
            <div className="p-3 rounded-lg bg-[#FAF2EF] border border-[#F2C5B6] text-[#9B3D1E] text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Front Prompt */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="card-front"
                className="text-xs font-semibold text-[#1E2320]"
              >
                Front: Question or Retrieval Prompt <span className="text-[#BA4E29]">*</span>
              </label>
              <span className="text-[11px] text-[#88938C]">
                {formData.front.length}/500
              </span>
            </div>
            <textarea
              id="card-front"
              rows={3}
              value={formData.front}
              onChange={(e) => {
                setFormData({ ...formData, front: e.target.value });
                if (errors.front) setErrors({ ...errors, front: '' });
              }}
              placeholder="e.g. What is the role of DNA Topoisomerase (Gyrase) during replication?"
              maxLength={500}
              className={`w-full px-3.5 py-2.5 rounded-lg border ${
                errors.front ? 'border-[#BA4E29] bg-[#FAF2EF]' : 'border-[#D8CEBF] bg-[#FFFFFF]'
              } text-sm text-[#1E2320] placeholder-[#88938C] focus:outline-hidden focus:ring-2 focus:ring-[#153225] resize-none`}
              autoFocus
            />
            {errors.front && (
              <p className="text-xs text-[#BA4E29] mt-1">{errors.front}</p>
            )}
            <p className="text-[11px] text-[#88938C] mt-1">
              Pose a specific, testable question that prompts active retrieval rather than passive recognition.
            </p>
          </div>

          {/* Back Answer */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="card-back"
                className="text-xs font-semibold text-[#1E2320]"
              >
                Back: Concise Answer & Core Mechanism <span className="text-[#BA4E29]">*</span>
              </label>
              <span className="text-[11px] text-[#88938C]">
                {formData.back.length}/1000
              </span>
            </div>
            <textarea
              id="card-back"
              rows={4}
              value={formData.back}
              onChange={(e) => {
                setFormData({ ...formData, back: e.target.value });
                if (errors.back) setErrors({ ...errors, back: '' });
              }}
              placeholder="e.g. Relieves torsional strain/supercoiling ahead of the replication fork by making transient cuts in the phosphodiester backbone."
              maxLength={1000}
              className={`w-full px-3.5 py-2.5 rounded-lg border ${
                errors.back ? 'border-[#BA4E29] bg-[#FAF2EF]' : 'border-[#D8CEBF] bg-[#FFFFFF]'
              } text-sm text-[#1E2320] placeholder-[#88938C] focus:outline-hidden focus:ring-2 focus:ring-[#153225] resize-none`}
            />
            {errors.back && (
              <p className="text-xs text-[#BA4E29] mt-1">{errors.back}</p>
            )}
          </div>

          {/* SM-2 Information Badge */}
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] text-xs text-[#646E68] flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-[#1C3D2E] shrink-0 mt-0.5" />
            <p>
              New flashcards start at Repetition 0 and an Ease Factor of 2.5, ready for review today.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#EAE3D9] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-[#D8CEBF] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-xs font-medium text-[#333935] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#153225] hover:bg-[#1C3D2E] text-xs font-medium text-[#FAF8F5] transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving...' : cardToEdit ? 'Update Card' : 'Save Flashcard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
