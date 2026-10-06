// Khung "Tự soạn bài mẫu" (feedback 23/09) — dành cho học viên muốn soạn bài trước rồi mới
// luyện nói. Ba nút: Improve văn bản (4 mức band), Sửa lỗi từ vựng & ngữ pháp, Lưu làm bài
// mẫu. Toàn bộ khung này là tính năng VIP; máy chủ chặn thật, ở đây chỉ hiện đúng trạng thái.
//
// Bản nháp giữ trong localStorage theo từng câu hỏi: học viên gõ nửa chừng rồi chuyển câu
// khác hoặc lỡ tải lại trang thì chữ vẫn còn. Chỉ khi bấm "Lưu làm bài mẫu" nó mới lên máy
// chủ — đó cũng là bản được dùng khi luyện nói.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, Lock, PenLine, Save, Sparkles, SpellCheck, Undo2 } from 'lucide-react';

import { composeFix, composeImprove, chooseAiSample } from './speakingApi';

const BANDS = ['5.0-5.5', '6.0-6.5', '7.0-7.5', '8.0-9.0'];
const draftKey = (questionId) => `speaking-compose-${questionId}`;

const loadDraft = (questionId) => {
    try { return localStorage.getItem(draftKey(questionId)) || ''; } catch (e) { return ''; }
};

