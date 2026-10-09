import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { Search, Lock, ChevronLeft, ChevronRight, Sparkles, History } from 'lucide-react';
import secureStorage from '../utils/secureStorage';
import API_BASE from '../config/api';
import Seo from './Seo';
import ForecastStars, { ForecastLegend } from './ForecastStars';
import DifficultyBadge from './DifficultyBadge';

const WritingForecast = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // URL conventions accepted: ?part=part1|part2 (preferred) or ?part=1|2 (legacy).
  // Optional ?type=<enum value> filters within the current part.
  const parseSearch = (search) => {
    const sp = new URLSearchParams(search);
    const partRaw = sp.get('part');
    const part = (partRaw === 'part2' || partRaw === '2') ? 'part2' : 'part1';
    return { part, type: sp.get('type') || '' };
  };
  const initial = parseSearch(location.search);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVIP, setIsVIP] = useState(false);
  // AI grading quota now comes from the server (/ai/writing/quota), which applies
  // the global rule: ANY active VIP subscription (any package) counts as VIP.
  const [aiQuota, setAiQuota] = useState(null);
  const [partSort, setPartSort] = useState(initial.part);
  const [typeFilter, setTypeFilter] = useState(initial.type);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const next = parseSearch(location.search);
    setPartSort(next.part);
    setTypeFilter(next.type);
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const updateUrl = (nextPart, nextType) => {
    const sp = new URLSearchParams();
    sp.set('part', nextPart);
    if (nextType) sp.set('type', nextType);
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` });
  };
  const itemsPerPage = 6;
  const userRole = localStorage.getItem('role');
  const isLoggedIn = !!(secureStorage.getItem('token') || localStorage.getItem('token'));
  // VN port: per-part attempt history dropdown.
  const [histOpen, setHistOpen] = useState(null);   // `${exam_id}-${part_number}`
  const [histData, setHistData] = useState({});
  const [histLoading, setHistLoading] = useState({});
  const openHist = async (examId, partNumber) => {
    const key = `${examId}-${partNumber}`;
    if (histOpen === key) { setHistOpen(null); return; }
    setHistOpen(key);
    if (histData[key] !== undefined) return;
    setHistLoading((p) => ({ ...p, [key]: true }));
    try {
      const token = secureStorage.getItem('token') || localStorage.getItem('token');
      const r = await fetch(`${API_BASE}/student/writing/forecast-history/${examId}/${partNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = r.ok ? await r.json() : [];
      setHistData((p) => ({ ...p, [key]: data }));
    } catch (e) {
      setHistData((p) => ({ ...p, [key]: [] }));
    } finally {
      setHistLoading((p) => ({ ...p, [key]: false }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = secureStorage.getItem('token') || localStorage.getItem('token');
      try {
        let forecastData = [];
        if (!token) {
          const forecastRes = await fetch(`${API_BASE}/public/writing-forecasts`);
          if (forecastRes.ok) { forecastData = await forecastRes.json(); }
        } else {
          const [forecastRes, vipRes] = await Promise.all([
            fetch(`${API_BASE}/student/writing/forecasts`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/customer/vip/subscription/status`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          forecastData = await forecastRes.json();
          const vipData = await vipRes.json();
          const hasAccess = vipData.is_subscribed && (
            vipData.package_type === 'all_skills' || (vipData.package_type === 'single_skill' && vipData.skill_type === 'writing')
          );
          setIsVIP(hasAccess);
        }
        const flat = [];
        forecastData.forEach(exam => {
          exam.parts.forEach(p => flat.push({
            task_id: p.task_id,
            part_number: p.part_number,
            title: p.title || `Part ${p.part_number}`,
            exam_title: exam.exam_title,
            exam_id: exam.exam_id,
            instructions: p.instructions || '',
            // Carry the per-part question type through so we can sort and
            // badge it on the matching part; fall back to the exam-level
            // aggregate values when present.
            task1_type: p.task1_type || exam.task1_type || null,
            task2_type: p.task2_type || exam.task2_type || null,
            difficulty_label: p.difficulty_label || null,
            forecast_level: p.forecast_level || null,
            occurrence_count: p.occurrence_count || 0,
            band: p.band ?? null   // this user's AI band (VN port)
          }));
        });
        setItems(flat);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const canSearch = !(userRole === 'customer' && !isVIP);
  const base = canSearch
    ? items.filter(it =>
      (it.title + ' ' + it.exam_title).toLowerCase().includes(searchQuery.toLowerCase())
    )
    : items;
  // Per-part question-type sort. Part 1 uses chart type (pie → map →
  // process → table → line → bar → mixed). Part 2 uses essay flavour
  // (agree/disagree → positive/negative → advantages outweigh disadvantages
  // → discussion → solutions+effects → two-part mixed). Items without a
  // type fall to the end of their list.
  const TASK1_TYPE_ORDER = ['pie', 'map', 'process', 'table', 'line', 'bar', 'mixed'];
  const TASK2_TYPE_ORDER = [
    'agree_disagree',
    'positive_negative',
    'advantages_disadvantages',
    'discussion',
    'solutions_effects',
    'two_part_mixed'
  ];
  const rank = (order, t) => {
    const i = order.indexOf(t);
    return i === -1 ? order.length : i;
  };
  const sorted = base
    .filter(it => partSort === 'part1' ? it.part_number === 1 : it.part_number === 2)
    .filter(it => {
      if (!typeFilter) return true;
      return partSort === 'part1'
        ? it.task1_type === typeFilter
        : it.task2_type === typeFilter;
    })
    .sort((a, b) => partSort === 'part1'
      ? rank(TASK1_TYPE_ORDER, a.task1_type) - rank(TASK1_TYPE_ORDER, b.task1_type)
      : rank(TASK2_TYPE_ORDER, a.task2_type) - rank(TASK2_TYPE_ORDER, b.task2_type)
    );

  // Pills shown above the grid — pre-built per-part so the Part 1 view
  // shows chart types and Part 2 shows essay flavours.
  const PART1_PILLS = [
    { value: '', label: 'All' },
    { value: 'pie', label: 'Pie' },
    { value: 'map', label: 'Map' },
    { value: 'process', label: 'Process' },
    { value: 'table', label: 'Table' },
    { value: 'line', label: 'Line' },
    { value: 'bar', label: 'Bar' },
    { value: 'mixed', label: 'Mixed' }
  ];
  const PART2_PILLS = [
    { value: '', label: 'All' },
    { value: 'agree_disagree', label: 'Agree / Disagree' },
    { value: 'positive_negative', label: 'Positive / Negative' },
    { value: 'advantages_disadvantages', label: 'Advantages vs Disadvantages' },
    { value: 'discussion', label: 'Discuss both views' },
    { value: 'solutions_effects', label: 'Solutions / Effects' },
    { value: 'two_part_mixed', label: 'Two-part Mixed' }
  ];
  const currentPills = partSort === 'part1' ? PART1_PILLS : PART2_PILLS;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginated = sorted.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;

  // Authoritative Writing-AI grade quota from the server (Gemini engine,
  // /ai/writing/quota). Replaces the old per-browser localStorage counters.
  useEffect(() => {
    const token = secureStorage.getItem('token') || localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/ai/writing/quota`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) setAiQuota(await r.json());
      } catch (e) { /* ignore */ }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title="English Writing Focus Tasks | EnglishOnComputer"
        description={`Practice English writing with our focus tasks${items.length ? ` like ${items.slice(0, 3).map(i => i.exam_title).join(', ')}` : ''}. A star marks Very Important tasks to prioritise.`}
        path="/writing_forecast"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'English Writing Focus Tasks',
          itemListElement: items.slice(0, 20).map((i, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: i.exam_title,
          })),
        }}
      />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-[#0096b1]">Home</Link>
              </li>
              <li><span className="text-gray-400 mx-2">/</span></li>
              <li><span className="text-[#0096b1] font-medium">Writing Practice</span></li>
            </ol>
          </nav>
          {aiQuota && (aiQuota.is_vip ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0096b1]/25 bg-[#0096b1]/5 px-4 py-2 self-start sm:self-auto">
              <Sparkles className="w-4 h-4 text-[#0096b1] shrink-0" />
              <span className="text-sm text-gray-600">AI evaluations</span>
              <span className="text-sm font-bold text-[#0096b1]">Unlimited for normal use</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eb7e37]/30 bg-gradient-to-r from-[#0096b1]/5 to-[#eb7e37]/10 px-4 py-2 self-start sm:self-auto">
              <Sparkles className="w-4 h-4 text-[#eb7e37] shrink-0" />
              <span className="text-sm text-gray-600">Free AI evaluations today</span>
              <span className="text-base font-extrabold text-[#eb7e37] tabular-nums">
                {aiQuota.remaining}<span className="text-gray-400 font-semibold text-sm">/{aiQuota.limit}</span>
              </span>
              <Link to="/vip-packages" className="text-xs font-bold text-[#0096b1] hover:underline">Upgrade to VIP</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4"><ForecastLegend /></div>
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={!isVIP && userRole === 'customer' ? "Search is VIP only..." : "Search focus tests..."}
              className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 ${(!isVIP && userRole === 'customer') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={searchQuery}
              onChange={(e) => {
                if (isVIP || userRole !== 'customer') {
                  setSearchQuery(e.target.value);
                }
              }}
              disabled={!isVIP && userRole === 'customer'}
            />
            {!isVIP && userRole === 'customer' && (
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            )}
          </div>
          <div className="w-48">
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
              value={partSort}
              onChange={(e) => updateUrl(e.target.value, '')}
            >
              <option value="part1">Part 1</option>
              <option value="part2">Part 2</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {currentPills.map(p => {
            const active = (typeFilter || '') === p.value;
            return (
              <button
                key={p.value || 'all'}
                onClick={() => updateUrl(partSort, p.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  active
                    ? 'bg-[#0096b1] text-white border-[#0096b1]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#0096b1] hover:text-[#0096b1]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow border border-gray-100 p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-40 bg-gray-100 rounded mb-3" />
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-5/6 bg-gray-100 rounded" />
                  <div className="h-3 w-4/6 bg-gray-100 rounded" />
                </div>
                <div className="h-9 w-full bg-gray-200 rounded mb-2" />
                <div className="h-9 w-full bg-gray-100 rounded mb-2" />
                <div className="h-9 w-full bg-gradient-to-r from-gray-200 to-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No focus items to display</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((it, index) => (
                <div key={it.task_id} className="bg-white rounded-lg shadow border border-gray-100 p-4 relative">
                  <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 min-w-0">
                    <span className="text-[#0096b1] italic mr-2">Writing:</span>
                    <span>{it.title}</span>
                  </h3>
                  {isLoggedIn && it.band != null && (() => {
                    const key = `${it.exam_id}-${it.part_number}`;
                    return (
                      <div className="relative shrink-0">
                        {histOpen === key && <div className="fixed inset-0 z-40" onClick={() => setHistOpen(null)} />}
                        <button onClick={() => openHist(it.exam_id, it.part_number)} title="Writing attempt history"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200">
                          <History className="w-4 h-4" /> History
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${histOpen === key ? 'rotate-90' : ''}`} />
                        </button>
                        {histOpen === key && (() => {
                          const attempts = histData[key] || [];
                          const versions = [{ key: 'cur', label: 'Current attempt', band: it.band }];
                          attempts.forEach((a) => versions.push({ key: `a${a.attempt_number}`, label: `Attempt ${a.attempt_number}`, band: a.band, date: a.created_at, attempt_number: a.attempt_number }));
                          return (
                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden text-left">
                              <div className="p-3 border-b border-gray-50 bg-gray-50/50"><h4 className="text-sm font-semibold text-gray-700">Attempt history</h4></div>
                              <div className="max-h-56 overflow-y-auto">
                                {histLoading[key] ? (
                                  <div className="p-6 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0096b1] mx-auto" /></div>
                                ) : (<>
                                  {versions.slice(0, 3).map((v) => (
                                    <button key={v.key} onClick={() => { setHistOpen(null); navigate('/writing_review', { state: { testId: it.exam_id, isForecast: true, partNumber: it.part_number, attemptNumber: v.attempt_number } }); }}
                                      className="w-full p-3 text-left hover:bg-[#0096b1]/5 border-b border-gray-50 transition-colors">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-700">{v.label}</span>
                                        {v.band != null ? <span className="text-base font-bold text-[#0096b1] bg-[#0096b1]/10 px-2.5 py-1 rounded">Band {v.band}</span> : <span className="text-xs text-gray-400">Not graded</span>}
                                      </div>
                                      {v.date && <div className="text-xs text-gray-400 mt-0.5">{new Date(v.date).toLocaleDateString()}</div>}
                                    </button>
                                  ))}
                                  <button onClick={() => { setHistOpen(null); navigate('/exam-history'); }} className="w-full text-center p-3 block text-sm font-semibold text-[#0096b1] hover:bg-[#0096b1]/5 transition-colors">View all history</button>
                                </>)}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Exam: {it.exam_title}</div>
                  {(it.difficulty_label || it.forecast_level) && (
                    <div className="mt-2 flex items-center gap-2">
                      <DifficultyBadge label={it.difficulty_label} />
                      <ForecastStars level={it.forecast_level} />
                    </div>
                  )}
                  {it.task1_type && it.part_number === 1 && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[#0096b1]/10 text-[#0096b1] capitalize">
                        Task 1 · {it.task1_type}
                      </span>
                    </div>
                  )}
                  {it.task2_type && it.part_number === 2 && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[#eb7e37]/10 text-[#eb7e37]">
                        Task 2 · {it.task2_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {/* Show full preview (text + image). Previously line-clamp-3 was
                      used here, but its display:-webkit-box + overflow:hidden clipped
                      images entirely from view. Cards can grow taller now. */}
                  <div className="mt-3 text-gray-700 [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: it.instructions }} />
                  {it.band != null && (
                    <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#0096b1]/5 border border-[#0096b1]/20 py-1.5">
                      <span className="text-xs text-gray-500">Your band:</span>
                      <span className="text-lg font-extrabold text-[#0096b1]">{it.band}</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!secureStorage.getItem('token') && !localStorage.getItem('token')) {
                        navigate('/login');
                        return;
                      }
                      navigate('/writing_test_room', { state: { taskId: it.task_id, testId: it.exam_id, isForecast: true, partNumber: it.part_number } });
                    }}
                    className={`mt-4 w-full text-white py-2 rounded ${it.band != null ? 'bg-[#eb7e37] hover:bg-[#d66e2a]' : 'bg-[#0096b1]'}`}
                  >
                    {it.band != null ? 'Retake' : 'Take Practice'}
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={() => navigate('/writing_review', { state: { testId: it.exam_id, isForecast: true, partNumber: it.part_number } })}
                      className="mt-2 w-full bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white py-2 rounded flex items-center justify-center gap-2"
                      title="Review, edit and evaluate your essay with AI"
                    >
                      <Sparkles className="w-4 h-4" />
                      Review &amp; Evaluate with AI
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={3} />
              </button>
              <span className="text-gray-600 font-bold">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WritingForecast;
