import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, BookOpen, Headphones, PenLine } from 'lucide-react';
import Navbar from '../components/Navbar';
import Seo from '../components/Seo';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import { labelForType } from '../utils/questionTypeStats';

const SKILLS = [
  { key: 'reading', label: 'Reading', unit: 'accuracy', Icon: BookOpen },
  { key: 'listening', label: 'Listening', unit: 'accuracy', Icon: Headphones },
  { key: 'writing', label: 'Writing', unit: 'band', Icon: PenLine },
  // VN also shows a Speaking tab fed by graded Speaking test attempts; the global app
  // has no such attempts yet, so the tab is hidden (backend still returns the data).
];

const accTone = (a) => (a >= 70 ? 'text-green-600' : a >= 40 ? 'text-amber-600' : 'text-red-500');
const accBadge = (a) => (a >= 70 ? 'bg-green-100 text-green-700' : a >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600');

// Convert accuracy (%) → approximate band for Reading/Listening (IELTS ratio table).
const BAND_TABLE = [
  [97.5, 9.0], [92.5, 8.5], [87.5, 8.0], [82.5, 7.5], [75, 7.0], [67.5, 6.5],
  [57.5, 6.0], [47.5, 5.5], [37.5, 5.0], [30, 4.5], [22.5, 4.0], [15, 3.5], [7.5, 3.0], [0, 2.5],
];
const bandFromAccuracy = (pct) => {
  const p = Number(pct) || 0;
  for (const [min, band] of BAND_TABLE) if (p >= min) return band.toFixed(1);
  return '2.5';
};

function TrendBadge({ value, suffix = '%' }) {
  if (value === null || value === undefined) {
    return <span className="inline-flex items-center gap-1 text-gray-400 text-sm"><Minus className="w-4 h-4" /> —</span>;
  }
  if (value > 0) return <span className="inline-flex items-center gap-1 text-green-600 text-sm font-semibold"><TrendingUp className="w-4 h-4" /> +{value}{suffix}</span>;
  if (value < 0) return <span className="inline-flex items-center gap-1 text-red-500 text-sm font-semibold"><TrendingDown className="w-4 h-4" /> {value}{suffix}</span>;
  return <span className="inline-flex items-center gap-1 text-gray-500 text-sm"><Minus className="w-4 h-4" /> 0{suffix}</span>;
}

export default function ResultsOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('reading');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    (async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/student/results-overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (e) { /* ignore */ } finally { setLoading(false); }
    })();
  }, [navigate]);

  const skills = data?.skills || {};
  const typeStats = data?.question_type_stats || {};
  const skillMeta = SKILLS.find(s => s.key === active);
  const skill = skills[active] || { items: [], count: 0, average: null, trend: null, unit: skillMeta?.unit };
  const isBand = skillMeta?.unit === 'band';

  // Chart data: build_skill_history gives newest-first → reverse to chronological.
  const chartData = [...(skill.items || [])].reverse().map((it, i) => ({
    name: `#${i + 1}`,
    value: it.value,
  })).filter(d => d.value !== null && d.value !== undefined);

  const rows = typeStats[active] || [];
  const wb = data?.writing_breakdown || { tasks: [], types: [], criteria: {} };
  const speaking = data?.speaking_breakdown || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo title="Results Overview" path="/results-overview" noindex />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2b5356]">Results Overview</h1>
          <p className="text-gray-500 mt-1">Choose a skill to see detailed statistics</p>
        </div>

        {/* Skill tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {SKILLS.map(({ key, label, Icon }) => {
            const cnt = skills[key]?.count || 0;
            const on = active === key;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  on ? 'bg-[#0096b1] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0096b1]'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
                <span className={`text-xs rounded-full px-1.5 ${on ? 'bg-white/25' : 'bg-gray-100'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : active === 'speaking' ? (
          /* Speaking is measured in bands, not correct answers like the other skills,
             so it has its own block: average, band per Part and the 4 IELTS criteria. */
          !speaking || !speaking.attempts ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
              No graded Speaking tests yet. Take a test and grade it to see statistics.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-[#2b5356] to-[#1e3c3e] text-white p-6">
                <p className="text-white/70 text-sm font-semibold">Average Overall Speaking Band</p>
                <p className="text-5xl font-bold mt-1 tabular-nums">
                  {speaking.overall_avg == null ? '—' : Number(speaking.overall_avg).toFixed(1)}
                </p>
                <p className="text-white/70 text-sm mt-1">
                  {speaking.attempts} graded tests
                  {speaking.latest != null && ` · latest ${Number(speaking.latest).toFixed(1)}`}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#2b5356] mb-3">Band by Part</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {speaking.parts.map((p) => (
                    <div key={p.label} className="rounded-xl border-2 border-gray-100 px-4 py-3">
                      <p className="text-sm text-gray-500">{p.label}</p>
                      <p className="text-2xl font-bold text-[#0096b1] tabular-nums">
                        {p.avg == null ? '—' : Number(p.avg).toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-400">{p.count} times</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#2b5356] mb-3">Criteria scores</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {speaking.criteria.map((c) => (
                    <div key={c.key} className="rounded-xl border-2 border-gray-100 px-4 py-3
                                                flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#2b5356]">{c.label}</span>
                      <span className="text-xl font-bold text-[#eb7e37] tabular-nums">
                        {c.avg == null ? '—' : Number(c.avg).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (skill.count || 0) === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
            No {skillMeta?.label} data yet. Take a test to see statistics.
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
                <div className="text-xs text-gray-500 mb-1">{isBand ? 'Average band' : 'Average accuracy'}</div>
                <div className={`text-3xl font-bold ${isBand ? 'text-[#0096b1]' : accTone(skill.average || 0)}`}>
                  {skill.average != null ? (isBand ? skill.average : `${skill.average}%`) : '—'}
                </div>
                {!isBand && skill.average != null && (
                  <div className="text-xs font-semibold text-[#0096b1] mt-1">≈ Band {bandFromAccuracy(skill.average)}</div>
                )}
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
                <div className="text-xs text-gray-500 mb-1">Tests taken</div>
                <div className="text-3xl font-bold text-gray-700">{skill.count || 0}</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
                <div className="text-xs text-gray-500 mb-1">Trend</div>
                <div className="mt-1.5 flex justify-center">
                  <TrendBadge value={skill.trend} suffix={isBand ? '' : '%'} />
                </div>
              </div>
            </div>

            {/* Progress chart */}
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">{skillMeta?.label} Progress Chart</h3>
              {chartData.length >= 2 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f5" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis domain={isBand ? [0, 9] : [0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v) => (isBand ? `Band ${v}` : `${v}%`)} />
                    <Line type="monotone" dataKey="value" stroke="#0096b1" strokeWidth={2.5} dot={{ r: 3, fill: '#0096b1' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-10 text-sm">At least 2 attempts are needed to draw the progress chart.</div>
              )}
            </div>

            {/* Per-question-type breakdown (reading/listening only) */}
            {!isBand && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Breakdown by question type</h3>
                {rows.length === 0 ? (
                  <div className="text-center text-gray-400 py-6 text-sm">
                    No question-type data yet (tests need question types assigned).
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b">
                          <th className="px-3 py-2 font-medium">Question type</th>
                          <th className="px-3 py-2 font-medium text-center">Correct / Total</th>
                          <th className="px-3 py-2 font-medium text-center">Accuracy</th>
                          <th className="px-3 py-2 font-medium text-right">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rows.map((r) => (
                          <tr key={r.type} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5 font-medium text-gray-800">{labelForType(r.type)}</td>
                            <td className="px-3 py-2.5 text-center text-gray-500">{r.correct}/{r.total}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${accBadge(r.accuracy)}`}>
                                {r.accuracy}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right"><TrendBadge value={r.trend} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-3 text-xs text-gray-400">
                  Trend = your more recent half of tests compared with the earlier half.
                </p>
              </div>
            )}

            {isBand && active === 'writing' && (
              <>
                {/* Component scores (TR/CC/LR/GRA) average */}
                {wb.criteria && (wb.criteria.tr != null || wb.criteria.cc != null || wb.criteria.lr != null || wb.criteria.gra != null) && (
                  <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Criteria scores (average)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[['TR', 'tr'], ['CC', 'cc'], ['LR', 'lr'], ['GRA', 'gra']].map(([code, k]) => (
                        <div key={k} className="border border-gray-100 rounded-xl p-4 text-center">
                          <div className="text-xs font-bold text-gray-400 mb-1">{code}</div>
                          <div className="text-2xl font-extrabold text-[#0096b1]">{wb.criteria[k] != null ? wb.criteria[k] : '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Task 1 / Task 2 band breakdown */}
                <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Breakdown by Task</h3>
                  {wb.tasks.length === 0 ? (
                    <div className="text-center text-gray-400 py-6 text-sm">No Task data yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {wb.tasks.map((t) => (
                        <div key={t.part} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-700">{t.label}</span>
                            <span className="text-xs text-gray-400">{t.count} essays</span>
                          </div>
                          <div className="flex items-end justify-between">
                            <div className="text-3xl font-bold text-[#0096b1]">{t.average != null ? t.average : '—'}</div>
                            <TrendBadge value={t.trend} suffix="" />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Average band</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Per-question-type band breakdown (from forecast question-type tags) */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h3 className="font-semibold text-gray-800 mb-3">Breakdown by task type</h3>
                  {wb.types.length === 0 ? (
                    <div className="text-center text-gray-400 py-6 text-sm">
                      No task-type data yet (writing tests need task types assigned).
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b">
                            <th className="px-3 py-2 font-medium">Task type</th>
                            <th className="px-3 py-2 font-medium text-center">Essays</th>
                            <th className="px-3 py-2 font-medium text-center">Avg band</th>
                            <th className="px-3 py-2 font-medium text-right">Trend</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {wb.types.map((r) => (
                            <tr key={r.type} className="hover:bg-gray-50">
                              <td className="px-3 py-2.5 font-medium text-gray-800">{labelForType(r.type)}</td>
                              <td className="px-3 py-2.5 text-center text-gray-500">{r.count}</td>
                              <td className="px-3 py-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0096b1]/10 text-[#0096b1]">
                                  {r.average != null ? r.average : '—'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right"><TrendBadge value={r.trend} suffix="" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-gray-400">
                    Bands by task type are based on the type label assigned to each test.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
