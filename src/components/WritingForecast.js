import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { Search, Lock, ChevronLeft, ChevronRight, Sparkles, CheckCircle } from 'lucide-react';
import AIFeedbackDialog from './AiFeedbackDialog';
import EditEssayDialog from './EditEssayDialog';
import secureStorage from '../utils/secureStorage';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import { Helmet } from 'react-helmet-async';

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
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [evaluatedMap, setEvaluatedMap] = useState({});
  const [aiRemaining, setAiRemaining] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

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
            task2_type: p.task2_type || exam.task2_type || null
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

  useEffect(() => {
    const role = localStorage.getItem('role');
    const usernameKey = localStorage.getItem('username') || 'unknown';
    const now = new Date();
    const nowUtcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const vnMs = nowUtcMs + (7 * 60 * 60 * 1000);
    const vn = new Date(vnMs);
    const dateKey = `${vn.getUTCFullYear()}-${String(vn.getUTCMonth() + 1).padStart(2, '0')}-${String(vn.getUTCDate()).padStart(2, '0')}`;
    const storeKey = `aiEvalCounters:${usernameKey}`;
    const counters = JSON.parse(localStorage.getItem(storeKey) || '{}');
    const isVipOrStudent = isVIP || role === 'student';
    const limit = isVipOrStudent ? 6 : 2;
    const used = isVipOrStudent ? (counters[dateKey]?.total || 0) : (counters[dateKey]?.forecast || 0);
    setAiRemaining(Math.max(0, limit - used));
  }, [isVIP, aiDialogOpen, aiLoading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>IELTS Writing Practice | Practice Mockup Tests</title>
        <meta name="description" content={`Practice your IELTS Writing skills with Practice exams like ${items.slice(0, 3).map(i => i.exam_title).join(', ')}...`} />
      </Helmet>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-[#0096b1]">Home</Link>
              </li>
              <li><span className="text-gray-400 mx-2">/</span></li>
              <li><span className="text-[#0096b1] font-medium">Writing Practice</span></li>
            </ol>
          </nav>
          <div className="text-sm font-semibold text-red-700 mt-5">
            <p>* Upgrade to VIP Listening and Reading to unlock 6 more free AI Writing evaluations per day *</p>
            <p>* Free AI evaluation remaining today: {aiRemaining} *</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={!isVIP && userRole === 'customer' ? "Search is VIP only..." : "Search forecasts..."}
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
                  <h3 className="text-lg font-semibold text-gray-800">
                    <span className="text-[#0096b1] italic mr-2">Writing:</span>
                    <span>{it.title}</span>
                  </h3>
                  <div className="text-sm text-gray-600 mt-1">Exam: {it.exam_title}</div>
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
                  <button
                    onClick={() => {
                      if (!secureStorage.getItem('token') && !localStorage.getItem('token')) {
                        navigate('/login');
                        return;
                      }
                      navigate('/writing_test_room', { state: { taskId: it.task_id, testId: it.exam_id, isForecast: true } });
                    }}
                    className="mt-4 w-full bg-[#0096b1] text-white py-2 rounded"
                  >
                    Take Practice
                  </button>
                      <button
                        onClick={() => { setSelectedPart(it); setEditDialogOpen(true); }}
                        className="mt-2 w-full bg-gray-800 text-white py-2 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          const role = localStorage.getItem('role');
                          const usernameKey = localStorage.getItem('username') || 'unknown';
                          const now = new Date();
                          const nowUtcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
                          const vnMs = nowUtcMs + (7 * 60 * 60 * 1000);
                          const vn = new Date(vnMs);
                          const dateKey = `${vn.getUTCFullYear()}-${String(vn.getUTCMonth() + 1).padStart(2, '0')}-${String(vn.getUTCDate()).padStart(2, '0')}`;
                          const storeKey = `aiEvalCounters:${usernameKey}`;
                          const counters = JSON.parse(localStorage.getItem(storeKey) || '{}');
                          if (!counters[dateKey]) counters[dateKey] = { full: 0, forecast: 0, total: 0 };
                          const isVipOrStudent = isVIP || role === 'student';
                          if (aiRemaining <= 0) {
                            setAiResult({ error: 'You have reached the daily AI evaluation limit.' });
                            setAiDialogOpen(true);
                            return;
                          }
                          if (isVipOrStudent) {
                            if (counters[dateKey].total >= 6) {
                              setAiResult({ error: 'You have exceeded the daily AI evaluation limit (6).' });
                              setAiDialogOpen(true);
                              return;
                            }
                          } else {
                            if (counters[dateKey].forecast >= 2) {
                              setAiResult({ error: 'Regular accounts can only evaluate 2 practice exercises per day.' });
                              setAiDialogOpen(true);
                              return;
                            }
                          }
                          setAiLoading(true);
                          setAiDialogOpen(true);
                          try {
                            const token = secureStorage.getItem('token') || localStorage.getItem('token');
                            let essayText = null;
                            try {
                              const taskResponse = await fetchWithTimeout(`${API_BASE}/student/writing/tasks/${it.task_id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                              if (taskResponse.ok) {
                                const taskData = await taskResponse.json();
                                essayText = taskData.previous_answer?.answer_text;
                              }
                            } catch (fetchErr) {
                              // Network error fetching task - treat as no essay
                            }
                            if (!essayText) {
                              setAiResult({ error: 'No essay content to evaluate. Please click "Take Practice" or "Edit" to write your essay first.' });
                              return;
                            }
                            const response = await fetchWithTimeout(`${API_BASE}/ai/evaluate-and-save/${it.task_id}`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ essay_text: essayText, instructions: it.instructions })
                            });
                            const responseText = await response.text();
                            let data;
                            try { data = JSON.parse(responseText); } catch { throw new Error('Invalid AI response'); }
                            if (!response.ok) throw new Error(data.detail || 'AI error');
                            if (!data.evaluation_result) throw new Error('Missing evaluation result');
                            setAiResult({
                              task_id: data.task_id,
                              evaluation_timestamp: data.evaluation_timestamp,
                              band_score: data.evaluation_result.band_score,
                              word_count: data.word_count,
                              answer_text: essayText,
                              evaluation_result: data.evaluation_result,
                              part_number: it.part_number
                            });
                            setEvaluatedMap(prev => ({ ...prev, [it.task_id]: true }));
                            counters[dateKey].total = (counters[dateKey].total || 0) + 1;
                            counters[dateKey].forecast = (counters[dateKey].forecast || 0) + 1;
                            localStorage.setItem(storeKey, JSON.stringify(counters));
                          } catch (err) {
                            setAiResult({ error: `Unable to process AI response: ${err.message}` });
                          } finally {
                            setAiLoading(false);
                          }
                        }}
                        className={`mt-2 w-full bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white py-2 rounded flex items-center justify-center gap-2 ${aiRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={aiLoading || aiRemaining <= 0}
                      >
                        {evaluatedMap[it.task_id] ? <CheckCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        {aiLoading ? '...' : 'Evaluate with AI'}
                      </button>
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
        <EditEssayDialog
          isOpen={editDialogOpen}
          onClose={() => { setEditDialogOpen(false); setSelectedPart(null); }}
          taskId={selectedPart}
          partNumber={selectedPart?.part_number}
        />
        <AIFeedbackDialog
          isOpen={aiDialogOpen}
          onClose={() => setAiDialogOpen(false)}
          result={aiResult}
          loading={aiLoading}
          setSelectedPart={setSelectedPart}
          setEditDialogOpen={setEditDialogOpen}
        />
      </div>
    </div>
  );
};

export default WritingForecast;
