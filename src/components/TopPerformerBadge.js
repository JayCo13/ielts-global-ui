import React from 'react';
import { Award, Medal, Trophy, Crown } from 'lucide-react';

// Achievement tiers by how many distinct exams (of a given skill) the user is in
// the Top 10 of. Highest reached tier is shown.
const TIERS = [
  { min: 25, label: 'Legend Performer', Icon: Crown, cls: 'bg-purple-100 text-purple-700' },
  { min: 10, label: 'Master Performer', Icon: Trophy, cls: 'bg-amber-100 text-amber-700' },
  { min: 3, label: 'Elite Performer', Icon: Medal, cls: 'bg-slate-200 text-slate-700' },
  { min: 1, label: 'Top Performer', Icon: Award, cls: 'bg-[#eb7e37]/10 text-[#eb7e37]' },
];
const LEGEND = TIERS[0];
const SKILL_LABEL = { reading: 'Reading', listening: 'Listening', writing: 'Writing' };

export function tierFor(count) {
  return TIERS.find((t) => (count || 0) >= t.min) || null;
}

// `count` (per-skill top10_count) → tiered badge. `legend` forces the 👑 Legend
// Performer badge (used inside Hall of Fame, where everyone is a Legend). `skill`
// appends a skill label (e.g. "Master Performer · Reading").
export default function TopPerformerBadge({ count, legend = false, skill, className = '', size = 'sm' }) {
  const tier = legend ? LEGEND : tierFor(count != null ? count : 1);
  if (!tier) return null;
  const { label, Icon, cls } = tier;
  const text = skill ? `${label} · ${SKILL_LABEL[skill] || skill}` : label;
  const compact = size === 'xs';
  return (
    <span
      title={legend ? 'Legend Performer — in the Hall of Fame' : text}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${cls} ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      } ${className}`}
    >
      <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {text}
    </span>
  );
}
