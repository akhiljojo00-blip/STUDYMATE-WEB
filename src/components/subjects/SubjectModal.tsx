import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Subject, SubjectFormData, SubjectColor, SubjectIconName } from '../../types/index.ts';
import { validateSubjectInput } from '../../utils/validation.ts';
import { COLOR_SCHEMES, ICON_MAP, renderSubjectIcon } from '../../utils/palette.ts';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubjectFormData) => Promise<void>;
  subjectToEdit?: Subject | null;
}

const DEFAULT_FORM: SubjectFormData = {
  name: '',
  code: '',
  description: '',
  color: 'forest',
  icon: 'BookOpen',
  targetHours: 4,
};

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subjectToEdit,
}) => {
  const [formData, setFormData] = useState<SubjectFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectToEdit) {
      setFormData({
        name: subjectToEdit.name || '',
        code: subjectToEdit.code || '',
        description: subjectToEdit.description || '',
        color: subjectToEdit.color || 'forest',
        icon: subjectToEdit.icon || 'BookOpen',
        targetHours: subjectToEdit.targetHours || 4,
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setErrors({});
    setServerError(null);
  }, [subjectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateSubjectInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    try {
      setSubmitting(true);
      await onSave(validation.sanitized);
      onClose();
    } catch (err: any) {
      console.error('Error saving subject:', err);
      setServerError(err.message || 'Failed to save subject. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141715]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAE3D9] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3
              id="subject-modal-title"
              className="font-serif text-xl font-semibold text-[#153225]"
            >
              {subjectToEdit ? 'Edit Subject' : 'Add New Subject'}
            </h3>
            <p className="text-xs text-[#646E68]">
              {subjectToEdit
                ? 'Update syllabus details and study allocation'
                : 'Define a course or topic for intentional study'}
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

          {/* Subject Name */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="subject-name"
                className="text-xs font-semibold text-[#1E2320]"
              >
                Subject Name <span className="text-[#BA4E29]">*</span>
              </label>
              <span className="text-[11px] text-[#88938C]">
                {formData.name.length}/60
              </span>
            </div>
            <input
              id="subject-name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g. Molecular Biology, Algorithms & Data Structures"
              maxLength={60}
              className={`w-full px-3.5 py-2.5 rounded-lg border ${
                errors.name ? 'border-[#BA4E29] bg-[#FAF2EF]' : 'border-[#D8CEBF] bg-[#FFFFFF]'
              } text-sm text-[#1E2320] placeholder-[#88938C] focus:outline-hidden focus:ring-2 focus:ring-[#153225]`}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-[#BA4E29] mt-1">{errors.name}</p>
            )}
          </div>

          {/* Course Code & Target Hours (2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="subject-code"
                className="block text-xs font-semibold text-[#1E2320] mb-1"
              >
                Course Code <span className="font-normal text-[#88938C]">(optional)</span>
              </label>
              <input
                id="subject-code"
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g. BIO-201"
                maxLength={20}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8CEBF] bg-[#FFFFFF] text-sm text-[#1E2320] placeholder-[#88938C] uppercase focus:outline-hidden focus:ring-2 focus:ring-[#153225]"
              />
              {errors.code && (
                <p className="text-xs text-[#BA4E29] mt-1">{errors.code}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="target-hours"
                className="block text-xs font-semibold text-[#1E2320] mb-1"
              >
                Target Weekly Hours
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="target-hours"
                  type="number"
                  min="0"
                  max="168"
                  step="0.5"
                  value={formData.targetHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetHours: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8CEBF] bg-[#FFFFFF] text-sm text-[#1E2320] focus:outline-hidden focus:ring-2 focus:ring-[#153225]"
                />
                <span className="text-xs font-medium text-[#646E68]">hrs/wk</span>
              </div>
              {errors.targetHours && (
                <p className="text-xs text-[#BA4E29] mt-1">{errors.targetHours}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="subject-desc"
                className="text-xs font-semibold text-[#1E2320]"
              >
                Description / Core Topics{' '}
                <span className="font-normal text-[#88938C]">(optional)</span>
              </label>
              <span className="text-[11px] text-[#88938C]">
                {formData.description.length}/280
              </span>
            </div>
            <textarea
              id="subject-desc"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Key concepts, textbook references, upcoming exams or study focus..."
              maxLength={280}
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8CEBF] bg-[#FFFFFF] text-sm text-[#1E2320] placeholder-[#88938C] focus:outline-hidden focus:ring-2 focus:ring-[#153225] resize-none"
            />
          </div>

          {/* Palette Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#1E2320] mb-2">
              Color Palette Theme
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {(Object.keys(COLOR_SCHEMES) as SubjectColor[]).map((colKey) => {
                const scheme = COLOR_SCHEMES[colKey];
                const isSelected = formData.color === colKey;
                return (
                  <button
                    key={colKey}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: colKey })}
                    title={scheme.label}
                    className={`h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#153225] ring-2 ring-[#153225] ring-offset-1'
                        : 'border-[#D8CEBF] hover:scale-105'
                    } ${scheme.bgLight}`}
                  >
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: scheme.accent }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#1E2320] mb-2">
              Subject Icon
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {(Object.keys(ICON_MAP) as SubjectIconName[]).map((iconKey) => {
                const isSelected = formData.icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconKey })}
                    title={iconKey}
                    className={`h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#153225] bg-[#E1EFE7] text-[#153225] ring-2 ring-[#153225] ring-offset-1'
                        : 'border-[#D8CEBF] bg-[#FAF8F5] text-[#646E68] hover:text-[#1E2320] hover:bg-[#F4EFEA]'
                    }`}
                  >
                    {renderSubjectIcon(iconKey, 'w-4 h-4')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
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
              {submitting
                ? 'Saving...'
                : subjectToEdit
                ? 'Update Subject'
                : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
