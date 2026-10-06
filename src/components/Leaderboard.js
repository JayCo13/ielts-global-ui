import React, { useState, useEffect } from 'react';
import { Trophy, Crown, ChevronLeft, ChevronRight, Medal } from 'lucide-react';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import TopPerformerBadge from './TopPerformerBadge';

const fmtTime = (s) => {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
};

const initials = (name) => (name || '?').trim().charAt(0).toUpperCase();

// Speaking ranks by AVERAGE band across attempts, Writing by band sum, Listening/Reading
// by correct answers — the label must name the number actually being ranked.
const scoreText = (e) => {
  if (e.score_unit === 'band_avg') return `Avg band: ${e.score}`;
  if (e.score_unit === 'band') return `Band total: ${e.score}`;
  return `${e.score} correct`;
};

// Metallic medal disc for the podium (1-3, centered pro icon) + a metallic numbered
// disc for rank 4. `hof` swaps rank-4 to the royal amethyst used by Hall of Fame.
// Multi-stop gradients + a bright inner ring give the polished metallic sheen.
const METALLIC = {
  gold:   'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600',
  silver: 'bg-gradient-to-br from-gray-100 via-slate-300 to-slate-500',
  bronze: 'bg-gradient-to-br from-orange-200 via-amber-600 to-amber-800',
  teal:   'bg-gradient-to-br from-cyan-100 via-cyan-300 to-[#0096b1]',
  amethyst: 'bg-gradient-to-br from-violet-200 via-purple-400 to-purple-700',
};
const rankBadge = (rank, hof = false) => {
  const base = 'flex items-center justify-center w-9 h-9 rounded-full shrink-0 shadow-md ring-1 ring-inset ring-white/60 text-white';
  if (rank <= 3) {
    const grad = rank === 1 ? METALLIC.gold : rank === 2 ? METALLIC.silver : METALLIC.bronze;
    const Icn = rank === 1 ? Crown : Medal;
    return (
      <div className={`${base} ${grad}`}>
        <Icn className="w-[18px] h-[18px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" strokeWidth={2.4} />
      </div>
    );
  }
  if (rank === 4) {
    return <div className={`${base} ${hof ? METALLIC.amethyst : METALLIC.teal} text-sm font-extrabold`}>4</div>;
  }
  return <div className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-gray-50 text-gray-500">{rank}</div>;
};

// Gradient frames for the top 4. Monthly = competitive (gold/silver/bronze/teal);
// Hall of Fame = more premium/royal (gold→purple, stronger glow).
const MONTH_FRAMES = {
  1: { ring: 'bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600', inner: 'bg-gradient-to-r from-amber-50 to-white', glow: 'shadow-md shadow-amber-300/70' },
  2: { ring: 'bg-gradient-to-r from-gray-200 via-slate-400 to-gray-500', inner: 'bg-gradient-to-r from-slate-50 to-white', glow: 'shadow-md shadow-slate-300/70' },
  3: { ring: 'bg-gradient-to-r from-orange-300 via-amber-600 to-amber-800', inner: 'bg-gradient-to-r from-orange-50 to-white', glow: 'shadow-md shadow-orange-300/70' },
  4: { ring: 'bg-gradient-to-r from-cyan-300 via-[#0096b1] to-cyan-500', inner: 'bg-gradient-to-r from-cyan-50 to-white', glow: 'shadow-sm shadow-cyan-200/60' },
};
const HOF_FRAMES = {
  1: { ring: 'bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600', inner: 'bg-gradient-to-br from-amber-50 via-white to-purple-50', glow: 'shadow-lg shadow-amber-300/70' },
  2: { ring: 'bg-gradient-to-r from-fuchsia-300 via-purple-500 to-fuchsia-600', inner: 'bg-gradient-to-br from-fuchsia-50 via-white to-purple-50', glow: 'shadow-lg shadow-fuchsia-300/60' },
  3: { ring: 'bg-gradient-to-r from-indigo-300 via-violet-500 to-indigo-600', inner: 'bg-gradient-to-br from-indigo-50 via-white to-violet-50', glow: 'shadow-lg shadow-indigo-300/60' },
  4: { ring: 'bg-gradient-to-r from-violet-300 via-purple-500 to-violet-600', inner: 'bg-gradient-to-br from-violet-50 to-white', glow: 'shadow-md shadow-violet-300/60' },
};

