import React from 'react';

// Difficulty labels set by the difficulty recompute job (easy/medium/hard/very_hard).
const MAP = {
  easy: { text: 'Easy', cls: 'bg-green-100 text-green-700' },
  medium: { text: 'Medium', cls: 'bg-lime-100 text-lime-700' },
  hard: { text: 'Hard', cls: 'bg-amber-100 text-amber-700' },
  very_hard: { text: 'Very hard', cls: 'bg-red-100 text-red-600' },
};

// Higher = harder; used for sorting when only labels are available.
export const difficultyRank = (label) => ({ easy: 1, medium: 2, hard: 3, very_hard: 4 }[label] || 0);

export default function DifficultyBadge({ label, className = '' }) {
  const m = MAP[label];
  if (!m) return null;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.cls} ${className}`}>
      {m.text}
    </span>
  );
}
