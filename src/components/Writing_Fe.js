import React, { useState, useEffect, useRef } from 'react';
import usePersistedState from '../utils/useListPreferences';
import { useLiveCounts } from '../utils/useLivePresence';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Search, ChevronLeft, ChevronRight, Sparkles, RotateCw, Bot, Lock, History } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import TestModeDialog from './TestModeDialog';
import Navbar from './Navbar';
import { create } from 'framer-motion/m';
import { checkExamAccess } from '../utils/examAccess';
import secureStorage from '../utils/secureStorage';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import Seo from './Seo';
import ForecastStars, { ForecastLegend } from './ForecastStars';
import DifficultyBadge from './DifficultyBadge';
import LiveTakers from './LiveTakers';

// Map a /student/writing/tasks row to the shape the list renders and sorts by.
// Used for the initial load AND the refill after a retake, so both keep
// task1_type/task2_type (type badges + Task 1 sort) and the difficulty fields.
const mapStudentWritingTest = (exam) => ({
  id: exam.exam_id,
  title: exam.title,
  created_at: exam.created_at,
  test_id: exam.test_id,
  parts: exam.parts,
  is_completed: exam.is_completed,
  task1_type: exam.task1_type ?? null,
  task2_type: exam.task2_type ?? null,
  difficultyAvg: exam.difficulty_avg ?? null,
  occurrenceSum: exam.occurrence_sum || 0,
  overall_band: exam.overall_band ?? null
});

