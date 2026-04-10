import React, { useState } from 'react';
import Button from './Button';

const AlertForm = ({ open, onClose, onConfirm, title, message }) => {
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
        
        <div className="flex justify-between gap-4 mt-6">
          <Button
            onClick={onClose}
            variant="outlined"
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            className="flex-1 px-6 py-2 bg-red-600 text-black hover:bg-red-700 rounded-lg"
            disabled={isSubmitting}
            autoFocus
          >
            {isSubmitting ? 'Submitting...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertForm;

