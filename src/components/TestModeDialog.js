import React from 'react';
import { BookOpen, Timer, X, ArrowRight, Info } from 'lucide-react';

// Full Test mode picker: Practice (no timer, graded on submit) vs Mock Exam
// (real exam timing + auto-submit). Shown before starting a full test.
const EXAM_TIMING = {
  listening: 'When the audio ends you get 2 extra minutes to check and fill in your answers, then the test is submitted automatically.',
  reading: 'Submitted automatically after 60 minutes. Ctrl + F search is disabled in the reading passages.',
  writing: 'Submitted automatically after 60 minutes.',
};

export default function TestModeDialog({ open, skill, onSelect, onClose }) {
  if (!open) return null;
  const examTiming = EXAM_TIMING[skill] || 'Real exam timing applies; the test is submitted automatically when time runs out.';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-[fadeIn_0.15s_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#2b5356]">Choose a test mode</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-4">
          {/* Practice */}
          <button onClick={() => onSelect('practice')}
            className="group text-left rounded-2xl border-2 border-gray-200 hover:border-[#0096b1] hover:shadow-lg p-5 transition-all">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-[#0096b1]/10 text-[#0096b1]"><BookOpen className="w-6 h-6" /></span>
              <span className="text-lg font-bold text-[#2b5356]">Practice</span>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li>• Time limit: <b>None</b>.</li>
              <li>• Your test is only graded when you click <b>Submit</b>.</li>
            </ul>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0096b1] opacity-0 group-hover:opacity-100 transition-opacity">
              Start practising <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Exam */}
          <button onClick={() => onSelect('exam')}
            className="group text-left rounded-2xl border-2 border-gray-200 hover:border-[#eb7e37] hover:shadow-lg p-5 transition-all">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-[#eb7e37]/10 text-[#eb7e37]"><Timer className="w-6 h-6" /></span>
              <span className="text-lg font-bold text-[#2b5356]">Mock Exam</span>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li>• Uses <b>real exam</b> timing.</li>
              <li>• {examTiming}</li>
            </ul>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#eb7e37] opacity-0 group-hover:opacity-100 transition-opacity">
              Start mock exam <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <div className="px-6 pb-5">
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-[#0096b1]/5 border border-[#0096b1]/20 rounded-xl px-3 py-2.5">
            <Info className="w-4 h-4 text-[#0096b1] shrink-0 mt-0.5" />
            <span><b>Tip:</b> Use <b>Ctrl +</b> or <b>Ctrl −</b> to zoom the page so the content fits your screen better.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
