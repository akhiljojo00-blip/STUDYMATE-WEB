import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Topic, TopicFormData, TopicStatus } from '../../types/index.ts';
import { validateTopicInput, ALLOWED_TOPIC_STATUSES } from '../../utils/validation.ts';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TopicFormData) => Promise<void>;
  topicToEdit?: Topic | null;
  subjectName: string;
}

const DEFAULT_FORM: TopicFormData = {
  title: '',
  description: '',
  status: 'not_started',
};

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  onSave,
  topicToEdit,
  subjectName,
}) => {
  const [formData, setFormData] = useState<TopicFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (topicToEdit) {
      setFormData({
        title: topicToEdit.title || '',
        description: topicToEdit.description || '',
        status: topicToEdit.status || 'not_started',
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setErrors({});
    setServerError(null);
  }, [topicToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateTopicInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    try {
      setSubmitting(true);
      await onSave(validation.sanitized);
      onClose();
    } catch (err: any) {
      console.error('Error saving topic:', err);
      setServerError(err.message || 'Failed to save topic.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabels: Record<TopicStatus, { label: string; desc: string }> = {
    not_started: { label: 'Not Started', desc: 'Syllabus unit defined' },
    learning: { label: 'Learning', desc: 'Active recall in progress' },
    reviewed: { label: 'Reviewed', desc: 'Initial pass completed' },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141715]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAE3D9] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3
              id="topic-modal-title"
              className="font-serif text-xl font-semibold text-[#153225]"
            >
              {topicToEdit ? 'Edit Topic' : 'Add Topic'}
            </h3>
            <p className="text-xs text-[#646E68]">
              {subjectName} &bull; Curriculum Unit
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 rounded-lg bg-[#FAF2EF] border border-[#F2C5B6] text-[#9B3D1E] text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="topic-title"
                className="text-xs font-semibold text-[#1E2320]"
              >
                Topic Title <span className="text-[#BA4E29]">*</span>
              </label>
              <span className="text-[11px] text-[#88938C]">
                {formData.title.length}/80
              </span>
            </div>
            <input
              id="topic-title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder="e.g. DNA Helicase & Replication Fork"
              maxLength={80}
              className={`w-full px-3.5 py-2.5 rounded-lg border ${
                errors.title ? 'border-[#BA4E29] bg-[#FAF2EF]' : 'border-[#D8CEBF] bg-[#FFFFFF]'
              } text-sm text-[#1E2320] placeholder-[#88938C] focus:outline-hidden focus:ring-2 focus:ring-[#153225]`}
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-[#BA4E29] mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="topic-desc"
                className="text-xs font-semibold text-[#1E2320]"
              >
                Key Concepts / Notes <span className="font-normal text-[#88938C]">(optional)</span>
              </label>
              <span className="text-[11px] text-[#88938C]">
                {formData.description.length}/300
              </span>
            </div>
            <textarea
              id="topic-desc"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Core formulas, textbook chapters, or concepts to test in active recall..."
              maxLength={300}
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8CEBF] bg-[#FFFFFF] text-sm text-[#1E2320] placeholder-[#88938C] focus:outline-hidden focus:ring-2 focus:ring-[#153225] resize-none"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#1E2320] mb-2">
              Topic Progress Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALLOWED_TOPIC_STATUSES.map((statusKey) => {
                const info = statusLabels[statusKey];
                const isSelected = formData.status === statusKey;
                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: statusKey })}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#153225] bg-[#E1EFE7] ring-1 ring-[#153225]'
                        : 'border-[#D8CEBF] bg-[#FAF8F5] hover:bg-[#F4EFEA]'
                    }`}
                  >
                    <span className="text-xs font-semibold text-[#153225] block">
                      {info.label}
                    </span>
                    <span className="text-[10px] text-[#646E68] block mt-0.5">
                      {info.desc}
                    </span>
                  </button>
                );
              })}
            </div>
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
              {submitting ? 'Saving...' : topicToEdit ? 'Update Topic' : 'Add Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