export default function ComposeSample({ questionId, seedText, locked, onSaved }) {
    const boxRef = useRef(null);
    const [text, setText] = useState('');
    // Vùng bôi đen, tính bằng chỉ số ký tự. Đọc lúc bấm nút thì đã muộn: bấm vào nút là ô
    // chữ mất focus và trình duyệt xoá vùng chọn, nên phải ghi lại ngay khi nó đổi.
    const [sel, setSel] = useState({ start: null, end: null });
    const [band, setBand] = useState('6.0-6.5');
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);   // { kind, changes/fixes, note }
    const [undoText, setUndoText] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setText(loadDraft(questionId) || seedText || '');
        setSel({ start: null, end: null });
        setResult(null); setUndoText(null); setSaved(false); setError('');
    }, [questionId, seedText]);

    useEffect(() => {
        if (!questionId) return;
        try { localStorage.setItem(draftKey(questionId), text); } catch (e) { /* chế độ riêng tư */ }
    }, [questionId, text]);

    const trackSelection = useCallback(() => {
        const el = boxRef.current;
        if (!el) return;
        const { selectionStart: start, selectionEnd: end } = el;
        setSel(start != null && end != null && end > start ? { start, end } : { start: null, end: null });
    }, []);

    const hasSelection = sel.start != null && sel.end != null;
    const selectedText = hasSelection ? text.slice(sel.start, sel.end) : '';

    const apply = async (kind) => {
        if (!text.trim()) { setError('Write something first for the AI to work on.'); return; }
        setBusy(kind); setError(''); setResult(null);
        const before = text;
        try {
            const args = { text, start: sel.start, end: sel.end };
            const d = kind === 'improve'
                ? await composeImprove(questionId, { ...args, targetBand: band })
                : await composeFix(questionId, args);
            setText(d.text || before);
            setUndoText(before);
            setSaved(false);
            setResult({ kind, note: d.note, items: kind === 'improve' ? (d.changes || []) : (d.fixes || []) });
            setSel({ start: null, end: null });
        } catch (e) { setError(e.message); } finally { setBusy(''); }
    };

    const save = async () => {
        if (!text.trim()) { setError('Your sample answer is empty.'); return; }
        setBusy('save'); setError('');
        try {
            await chooseAiSample(questionId, text.trim());
            setSaved(true);
            if (onSaved) onSaved(text.trim());
        } catch (e) { setError(e.message); } finally { setBusy(''); }
    };

    if (locked) {
        return (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                <Lock size={20} className="mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-bold text-[#2b5356]">Writing your own sample answer is a VIP feature</p>
                <p className="mt-1 text-xs text-gray-600 max-w-md mx-auto">
                    VIP lets you draft your own answer, have the AI raise it to a target band or
                    fix vocabulary &amp; grammar mistakes, then save it as a sample to practise speaking.
                </p>
            </div>
        );
    }

    const disabled = !!busy;
    return (
        <div>
            <p className="text-xs text-gray-600 mb-3">
                Type your answer in the box below. To have the AI work on just one part,
                <b> highlight that part</b> and press a button — with nothing highlighted, the AI works on the whole answer.
            </p>

            <textarea
                ref={boxRef}
                value={text}
                onChange={(e) => { setText(e.target.value); setSaved(false); }}
                onSelect={trackSelection}
                onKeyUp={trackSelection}
                onMouseUp={trackSelection}
                rows={8}
                placeholder="Write your sample answer here…"
                className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm leading-relaxed
                           focus:border-[#0096b1] focus:outline-none resize-y"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-gray-500 mt-1">
                <span>{text.trim() ? `${text.trim().split(/\s+/).length} words` : 'No text yet'}</span>
                {hasSelection && (
                    <span className="text-[#eb7e37] font-semibold truncate max-w-[60%]">
                        Selected: “{selectedText.length > 40 ? `${selectedText.slice(0, 40)}…` : selectedText}”
                    </span>
                )}
            </div>

            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-1.5">
                Target level for improvement
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {BANDS.map((b) => (
                    <button key={b} type="button" onClick={() => setBand(b)}
                            className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition ${
                                band === b ? 'bg-[#eb7e37] text-white border-[#eb7e37]'
                                           : 'bg-white text-[#2b5356] border-gray-200 hover:border-[#eb7e37]/60'}`}>
                        {b}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
                <button type="button" onClick={() => apply('improve')} disabled={disabled}
                        className="px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-semibold
                                   hover:bg-[#007a90] disabled:opacity-50 inline-flex items-center gap-2">
                    {busy === 'improve' ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    Improve text{hasSelection ? ' (selection)' : ''}
                </button>
                <button type="button" onClick={() => apply('fix')} disabled={disabled}
                        className="px-4 py-2 rounded-lg border-2 border-[#0096b1] text-[#0096b1] text-sm font-semibold
                                   hover:bg-[#0096b1]/10 disabled:opacity-50 inline-flex items-center gap-2">
                    {busy === 'fix' ? <Loader2 className="animate-spin" size={14} /> : <SpellCheck size={14} />}
                    Fix vocabulary &amp; grammar
                </button>
                <button type="button" onClick={save} disabled={disabled}
                        className="px-4 py-2 rounded-lg bg-[#2b5356] text-white text-sm font-semibold
                                   hover:bg-[#1e3c3e] disabled:opacity-50 inline-flex items-center gap-2">
                    {busy === 'save' ? <Loader2 className="animate-spin" size={14} />
                        : saved ? <Check size={14} /> : <Save size={14} />}
                    {saved ? 'Saved as sample' : 'Save as sample'}
                </button>
                {undoText != null && (
                    <button type="button" onClick={() => { setText(undoText); setUndoText(null); setResult(null); setSaved(false); }}
                            disabled={disabled}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold
                                       hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2">
                        <Undo2 size={14} /> Undo
                    </button>
                )}
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {result && (
                <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-[11px] font-semibold text-[#0096b1] uppercase tracking-wide inline-flex items-center gap-1.5">
                        <PenLine size={13} />
                        {result.kind === 'improve' ? 'AI improvement' : 'AI corrections'}
                    </p>
                    {!result.items.length && (
                        <p className="text-sm text-gray-600 mt-1.5">
                            {result.kind === 'fix'
                                ? 'No vocabulary or grammar mistakes worth fixing were found.'
                                : 'The AI made no significant changes here.'}
                        </p>
                    )}
                    <ul className="space-y-1.5 mt-1.5">
                        {result.items.map((c, i) => (
                            <li key={i} className="text-xs text-gray-700">
                                <span className="line-through text-gray-400">{c.from}</span>
                                {' → '}
                                <b className="text-[#2b5356]">{c.to}</b>
                                {c.why && <span className="text-gray-500"> — {c.why}</span>}
                            </li>
                        ))}
                    </ul>
                    {result.note && <p className="text-xs text-gray-600 mt-2 italic">{result.note}</p>}
                </div>
            )}
        </div>
    );
}
