// Luyện phát âm với AI cho một từ trong New Words (feedback 07/09).
//
// Dùng lại đúng hai endpoint của Speaking: `model-audio` để nghe mẫu và
// `practice/pronunciation` để chấm. Không dựng đường riêng — chấm phát âm ở hai nơi mà hai
// bộ prompt khác nhau thì cùng một từ sẽ ra hai kết quả, học viên không biết tin cái nào.
//
// Speaking đang khoá cho vài tài khoản test, nên component tự hỏi quyền trước và ẩn hẳn
// nếu chưa được mở — thà không có nút còn hơn có nút bấm vào báo lỗi.
import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Mic, Square, Loader2, X, AlertCircle } from 'lucide-react';
import { createRecorder } from '../exam_elements/speaking/recorder';
import { modelAudioUrl, scorePronunciation } from '../exam_elements/speaking/speakingApi';
import WordStress from '../exam_elements/speaking/WordStress';
import API_BASE from '../config/api';

export const useSpeakingAllowed = () => {
    const [allowed, setAllowed] = useState(false);
    useEffect(() => {
        fetch(`${API_BASE}/student/speaking/access`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        })
            .then((r) => (r.ok ? r.json() : { allowed: false }))
            .then((d) => setAllowed(!!d.allowed))
            .catch(() => setAllowed(false));
    }, []);
    return allowed;
};

const PronunciationCoach = ({ word, example, onClose }) => {
    const [text, setText] = useState(word || '');
    const [recording, setRecording] = useState(false);
    const [busy, setBusy] = useState('');
    const [out, setOut] = useState(null);
    const [error, setError] = useState('');
    const recRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => () => { if (recRef.current) recRef.current.dispose(); }, []);

    const play = (url) => {
        if (!audioRef.current) return;
        audioRef.current.src = url;
        audioRef.current.play().catch(() => setError('Could not play the model audio.'));
    };

    const micReason = (name) => {
        if (name === 'NotAllowedError' || name === 'SecurityError') {
            return 'Your browser is blocking the microphone. Click the lock icon next to the address bar, '
                + 'allow Microphone, then reload the page.';
        }
        if (name === 'NotFoundError') return 'No microphone was found.';
        if (name === 'NotReadableError') return 'The microphone is being used by another app.';
        return 'Could not open the microphone. Try reloading the page.';
    };

    const toggle = async () => {
        if (recording) {
            setRecording(false);
            const rec = recRef.current; recRef.current = null;
            if (!rec) return;
            setBusy('score');
            // Bọc cả luồng chứ không riêng lời gọi mạng — xem ghi chú cùng chỗ trong
            // SpeakingQuestionDetail: lỗi trước bước gửi từng làm nút chết lặng.
            try {
                const { blob } = await rec.stop();
                try { rec.dispose(); } catch (e) { /* dọn dẹp hỏng không chặn việc chấm */ }
                if (!blob || !blob.size) { setError('No sound was recorded.'); return; }
                setOut(await scorePronunciation(text, blob, 'webm'));
            } catch (e) {
                setError(e.message || 'Could not score the recording. Please try again.');
            } finally { setBusy(''); }
            return;
        }
        setOut(null); setError(''); setBusy('mic');
        const rec = createRecorder();
        const ok = await rec.init();
        setBusy('');
        if (!ok) { setError(micReason(rec.lastError)); return; }
        recRef.current = rec;
        rec.start(() => {});
        setRecording(true);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
            <audio ref={audioRef} className="hidden" />
            <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl max-h-[88vh] flex flex-col">
                <header className="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
                    <h2 className="font-bold text-[#2b5356] text-lg">AI pronunciation practice</h2>
                    <button onClick={onClose} aria-label="Close"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-5 overflow-y-auto grow">
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
                              className="w-full rounded-xl border-2 border-gray-200 px-3.5 py-2.5 text-[15px]
                                         focus:border-[#0096b1] focus:ring-1 focus:ring-[#0096b1] outline-none" />
                    {example && (
                        <button type="button" onClick={() => setText(example)}
                                className="mt-2 text-sm font-semibold text-[#0096b1] hover:underline">
                            Use the example sentence
                        </button>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button type="button" disabled={!text.trim()}
                                onClick={() => play(modelAudioUrl(text.trim(), null, true))}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold
                                           text-[#eb7e37] border-2 border-[#eb7e37]/40 hover:border-[#eb7e37]
                                           disabled:opacity-50">
                            <Volume2 size={16} /> Listen
                        </button>
                        <button type="button" onClick={toggle}
                                disabled={!text.trim() || busy === 'score'}
                                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold
                                            disabled:opacity-50 ${recording
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-[#0096b1] text-white hover:bg-[#007a90]'}`}>
                            {busy ? <Loader2 className="animate-spin" size={16} />
                                : recording ? <Square size={16} /> : <Mic size={16} />}
                            {busy === 'mic' ? 'Requesting microphone…'
                                : recording ? 'Stop and score' : 'Tap to speak'}
                        </button>
                    </div>

                    {error && (
                        <p className="mt-3 flex items-start gap-2 text-sm text-[#eb7e37] bg-[#eb7e37]/10 rounded-lg px-3 py-2">
                            <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
                        </p>
                    )}

                    {out && (
                        <div className="mt-4 rounded-xl border-2 border-gray-100 p-4">
                            {out.score == null ? (
                                <p className="text-sm text-[#eb7e37]">{out.problem}</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-[#2b5356] tabular-nums">
                                        {out.score}<span className="text-base text-gray-400 font-normal">/100</span>
                                    </p>
                                    <p className="text-xs text-gray-400">{out.scale_note}</p>
                                </>
                            )}
                            {!!(out.sounds || []).length && (
                                <ul className="mt-3 space-y-1.5">
                                    {out.sounds.map((s, i) => (
                                        <li key={i} className="text-sm rounded-lg bg-gray-50 px-3 py-2">
                                            <span className="font-bold text-[#2b5356]">{s.sound}</span>
                                            {s.heard_as && <span className="text-gray-500"> heard as {s.heard_as}</span>}
                                            {s.how && <span className="block text-gray-600 mt-0.5">{s.how}</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <WordStress items={out.word_stress} verdict={out.word_stress_verdict} />
                            {out.clarity && <p className="text-sm text-gray-600 mt-2">{out.clarity}</p>}
                            {!!(out.tips || []).length && (
                                <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-0.5">
                                    {out.tips.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PronunciationCoach;