const Writing_Fe = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Remembered (per tab session) so coming back from a test lands on the page it was on.
  const [currentPage, setCurrentPage] = usePersistedState('listPage:writing', 1);
  // Lasting preference: hide the tests already completed.
  const [hideDone, setHideDone] = usePersistedState('hideDone:writing', false, 'local');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [isVIP, setIsVIP] = useState(false);
  // AI grading quota now comes from the server (/ai/writing/quota), which applies
  // the global rule: ANY active VIP subscription (any package) counts as VIP.
  const [aiQuota, setAiQuota] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const dropdownRef = useRef(null);
  const testsPerPage = 6;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  // VN port: Practice / Mock Exam picker + per-card attempt history.
  const [modeForTest, setModeForTest] = useState(null);
  const [histOpen, setHistOpen] = useState(null);   // test_id whose history dropdown is open
  const [histData, setHistData] = useState({});     // test_id -> attempts
  const [histLoading, setHistLoading] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const currentUser = localStorage.getItem('username');
    if (currentUser) {
      setUsername(currentUser);
    }

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {

      const token = secureStorage.getItem('token') || localStorage.getItem('token');

      try {
        if (!token) {
          const response = await fetch(`${API_BASE}/public/writing-forecasts`);
          if (response.ok) {
            const data = await response.json();
            const mapped = data.map(exam => ({
              id: exam.exam_id,
              title: exam.exam_title,
              created_at: new Date().toISOString(), // Fallback since it's not provided by public API
              test_id: exam.exam_id,
              parts: exam.parts,
              is_completed: false,
              task1_type: exam.task1_type ?? null,
              task2_type: exam.task2_type ?? null
            }));
            setTests(mapped);
          }
        } else {
          const [testsResponse, subscriptionResponse] = await Promise.all([
            fetch(`${API_BASE}/student/writing/tasks`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE}/customer/vip/subscription/status`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);

          if (testsResponse.status === 401 || subscriptionResponse.status === 401) {
            navigate('/login');
            return;
          }

          if (testsResponse.ok && subscriptionResponse.ok) {
            const [testsData, subscriptionData] = await Promise.all([
              testsResponse.json(),
              subscriptionResponse.json()
            ]);

            setAccountStatus(subscriptionData);

            // Writing-specific VIP access logic
            const hasWritingAccess = subscriptionData.is_subscribed && (
              subscriptionData.package_type === 'all_skills' ||
              (subscriptionData.package_type === 'single_skill' &&
                subscriptionData.skill_type === 'writing')
            );

            setIsVIP(hasWritingAccess);
            setTests(testsData.map(mapStudentWritingTest));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

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

  // AI evaluation moved to the Writing Review page (/writing_review, Gemini engine).
  const openReview = (test, partNumber) => {
    navigate('/writing_review', { state: { testId: test.test_id, isForecast: false, partNumber } });
  };

  const handleStartTest = async (test) => {
    if (!localStorage.getItem('token') && !secureStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    if (test.is_completed) {
      setSelectedTest(test);
      setDialogOpen(true);
    } else {
      setModeForTest(test);   // pick Practice / Mock Exam first (VN port)
    }
  };

  const startTestWithMode = (mode) => {
    const test = modeForTest;
    setModeForTest(null);
    if (test) navigate(`/writing_test_room`, {
      state: { taskId: test.parts[0].task_id, testId: test.test_id, testTitle: test.title, mode }
    });
  };

  // VN port: per-card history dropdown (current graded version + past attempts).
  const openHist = async (testId) => {
    if (histOpen === testId) { setHistOpen(null); return; }
    setHistOpen(testId);
    if (histData[testId]) return;
    setHistLoading((prev) => ({ ...prev, [testId]: true }));
    try {
      const token = secureStorage.getItem('token') || localStorage.getItem('token');
      const r = await fetchWithTimeout(`${API_BASE}/student/writing/test/${testId}/attempts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = r.ok ? await r.json() : [];
      setHistData((prev) => ({ ...prev, [testId]: data }));
    } catch (e) { setHistData((prev) => ({ ...prev, [testId]: [] })); }
    finally { setHistLoading((prev) => ({ ...prev, [testId]: false })); }
  };

  const handleConfirmReset = async () => {
    const token = secureStorage.getItem('token') || localStorage.getItem('token');
    try {
      const response = await fetchWithTimeout(`${API_BASE}/student/writing/test/${selectedTest.test_id}/reset`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const testsResponse = await fetchWithTimeout(`${API_BASE}/student/writing/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (testsResponse.ok) {
          const updatedTests = await testsResponse.json();
          // Same shape as the initial load — raw API rows lack the camelCase
          // difficulty/occurrence fields the cards and sort rely on.
          setTests(updatedTests.map(mapStudentWritingTest));
        }

        // The previous attempt is now a version in History; pick a mode for the retake.
        setHistData((prev) => { const next = { ...prev }; delete next[selectedTest.test_id]; return next; });
        setModeForTest(selectedTest);
      }
    } catch (error) {
      console.error('Error resetting test:', error);
    } finally {
      setDialogOpen(false);
      setSelectedTest(null);
    }
  };

  const [sortOrder, setSortOrder] = useState('alphabet');

  // Primary sort: Task 1 chart type (pie → map → process → table → line → bar
  // → mixed); tests without a type fall to the end. User's sort option below
  // becomes the tiebreaker within each type group.
  const TASK1_TYPE_ORDER = ['pie', 'map', 'process', 'table', 'line', 'bar', 'mixed'];
  const task1TypeRank = (t) => {
    const i = TASK1_TYPE_ORDER.indexOf(t);
    return i === -1 ? TASK1_TYPE_ORDER.length : i;
  };

  // "Hide completed" is a VIP filter, like the extra sort options (students always have it).
  const canHideDone = !!(secureStorage.getItem('token') || localStorage.getItem('token'))
    && (accountStatus?.is_subscribed || localStorage.getItem('role') !== 'customer');

  const filteredTests = tests
    .filter(test => !(hideDone && canHideDone) || !test.is_completed)
    .filter(test => test.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const rankDiff = task1TypeRank(a.task1_type) - task1TypeRank(b.task1_type);
      if (rankDiff !== 0) return rankDiff;
      switch (sortOrder) {
        case 'alphabet': {
          const aMatch = (a.title || '').match(/([^\d]+)(\d+)/);
          const bMatch = (b.title || '').match(/([^\d]+)(\d+)/);
          if (!aMatch || !bMatch) return (a.title || '').localeCompare(b.title || '');
          const [, aText, aNum] = aMatch;
          const [, bText, bNum] = bMatch;
          const textCompare = aText.localeCompare(bText);
          if (textCompare !== 0) return textCompare;
          return parseInt(aNum, 10) - parseInt(bNum, 10);
        }
        case 'latest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'forecast':
          return (b.occurrenceSum || 0) - (a.occurrenceSum || 0);
        case 'difficulty': {
          // Easy first = higher average band; unclassified tests go last.
          const av = a.difficultyAvg, bv = b.difficultyAvg;
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          return bv - av;
        }
        default:
          return (a.title || '').localeCompare(b.title || '');
      }
    });

  const indexOfLastTest = currentPage * testsPerPage;
  const indexOfFirstTest = indexOfLastTest - testsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstTest, indexOfLastTest);
  const totalPages = Math.ceil(filteredTests.length / testsPerPage);

  // The remembered page can point past the end once the list shrinks (search, or
  // hiding completed tests) — fall back to the last page that still has results.
  // Wait for the list to load first, or the remembered page would be thrown away.
  useEffect(() => {
    if (tests.length > 0 && totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [tests.length, totalPages, currentPage, setCurrentPage]);

  // Live "N people are taking this test" for the cards on this page (scope = test id).
  const liveCounts = useLiveCounts(currentTests.map(t => String(t.test_id)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white shadow-lg">
          <div className="relative w-20 h-20 mb-6">
            {/* Spinning circles animation */}
            <div className="absolute inset-0 border-4 border-t-green-500 border-r-green-400 border-b-green-300 border-l-green-200 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-t-green-400 border-r-green-300 border-b-green-200 border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 border-4 border-t-green-300 border-r-green-200 border-b-transparent border-l-green-400 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>

          <div className="text-xl font-medium text-gray-700 mb-2">Loading writing tests...</div>

          <div className="flex space-x-1.5 mt-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>

          <div className="mt-4 text-sm text-gray-500 max-w-xs text-center">
            Loading Writing tests. Please wait...
          </div>
        </div>
      </div>
    );
  }

  const renderTestCard = (test, index) => (
    <div
      key={test.test_id}
      className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-300 border border-gray-100 p-2 relative"
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center min-w-0">
          <span className="text-[#0096b1] text-md italic mr-2">Test:</span>
          <span className="text-gray-700 truncate">{test.title}</span>
        </h3>
          {(test.is_completed || test.overall_band != null) && (
            <div className="relative shrink-0">
              {histOpen === test.test_id && <div className="fixed inset-0 z-40" onClick={() => setHistOpen(null)} />}
              <button onClick={() => openHist(test.test_id)} title="Writing attempt history"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200">
                <History className="w-4 h-4" /> History
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${histOpen === test.test_id ? 'rotate-90' : ''}`} />
              </button>
              {histOpen === test.test_id && (() => {
                const attempts = histData[test.test_id] || [];
                const versions = [];
                if (test.is_completed) versions.push({ key: 'cur', label: 'Current attempt', overall: test.overall_band });
                attempts.forEach((a) => versions.push({ key: `a${a.attempt_number}`, label: `Attempt ${a.attempt_number}`, overall: a.overall_band, date: a.created_at, attempt_number: a.attempt_number }));
                return (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden text-left">
                    <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                      <h4 className="text-sm font-semibold text-gray-700">Attempt history</h4>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {histLoading[test.test_id] ? (
                        <div className="p-6 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0096b1] mx-auto" /></div>
                      ) : versions.length > 0 ? (
                        <>
                          {versions.slice(0, 3).map((v) => (
                            <button key={v.key}
                              onClick={() => { setHistOpen(null); navigate('/writing_review', { state: { testId: test.test_id, isForecast: false, attemptNumber: v.attempt_number } }); }}
                              className="w-full p-3 text-left hover:bg-[#0096b1]/5 border-b border-gray-50 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700">{v.label}</span>
                                {v.overall != null
                                  ? <span className="text-base font-bold text-[#0096b1] bg-[#0096b1]/10 px-2.5 py-1 rounded">Band {v.overall}</span>
                                  : <span className="text-xs text-gray-400">Not graded</span>}
                              </div>
                              {v.date && <div className="text-xs text-gray-400 mt-0.5">{new Date(v.date).toLocaleDateString()}</div>}
                            </button>
                          ))}
                          <button onClick={() => { setHistOpen(null); navigate('/exam-history'); }}
                            className="w-full text-center p-3 block text-sm font-semibold text-[#0096b1] hover:bg-[#0096b1]/5 transition-colors">
                            View all history
                          </button>
                        </>
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">No attempts yet.</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <LiveTakers count={liveCounts[test.test_id]} className="mb-2" />

        {(test.task1_type || test.task2_type) && (
          <div className="mb-2 flex flex-wrap gap-1">
            {test.task1_type && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[#0096b1]/10 text-[#0096b1] capitalize">
                Task 1 · {test.task1_type}
              </span>
            )}
            {test.task2_type && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[#eb7e37]/10 text-[#eb7e37]">
                Task 2 · {test.task2_type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}

        {test.overall_band != null && (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-[#0096b1]/5 border border-[#0096b1]/20 py-1.5">
            <span className="text-xs text-gray-500">Writing Overall:</span>
            <span className="text-lg font-extrabold text-[#0096b1]">{test.overall_band}</span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {test.parts.map((task) => (
            <div key={task.task_id} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 py-1.5 px-2 rounded">
              <span className="flex items-center gap-2">
                Part {task.part_number}
                <DifficultyBadge label={task.difficulty_label} />
                <ForecastStars level={task.forecast_level} />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-md">{task.word_limit} words</span>
                {test.is_completed && (
                  <button
                    onClick={() => openReview(test, task.part_number)}
                    className="px-2 py-0.5 text-md bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white rounded flex items-center gap-1"
                    title="Review, edit and evaluate your essay with AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    Review &amp; AI
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => handleStartTest(test)}
          className={`w-full flex items-center justify-center gap-2 ${test.is_completed ? 'bg-[#eb7e37] hover:bg-[#d66e2a]' : 'bg-[#0096b1] hover:bg-[#007a90]'} text-white px-4 py-2 rounded-md transition-colors font-medium text-sm`}
        >
          {test.is_completed ? (
            <RotateCw className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{test.is_completed ? 'Retake' : 'Start'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title="English Writing Practice Tasks | EnglishOnComputer"
        description={`Practice your English writing skills. Includes tasks like ${tests.slice(0, 3).map(t => t.title).join(', ')}...`}
        path="/writing_list"
      />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="text-gray-500 hover:text-[#0096b1]">Home</Link></li>
              <li><span className="text-gray-400 mx-2">/</span></li>
              <li><span className="text-[#0096b1] font-medium">Writing Tests</span></li>
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

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tests..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="alphabet">By Alphabet</option>
            {(isVIP || localStorage.getItem('role') === 'student') && (
              <>
                <option value="forecast">Important Levels: Highest to Lowest</option>
                <option value="difficulty">By difficulty (easiest first)</option>
                <option value="latest">Newest</option>
                <option value="oldest">Oldest</option>
              </>
            )}
          </select>
          {canHideDone && (
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer select-none bg-white hover:bg-gray-50 whitespace-nowrap">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#0096b1] cursor-pointer"
                checked={!!hideDone}
                onChange={(e) => { setHideDone(e.target.checked); setCurrentPage(1); }}
              />
              <span className="text-sm font-medium text-gray-700">Hide completed</span>
            </label>
          )}
        </div>

        <div className="mb-4"><ForecastLegend /></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTests.map((test, index) => renderTestCard(test, index))}
        </div>

        {/* Add pagination controls */}
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={3} />
          </button>
          <span className="text-gray-600 font-bold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        <TestModeDialog open={!!modeForTest} skill="writing" onSelect={startTestWithMode} onClose={() => setModeForTest(null)} />

        <ConfirmDialog
          isOpen={dialogOpen}
          message="Retaking starts a new attempt. Your previous result is kept and you can review it in History. Do you want to continue?"
          onConfirm={handleConfirmReset}
          onCancel={() => {
            setDialogOpen(false);
            setSelectedTest(null);
          }}
        />
      </div>
    </div>
  );
};

export default Writing_Fe;
