import React from 'react';
import { Star, Target } from 'lucide-react';

// forecast_level 1-4 → forecast likelihood stars (auto forecast by occurrence).
const LABELS = { 4: 'Very Important', 3: 'Important', 2: 'Moderately Important', 1: 'Slightly Important' };

// Hover legend shown on every star group (full test + parts, all 3 skills).
export const FORECAST_LEGEND =
  'Important Levels:\n★★★★ Very Important\n★★★ Important\n★★ Moderately Important\n★ Slightly Important';

// Horizontal legend for the list headers (parts + full test). The Target icon
// distinguishes the forecast stars from the difficulty badge.
export function ForecastLegend({ className = '' }) {
  const rows = [
    { stars: '★★★★', label: 'Very Important' },
    { stars: '★★★', label: 'Important' },
    { stars: '★★', label: 'Moderately Important' },
    { stars: '★', label: 'Slightly Important' },
  ];
  return (
    <div className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-gray-700 ${className}`}>
      <span className="inline-flex items-center gap-1 font-semibold text-gray-600">
        <Target size={14} className="text-[#eb7e37] shrink-0" /> Important Levels:
      </span>
      {rows.map((r) => (
        <span key={r.stars} className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className="text-yellow-500 tracking-tight">{r.stars}</span> {r.label}
        </span>
      ))}
    </div>
  );
}

export default function ForecastStars({ level, showLabel = false, className = '' }) {
  if (!level) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 align-middle ${className}`} title={FORECAST_LEGEND}>
      {/* Target icon before the stars distinguishes forecast from difficulty. */}
      <Target size={12} className="text-[#eb7e37] shrink-0 mr-0.5" />
      {Array.from({ length: level }).map((_, i) => (
        <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
      ))}
      {showLabel && <span className="ml-1 text-[11px] text-gray-500">{LABELS[level]}</span>}
    </span>
  );
}
