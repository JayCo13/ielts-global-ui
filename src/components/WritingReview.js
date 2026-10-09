import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import {
  Sparkles, SpellCheck, Save, Plus, BookOpen, Lock, ChevronRight, ChevronDown,
  FileDown, MessageSquare, X, Trophy, Flag, ArrowUpCircle, GripHorizontal,
  Target, Link2, Type, MoreHorizontal,
} from 'lucide-react';
import CustomRichTextEditor from './CustomRichTextEditor';
import Leaderboard from './Leaderboard';
import ErrorReportModal from './ErrorReportModal';
import { TranslatorDialog } from '../translator';
import API_BASE from '../config/api';

const TARGET_BANDS = ['', '4.0-5.0', '5.5-6.0', '6.5-7.5', '8.0-9.0'];

// Render AI answers with light markdown: **bold**, "- " bullets, paragraphs.
const formatAiAnswer = (t) => {
  const esc = (s) => (s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const h = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const lines = h.split('\n');
  const out = []; let inList = false;
  for (const ln of lines) {
    const m = ln.match(/^\s*[-•]\s+(.*)/);
    if (m) { if (!inList) { out.push('<ul class="list-disc pl-5 space-y-0.5 my-1">'); inList = true; } out.push(`<li>${m[1]}</li>`); }
    else { if (inList) { out.push('</ul>'); inList = false; } if (ln.trim()) out.push(`<p class="mb-1">${ln}</p>`); }
  }
  if (inList) out.push('</ul>');
  return out.join('');
};

// Criterion display order + labels (Task 1 uses "Task Achievement").
const critMeta = (part) => ([
  { key: 'task_response', label: part === 1 ? 'Task Achievement' : 'Task Response' },
  { key: 'coherence_cohesion', label: 'Coherence & Cohesion' },
  { key: 'lexical_resource', label: 'Lexical Resource' },
  { key: 'grammatical_range', label: 'Grammatical Range & Accuracy' },
]);

const critShort = (part) => ([
  { key: 'task_response', code: part === 1 ? 'TA' : 'TR', name: part === 1 ? 'Task Achievement' : 'Task Response', Icon: Target },
  { key: 'coherence_cohesion', code: 'CC', name: 'Coherence & Cohesion', Icon: Link2 },
  { key: 'lexical_resource', code: 'LR', name: 'Lexical Resource', Icon: BookOpen },
  { key: 'grammatical_range', code: 'GRA', name: 'Grammatical Range & Accuracy', Icon: Type },
]);

// Short description per fixed sub-criterion (shown next to each score).
const SUBCRIT_DESC = {
  'Relevance to Prompt': 'Answers the prompt accurately and relevantly',
  'Overview Quality': 'Quality of the overview paragraph',
  'Selection of Key Features': 'Selects the most important features',
  'Data Accuracy': 'Accuracy of figures and information',
  'Coverage of Key Features': 'Covers all key features',
  'Development of Details': 'Develops and compares details',
  'Appropriate Format': 'Correct layout / format',
  'Appropriate Word Count': 'Meets the minimum word count',
  'Addressing All Parts of the Task': 'Addresses every part of the task',
  'Position Quality': 'Clear, consistent position',
  'Development of Ideas': 'Ideas developed with reasoning',
  'Support with Examples': 'Supported with examples / evidence',
  'Idea Relevance': 'Ideas directly relevant to the question',
  'Appropriate Essay Structure': 'Logical essay structure',
  'Logical Organization': 'Ideas organised logically',
  'Clear Progression of Ideas': 'Ideas progress smoothly',
  'Paragraphing': 'Sensible paragraphing',
  'Cohesive Devices Usage': 'Accurate, varied linking words',
  'Vocabulary Range': 'Wide, flexible vocabulary',
  'Lexical Accuracy': 'Accurate word choice',
  'Collocation Usage': 'Natural collocations',
  'Topic-specific Vocabulary': 'Topic-specific vocabulary',
  'Word Choice Precision': 'Precise, nuanced word choice',
  'Spelling & Word Formation': 'Correct spelling and word forms',
  'Sentence Structure Variety': 'Varied sentence structures',
  'Complex Sentence Usage': 'Natural, accurate complex sentences',
  'Grammar Accuracy': 'Grammatical accuracy',
  'Verb Tense Consistency': 'Consistent, appropriate tenses',
  'Article & Preposition Accuracy': 'Accurate articles and prepositions',
  'Punctuation Usage': 'Correct punctuation',
};

// Band → colour (red < 5, amber 5–6.5, green ≥ 6.5) for the gauge + bars.
const bandHex = (s) => { const n = Number(s) || 0; return n >= 6.5 ? '#16a34a' : n >= 5 ? '#d97706' : '#dc2626'; };

const ScoreRing = ({ value, size = 104 }) => {
  const v = Number(value) || 0;
  const stroke = Math.max(5, Math.round(size * 0.09)), r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, v / 9)), col = bandHex(v);
  return (
    <svg width={size} height={size} className="mx-auto block">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f5" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central" fontSize={Math.round(size * 0.3)} fontWeight="800" fill={col}>{value}</text>
      <text x="50%" y="70%" textAnchor="middle" dominantBaseline="central" fontSize={Math.max(7, Math.round(size * 0.12))} fontWeight="700" letterSpacing="0.5" fill="#9ca3af">BAND</text>
    </svg>
  );
};

const wordCount = (html) => {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
};

// Seconds → "M:SS" for "Time taken".
const fmtDur = (s) => {
  if (s == null) return null;
  const m = Math.floor(s / 60), ss = s % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
};

// Plain text of the essay (keeps line breaks) for the inline spell-check view.
const plainEssayText = (html) => (html || '')
  .replace(/<\/(p|div)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const processInstructions = (html) => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('/')) img.setAttribute('src', `${API_BASE}${src}`);
    });
    return doc.body.innerHTML;
  } catch (e) {
    return html;
  }
};

