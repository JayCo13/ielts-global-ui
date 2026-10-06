import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Trash2, ImagePlus, FileText, CheckCircle2, ChevronRight, X } from 'lucide-react';
import Navbar from './Navbar';
import API_BASE from '../config/api';

// Uploaded images come back as absolute R2 URLs; a relative /static path is only
// the backend's fallback when R2 is unavailable.
const absUrl = (u) => (u && u.startsWith('/') ? `${API_BASE}${u}` : u);

// Student "Custom Tasks" (ported from VN "Bài tự thêm"): add your own Writing prompt +
// essay, then grade it on the Writing Review page. Auto-deleted after 24 hours.
export default function WritingCustom() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [part, setPart] = useState(1);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/student/writing/custom`, { headers: authHeaders });
      if (r.ok) setItems(await r.json());
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchList();
  }, [token, navigate, fetchList]);

  const resetForm = () => {
    setPart(1); setTitle(''); setInstructions(''); setImageUrl(''); setImagePreview(''); setAnswer('');
  };

  const uploadImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await fetch(`${API_BASE}/student/writing/custom/upload-image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.detail || 'Image upload failed'); return; }
      setImageUrl(data.image_url);
      setImagePreview(absUrl(data.image_url));
      toast.success('Image uploaded');
    } catch (e) { toast.error('Error while uploading the image'); } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!title.trim()) { toast.error('Please enter the task prompt.'); return; }
    if (part === 1 && !imageUrl) { toast.error('Part 1 requires an image of the task.'); return; }
    if (!answer.trim()) { toast.error('Please enter your essay.'); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/student/writing/custom`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ part_number: part, title: title.trim(), instructions, image_url: imageUrl || null, answer_text: answer }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.detail || 'Could not create the task'); return; }
      toast.success('Task created — opening the evaluation page');
      navigate('/writing_review', { state: { testId: data.test_id, isForecast: false } });
    } catch (e) { toast.error('Error while creating the task'); } finally { setSubmitting(false); }
  };

  const remove = async (testId) => {
    if (!window.confirm('Delete this custom task?')) return;
    try {
      const r = await fetch(`${API_BASE}/student/writing/custom/${testId}`, { method: 'DELETE', headers: authHeaders });
      if (r.ok) { setItems((s) => s.filter((i) => i.test_id !== testId)); toast.success('Deleted'); }
      else toast.error('Delete failed');
    } catch (e) { toast.error('Error while deleting'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[#2b5356]">Custom Writing Tasks</h1>
            <p className="text-sm text-gray-500">Add your own Writing prompt and let the AI grade your essay.</p>
            <p className="text-xs text-amber-600 mt-0.5">Custom tasks are <b>deleted automatically after 24 hours</b>. Download the PDF or Word file from the Export tab of the evaluation page to keep a copy.</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0096b1] text-white hover:bg-[#007a90]">
            <Plus className="w-4 h-4" /> New task
          </button>
        </div>

        {/* List */}
        {loading ? <div className="text-center text-gray-400 py-16">Loading...</div>
          : items.length === 0 ? (
          <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-200/70">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No custom tasks yet. Click <b>"New task"</b> to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((it) => (
              <div key={it.test_id} className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#0096b1]/10 text-[#0096b1] mb-1">Task {it.part_number}</span>
                    <h3 className="font-bold text-gray-800">{it.title}</h3>
                  </div>
                  <button onClick={() => remove(it.test_id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="mt-2 text-sm">
                  {it.is_ai_evaluated
                    ? <span className="inline-flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="w-4 h-4" /> Graded · Band {it.score}</span>
                    : <span className="text-gray-400">Not graded</span>}
                </div>
                <button onClick={() => navigate('/writing_review', { state: { testId: it.test_id, isForecast: false } })}
                  className="mt-3 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-800 text-white hover:bg-gray-700">
                  {it.is_ai_evaluated ? 'View evaluation' : 'Evaluate'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#2b5356]">New Writing task</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            {/* Part */}
            <label className="block text-sm font-semibold text-gray-700 mb-1">Choose a part <span className="text-red-500">*</span></label>
            <div className="flex gap-2 mb-4">
              {[1, 2].map((p) => (
                <button key={p} onClick={() => setPart(p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${part === p ? 'border-[#0096b1] bg-[#0096b1]/10 text-[#0096b1]' : 'border-gray-200 text-gray-500'}`}>
                  Part {p} {p === 1 ? '(with a task image)' : '(no image)'}
                </button>
              ))}
            </div>

            {/* Title = the prompt */}
            <label className="block text-sm font-semibold text-gray-700 mb-1">Task prompt <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={part === 1 ? 'e.g. The charts below show the percentage of...' : 'Paste the Task 2 prompt here (e.g. Some people think that...)'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" />

            {/* Optional extra description */}
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Extra description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2}
              placeholder="Notes / extra description if needed..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" />

            {/* Image (Part 1 only) */}
            {part === 1 && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Task image <span className="text-red-500">*</span></label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="preview" className="max-h-48 rounded-lg border border-gray-200" />
                    <button onClick={() => { setImageUrl(''); setImagePreview(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-lg py-8 cursor-pointer hover:border-[#0096b1]">
                    <ImagePlus className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload an image (chart, table, map...)'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            )}

            {/* Answer */}
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your essay <span className="text-red-500">*</span></label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={8}
              placeholder="Type or paste your essay here..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-1" />
            <div className="text-xs text-gray-400 mb-4">{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
              <button onClick={submit} disabled={submitting || uploading}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#0096b1] text-white hover:bg-[#007a90] disabled:opacity-60">
                {submitting ? 'Creating...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
