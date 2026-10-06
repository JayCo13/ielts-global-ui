import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import API_BASE from '../config/api';

// Canonical error types — keys must match the backend (error_report_routes.py).
const ERROR_TYPES = [
  { key: 'wrong_answer', label: 'Wrong answer key', needsQuestions: 'wrong' },
  { key: 'mis_graded', label: 'Answer graded incorrectly', needsQuestions: 'graded' },
  { key: 'spelling', label: 'Spelling mistake', descPlaceholder: 'Details: which word/phrase is wrong and what it should be.' },
  { key: 'audio', label: 'Audio problem' },
  // 'audio_cue' (replay jumps to the wrong spot) is re-enabled together with
  // listening audio alignment, which global does not have yet.
  { key: 'ui', label: 'Display / UI problem', descPlaceholder: 'Details: where it happens and what is wrong (e.g. broken layout, hidden text, button not working...).' },
  { key: 'other', label: 'Other' },
];

// Writing has no answer key or question numbers: same backend keys, writing wording,
// no question-number inputs (mirrors the VN writing report options).
const WRITING_ERROR_TYPES = [
  { key: 'mis_graded', label: 'AI score seems inaccurate', descPlaceholder: 'Details: which criterion or comment looks wrong and why.' },
  { key: 'wrong_answer', label: 'Task prompt content is wrong', descPlaceholder: 'Details: what is wrong in the prompt or the image.' },
  { key: 'spelling', label: 'Spelling mistake', descPlaceholder: 'Details: which word/phrase is wrong and what it should be.' },
  { key: 'ui', label: 'Display / UI problem', descPlaceholder: 'Details: where it happens and what is wrong (e.g. broken layout, hidden text, button not working...).' },
  { key: 'other', label: 'Other' },
];

/**
 * Report-an-error modal, filed from the exam Review screen.
 * Props: open, onClose, examId, resultId, skill ('reading'|'listening'|'writing'), examTitle.
 */
const ErrorReportModal = ({ open, onClose, examId, resultId, skill, examTitle }) => {
  const errorTypes = skill === 'writing' ? WRITING_ERROR_TYPES : ERROR_TYPES;
  const [selected, setSelected] = useState([]);
  const [wrongQuestions, setWrongQuestions] = useState('');
  const [misGradedQuestions, setMisGradedQuestions] = useState('');
  const [typeInfo, setTypeInfo] = useState({});   // per-type details (spelling / ui)
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const reset = () => {
    setSelected([]);
    setWrongQuestions('');
    setMisGradedQuestions('');
    setTypeInfo({});
    setDescription('');
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one error type.');
      return;
    }
    // Fold the per-type details (spelling / ui) into the description so
    // the admin sees structured detail without a backend schema change.
    const descParts = [];
    errorTypes.forEach((t) => {
      if (t.descPlaceholder && selected.includes(t.key) && (typeInfo[t.key] || '').trim()) {
        descParts.push(`[${t.label}] ${typeInfo[t.key].trim()}`);
      }
    });
    if (description.trim()) descParts.push(description.trim());
    const fullDescription = descParts.join('\n') || null;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/student/error-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_id: examId ? parseInt(examId) : null,
          result_id: resultId ? parseInt(resultId) : null,
          skill: skill || null,
          exam_title: examTitle || null,
          error_types: selected,
          wrong_answer_questions: (skill !== 'writing' && selected.includes('wrong_answer')) ? wrongQuestions.trim() || null : null,
          mis_graded_questions: (skill !== 'writing' && selected.includes('mis_graded')) ? misGradedQuestions.trim() || null : null,
          description: fullDescription,
        }),
      });
      if (res.ok) {
        toast.success('Report sent. Thank you for your feedback!');
        reset();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || 'Could not send the report. Please try again.');
      }
    } catch (e) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-[#2b5356]">Report an Error</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="mb-3 text-sm text-gray-500">Select the type of problem you found:</p>
          <div className="space-y-2">
            {errorTypes.map((t) => {
              const checked = selected.includes(t.key);
              return (
                <div key={t.key}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 hover:border-[#0096b1]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(t.key)}
                      className="h-4 w-4 rounded border-gray-300 text-[#0096b1] focus:ring-[#0096b1]"
                    />
                    <span className="text-sm font-medium text-gray-800">{t.label}</span>
                  </label>
                  {checked && t.needsQuestions === 'wrong' && (
                    <input
                      type="text"
                      value={wrongQuestions}
                      onChange={(e) => setWrongQuestions(e.target.value)}
                      placeholder="Question numbers with a wrong answer key (e.g. 3, 7, 12)"
                      className="mt-2 ml-7 w-[calc(100%-1.75rem)] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0096b1] focus:outline-none focus:ring-1 focus:ring-[#0096b1]"
                    />
                  )}
                  {checked && t.needsQuestions === 'graded' && (
                    <input
                      type="text"
                      value={misGradedQuestions}
                      onChange={(e) => setMisGradedQuestions(e.target.value)}
                      placeholder="Question numbers graded incorrectly (e.g. 5, 9)"
                      className="mt-2 ml-7 w-[calc(100%-1.75rem)] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0096b1] focus:outline-none focus:ring-1 focus:ring-[#0096b1]"
                    />
                  )}
                  {checked && t.descPlaceholder && (
                    <textarea
                      value={typeInfo[t.key] || ''}
                      onChange={(e) => setTypeInfo((p) => ({ ...p, [t.key]: e.target.value }))}
                      rows={2}
                      placeholder={t.descPlaceholder}
                      className="mt-2 ml-7 w-[calc(100%-1.75rem)] resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0096b1] focus:outline-none focus:ring-1 focus:ring-[#0096b1]"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell us more so we can check it..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0096b1] focus:outline-none focus:ring-1 focus:ring-[#0096b1]"
            />
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <b>Note:</b> Every report is reviewed by our team. If it is a genuine error, we will fix it. If the original result is correct under the test rules, nothing will change.
            </span>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-[#0096b1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#007a90] disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorReportModal;