export default function WritingReview() {
  const location = useLocation();
  const navigate = useNavigate();
  // Resolve nav from router state, falling back to the writing room's persisted
  // sessionStorage (survives re-render / state loss so we don't bounce to the list).
  const nav = useMemo(() => {
    if (location.state && location.state.testId) return location.state;
    try {
      const saved = JSON.parse(sessionStorage.getItem('writing_room_nav') || '{}');
      if (saved && saved.testId) return saved;
    } catch (e) { /* ignore */ }
    return location.state || {};
  }, [location.state]);
  const { testId, isForecast, partNumber, attemptNumber } = nav;

  const [parts, setParts] = useState([]);
  const [active, setActive] = useState(0);           // index into parts
  const [tab, setTab] = useState('work');            // work | feedback | samples
  const [loading, setLoading] = useState(true);
  const [essays, setEssays] = useState({});          // task_id -> html
  const [savedEssays, setSavedEssays] = useState({}); // task_id -> last-saved html (dirty check)
  const [results, setResults] = useState({});        // task_id -> { result, detailed, gradedText }
  const [targetBand, setTargetBand] = useState('');
  const [thinkLonger, setThinkLonger] = useState(false);
  const [grading, setGrading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quota, setQuota] = useState(null);
  const [openCrit, setOpenCrit] = useState({ task_response: true }); // TR expanded by default
  const [vocabMenu, setVocabMenu] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [dict, setDict] = useState({ open: false, text: '', pos: { x: 0, y: 0 } });
  const [gen, setGen] = useState({});        // task_id -> { outline, sampleTarget, sampleTop, keylang }
  const [genLoading, setGenLoading] = useState('');  // '<taskId>:<kind>' while loading
  const [spell, setSpell] = useState({});    // task_id -> { errors:[{original,suggestion,explain,_show}] }
  const [spellLoading, setSpellLoading] = useState(false);
  const [spellPopover, setSpellPopover] = useState(null); // { idx, x, y }
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [optMenuOpen, setOptMenuOpen] = useState(false);   // "Options" dropdown (New Words / Leaderboard / Report)
  const [newWordsConfirm, setNewWordsConfirm] = useState(false);
  const [spellH, setSpellH] = useState(120);   // resizable Check-Spelling panel height (px)
  // Writing Assistant (W2) — right-side panel, NOT a tab.
  const [assistPanelOpen, setAssistPanelOpen] = useState(false);
  const [assistPanelTab, setAssistPanelTab] = useState('check'); // check | ask
  const [assistPos, setAssistPos] = useState({ x: 0, y: 0 });
  const assistInited = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [reportOpen, setReportOpen] = useState(false);   // shared ErrorReportModal (skill 'writing')
  const [assistSel, setAssistSel] = useState('');
  const [assistErrors, setAssistErrors] = useState(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistRemaining, setAssistRemaining] = useState(null);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [locked, setLocked] = useState(false);   // current essay finalized into history
  const [endConfirm, setEndConfirm] = useState(false);
  const [endSending, setEndSending] = useState(false);
  const readOnly = attemptNumber != null || locked;   // read-only: past attempt OR locked

  const token = localStorage.getItem('token');
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  const fetchQuota = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/ai/writing/quota`, { headers: authHeaders });
      if (r.ok) setQuota(await r.json());
    } catch (e) { /* ignore */ }
  }, [authHeaders]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (!testId) { navigate('/writing_list'); return; }
    (async () => {
      try {
        // Read-only past attempt: load the snapshot (essay + stored grade) directly.
        if (attemptNumber != null) {
          const ar = await fetch(`${API_BASE}/student/writing/test/${testId}/attempt/${attemptNumber}/answers`, { headers: authHeaders });
          if (!ar.ok) throw new Error();
          const ad = await ar.json();
          const aps = ad.parts || [];
          setParts(aps);
          const ae = {}, ase = {}, ares = {}, agen = {};
          aps.forEach((p) => {
            ae[p.task_id] = p.answer?.answer_text || '';
            ase[p.task_id] = ae[p.task_id];
            if (p.result) ares[p.task_id] = { result: p.result, detailed: !!(p.result._detailed), gradedText: ae[p.task_id] };
            if (p.generated) agen[p.task_id] = p.generated;
          });
          setEssays(ae); setSavedEssays(ase); setResults(ares); setGen(agen);
          setLoading(false);
          fetchQuota();
          return;
        }
        const r = await fetch(`${API_BASE}/student/writing/test/${testId}/answers`, { headers: authHeaders });
        if (!r.ok) throw new Error();
        const data = await r.json();
        let ps = data.parts || [];
        // Forecast: only show the single part the user did (Full Test shows both).
        if (isForecast) {
          if (partNumber) ps = ps.filter((p) => p.part_number === partNumber);
          else { const answered = ps.filter((p) => (p.answer?.answer_text || '').trim()); if (answered.length) ps = answered; }
          if (ps.length === 0) ps = data.parts || [];
        }
        setParts(ps);
        const e = {}, se = {};
        ps.forEach((p) => { e[p.task_id] = p.answer?.answer_text || ''; se[p.task_id] = p.answer?.answer_text || ''; });
        setEssays(e); setSavedEssays(se);
        setLocked(ps.some((p) => p.answer?.locked));
        // Prefill any stored AI results + persisted generations.
        const res = {}, genSeed = {};
        await Promise.all(ps.map(async (p) => {
          try {
            const rr = await fetch(`${API_BASE}/ai/writing/result/${p.task_id}`, { headers: authHeaders });
            if (rr.ok) {
              const j = await rr.json();
              if (j.evaluated && j.result) res[p.task_id] = { result: j.result, detailed: !!(j.result._detailed), gradedText: e[p.task_id] };
              if (j.generated) genSeed[p.task_id] = j.generated;
            }
          } catch (e2) { /* ignore */ }
        }));
        setResults(res);
        setGen(genSeed);
      } catch (e) {
        toast.error('Could not load your essay');
      } finally { setLoading(false); }
    })();
    fetchQuota();
  }, [testId, token, authHeaders, navigate, fetchQuota]);

  const part = parts[active];
  const taskId = part?.task_id;
  const essay = taskId != null ? (essays[taskId] || '') : '';
  const dirty = taskId != null && essays[taskId] !== savedEssays[taskId];
  const result = taskId != null ? results[taskId] : null;

  const saveEssay = async () => {
    if (taskId == null) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/student/writing/tasks/${taskId}/save-draft`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ answer_text: essay }),
      });
      if (r.ok) { setSavedEssays((s) => ({ ...s, [taskId]: essay })); toast.success('Essay saved'); }
      else { const d = await r.json().catch(() => ({})); toast.error(d.detail || 'Save failed'); }
    } catch (e) { toast.error('Error while saving'); } finally { setSaving(false); }
  };

  const grade = async () => {
    if (taskId == null) return;
    if (dirty) { toast('Please save your essay before grading.', { icon: '💾' }); return; }
    // Re-eval rules: cannot re-evaluate unless the essay was edited since the last
    // grade; then confirm (only 1 re-eval per attempt).
    if (result) {
      if (essay === result.gradedText) { toast('Edit your essay before re-evaluating it.', { icon: '✏️' }); return; }
      if (!window.confirm('Re-evaluating uses another AI evaluation. Do you want to continue?')) return;
    }
    setGrading(true);
    try {
      const qs = new URLSearchParams();
      if (targetBand) qs.set('target_band', targetBand);
      if (thinkLonger) qs.set('think_longer', 'true');
      const r = await fetch(`${API_BASE}/ai/writing/grade/${taskId}?${qs.toString()}`, { method: 'POST', headers: authHeaders });
      const data = await r.json();
      if (!r.ok) { toast.error(data.detail || 'Grading failed'); return; }
      setResults((s) => ({ ...s, [taskId]: { result: data.result, detailed: data.detailed, gradedText: essay } }));
      setOpenCrit({ task_response: true });
      setTab('feedback');
      if (data.quota) setQuota((q) => ({ ...(q || {}), remaining: data.quota.remaining, limit: data.quota.limit, is_vip: data.quota.is_vip }));
      toast.success('Grading complete!');
    } catch (e) { toast.error('Error while grading'); } finally { setGrading(false); }
  };

  // On-demand VIP generators (outline / sample / key language). Each is 1 AI use.
  const runGen = async (kind, url, storeKey) => {
    if (taskId == null) return;
    setGenLoading(`${taskId}:${storeKey}`);
    try {
      const res = await fetch(url, { method: 'POST', headers: authHeaders });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || 'Could not generate'); return; }
      setGen((g) => ({ ...g, [taskId]: { ...(g[taskId] || {}), [storeKey]: data } }));
      fetchQuota();
    } catch (e) { toast.error('Error while generating content'); } finally { setGenLoading(''); }
  };
  const genBusy = (storeKey) => genLoading === `${taskId}:${storeKey}`;
  const genData = (storeKey) => (taskId != null ? (gen[taskId] || {})[storeKey] : null);

  // Spelling & grammar check (1 AI use).
  const runSpellcheck = async () => {
    if (taskId == null) return;
    if (dirty) { toast('Please save your essay before checking.', { icon: '💾' }); return; }
    setSpellLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/writing/spellcheck/${taskId}`, { method: 'POST', headers: authHeaders });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || 'Check failed'); return; }
      setSpell((s) => ({ ...s, [taskId]: { errors: (data.errors || []).map((e) => ({ ...e, _show: false })) } }));
      if (data.quota) setQuota((q) => ({ ...(q || {}), remaining: data.quota.remaining, limit: data.quota.limit }));
      if (!data.errors || data.errors.length === 0) toast.success('No spelling or grammar errors found!');
      fetchQuota();
    } catch (e) { toast.error('Error while checking'); } finally { setSpellLoading(false); }
  };
  const applyFix = (idx) => {
    const errs = (spell[taskId]?.errors) || [];
    const er = errs[idx];
    if (!er || taskId == null) return;
    const cur = essays[taskId] || '';
    if (!cur.includes(er.original)) { toast.error('Could not find that text in your essay (it may already be fixed).'); return; }
    setEssays((s) => ({ ...s, [taskId]: cur.replace(er.original, er.suggestion) }));
    setSpell((s) => ({ ...s, [taskId]: { errors: errs.filter((_, i) => i !== idx) } }));
    toast.success('Applied — remember to save your essay.');
  };
  const ignoreFix = (idx) => {
    const errs = (spell[taskId]?.errors) || [];
    setSpell((s) => ({ ...s, [taskId]: { errors: errs.filter((_, i) => i !== idx) } }));
  };
  const toggleExplain = (idx) => {
    const errs = (spell[taskId]?.errors) || [];
    setSpell((s) => ({ ...s, [taskId]: { errors: errs.map((e, i) => i === idx ? { ...e, _show: !e._show } : e) } }));
  };
  const spellErrors = taskId != null ? (spell[taskId]?.errors || null) : null;

  // Inline spell-check view: essay text with wrong spans struck red + suggestion
  // underlined green, each clickable to open the Apply/Explain/Ignore popover.
  const renderMarkedEssay = () => {
    const text = plainEssayText(essay);
    const errs = spellErrors || [];
    if (!errs.length) return null;
    const marks = []; let searchFrom = 0;
    errs.forEach((er, idx) => {
      if (!er.original) return;
      const at = text.indexOf(er.original, searchFrom);
      if (at === -1) return;
      marks.push({ start: at, end: at + er.original.length, idx });
      searchFrom = at + er.original.length;
    });
    marks.sort((a, b) => a.start - b.start);
    const nodes = []; let cursor = 0, key = 0;
    marks.forEach((m) => {
      if (m.start > cursor) nodes.push(<span key={key++}>{text.slice(cursor, m.start)}</span>);
      const er = errs[m.idx];
      nodes.push(
        <span key={key++} className="cursor-pointer rounded px-0.5 hover:bg-yellow-50"
          onClick={(e) => setSpellPopover({ idx: m.idx, x: e.clientX, y: e.clientY })}>
          <del className="text-red-600" style={{ textDecorationColor: '#ef4444' }}>{er.original}</del>
          <ins className="text-green-600 mx-0.5" style={{ textDecoration: 'underline', textDecorationColor: '#16a34a' }}>{er.suggestion}</ins>
        </span>
      );
      cursor = m.end;
    });
    if (cursor < text.length) nodes.push(<span key={key++}>{text.slice(cursor)}</span>);
    return nodes;
  };

  // Export the evaluation (prompt + essay + result + generated content) to PDF/Word.
  const buildReportHtml = () => {
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    // Task 1 prompts carry the chart/map as an <img>; stripping tags to plain text
    // dropped it, so the exported file showed a question you couldn't actually answer.
    // Keep the markup (with absolute image URLs) and only fall back to text if empty.
    const promptHtml = processInstructions(part?.instructions || '');
    const promptText = (part?.instructions || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    const essayText = plainEssayText(essay).trim();
    let h = `<h1>Writing Evaluation — Task ${part?.part_number || ''}</h1>`;
    h += `<h3>Task prompt</h3>`;
    h += promptHtml
      ? `<div style="max-width:100%">${promptHtml}</div>`
      : `<p>${esc(promptText)}</p>`;
    h += `<h3>Your essay</h3><p style="white-space:pre-wrap">${esc(essayText)}</p>`;
    const r = result?.result, detailed = result?.detailed;
    if (r) {
      // ── FEEDBACK (above the Analysis) ──
      h += `<h2>Feedback — Overall Band: ${esc(r.overall_band)} (+/- 0.5)</h2>`;
      if (r.summary) h += `<p><i>${esc(r.summary)}</i></p>`;
      // Priority focus
      if (detailed && Array.isArray(r.priority_focus) && r.priority_focus.length) {
        const lvLabel = (lv) => { const l = (lv || '').toLowerCase(); return l === 'high' ? 'High priority' : l === 'medium' ? 'Medium priority' : 'Refinement'; };
        h += `<h3>Priority focus</h3><ul>${r.priority_focus.map((p) => `<li><b>${esc(p.label)}</b> (${esc(lvLabel(p.level))})${p.note ? ` — ${esc(p.note)}` : ''}</li>`).join('')}</ul>`;
      }
      // Each criterion → each sub-criterion (Explanation / Example from your essay / Strategic advice)
      meta.forEach(({ key, label }) => {
        const c = (r.criteria || {})[key] || {};
        h += `<h3>${esc(label)} — ${esc(c.score)}</h3>`;
        if (detailed && c.comment) h += `<p>${esc(c.comment)}</p>`;
        const subs = Array.isArray(c.subscores) ? c.subscores : [];
        if (subs.length) {
          h += `<ul>${subs.map((s) => {
            const explanation = s.explanation || s.why;   // backward-compat
            let li = `<li><b>${esc(s.name)}: ${esc(s.score)}</b>`;
            if (detailed) {
              if (explanation) li += `<br/><b>Explanation:</b> ${esc(explanation)}`;
              if (s.example) li += `<br/><b>Example from your essay:</b> <i>"${esc(s.example)}"</i>`;
              if (s.strategic_advice) li += `<br/><b>Strategic advice:</b> ${esc(s.strategic_advice)}`;
            }
            return li + `</li>`;
          }).join('')}</ul>`;
        }
        if (detailed && Array.isArray(c.details) && c.details.length) h += `<ul>${c.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`;
        const errs = detailed ? ((r.errors || {})[key] || []) : [];
        if (errs.length) h += `<ul>${errs.map((e) => `<li><s>${esc(e.error)}</s> → <b>${esc(e.fix)}</b>${e.explain ? ` — ${esc(e.explain)}` : ''}</li>`).join('')}</ul>`;
      });
    }
    const g = (taskId != null && gen[taskId]) || {};
    // ── DETAILED ANALYSIS (below the Feedback), only if it was generated. ──
    const a = g.analysis?.analysis;
    if (a) {
      h += `<h2>Detailed analysis</h2>`;
      const critList = [['TR', part?.part_number === 1 ? 'Task Achievement' : 'Task Response'], ['CC', 'Coherence & Cohesion'], ['LR', 'Lexical Resource'], ['GR', 'Grammatical Range & Accuracy']];
      if (Array.isArray(a.paragraphs) && a.paragraphs.length) {
        h += `<h3>1. Paragraph-by-paragraph analysis</h3>`;
        a.paragraphs.forEach((p, pi) => {
          h += `<h4>Paragraph ${pi + 1}</h4>`;
          if (p.original) h += `<p style="white-space:pre-wrap"><i>${esc(p.original)}</i></p>`;
          critList.forEach(([code, name]) => {
            const issues = Array.isArray(((p.criteria || {})[code] || {}).issues) ? p.criteria[code].issues : [];
            h += `<p><b>${esc(code)}</b> — ${esc(name)}</p>`;
            if (!issues.length) { h += `<p>No significant issue found for this criterion.</p>`; return; }
            h += `<ul>${issues.map((is) => {
              let li = `<li><b>Issue:</b> ${esc(is.problem)}`;
              if (is.evidence) li += `<br/>Evidence: <i>"${esc(is.evidence)}"</i>`;
              if (is.explanation) li += `<br/>${esc(is.explanation)}`;
              if (is.fix) li += `<br/><b>Improvement:</b> ${esc(is.fix)}`;
              return li + `</li>`;
            }).join('')}</ul>`;
          });
          if (p.rewrite) h += `<p><b>Rewritten paragraph:</b></p><p style="white-space:pre-wrap">${esc(p.rewrite)}</p>`;
        });
      }
      if (a.revised_essay) h += `<h3>Complete revised essay</h3><p style="white-space:pre-wrap">${esc(a.revised_essay)}</p>`;
      if (a.target_band_essay) h += `<h3>Essay adjusted to Target Band${targetBand ? ` ${esc(targetBand)}` : ''}</h3><p style="white-space:pre-wrap">${esc(a.target_band_essay)}</p>`;
      if (a.key_language) {
        h += `<h3>Key Language</h3>`;
        [['word_choice', 'Word Choice'], ['sentence_structures', 'Sentence Structures'], ['cohesion_linking', 'Cohesion & Linking']].forEach(([k, lb]) => {
          const items = a.key_language[k] || [];
          if (items.length) h += `<p><b>${lb}:</b></p><ul>${items.map((it) => `<li><b>${esc(it.term)}</b>${it.note ? ` — ${esc(it.note)}` : ''}</li>`).join('')}</ul>`;
        });
      }
    }
    if (g.outline?.outline?.sections) {
      h += `<h3>Suggested outline</h3><ul>${g.outline.outline.sections.map((s) => `<li><b>${esc(s.name)}:</b> ${esc(s.idea)}</li>`).join('')}</ul>`;
    }
    if (g.sampleTarget?.sample?.essay) h += `<h3>Model essay (Target Band)</h3><p style="white-space:pre-wrap">${esc(g.sampleTarget.sample.essay)}</p>`;
    if (g.sampleTop?.sample?.essay_html) h += `<h3>Band 8-9 model essay</h3><div>${g.sampleTop.sample.essay_html}</div>`;
    if (g.keylang?.keylang) {
      const kl = g.keylang.keylang;
      h += `<h3>Key Language</h3>`;
      [['vocabulary', 'Vocabulary'], ['collocations', 'Collocations'], ['patterns', 'Sentence patterns']].forEach(([k, lb]) => {
        if ((kl[k] || []).length) h += `<p><b>${lb}:</b></p><ul>${kl[k].map((it) => `<li><b>${esc(it.term)}</b>${it.note ? ` — ${esc(it.note)}` : ''}</li>`).join('')}</ul>`;
      });
    }
    return h;
  };
  const exportWord = () => {
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${buildReportHtml()}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Writing_Task${part?.part_number || ''}_evaluation.doc`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('Your browser blocked the print window. Please allow pop-ups.'); return; }
    w.document.write(`<html><head><meta charset='utf-8'><title>Writing Evaluation</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:24px auto;padding:0 16px;line-height:1.5}h1{font-size:20px}h2{font-size:17px}h3{font-size:15px}s{color:#c00}b{color:#0a0}img{max-width:100%;height:auto}table{border-collapse:collapse}table td,table th{border:1px solid #999;padding:4px}</style></head><body>${buildReportHtml()}</body></html>`);
    w.document.close();

    // The Task 1 chart is a remote <img>; printing on a fixed timer would fire before
    // it downloads and leave a blank box in the PDF. Wait for the images, but cap the
    // wait so a broken URL can't block the export.
    const images = Array.from(w.document.images || []);
    const settled = images.map((img) => (
      img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; })
    ));
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      w.focus();
      w.print();
    };
    Promise.all(settled).then(() => setTimeout(doPrint, 150));
    setTimeout(doPrint, 5000);
  };

  // Writing Assistant: capture a selection inside the essay editor.
  const onEditorMouseUp = () => {
    setTimeout(() => {
      const text = (window.getSelection()?.toString() || '').trim();
      if (text && text.length >= 2) { setAssistSel(text); setAssistErrors(null); }
    }, 10);
  };
  const runAssistCheck = async () => {
    if (!assistSel) return;
    setAssistLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/writing/assist/check`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ text: assistSel, part_number: part?.part_number || 2 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || 'Check failed'); return; }
      setAssistErrors((data.errors || []).map((e) => ({ ...e, _show: false })));
      if (data.assist_remaining !== undefined) setAssistRemaining(data.assist_remaining);
    } catch (e) { toast.error('Error while checking'); } finally { setAssistLoading(false); }
  };
  const applyAssist = (idx, useHigh = false) => {
    const er = (assistErrors || [])[idx];
    if (!er || taskId == null) return;
    const replacement = useHigh ? (er.high_band || er.suggestion) : er.suggestion;
    const cur = essays[taskId] || '';
    if (!cur.includes(er.error)) { toast.error('Could not find that text in your essay (it may already be fixed).'); return; }
    setEssays((s) => ({ ...s, [taskId]: cur.replace(er.error, replacement) }));
    setAssistErrors((es) => es.filter((_, i) => i !== idx));
    toast.success('Applied — remember to save your essay.');
  };
  const askAI = async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatInput(''); setChatLoading(true);
    setChat((c) => [...c, { role: 'user', text: q }]);
    try {
      const res = await fetch(`${API_BASE}/ai/writing/assist/ask`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ question: q, context: assistSel, task_id: taskId }),
      });
      const data = await res.json();
      if (!res.ok) { setChat((c) => [...c, { role: 'ai', text: data.detail || 'Error' }]); return; }
      setChat((c) => [...c, { role: 'ai', text: data.answer || '' }]);
      if (data.assist_remaining !== undefined) setAssistRemaining(data.assist_remaining);
    } catch (e) { setChat((c) => [...c, { role: 'ai', text: 'Error while asking the AI' }]); } finally { setChatLoading(false); }
  };

  // Word-click dictionary on the prompt / essay.
  const handleWordSelect = () => {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = (sel?.toString() || '').trim();
      if (text && text.length < 50 && !text.includes(' ')) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        setVocabMenu({ visible: true, x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY + 5, text });
      }
    }, 10);
  };
  const saveVocab = async () => {
    if (!vocabMenu.text) return;
    try {
      const r = await fetch(`${API_BASE}/student/vocabulary`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ word: vocabMenu.text, source_type: 'writing', source_exam_id: testId ? parseInt(testId, 10) : null, source_exam_title: 'Writing Test' }),
      });
      if (r.ok) toast.success(`"${vocabMenu.text}" added to New Words!`);
    } catch (e) { /* ignore */ }
    setVocabMenu({ visible: false, x: 0, y: 0, text: '' });
  };

  const leaveReview = () => navigate(isForecast ? '/writing_forecast' : '/writing_list');
  const exitReview = () => {
    if (readOnly) { leaveReview(); return; }   // read-only view → just leave
    setEndConfirm(true);                        // live review → confirm first
  };
  const confirmEndReview = async () => {
    setEndSending(true);
    // Graded & not yet locked → save to history + lock.
    if (result && !locked) {
      try { await fetch(`${API_BASE}/student/writing/test/${testId}/finalize`, { method: 'POST', headers: authHeaders }); } catch (e) { /* ignore */ }
    }
    setEndSending(false);
    setEndConfirm(false);
    leaveReview();
  };

  const openAssistant = (t) => {
    setAssistPanelTab(t || assistPanelTab);
    if (!assistInited.current) {
      const w = 380;
      setAssistPos({ x: Math.max(8, window.innerWidth - w - 16), y: 96 });
      assistInited.current = true;
    }
    setAssistPanelOpen(true);
  };
  // Drag the top edge of the Check-Spelling panel to resize it.
  const startSpellResize = (e) => {
    e.preventDefault();
    const startY = e.clientY, startH = spellH;
    const move = (ev) => setSpellH(Math.min(560, Math.max(44, startH + (startY - ev.clientY))));
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const startAssistDrag = (e) => {
    if (e.button !== 0) return;
    dragOffset.current = { x: e.clientX - assistPos.x, y: e.clientY - assistPos.y };
    const move = (ev) => {
      const x = Math.min(Math.max(0, ev.clientX - dragOffset.current.x), window.innerWidth - 60);
      const y = Math.min(Math.max(0, ev.clientY - dragOffset.current.y), window.innerHeight - 60);
      setAssistPos({ x, y });
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (loading) return (<div className="min-h-screen bg-gray-50"><div className="text-center py-20 text-gray-500">Loading...</div></div>);

  const meta = critMeta(part?.part_number || 2);
  const r = result?.result;
  const detailed = result?.detailed;
  const toggleCrit = (key) => setOpenCrit((o) => ({ ...o, [key]: !o[key] }));
  // Detailed analysis + generators are VIP-only on the server (403 otherwise).
  const isVipAi = !!quota?.is_vip;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden" onMouseDown={(e) => { if (vocabMenu.visible && !e.target.closest?.('[data-vocabmenu]')) setVocabMenu((m) => ({ ...m, visible: false })); if (spellPopover && !e.target.closest?.('[data-spellpop]')) setSpellPopover(null); }}>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="shrink-0 px-3 md:px-4 py-2 flex items-center justify-between gap-2 flex-wrap border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate(isForecast ? '/writing_forecast' : '/writing_list')} className="text-sm text-gray-500 hover:text-[#0096b1] font-medium">← Back to list</button>
          <h1 className="text-base md:text-lg font-bold text-[#2b5356]">Writing Review & AI Evaluation</h1>
          {parts.length > 1 && (
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              {parts.map((p, i) => (
                <button key={p.task_id} onClick={() => setActive(i)}
                  className={`px-3 py-1 rounded-md text-sm font-semibold ${active === i ? 'bg-white text-[#0096b1] shadow-sm' : 'text-gray-500'}`}>Part {p.part_number}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {quota && (
            quota.is_vip
              ? <span className="text-sm text-gray-600">AI evaluations: <span className="font-bold text-[#0096b1]">Unlimited for normal use</span> <span className="text-gray-400">(VIP)</span></span>
              : <span className="text-sm text-gray-600 inline-flex items-center gap-2">AI evaluations left today: <span className="font-bold text-[#0096b1]">{quota.remaining}</span>/{quota.limit} <span className="text-gray-400">(free)</span>
                  <button onClick={() => navigate('/vip-packages')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#eb7e37] text-white hover:bg-[#d66e2a]">Upgrade to VIP</button>
                </span>
          )}
          <button onClick={() => openAssistant()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#eb7e37] text-white hover:bg-[#d66e2a]">
            <MessageSquare className="w-4 h-4" /> AI Assistant
          </button>
        </div>
      </div>

      {/* Dashboard — top row: band + 4 criteria; bottom row: AI grading controls */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-3 md:px-4 py-3">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2.5 shrink-0">
            <ScoreRing value={r ? r.overall_band : '–'} size={112} />
            <span className="text-sm text-gray-400 font-medium whitespace-nowrap">± 0.5</span>
          </div>
          {r ? (
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-[260px]">
              {critShort(part?.part_number || 2).map(({ key, code, Icon }) => {
                const c = (r.criteria || {})[key] || {}; const sc = Number(c.score) || 0; const col = bandHex(sc);
                return (
                  <div key={key} className="rounded-xl border border-gray-200/70 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0" style={{ background: `${col}1a` }}>
                          <Icon className="w-5 h-5" style={{ color: col }} />
                        </span>
                        <span className="text-base font-bold text-gray-500 tracking-wide">{code}</span>
                      </span>
                      <span className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: col }}>{c.score ?? '–'}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (sc / 9) * 100)}%`, background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 text-base text-gray-400 min-w-[220px]">Not graded yet — choose a target, then click <b>"Evaluate with AI"</b>.</div>
          )}
        </div>
        {readOnly ? (
          <div className="mt-3 inline-flex text-sm font-semibold text-[#eb7e37] bg-[#eb7e37]/10 px-3 py-2 rounded-lg">{attemptNumber != null ? `Viewing attempt #${attemptNumber} (read-only)` : 'Saved to your history — read-only'}</div>
        ) : (
          <div className="mt-3 flex items-center gap-3 flex-wrap justify-end">
            <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-1.5">Target:
              <select value={targetBand} onChange={(e) => setTargetBand(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold">
                {TARGET_BANDS.map((b) => <option key={b} value={b}>{b || 'Auto'}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-4 h-4" checked={thinkLonger} onChange={(e) => setThinkLonger(e.target.checked)} /> Think Longer</label>
            <button onClick={grade} disabled={grading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-bold bg-[#0096b1] text-white hover:bg-[#007a90] disabled:opacity-60 shadow-sm">
              <Sparkles className="w-5 h-5" /> {grading ? 'Grading...' : (result ? 'Re-evaluate' : 'Evaluate with AI')}
            </button>
          </div>
        )}
      </div>

      {/* Tab bar + grouped actions on the right (AI Assistant is a side panel, not a tab) */}
      <div className="shrink-0 px-3 md:px-4 pt-2 bg-gray-50">
        <div className="flex items-end justify-between gap-2 flex-wrap border-b border-gray-200">
          <div className="flex gap-1">
            {[['work', 'Task & Essay'], ['feedback', 'Feedback'], ['samples', 'Analysis'], ['export', 'Export PDF/Word']].map(([k, lb]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-5 py-2.5 text-base font-semibold rounded-t-lg -mb-px border-b-2 ${tab === k ? 'border-[#0096b1] text-[#0096b1] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{lb}</button>
            ))}
          </div>
          {/* New Words / Leaderboard / Report grouped under "Options"; End review stands alone. */}
          <div className="flex items-center gap-1.5 pb-1.5 flex-wrap">
            <div className="relative">
              <button onClick={() => setOptMenuOpen((o) => !o)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50">
                <MoreHorizontal className="w-4 h-4" /> Options
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${optMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {optMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOptMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
                    <button onClick={() => { setOptMenuOpen(false); setNewWordsConfirm(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><BookOpen className="w-4 h-4 text-gray-500" /> New Words</button>
                    {!isForecast && <button onClick={() => { setOptMenuOpen(false); setLeaderOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Trophy className="w-4 h-4 text-gray-500" /> Leaderboard</button>}
                    <button onClick={() => { setOptMenuOpen(false); setReportOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Flag className="w-4 h-4 text-gray-500" /> Report an error</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={exitReview} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#2b5356] text-white hover:bg-[#1e3c3e]"><X className="w-4 h-4" /> End review</button>
          </div>
        </div>
      </div>

      {/* Tab content (full width) */}
      <div className="flex-1 min-h-0 overflow-hidden p-3 md:p-4 pb-16">
        {/* TASK & ESSAY */}
        {tab === 'work' && (
          <div className="flex flex-col h-full gap-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
              <section className="bg-white rounded-2xl shadow-sm border border-gray-200/70 p-4 flex flex-col min-h-0">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2 shrink-0">Task prompt — Task {part?.part_number}</h2>
                <div className="max-w-none leading-relaxed text-base flex-1 min-h-0 overflow-y-auto [&_img]:max-w-full [&_img]:h-auto" onMouseUp={handleWordSelect}
                  dangerouslySetInnerHTML={{ __html: processInstructions(part?.instructions) }} />
              </section>
              <section className="bg-white rounded-2xl shadow-sm border border-gray-200/70 p-4 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 shrink-0 gap-2 flex-wrap">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Your essay</h2>
                  <span className="text-sm text-gray-500">
                    {wordCount(essay)} words{part?.word_limit ? ` / minimum ${part.word_limit}` : ''}
                    {part?.answer?.time_taken != null && <span className="ml-2 text-gray-400">· Time taken: <span className="font-semibold text-gray-600">{fmtDur(part.answer.time_taken)}</span></span>}
                  </span>
                </div>
                <div className="flex-1 min-h-[140px] border border-gray-200 rounded-lg overflow-y-auto text-base" onMouseUp={onEditorMouseUp}>
                  {readOnly
                    ? <div className="p-3 max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: essay }} />
                    : <CustomRichTextEditor value={essay} onChange={(v) => setEssays((s) => ({ ...s, [taskId]: v }))} textSize="regular" colorTheme="black-on-white" />}
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2 mt-2 shrink-0">
                    <button onClick={saveEssay} disabled={saving || !dirty}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ${dirty ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                      <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save essay'}
                    </button>
                    {dirty && <span className="text-sm text-amber-600">Unsaved changes</span>}
                    <span className="ml-auto text-sm text-gray-400">Highlight text → open the AI Assistant</span>
                  </div>
                )}
              </section>
            </div>
            {/* Check Spelling & Grammar — resizable bar (drag the top edge) */}
            {!readOnly && (
            <div className="shrink-0 bg-white rounded-2xl border border-gray-200/70 shadow-sm flex flex-col overflow-hidden" style={{ height: spellH }}>
              <div onMouseDown={startSpellResize} className="shrink-0 h-2 flex items-center justify-center cursor-row-resize hover:bg-gray-100 group" title="Drag to resize">
                <div className="w-10 h-1 rounded-full bg-gray-300 group-hover:bg-[#0096b1]" />
              </div>
              <div className="px-4 pb-3 pt-1 flex-1 min-h-0 overflow-y-auto">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <h3 className="text-base font-semibold text-gray-700">Check Spelling &amp; Grammar</h3>
                  <button onClick={runSpellcheck} disabled={spellLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-[#0096b1] text-[#0096b1] hover:bg-[#0096b1]/10 disabled:opacity-60">
                    <SpellCheck className="w-4 h-4" /> {spellLoading ? 'Checking...' : 'Check (uses 1 AI evaluation)'}
                  </button>
                </div>
                {spellErrors === null ? <p className="text-sm text-gray-400">Checks spelling &amp; grammar across the whole essay — errors are shown inline (red strike-through = wrong, green underline = suggestion). Click an error to Apply / Explain / Ignore, then save your essay. <b>Drag the top edge</b> to enlarge this panel.</p>
                  : spellErrors.length === 0 ? <p className="text-sm text-green-600">No spelling / grammar errors.</p> : (
                  <div className="text-base text-gray-800 leading-loose whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{renderMarkedEssay()}</div>
                )}
              </div>
            </div>
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {tab === 'feedback' && (
          <div className="h-full overflow-y-auto" onMouseUp={handleWordSelect}>
            {!r ? <div className="text-center text-gray-400 text-sm py-16">Click <b>"Evaluate with AI"</b> above to see detailed feedback.</div> : (
            <div className="max-w-5xl mx-auto space-y-4">
              {r.summary && <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-4 text-base text-gray-700 leading-relaxed">{r.summary}</div>}

              {/* OVERALL ASSESSMENT: general comment + sub-criteria scores */}
              <h3 className="text-base font-bold text-[#2b5356] mb-2">Overall assessment</h3>
              <div className="space-y-3">
                {meta.map(({ key, label }) => {
                  const c = (r.criteria || {})[key] || {};
                  const sc = Number(c.score) || 0, col = bandHex(sc);
                  const open = !!openCrit[key];
                  const Icon = critShort(part?.part_number || 2).find((x) => x.key === key)?.Icon || Target;
                  return (
                    <div key={key} className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
                      <button onClick={() => toggleCrit(key)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
                        <Icon className="w-5 h-5 shrink-0" style={{ color: col }} />
                        <span className="text-lg font-bold text-gray-800 flex-1">{label}</span>
                        <span className="text-lg font-extrabold px-3 py-1 rounded-lg tabular-nums" style={{ color: col, background: `${col}1a` }}>{c.score}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} />
                      </button>
                      <div className="px-5"><div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(sc / 9) * 100}%`, background: col }} /></div></div>
                      {open && (
                        <div className="px-5 py-4 space-y-4">
                          {/* General comment — shown to everyone */}
                          {c.comment && <p className="text-base text-gray-700 leading-relaxed"><span className="font-semibold text-gray-800">General comment: </span>{c.comment}</p>}
                          {/* Sub-scores with descriptions */}
                          {Array.isArray(c.subscores) && c.subscores.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {c.subscores.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 px-3 py-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-gray-700">{s.name}</div>
                                    {SUBCRIT_DESC[s.name] && <div className="text-xs text-gray-400">{SUBCRIT_DESC[s.name]}</div>}
                                  </div>
                                  <span className="text-lg font-extrabold tabular-nums shrink-0" style={{ color: bandHex(s.score) }}>{s.score}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DETAILED EXPLANATION: Score → Explanation → Example → Advice + Priority focus */}
              <div>
                <h3 className="text-base font-bold text-[#2b5356] mb-2 mt-2">Detailed explanation</h3>
                {!detailed ? (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" /> A detailed explanation of each criterion (Score → Explanation → Example → Advice) + priority focus is available to VIP accounts.
                    <button onClick={() => navigate('/vip-packages')} className="ml-auto inline-flex items-center gap-1 font-semibold text-[#0096b1] shrink-0">See VIP packages <ChevronRight className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Priority focus */}
                    {Array.isArray(r.priority_focus) && r.priority_focus.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-5">
                        <div className="text-base font-bold text-gray-800 mb-3">Priority focus</div>
                        <div className="space-y-2.5">
                          {r.priority_focus.map((p, i) => {
                            const lv = (p.level || '').toLowerCase();
                            const dot = lv === 'high' ? '#dc2626' : lv === 'medium' ? '#d97706' : '#16a34a';
                            const lab = lv === 'high' ? 'High priority' : lv === 'medium' ? 'Medium priority' : 'Refinement';
                            return (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-800">{p.label} <span className="text-xs font-normal" style={{ color: dot }}>· {lab}</span></div>
                                  {p.note && <div className="text-sm text-gray-600">{p.note}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Each criterion → each sub-criterion */}
                    {meta.map(({ key, label }) => {
                      const c = (r.criteria || {})[key] || {};
                      const subs = Array.isArray(c.subscores) ? c.subscores : [];
                      const Icon = critShort(part?.part_number || 2).find((x) => x.key === key)?.Icon || Target;
                      return (
                        <div key={key} className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="w-5 h-5 text-[#0096b1]" />
                            <span className="text-lg font-bold text-gray-800">{label}</span>
                          </div>
                          <div className="space-y-3">
                            {subs.map((s, i) => {
                              const col = bandHex(s.score);
                              const explanation = s.explanation || s.why;   // backward-compat
                              return (
                                <div key={i} className="rounded-xl border border-gray-100 p-3">
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div>
                                      <div className="font-semibold text-gray-800">{s.name}</div>
                                      {SUBCRIT_DESC[s.name] && <div className="text-xs text-gray-400">{SUBCRIT_DESC[s.name]}</div>}
                                    </div>
                                    <span className="text-lg font-extrabold tabular-nums shrink-0" style={{ color: col }}>{s.score}</span>
                                  </div>
                                  {explanation && <p className="text-sm text-gray-600 mb-1.5"><span className="font-semibold text-gray-700">Explanation: </span>{explanation}</p>}
                                  {s.example && <div className="text-sm bg-gray-50 rounded-lg p-2 mb-1.5 border-l-2 border-gray-300"><span className="text-xs font-semibold text-gray-500 uppercase">Example from your essay</span><div className="italic text-gray-700 mt-0.5">"{s.example}"</div></div>}
                                  {s.strategic_advice && <p className="text-sm text-[#0096b1]"><span className="font-semibold">Strategic advice: </span>{s.strategic_advice}</p>}
                                  {!explanation && !s.example && !s.strategic_advice && <p className="text-sm text-green-600">Good.</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
            )}
          </div>
        )}

        {/* DETAILED ANALYSIS (replaces the model essay) */}
        {tab === 'samples' && (
          <div className="h-full overflow-y-auto" onMouseUp={handleWordSelect}>
            {!isVipAi ? <div className="text-center text-amber-700 text-sm py-16">The detailed analysis is available to VIP accounts. <button onClick={() => navigate('/vip-packages')} className="font-semibold text-[#0096b1]">See VIP packages</button></div> : (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-gray-500">Paragraph-by-paragraph analysis (TR/CC/LR/GR), rewrites, the complete revised essay{targetBand ? ` + a Target Band ${targetBand} version` : ''} & Key Language. <span className="text-gray-400">(uses 1 AI evaluation)</span></p>
                <button onClick={() => runGen('analyze', `${API_BASE}/ai/writing/analyze/${taskId}${targetBand ? `?target_band=${targetBand}` : ''}`, 'analysis')} disabled={!!genLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0096b1] text-white hover:bg-[#007a90] disabled:opacity-60 shrink-0">
                  {genBusy('analysis') ? 'Analysing...' : (genData('analysis') ? 'Analyse again' : 'Detailed analysis')}
                </button>
              </div>
              {(() => {
                const a = genData('analysis')?.analysis;
                if (!a) return <div className="text-center text-gray-400 text-sm py-12">Click <b>"Detailed analysis"</b> to have the AI analyse each paragraph, rewrite it and extract Key Language.</div>;
                const critList = [['TR', part?.part_number === 1 ? 'Task Achievement' : 'Task Response'], ['CC', 'Coherence & Cohesion'], ['LR', 'Lexical Resource'], ['GR', 'Grammatical Range & Accuracy']];
                return (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-[#2b5356] mb-2">1. Paragraph-by-paragraph analysis</h3>
                      <div className="space-y-4">
                        {(a.paragraphs || []).map((p, pi) => (
                          <div key={pi} className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Paragraph {pi + 1}</div>
                            {p.original && <div className="text-sm text-gray-500 italic bg-gray-50 rounded-lg p-2 mb-3 whitespace-pre-wrap">{p.original}</div>}
                            <div className="space-y-2.5">
                              {critList.map(([code, name]) => {
                                const cc = (p.criteria || {})[code] || {};
                                const issues = Array.isArray(cc.issues) ? cc.issues : [];
                                return (
                                  <div key={code} className="border-l-2 pl-3" style={{ borderColor: issues.length ? '#eb7e37' : '#16a34a' }}>
                                    <div className="text-sm font-bold text-gray-700">{code} <span className="font-normal text-gray-400">— {name}</span></div>
                                    {issues.length === 0
                                      ? <div className="text-sm text-green-600">✅ No significant issue found for this criterion.</div>
                                      : issues.map((is, ii) => (
                                        <div key={ii} className="text-sm mt-1 mb-1.5">
                                          <div className="text-gray-800"><span className="font-semibold">Issue:</span> {is.problem}</div>
                                          {is.evidence && <div className="text-gray-500">Evidence: <span className="italic">"{is.evidence}"</span></div>}
                                          {is.explanation && <div className="text-gray-600">{is.explanation}</div>}
                                          {is.fix && <div className="text-[#0096b1]"><span className="font-semibold">Improvement:</span> {is.fix}</div>}
                                        </div>
                                      ))}
                                  </div>
                                );
                              })}
                            </div>
                            {p.rewrite && <div className="mt-3"><div className="text-sm font-semibold text-gray-800 mb-1">✍️ Rewritten paragraph</div><div className="text-sm text-gray-700 bg-green-50/50 border border-green-100 rounded-lg p-3 whitespace-pre-wrap">{p.rewrite}</div></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                    {a.revised_essay && (
                      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-4">
                        <h3 className="text-base font-bold text-[#2b5356] mb-2">📝 Complete revised essay</h3>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.revised_essay}</div>
                      </div>
                    )}
                    {a.target_band_essay && (
                      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-4">
                        <h3 className="text-base font-bold text-[#2b5356] mb-2">🎯 Essay adjusted to Target Band {targetBand}</h3>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.target_band_essay}</div>
                      </div>
                    )}
                    {a.key_language && (
                      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-4">
                        <h3 className="text-base font-bold text-[#2b5356] mb-2">🔑 Key Language</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          {[['word_choice', 'Word Choice'], ['sentence_structures', 'Sentence Structures'], ['cohesion_linking', 'Cohesion & Linking']].map(([k, label]) => (
                            <div key={k}>
                              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase">{label}</div>
                              <ul className="space-y-1">{(a.key_language[k] || []).map((it, i) => <li key={i}><span className="font-medium text-[#2b5356]">{it.term}</span>{it.note ? <span className="text-gray-500"> — {it.note}</span> : null}</li>)}</ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            )}
          </div>
        )}

        {tab === 'export' && (
          <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-[#2b5356] mb-1">Export PDF/Word</h3>
            <p className="text-sm text-gray-500 mb-4">
              The file contains the task prompt, your essay, the score for each criterion, all
              feedback and the detailed analysis (if you ran it). Download it to keep a copy —
              custom tasks are deleted automatically after 24 hours.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={exportPdf} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0096b1] text-white hover:bg-[#007e95] transition-colors">
                <FileDown className="w-4 h-4" /> Download PDF
              </button>
              <button onClick={exportWord} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                <FileDown className="w-4 h-4" /> Download Word
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Writing Assistant — draggable floating modal */}
      {assistPanelOpen && (
        <div className="fixed z-[90] w-[92vw] max-w-[380px] max-h-[85vh] bg-white shadow-2xl border border-gray-200 rounded-xl flex flex-col overflow-hidden"
          style={{ left: assistPos.x, top: assistPos.y }}>
          <div onMouseDown={startAssistDrag} className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#eb7e37] text-white cursor-move select-none">
            <span className="font-bold flex items-center gap-2"><GripHorizontal className="w-4 h-4 opacity-80" /><MessageSquare className="w-4 h-4" /> AI Assistant</span>
            <button onClick={() => setAssistPanelOpen(false)} className="p-1 rounded hover:bg-white/20"><X className="w-4 h-4" /></button>
          </div>
          <div className="shrink-0 flex border-b border-gray-200">
            {[['check', 'Check Errors'], ['ask', 'Ask AI']].map(([k, lb]) => (
              <button key={k} onClick={() => setAssistPanelTab(k)} className={`flex-1 py-2 text-sm font-semibold ${assistPanelTab === k ? 'text-[#eb7e37] border-b-2 border-[#eb7e37]' : 'text-gray-500'}`}>{lb}</button>
            ))}
          </div>

          {assistPanelTab === 'check' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
              {assistSel ? (
                <div className="text-xs text-gray-600 bg-[#0096b1]/5 rounded-lg p-2">
                  <span className="font-medium">Selected text: </span><span className="italic">"{assistSel.slice(0, 200)}{assistSel.length > 200 ? '…' : ''}"</span>
                  {assistRemaining !== null && <span className="ml-1 text-gray-400">· {assistRemaining} left today</span>}
                </div>
              ) : <p className="text-xs text-gray-400">On the <b>Task & Essay</b> tab, highlight part of your essay to check Grammar / Vocabulary / Context / Naturalness.</p>}
              {assistSel && (
                <button onClick={runAssistCheck} disabled={assistLoading} className="w-full py-1.5 rounded-lg bg-[#eb7e37] text-white text-sm font-semibold hover:bg-[#d66e2a] disabled:opacity-60">{assistLoading ? 'Checking...' : 'Check selected text'}</button>
              )}
              {assistErrors && assistErrors.length === 0 && <p className="text-sm text-green-600">This text looks good.</p>}
              {assistErrors && assistErrors.map((er, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-2 text-sm bg-white">
                  <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mb-1">{er.type}</span>
                  <div className="text-red-600 line-through break-words">{er.error}</div>
                  <div className="text-green-600 break-words">{er.suggestion}</div>
                  {er.high_band && <div className="text-purple-700 break-words mt-0.5"><span className="text-[10px] font-bold uppercase">High-band: </span>{er.high_band}</div>}
                  {er._show && er.explain && <div className="text-gray-500 mt-1">{er.explain}</div>}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <button onClick={() => applyAssist(i)} className="px-2 py-0.5 rounded bg-green-500 text-white text-xs font-semibold">Apply</button>
                    {er.high_band && <button onClick={() => applyAssist(i, true)} className="px-2 py-0.5 rounded bg-purple-600 text-white text-xs font-semibold inline-flex items-center gap-0.5"><ArrowUpCircle className="w-3 h-3" /> Higher band</button>}
                    <button onClick={() => setAssistErrors((es) => es.map((e, j) => j === i ? { ...e, _show: !e._show } : e))} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-semibold">Explain</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {assistPanelTab === 'ask' && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {chat.length === 0 && <p className="text-sm text-gray-400">Ask the AI about the selected text or anything about your writing.{assistRemaining !== null && ` (${assistRemaining} questions left today)`}</p>}
                {chat.map((m, i) => (
                  m.role === 'ai'
                    ? <div key={i} className="text-sm rounded-lg px-3 py-2 bg-gray-100 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatAiAnswer(m.text) }} />
                    : <div key={i} className="text-sm rounded-lg px-3 py-2 bg-[#0096b1]/10 text-gray-800 ml-8 whitespace-pre-wrap">{m.text}</div>
                ))}
                {chatLoading && <div className="text-sm text-gray-400">The AI is answering...</div>}
              </div>
              <div className="shrink-0 flex gap-2 p-3 border-t border-gray-200">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); askAI(); } }}
                  placeholder="Type your question..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <button onClick={askAI} disabled={chatLoading} className="px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-semibold disabled:opacity-60">Send</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline spellcheck popover */}
      {spellPopover && spellErrors && spellErrors[spellPopover.idx] && (
        <div data-spellpop className="fixed z-[110] bg-white rounded-lg shadow-xl border border-gray-200 p-2 w-64"
          style={{ left: Math.min(spellPopover.x, window.innerWidth - 270), top: spellPopover.y + 10 }}>
          <div className="text-xs mb-1"><span className="text-red-600 line-through">{spellErrors[spellPopover.idx].original}</span> → <span className="text-green-600 font-semibold">{spellErrors[spellPopover.idx].suggestion}</span></div>
          {spellErrors[spellPopover.idx]._show && spellErrors[spellPopover.idx].explain && <div className="text-xs text-gray-500 mb-1">{spellErrors[spellPopover.idx].explain}</div>}
          <div className="flex gap-1">
            <button onClick={() => { applyFix(spellPopover.idx); setSpellPopover(null); }} className="px-2 py-0.5 rounded bg-green-500 text-white text-xs font-semibold">Apply</button>
            <button onClick={() => toggleExplain(spellPopover.idx)} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-semibold">Explain</button>
            <button onClick={() => { ignoreFix(spellPopover.idx); setSpellPopover(null); }} className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-semibold">Ignore</button>
          </div>
        </div>
      )}

      {/* Leaderboard modal (Full Test) */}
      {leaderOpen && (
        <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4" onClick={() => setLeaderOpen(false)}>
          <div className="bg-gray-50 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[#2b5356] flex items-center gap-2"><Trophy className="w-5 h-5 text-[#eb7e37]" /> Leaderboard</h3>
              <button onClick={() => setLeaderOpen(false)} className="p-1 rounded hover:bg-gray-200"><X className="w-4 h-4" /></button>
            </div>
            {testId ? <Leaderboard examId={testId} pageSize={20} /> : <p className="text-sm text-gray-500">No leaderboard data.</p>}
          </div>
        </div>
      )}

      {/* Report an error — shared modal, skill 'writing' */}
      <ErrorReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        examId={testId}
        skill="writing"
        examTitle={part?.part_number ? `Writing Task ${part.part_number}` : 'Writing Test'}
      />

      {/* End review — confirm modal */}
      {endConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4" onClick={() => !endSending && setEndConfirm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#2b5356] mb-2 flex items-center gap-2"><X className="w-5 h-5 text-[#eb7e37]" /> End review?</h3>
            {result ? (
              <p className="text-sm text-gray-600 mb-5">This essay will be <b>saved to your history and locked</b> — you will <b>no longer be able to re-grade or edit it with AI</b>. To change it later, use <b>"Retake"</b> to start a new attempt.</p>
            ) : (
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to end the review and go back to the list?</p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setEndConfirm(false)} disabled={endSending} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-60">Cancel</button>
              <button onClick={confirmEndReview} disabled={endSending} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#2b5356] text-white hover:bg-[#1e3c3e] disabled:opacity-60 inline-flex items-center gap-1.5">
                <X className="w-4 h-4" /> {endSending ? 'Saving...' : (result ? 'End & lock' : 'End review')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Words confirm */}
      {newWordsConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4" onClick={() => setNewWordsConfirm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#2b5356] mb-2 flex items-center justify-center gap-2"><BookOpen className="w-5 h-5" /> Go to New Words</h3>
            <p className="text-sm text-gray-600 mb-5">Once you open New Words you cannot come back to this Review page. Make sure you have finished reviewing before continuing.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setNewWordsConfirm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
              <button onClick={() => navigate('/new-vocabulary')} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0096b1] text-white hover:bg-[#007a90]">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Word-click menu */}
      {vocabMenu.visible && (
        <div data-vocabmenu className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[190px]" style={{ left: vocabMenu.x, top: vocabMenu.y }}>
          <button onClick={saveVocab} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#0096b1]/10 hover:text-[#0096b1] flex items-center gap-2"><Plus className="w-4 h-4" /> Add to New Words</button>
          <button onClick={() => { setDict({ open: true, text: vocabMenu.text, pos: { x: vocabMenu.x, y: vocabMenu.y } }); setVocabMenu({ visible: false, x: 0, y: 0, text: '' }); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#0096b1]/10 hover:text-[#0096b1] flex items-center gap-2"><BookOpen className="w-4 h-4" /> Dictionary</button>
        </div>
      )}
      <TranslatorDialog isOpen={dict.open} selectedText={dict.text} position={dict.pos} onClose={() => setDict({ open: false, text: '', pos: { x: 0, y: 0 } })} colorTheme="black-on-white" />
    </div>
  );
}
