import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { Search, Lock, ChevronRight, ChevronLeft, Star } from 'lucide-react';
import secureStorage from '../utils/secureStorage';
import API_BASE from '../config/api';

const ReadingForecast = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVIP, setIsVIP] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [userRole, setUserRole] = useState('');
  const [examHistoryDropdowns, setExamHistoryDropdowns] = useState({});
  const [examHistories, setExamHistories] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const examHistoryRefs = useRef({});

  useEffect(() => {
    const fetchUserRole = async () => {
      let token = secureStorage.getItem('token') || localStorage.getItem('token');
      let userId = secureStorage.getItem('user_id') || localStorage.getItem('user_id');
      if (!token || !userId) { navigate('/login'); return; }
      try {
        const res = await fetch(`${API_BASE}/student/user-role/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) { const data = await res.json(); setUserRole(data.role); } else if (res.status === 401) { navigate('/login'); }
      } catch (_) { }
    };
    fetchUserRole();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const token = secureStorage.getItem('token') || localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      try {
        const [forecastRes, vipRes] = await Promise.all([
          fetch(`${API_BASE}/student/reading/forecasts`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE}/customer/vip/subscription/status`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const [forecastData, vipData] = await Promise.all([forecastRes.json(), vipRes.json()]);
        // Use the new skill-specific access flag (supports multiple subscriptions)
        const hasAccess = vipData.has_reading_access || false;
        setIsVIP(hasAccess);
        const flat = [];
        (Array.isArray(forecastData) ? forecastData : []).forEach(exam => {
          (exam.parts || []).forEach(p => flat.push({
            exam_id: exam.exam_id,
            exam_title: exam.exam_title,
            part_number: p.part_number,
            forecast_title: p.forecast_title || '',
            attempts_count: p.attempts_count || 0,
            completed: !!p.completed,
            is_recommended: !!p.is_recommended
          }));
        });
        setItems(flat);
      } catch (_) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const isCustomer = (userRole || '').toLowerCase() === 'customer';
  const isLimitedUser = isCustomer && !isVIP;
  const canSearch = !isLimitedUser;
  const filtered = (canSearch
    ? items.filter(it => ((it.exam_title || '').toLowerCase().includes(searchQuery.toLowerCase())) || ((it.forecast_title || '').toLowerCase().includes(searchQuery.toLowerCase())))
    : items);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginated = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

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
      const token = secureStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/student/reading/forecast-history/${examId}/${partNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const results = await response.json();
        setExamHistories(prev => ({ ...prev, [key]: Array.isArray(results) ? results : [] }));
      } else {
        setExamHistories(prev => ({ ...prev, [key]: [] }));
      }
    } catch (_) {
      setExamHistories(prev => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingHistory(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleExamHistoryDropdown = (examId, partNumber) => {
    const key = `${examId}-${partNumber}`;
    const isOpen = !!examHistoryDropdowns[key];
    setExamHistoryDropdowns({});
    if (!isOpen) {
      setExamHistoryDropdowns({ [key]: true });
      fetchExamHistory(examId, partNumber);
    }
  };

  const handleViewPreviousExam = (examId, resultId, partNumber) => {
    navigate('/reading_test_room', {
      state: {
        examId: examId,
        resultId: resultId,
        fromResultReview: true,
        forecastPart: partNumber
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/" className="text-gray-500 hover:text-[#0096b1]">Home</Link>
            </li>
            <li><span className="text-gray-400 mx-2">/</span></li>
            <li><span className="text-[#0096b1] font-medium">Reading Forecast</span></li>
          </ol>
        </nav>
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
          <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
          <span className="text-gray-700">= Recommended Test</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={!isVIP && userRole === 'customer' ? "Search is VIP only..." : "Tìm kiếm dự đoán..."}
              className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 ${(!isVIP && userRole === 'customer') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={searchQuery}
              onChange={(e) => {
                if (isVIP || userRole !== 'customer') { setSearchQuery(e.target.value); }
              }}
              disabled={!isVIP && userRole === 'customer'}
            />
            {!isVIP && userRole === 'customer' && (
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Chưa có bài kiểm tra dự đoán</div>
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
                      <span className="truncate max-w-[70%] inline-block align-bottom" title={it.exam_title}>{it.exam_title}</span>
                    </h3>
                    {(() => {
                      const hasHistory = it.attempts_count > 0;
                      const canShowHistory = hasHistory && (!isLimitedUser || (index + indexOfFirstItem) < 6);
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
                                            <p className="text-sm font-medium text-gray-900">Attempt #{result.attempt_number || ''}</p>
                                            <p className="text-xs text-gray-500">
                                              {new Date(result.completion_date).toLocaleString('vi-VN', {
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
                                            <p className="text-sm font-medium text-blue-600">{(result.total_score ?? result.score_earned ?? 0)}/{(result.score_total ?? 40)}</p>
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
                    <span>Dự đoán Part: </span>
                    <span className={`${(isLimitedUser && (index + indexOfFirstItem) >= 6) ? 'blur-[4px] select-none' : ''}`}>
                      {it.part_number}{it.forecast_title ? ` – ${it.forecast_title}` : ''}
                    </span>
                  </div>
                  {(isLimitedUser && (index + indexOfFirstItem) >= 6) ? (
                    <div className="mt-4 p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Lock className="w-5 h-5 text-[#0096b1]" />
                        <span className="text-sm font-medium">VIP upgrade required</span>
                      </div>
                      <Link
                        to="/vip-packages?type=reading"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0096b1] text-white hover:bg-[#00839a] text-sm"
                      >
                        View packages
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        // Clear highlights and notes from previous attempt
                        localStorage.removeItem('ielts-highlights');
                        localStorage.removeItem('ielts-notes');
                        navigate('/reading_test_room', { state: { examId: it.exam_id, forecastPart: it.part_number } });
                      }}
                      className={`mt-4 w-full py-2 rounded text-white ${it.attempts_count > 0 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#0096b1] hover:bg-[#00839a]'}`}
                    >
                      {it.attempts_count > 0 ? 'Retake' : 'Start'}
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

export default ReadingForecast;
