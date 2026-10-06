import React, { useState } from 'react';
import Button from './Button';

/**
 * Shared warning dialog.
 *
 * `secondaryLabel`/`onSecondary` add ONE optional third choice in the middle —
 * the exam rooms use it for "Exit without submitting" (VN fix) so students can
 * leave without pushing an unfinished attempt into their results. Without
 * those props the dialog keeps its original two buttons. `confirmLabel` /
 * `busyLabel` override the confirm button text.
 */
const AlertForm = ({ open, onClose, onConfirm, title, message,
                     confirmLabel, busyLabel, secondaryLabel, onSecondary }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (isSubmitting) return; // Prevent multiple clicks
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 max-w-[500px] w-full shadow-lg">
        <h2 className="text-xl font-bold text-center text-red-600 mb-4">
          {title || 'Warning'}
        </h2>
        
        <div className="my-6 text-center text-gray-700">
          {message || 'Are you sure you want to leave this page? Your progress will be lost.'}
        </div>
        
        <div className="flex flex-wrap justify-between gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outlined"
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {secondaryLabel && (
            <Button
              onClick={onSecondary}
              variant="outlined"
              className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
              disabled={isSubmitting}
            >
              {secondaryLabel}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            variant="contained"
            className="flex-1 px-6 py-2 bg-red-600 text-black hover:bg-red-700 rounded-lg"
            disabled={isSubmitting}
            autoFocus
          >
            {isSubmitting ? (busyLabel || 'Submitting...') : (confirmLabel || 'Confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertForm;