// Wraps a row in a gradient-border frame for ranks 1-4; plain otherwise.
function FramedRow({ rank, variant, isMe, children }) {
  const frames = variant === 'hof' ? HOF_FRAMES : MONTH_FRAMES;
  const f = frames[rank];
  const meRing = isMe ? 'ring-2 ring-[#0096b1]' : '';
  if (!f) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isMe ? 'bg-[#0096b1]/10 border border-[#0096b1]/40' : 'hover:bg-gray-50'}`}>
        {children}
      </div>
    );
  }
  return (
    <div className={`rounded-xl p-[2px] ${f.ring} ${f.glow}`}>
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] ${f.inner} ${meRing}`}>
        {children}
      </div>
    </div>
  );
}

function Pager({ page, pageCount, onPage }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-3">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-600">Page {page}/{pageCount}</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Avatar({ e, ring }) {
  return e.avatar ? (
    <img src={e.avatar} alt="" className={`w-9 h-9 rounded-full object-cover shrink-0 ${ring}`} onError={(ev) => { ev.target.style.display = 'none'; }} />
  ) : (
    <div className={`w-9 h-9 rounded-full bg-[#0096b1]/20 text-[#0096b1] flex items-center justify-center text-sm font-bold shrink-0 ${ring}`}>
      {initials(e.name)}
    </div>
  );
}

function Row({ e }) {
  const top = e.rank <= 4;
  return (
    <FramedRow rank={e.rank} variant="month" isMe={e.is_me}>
      {rankBadge(e.rank)}
      <Avatar e={e} ring={top ? 'ring-2 ring-white shadow' : ''} />
      <div className="min-w-0 flex-1">
        <div className={`truncate ${top ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
          {e.name}
          {e.is_me && <span className="ml-2 text-[10px] font-bold text-white bg-[#0096b1] rounded-full px-1.5 py-0.5">You</span>}
        </div>
        {e.is_top_performer && <TopPerformerBadge count={e.top10_count} size="xs" className="mt-0.5" />}
      </div>
      <div className="text-right shrink-0">
        <div className="font-bold text-[#2b5356]">{e.score} <span className="text-xs font-normal text-gray-500">correct</span></div>
        <div className="text-xs text-gray-400">
          {e.attempts != null ? `${e.attempts} attempt${e.attempts === 1 ? '' : 's'}` : ''}{e.attempts != null && e.time_taken != null ? ' · ' : ''}{fmtTime(e.time_taken)}
        </div>
      </div>
    </FramedRow>
  );
}

function HofRow({ e }) {
  const top = e.rank <= 4;
  return (
    <FramedRow rank={e.rank} variant="hof" isMe={e.is_me}>
      {rankBadge(e.rank, true)}
      <Avatar e={e} ring={top ? 'ring-2 ring-white shadow' : ''} />
      <div className="min-w-0 flex-1">
        <div className={`truncate ${top ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
          {e.name}
          {e.is_me && <span className="ml-2 text-[10px] font-bold text-white bg-[#0096b1] rounded-full px-1.5 py-0.5">You</span>}
        </div>
        {/* Everyone in the Hall of Fame is shown as Legend Performer. */}
        <TopPerformerBadge legend size="xs" className="mt-0.5" />
      </div>
      <div className="text-right shrink-0">
        <div className="font-bold text-purple-700">{e.cup_top3} <span className="text-xs font-normal text-gray-500">Monthly Cup Top 3</span></div>
        <div className="text-xs text-gray-400">{scoreText(e)}{e.total_time ? ` · ${fmtTime(e.total_time)}` : ''}</div>
      </div>
    </FramedRow>
  );
}

// Monthly Cup row — this month's aggregated standing (# tests Top 10 + score).
function CupRow({ e }) {
  const top = e.rank <= 4;
  return (
    <FramedRow rank={e.rank} variant="hof" isMe={e.is_me}>
      {rankBadge(e.rank, true)}
      <Avatar e={e} ring={top ? 'ring-2 ring-white shadow' : ''} />
      <div className="min-w-0 flex-1">
        <div className={`truncate ${top ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
          {e.name}
          {e.is_me && <span className="ml-2 text-[10px] font-bold text-white bg-[#0096b1] rounded-full px-1.5 py-0.5">You</span>}
        </div>
        {e.top10_count > 0 && e.count_label !== 'tests' && (
          <TopPerformerBadge count={e.top10_count} size="xs" className="mt-0.5" />
        )}
      </div>
      <div className="text-right shrink-0">
        {/* The BOLD number must be the one deciding the rank. Speaking ranks by average
            band, so it goes on top and the test count moves to the secondary line. */}
        {e.score_unit === 'band_avg' ? (
          <>
            <div className="font-bold text-purple-700">
              {e.score} <span className="text-xs font-normal text-gray-500">average band</span>
            </div>
            <div className="text-xs text-gray-400">{e.top10_count} full tests</div>
          </>
        ) : (
          <>
            <div className="font-bold text-purple-700">
              {e.top10_count}{' '}
              <span className="text-xs font-normal text-gray-500">
                {e.count_label === 'tests' ? 'full tests' : 'Top 10 finishes'}
              </span>
            </div>
            <div className="text-xs text-gray-400">{scoreText(e)}{e.attempts ? ` · ${e.attempts} attempts` : ''}</div>
          </>
        )}
      </div>
    </FramedRow>
  );
}

const HOF_SKILLS = [
  { key: 'listening', label: 'Listening' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' },
  // VN also has a Speaking board (graded full Speaking tests). The global app has no
  // Speaking test attempts yet, so the tab is left out; the backend still supports
  // ?skill=speaking.
];

// pageSize > 0 turns on client-side pagination (result page). Left 0 → the compact
// Top-10 dialog used inside the exam room.
/**
 * `initialTab` / `initialSkill`: open straight into a specific board (e.g. the Monthly
 * Cup of one skill when there is no per-test board to show).
 */
export default function Leaderboard({ examId, pageSize = 0, initialTab, initialSkill }) {
  const paginated = pageSize > 0;
  const [tab, setTab] = useState(initialTab || 'month'); // 'month' | 'cup' | 'hof'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hofSkill, setHofSkill] = useState(initialSkill || 'listening'); // + 'speaking'
  const [hofBySkill, setHofBySkill] = useState({}); // skill -> {entries} (cache)
  const [hofLoading, setHofLoading] = useState(false);
  const [cupSkill, setCupSkill] = useState(initialSkill || 'listening');
  const [cupBySkill, setCupBySkill] = useState({}); // skill -> {entries, month} (cache)
  const [cupLoading, setCupLoading] = useState(false);
  const [monthPage, setMonthPage] = useState(1);
  const [hofPage, setHofPage] = useState(1);
  const [cupPage, setCupPage] = useState(1);
  const hof = hofBySkill[hofSkill] || null;
  const cup = cupBySkill[cupSkill] || null;

  useEffect(() => {
    if (!examId) return;
    const token = localStorage.getItem('token');
    const limit = paginated ? 500 : 10;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/student/leaderboard/${examId}?limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) setData(await res.json());
      } catch (e) { /* ignore */ } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [examId, paginated]);

  // Lazy-load each Hall of Fame skill board the first time it's viewed (writing has
  // no data yet — skip the fetch, the UI shows a "coming soon" note).
  useEffect(() => {
    if (tab !== 'hof' || hofBySkill[hofSkill]) return;
    const token = localStorage.getItem('token');
    let cancelled = false;
    setHofLoading(true);
    (async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/student/hall-of-fame?skill=${hofSkill}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const json = await res.json();
          setHofBySkill((prev) => ({ ...prev, [hofSkill]: json }));
        }
      } catch (e) { /* ignore */ } finally { if (!cancelled) setHofLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [tab, hofSkill, hofBySkill]);

  // Lazy-load each Monthly Cup skill board the first time it's viewed.
  useEffect(() => {
    if (tab !== 'cup' || cupBySkill[cupSkill]) return;
    const token = localStorage.getItem('token');
    let cancelled = false;
    setCupLoading(true);
    (async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/student/monthly-cup?skill=${cupSkill}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const json = await res.json();
          setCupBySkill((prev) => ({ ...prev, [cupSkill]: json }));
        }
      } catch (e) { /* ignore */ } finally { if (!cancelled) setCupLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [tab, cupSkill, cupBySkill]);

  // Reset pagination when switching skill board.
  useEffect(() => { setHofPage(1); }, [hofSkill]);
  useEffect(() => { setCupPage(1); }, [cupSkill]);

  // Only wait when there really is a per-test board to load. Without `examId` the loader
  // above exits early, `loading` stays true and `data` stays null — blocking here would
  // render nothing at all.
  if (examId && (loading || !data)) return null;
  // Always render (the board has a Hall of Fame tab too); the monthly tab shows its
  // own empty state when nobody qualified this month.
  // `data` only exists when opened with an `examId`; without one it is null here, so
  // never read `data.top` directly (it would throw and blank the page).
  const hasMonth = !!(data?.top && data.top.length > 0);
  const meInTop = !!(data?.me && data.top.some((e) => e.is_me));

  // Paginated slices (result page) vs full list (dialog).
  const monthRows = data?.top || [];
  const monthPageCount = paginated ? Math.max(1, Math.ceil(monthRows.length / pageSize)) : 1;
  const monthSlice = paginated ? monthRows.slice((monthPage - 1) * pageSize, monthPage * pageSize) : monthRows;

  const hofRows = hof?.entries || [];
  const hofPageCount = paginated ? Math.max(1, Math.ceil(hofRows.length / pageSize)) : 1;
  const hofSlice = paginated ? hofRows.slice((hofPage - 1) * pageSize, hofPage * pageSize) : hofRows;

  const cupRows = cup?.entries || [];
  const cupPageCount = paginated ? Math.max(1, Math.ceil(cupRows.length / pageSize)) : 1;
  const cupSlice = paginated ? cupRows.slice((cupPage - 1) * pageSize, cupPage * pageSize) : cupRows;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="inline-flex bg-gray-100 rounded-lg p-1 flex-wrap">
          {/* The per-TEST board only makes sense when opened from a specific test; without
              an exam the button is hidden rather than leading to an empty tab. */}
          {examId && (
            <button
              onClick={() => setTab('month')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'month' ? 'bg-white text-[#eb7e37] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Trophy className="w-4 h-4" /> Test ranking {data?.month || ''}
            </button>
          )}
          <button
            onClick={() => setTab('cup')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'cup' ? 'bg-white text-[#0096b1] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Trophy className="w-4 h-4" /> Monthly Cup
          </button>
          <button
            onClick={() => setTab('hof')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'hof' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Crown className="w-4 h-4" /> Hall of Fame
          </button>
        </div>
        {tab === 'month' && data?.me && (
          <span className="text-sm text-gray-600">
            Your rank: <span className="font-bold text-[#0096b1]">{data.me.rank}</span>
            <span className="text-gray-400">/{data.total}</span>
          </span>
        )}
      </div>

      {tab === 'month' && data ? (
        <>
          {hasMonth ? (
            <div className="space-y-1">
              {monthSlice.map((e) => <Row key={e.user_id} e={e} />)}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-6 text-sm">Nobody has qualified for this month's ranking yet.</div>
          )}

          {paginated ? (
            <Pager page={monthPage} pageCount={monthPageCount} onPage={setMonthPage} />
          ) : (
            data.me && !meInTop && (
              <>
                <div className="text-center text-gray-300 my-1">···</div>
                <Row e={data.me} />
              </>
            )
          )}

          {data.me_message && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2">
              {data.me_message}
            </div>
          )}
        </>
      ) : tab === 'cup' ? (
        <>
          <div className="mb-3 text-sm text-gray-500">Combined ranking for <b>{cup?.month || ''}</b> — resets every month; at month end the Top 3 enter the Hall of Fame.</div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {HOF_SKILLS.map((s) => (
              <button
                key={s.key}
                onClick={() => setCupSkill(s.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  cupSkill === s.key ? 'bg-[#0096b1] text-white border-[#0096b1]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0096b1]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {cupLoading ? (
            <div className="text-center text-gray-400 py-6 text-sm">Loading...</div>
          ) : cupRows.length > 0 ? (
            <>
              <div className="space-y-1">
                {cupSlice.map((e) => <CupRow key={e.user_id} e={e} />)}
              </div>
              {paginated && <Pager page={cupPage} pageCount={cupPageCount} onPage={setCupPage} />}
            </>
          ) : (
            <div className="text-center text-gray-400 py-6 text-sm">Nobody is in this month's {HOF_SKILLS.find(s => s.key === cupSkill)?.label} Monthly Cup yet.</div>
          )}
        </>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-500">All-time honour board — ranked by Monthly Cup Top 3 finishes, then total score, then total time.</div>
          {/* Per-skill Hall of Fame boards */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {HOF_SKILLS.map((s) => (
              <button
                key={s.key}
                onClick={() => setHofSkill(s.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  hofSkill === s.key ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {hofLoading ? (
            <div className="text-center text-gray-400 py-6 text-sm">Loading...</div>
          ) : hofRows.length > 0 ? (
            <>
              <div className="space-y-1">
                {hofSlice.map((e) => <HofRow key={e.user_id} e={e} />)}
              </div>
              {paginated && <Pager page={hofPage} pageCount={hofPageCount} onPage={setHofPage} />}
            </>
          ) : (
            <div className="text-center text-gray-400 py-6 text-sm">Nobody is in the {HOF_SKILLS.find(s => s.key === hofSkill)?.label} Hall of Fame yet (it fills up month by month).</div>
          )}
        </>
      )}
    </div>
  );
}
