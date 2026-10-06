import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Wrench } from 'lucide-react';
import API_BASE from '../../config/api';
import fetchWithTimeout from '../../utils/fetchWithTimeout';

const toAbsoluteUrl = (u) => (u && u.startsWith('/')) ? `${API_BASE}${u}` : u;

// Mobile browsers (iOS Safari especially) render inline PDFs as a single,
// non-scrollable first page. Route them through the Google Docs viewer,
// which paginates properly; desktop keeps the native PDF viewer.
const isMobilePdfViewer = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const SpeakingLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { title: stateTitle, pdfUrl: statePdfUrl, partType: statePart, materialId: stateId } = location.state || {};
  const [title, setTitle] = useState(stateTitle || 'Speaking Material');
  const [pdfUrl, setPdfUrl] = useState(statePdfUrl ? toAbsoluteUrl(statePdfUrl) : '');
  const [partType, setPartType] = useState(statePart || null);
  const [loading, setLoading] = useState(!statePdfUrl);
  const [locked, setLocked] = useState(false);

  // Speaking gate (app/utils/speaking_gate.py — open to all accounts today). The room can be
  // opened straight from a URL, so it checks on its own. Fails open on network errors.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    let alive = true;
    fetchWithTimeout(`${API_BASE}/student/speaking/access`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json().catch(() => ({})).then((d) => ({ status: r.status, ok: r.ok, d })))
      .then(({ status, ok, d }) => {
        if (alive && (status === 503 || (ok && d.allowed === false))) { setLocked(true); setLoading(false); }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (statePdfUrl) return;
    const params = new URLSearchParams(location.search);
    const id = stateId || params.get('id');
    if (!id) {
      setLoading(false);
      return;
    }
    const fetchMaterial = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await fetchWithTimeout(`${API_BASE}/student/speaking/materials/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load material');
        const data = await res.json();
        setTitle(data.title || 'Speaking Material');
        setPdfUrl(toAbsoluteUrl(data.pdf_url) || '');
        setPartType(data.part_type || null);
      } catch (e) {
        setPdfUrl('');
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [location.search, statePdfUrl, stateId, navigate]);

  if (locked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#eb7e37]/10 flex items-center justify-center mx-auto mb-5">
            <Wrench className="text-[#eb7e37]" size={30} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-[#2b5356] mb-3">Feature update in progress</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Speaking is being upgraded. We will reopen it as soon as it is ready;
            Listening, Reading and Writing work as usual.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-lg bg-[#0096b1] text-white font-semibold hover:bg-[#007a90] transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm flex-none">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <button
            onClick={() => navigate('/speaking_list')}
            className="flex items-center text-lg font-bold text-gray-600 hover:text-lime-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" strokeWidth={3} />
            Back to Materials
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800">
            <span className="text-lime-600 font-bold italic mr-2">Speaking:</span>
            <span className="text-gray-700">{title}</span>
          </h3>
          {partType && (
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
              {partType === 'part1' ? 'Part 1' : 'Part 2-3'}
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md h-[80vh] md:h-[90vh] p-4 mt-4">
          {pdfUrl ? (
            isMobilePdfViewer ? (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                  title="Speaking PDF"
                  className="w-full flex-1 border rounded"
                />
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-center text-lime-600 font-bold underline"
                >
                  Open PDF in new tab
                </a>
              </div>
            ) : (
              <iframe src={pdfUrl} title="Speaking PDF" className="w-full h-full border rounded" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">No PDF available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingLayout;
