import React from 'react';

// "N people are taking this test" line with a pulsing dot (list cards + exam rooms).
// Renders nothing below `min` — list cards show from 1; an exam room passes min={2}
// so a student alone in a test is not told that "1 person" (themselves) is taking it.
export default function LiveTakers({ count, min = 1, className = '' }) {
  const n = Number(count) || 0;
  if (n < min) return null;
  return (
    <div className={`flex items-center gap-1.5 text-[#0096b1] font-semibold text-sm ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0096b1] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0096b1]"></span>
      </span>
      {n === 1 ? '1 person is taking this test' : `${n} people are taking this test`}
    </div>
  );
}
