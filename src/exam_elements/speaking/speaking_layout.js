import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import API_BASE from '../../config/api';
import fetchWithTimeout from '../../utils/fetchWithTimeout';

const toAbsoluteUrl = (u) => (u && u.startsWith('/')) ? `${API_BASE}${u}` : u;

const SpeakingLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { title: stateTitle, pdfUrl: statePdfUrl, partType: statePart, materialId: stateId } = location.state || {};
  const [title, setTitle] = useState(stateTitle || 'Speaking Material');
  const [pdfUrl, setPdfUrl] = useState(statePdfUrl ? toAbsoluteUrl(statePdfUrl) : '');
  const [partType, setPartType] = useState(statePart || null);
  const [loading, setLoading] = useState(!statePdfUrl);

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

        <div className="bg-white rounded-xl shadow-md h-[90vh] p-4 mt-4">
          {pdfUrl ? (
            <iframe src={pdfUrl} title="Speaking PDF" className="w-full h-full border rounded" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">No PDF available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingLayout;
