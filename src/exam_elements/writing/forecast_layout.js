import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { ChevronLeft } from 'lucide-react';
import API_BASE from '../../config/api';
import fetchWithTimeout from '../../utils/fetchWithTimeout';

const WritingForecastLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const taskId = location.state?.taskId;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (!taskId) { setLoading(false); return; }
    const fetchDetail = async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/student/writing/forecast/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const instr = data?.instructions || '';
        console.log('[WRITING-FORECAST-DIAG] instructions length:', instr.length);
        console.log('[WRITING-FORECAST-DIAG] first 120 chars:', instr.slice(0, 120));
        console.log('[WRITING-FORECAST-DIAG] last 120 chars:', instr.slice(-120));
        const imgMatches = instr.match(/<img\b[^>]*>/gi) || [];
        console.log('[WRITING-FORECAST-DIAG] img tag count:', imgMatches.length);
        imgMatches.forEach((tag, i) => {
          const srcMatch = tag.match(/\bsrc=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
          const src = srcMatch ? (srcMatch[1] || srcMatch[2] || srcMatch[3]) : '(no src)';
          console.log(`[WRITING-FORECAST-DIAG] img[${i}] src starts:`, src.slice(0, 80));
          console.log(`[WRITING-FORECAST-DIAG] img[${i}] src ends:`, src.slice(-80));
          console.log(`[WRITING-FORECAST-DIAG] img[${i}] src length:`, src.length);
        });
        setItem(data);
      } catch (e) {
        console.error('[WRITING-FORECAST-DIAG] fetch error:', e);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [taskId, navigate]);

  // After the instructions HTML is mounted, attach onerror/onload listeners so
  // we can see in console whether the browser actually managed to decode the
  // image, and report the rendered size.
  useEffect(() => {
    if (!item || !contentRef.current) return;
    const imgs = contentRef.current.querySelectorAll('img');
    imgs.forEach((img, i) => {
      const report = (tag) => {
        console.log(`[WRITING-FORECAST-DIAG] img[${i}] ${tag}: complete=${img.complete}, naturalW=${img.naturalWidth}, naturalH=${img.naturalHeight}, srcLen=${(img.getAttribute('src') || '').length}`);
      };
      if (img.complete) {
        report('already-loaded');
      } else {
        img.addEventListener('load', () => report('load'));
        img.addEventListener('error', () => {
          console.error(`[WRITING-FORECAST-DIAG] img[${i}] ERROR loading — src starts:`, (img.getAttribute('src') || '').slice(0, 80));
        });
      }
    });
  }, [item]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button onClick={() => navigate('/writing_forecast')} className="flex items-center text-gray-600 hover:text-[#0096b1]">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Forecasts
        </button>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading...</div>
        ) : !item ? (
          <div className="p-8 text-center text-gray-600">Forecast not available</div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800">
              <span className="text-[#0096b1] italic mr-2">Writing Forecast:</span>
              <span>{item.title || `Part ${item.part_number}`}</span>
            </h2>
            <div className="mt-1 text-sm text-gray-600">Exam: {item.exam_title}</div>
            <div ref={contentRef} className="mt-6 prose max-w-none [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: item.instructions }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingForecastLayout;