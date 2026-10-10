import React, { useEffect, useState, useRef } from 'react';
import usePersistedState from '../utils/useListPreferences';
import { useLiveCounts } from '../utils/useLivePresence';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { Search, Lock, ChevronRight, ChevronLeft, Star, Filter, CheckCircle2 } from 'lucide-react';
import secureStorage from '../utils/secureStorage';
import ConfirmDialog from './ConfirmDialog';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import Seo from './Seo';
import ForecastStars, { ForecastLegend } from './ForecastStars';
import DifficultyBadge from './DifficultyBadge';
import { labelForType } from '../utils/questionTypeStats';
import LiveTakers from './LiveTakers';

const ListeningForecast = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVIP, setIsVIP] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [examHistoryDropdowns, setExamHistoryDropdowns] = useState({});
  const [examHistories, setExamHistories] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const examHistoryRefs = useRef({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [examToRetake, setExamToRetake] = useState(null);
  const [sortOrder, setSortOrder] = useState('default');
  // Remembered so returning from a part lands back on the page it was on.
  const [currentPage, setCurrentPage] = usePersistedState('listPage:listeningForecast', 1);
  const [hideDone, setHideDone] = usePersistedState('hideDone:listeningForecast', false, 'local');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPart, setSelectedPart] = useState('all');
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // No token at all — public/SEO view.
        setUserRole('guest');
        return;
      }
      let userId = secureStorage.getItem('user_id');
      if (!userId) {
        userId = localStorage.getItem('user_id');
      }
      // SECURITY: token present + user_id missing means we lost the secureStorage
      // encryption key (typically a tab-close) or hit a Google OAuth path that
      // didn't persist user_id. Recover via /student/profile rather than
      // falling back to userRole='guest' — that fallback bypassed the no-VIP
      // filter and exposed paid content to non-VIP customers.
      if (!userId) {
        try {
          const profileRes = await fetchWithTimeout(`${API_BASE}/student/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            userId = profile.user_id;
            if (userId) {
              localStorage.setItem('user_id', String(userId));
              try { secureStorage.setItem('user_id', String(userId)); } catch (e) { /* ok */ }
            }
            setUserRole(profile.role || 'customer');
            return;
          }
          navigate('/login');
          return;
        } catch (e) {
          navigate('/login');
          return;
        }
      }
      try {
        const response = await fetchWithTimeout(`${API_BASE}/student/user-role/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        } else if (response.status === 401) {
          navigate('/login');
        }
      } catch (error) { }
    };
    fetchUserRole();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        let forecastsData = [];
        if (!token) {
          const forecastsRes = await fetch(`${API_BASE}/public/listening-forecasts`);
          if (forecastsRes.ok) {
            forecastsData = await forecastsRes.json();
          }
        } else {
          const [forecastsRes, vipRes] = await Promise.all([
            fetch(`${API_BASE}/student/listening/forecasts`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/customer/vip/subscription/status`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          forecastsData = await forecastsRes.json();
          const vipData = await vipRes.json();
          // Use the new skill-specific access flag (supports multiple subscriptions)
          const hasAccess = vipData.has_listening_access || false;
          setIsVIP(hasAccess);
        }
        const normalized = Array.isArray(forecastsData)
          ? forecastsData.flatMap(exam => (Array.isArray(exam.parts) ? exam.parts.map(p => ({
            exam_id: exam.exam_id,
            exam_title: exam.exam_title || exam.title,
            part_number: p.part_number,
            forecast_title: p.forecast_title || '',
            completed: !!p.completed,
            attempts_count: p.attempts_count || 0,
            latest_score: p.latest_score ?? null,
            total_questions: p.total_questions ?? null,
            is_recommended: !!p.is_recommended,
            question_types: Array.isArray(p.question_types) ? p.question_types : [],
            forecast_level: p.forecast_level || null,
            difficulty_label: p.difficulty_label || null,
            difficulty_score: p.difficulty_score ?? null,
            occurrence_count: p.occurrence_count || 0
          })) : []))
          : [];
        setItems(normalized);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Per-part history is fetched on demand; no global completion map needed

  const calculateBandScore = (totalScore) => {
    const bandScore = (totalScore / 40) * 9;
    return Math.round(bandScore * 2) / 2;
  };

  const fetchExamHistory = async (examId, partNumber) => {
    const key = `${examId}-${partNumber}`;
    if (examHistories[key]) {
      return;
    }
    setLoadingHistory(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithTimeout(`${API_BASE}/student/listening/forecast-history/${examId}/${partNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const results = await response.json();
        setExamHistories(prev => ({ ...prev, [key]: results }));
      } else {
        setExamHistories(prev => ({ ...prev, [key]: [] }));
      }
    } catch (error) {
      setExamHistories(prev => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingHistory(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleExamHistoryDropdown = (examId, partNumber) => {
    const key = `${examId}-${partNumber}`;
    const isCurrentlyOpen = examHistoryDropdowns[key];
    setExamHistoryDropdowns({});
    if (!isCurrentlyOpen) {
      setExamHistoryDropdowns({ [key]: true });
      fetchExamHistory(examId, partNumber);
    }
  };

  const handleViewPreviousExam = (examId, resultId, partNumber) => {
    navigate(`/listening_test_room`, {
      state: {
        examId: examId,
        fromResultReview: true,
        resultId: resultId,
        forecastPart: partNumber
      }
    });
  };

  const allQuestionTypes = [...new Set(items.flatMap(it => it.question_types || []))].filter(Boolean);
  const allParts = [...new Set(items.map(it => it.part_number).filter(Boolean))].sort((a, b) => a - b);

  // A "limited" user sees gated/blurred content: non-VIP customers AND guests
  // (no token). Students/admins are never limited. Guests must be gated at least
  // as strictly as a non-VIP customer — otherwise the public/SEO view leaks paid
  // part names. '' (role not yet fetched) is treated as limited: safe default.
  const isLimitedUser = !isVIP && userRole !== 'student' && userRole !== 'admin';

  const canSearch = !isLimitedUser;
  // "Hide completed" rides on the same VIP gate as search / sort / filters: for a
  // limited user the first 6 cards are the free ones, so the order must not change.
  const canHideDone = !isLimitedUser;
  const keepItem = (it) => !(hideDone && canHideDone) || !it.completed;

  const filtered = isLimitedUser
    ? items
    : items.filter(keepItem).filter(it => {
      const matchesSearch = ((it.exam_title || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
        ((it.forecast_title || '').toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === 'all' || (it.question_types || []).includes(selectedType);
      const matchesPart = selectedPart === 'all' || it.part_number === selectedPart;
      return matchesSearch && matchesType && matchesPart;
    }).sort((a, b) => {
      if (sortOrder === 'alphabet_asc' || sortOrder === 'alphabet_desc') {
        const titleA = a.forecast_title || a.exam_title || '';
        const titleB = b.forecast_title || b.exam_title || '';
        return sortOrder === 'alphabet_asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      } else if (sortOrder === 'difficulty') {
        // Easiest first = higher average % correct; unclassified parts go last.
        const av = a.difficulty_score, bv = b.difficulty_score;
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return bv - av;
      } else if (sortOrder === 'forecast') {
        // Important Levels, highest first.
        return (b.occurrence_count || 0) - (a.occurrence_count || 0);
      }
      return 0; // default order
    });
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginated = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  // A remembered page can point past the end after hiding finished items. Only clamp
  // once the list has actually loaded — on the first render `items` is still empty and
  // totalPages falls back to 1, which would throw away the remembered page.
  useEffect(() => {
    if (items.length > 0 && totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [items.length, totalPages, currentPage, setCurrentPage]);

  // Live "N people are taking this test" for the cards on this page (scope = "<exam>p<part>").
  const liveCounts = useLiveCounts(paginated.map(it => `${it.exam_id}p${it.part_number}`));

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title="English Listening Focus Tests | EnglishOnComputer"
        description={`Practice English listening with our focus tests${items.length ? ` like ${items.slice(0, 3).map(i => i.exam_title).join(', ')}` : ''}. A star marks Very Important tests to prioritise.`}
        path="/listening_forecast"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'English Listening Focus Tests',
          itemListElement: items.slice(0, 20).map((i, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: i.exam_title,
          })),
        }}
      />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/" className="text-gray-500 hover:text-[#0096b1]">Home</Link>
            </li>
            <li><span className="text-gray-400 mx-2">/</span></li>
            <li><span className="text-[#0096b1] font-medium">Listening Practice</span></li>
          </ol>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4"><ForecastLegend /></div>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={isLimitedUser ? "Search is VIP only..." : "Search focus tests..."}
              className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 ${isLimitedUser ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={searchQuery}
              onChange={(e) => {
                if (canSearch) { setSearchQuery(e.target.value); setCurrentPage(1); }
              }}
              disabled={isLimitedUser}
            />
            {isLimitedUser && (
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            )}
          </div>
          <select
            aria-label="Sort"
            className={`px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0096b1] focus:border-[#0096b1] font-medium ${isLimitedUser ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white text-gray-700'}`}
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
            disabled={isLimitedUser}
            title={isLimitedUser ? 'Sorting is VIP only' : undefined}
          >
            <option value="default">Newest</option>
            <option value="forecast">Important Levels: Highest to Lowest</option>
            <option value="difficulty">By difficulty (easiest first)</option>
            <option value="alphabet_asc">By Alphabet (A-Z)</option>
            <option value="alphabet_desc">By Alphabet (Z-A)</option>
          </select>
          <select
            aria-label="Part"
            className={`px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0096b1] focus:border-[#0096b1] font-medium ${isLimitedUser ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white text-gray-700'}`}
            value={selectedPart}
            onChange={(e) => { setSelectedPart(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}
            disabled={isLimitedUser}
            title={isLimitedUser ? 'Filtering is VIP only' : undefined}
          >
            <option value="all">All parts</option>
            {allParts.map(pn => (
              <option key={pn} value={pn}>Part {pn}</option>
            ))}
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

        {/* Question type filter */}
        {allQuestionTypes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Filter by question type:</span>
              {isLimitedUser && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Lock className="w-3 h-3" />
                  VIP only
                </span>
              )}
            </div>
            <div className={`flex flex-wrap gap-2 ${isLimitedUser ? 'opacity-50 pointer-events-none select-none' : ''}`}>
              <button
                onClick={() => { setSelectedType('all'); setCurrentPage(1); }}
                disabled={isLimitedUser}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedType === 'all'
                  ? 'bg-[#0096b1] text-white border-[#0096b1]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#0096b1] hover:text-[#0096b1]'
                  }`}
              >
                All ({items.length})
              </button>
              {allQuestionTypes.map(type => {
                const count = items.filter(it => (it.question_types || []).includes(type)).length;
                return (
                  <button
                    key={type}
                    onClick={() => { setSelectedType(type); setCurrentPage(1); }}
                    disabled={isLimitedUser}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedType === type
                      ? 'bg-[#0096b1] text-white border-[#0096b1]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#0096b1] hover:text-[#0096b1]'
                      }`}
                  >
                    {labelForType(type)} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No Practice tests available</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((it, index) => (
                <div key={`${it.exam_id}-${it.part_number}`} className="bg-white rounded-lg shadow border border-gray-100 p-4 relative">
                  {it.is_recommended && (
                    <div className="absolute top-2 right-2">
                      <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 pr-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                      <span className="text-[#0096b1] font-medium mr-2">Original Test:</span>
                      <span className={`truncate max-w-[70%] inline-block align-bottom ${(isLimitedUser && (index + indexOfFirstItem) >= 6) ? 'blur-[4px] select-none' : ''}`} title={(isLimitedUser && (index + indexOfFirstItem) >= 6) ? undefined : it.exam_title}>{it.exam_title}</span>
                    </h3>
                    {(() => {
                      const canShowHistory = (!isLimitedUser || (index + indexOfFirstItem) < 6);
                      if (!canShowHistory) return null;
                      return (
                        <div className="relative" ref={el => examHistoryRefs.current[`${it.exam_id}-${it.part_number}`] = el}>
                          <button
                            onClick={() => toggleExamHistoryDropdown(it.exam_id, it.part_number)}
                            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                          >
                            History
                            <ChevronRight className={`w-4 h-4 transition-transform ${examHistoryDropdowns[`${it.exam_id}-${it.part_number}`] ? 'rotate-90' : ''}`} />
                          </button>
                          {examHistoryDropdowns[`${it.exam_id}-${it.part_number}`] && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="p-3 border-b border-gray-100">
                                <h4 className="font-medium text-gray-900">History</h4>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {loadingHistory[`${it.exam_id}-${it.part_number}`] ? (
                                  <div className="p-4 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                                  </div>
                                ) : examHistories[`${it.exam_id}-${it.part_number}`] && examHistories[`${it.exam_id}-${it.part_number}`].length > 0 ? (
                                  <>
                                    {examHistories[`${it.exam_id}-${it.part_number}`].slice(0, 2).map((result) => (
                                      <button
                                        key={result.result_id}
                                        onClick={() => handleViewPreviousExam(it.exam_id, result.result_id, it.part_number)}
                                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors"
                                      >
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">
                                              Attempt #{result.attempt_number}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {new Date(result.completion_date).toLocaleString('en-US', {
                                                timeZone: 'Asia/Ho_Chi_Minh',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-medium text-blue-600">
                                              {result.score_earned}/{result.score_total}
                                            </p>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </>
                                ) : (
                                  <div className="p-4 text-center text-gray-500">
                                    <p className="text-sm">No history</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-2 text-md text-gray-700">
                    <span>Practice Part: </span>
                    <span className={`${(isLimitedUser && (index + indexOfFirstItem) >= 6) ? 'blur-[4px] select-none' : ''}`}>
                      {it.part_number}{it.forecast_title ? ` – ${it.forecast_title}` : ''}
                    </span>
                    <DifficultyBadge label={it.difficulty_label} className="ml-2 align-middle" />
                    <ForecastStars level={it.forecast_level} className="ml-2" />
                  </div>
                  {it.latest_score != null && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#eb7e37]">
                      <CheckCircle2 className="w-4 h-4" /> Correct {it.latest_score}/{it.total_questions}
                    </div>
                  )}
                  <LiveTakers count={liveCounts[`${it.exam_id}p${it.part_number}`]} className="mt-2" />
                  {(it.question_types || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {it.question_types.map(qt => (
                        <span key={qt} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0096b1]/10 text-[#0096b1] border border-[#0096b1]/20">
                          {labelForType(qt)}
                        </span>
                      ))}
                    </div>
                  )}
                  {(isLimitedUser && (index + indexOfFirstItem) >= 6) ? (
                    <div className="mt-4 p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Lock className="w-5 h-5 text-[#0096b1]" />
                        <span className="text-sm font-medium">VIP upgrade required</span>
                      </div>
                      <Link
                        to="/vip-packages?type=all"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0096b1] text-white hover:bg-[#00839a] text-sm"
                      >
                        View packages
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    (() => {
                      const forecastPart = it.part_number;
                      const hasHistory = !!it.attempts_count;
                      return (
                        <button
                          onClick={() => {
                            if (!localStorage.getItem('token')) {
                              navigate('/login');
                              return;
                            }
                            if (hasHistory) {
                              setExamToRetake({ examId: it.exam_id, forecastPart });
                              setShowConfirmDialog(true);
                            } else {
                              navigate('/listening_test_room', { state: { examId: it.exam_id, forecastPart } });
                            }
                          }}
                          className={`mt-4 w-full py-2 rounded text-white ${hasHistory ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#0096b1] hover:bg-[#00839a]'}`}
                        >
                          {hasHistory ? 'Retake' : 'Start'}
                        </button>
                      );
                    })()
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
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message="Are you sure you want to retake this Practice? Your previous attempts are saved in history."
        onConfirm={async () => {
          if (!examToRetake) { setShowConfirmDialog(false); return; }
          try {
            const token = localStorage.getItem('token');
            const res = await fetchWithTimeout(`${API_BASE}/student/listening/exam/${examToRetake.examId}/retake`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              // Clear highlights and notes from previous attempt
              localStorage.removeItem('ielts-highlights');
              localStorage.removeItem('ielts-notes');
              navigate('/listening_test_room', { state: { examId: examToRetake.examId, forecastPart: examToRetake.forecastPart } });
            }
          } catch { }
          setShowConfirmDialog(false);
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
};

export default ListeningForecast;
