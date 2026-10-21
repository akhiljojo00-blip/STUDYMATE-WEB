import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  badge?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  description,
  badge,
  onClose,
  onConfirm,
  deleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141715]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-[#FFFFFF] border border-[#F2C5B6] rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="w-12 h-12 rounded-full bg-[#FAF2EF] text-[#BA4E29] flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3
          id="delete-dialog-title"
          className="font-serif text-xl font-semibold text-[#153225]"
        >
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-[#646E68] mt-2 leading-relaxed">
          {description}
        </p>

        {badge && (
          <div className="mt-3 inline-block px-2.5 py-1 rounded-md bg-[#F4EFEA] border border-[#EAE3D9] text-xs font-mono text-[#153225]">
            {badge}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg border border-[#D8CEBF] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-xs font-medium text-[#333935] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#BA4E29] hover:bg-[#9B3D1E] text-xs font-medium text-[#FAF8F5] transition-colors shadow-xs cursor-pointer disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting...' : 'Confirm Deletion'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
