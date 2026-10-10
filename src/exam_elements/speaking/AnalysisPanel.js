// Thân của phần Phân tích — DÙNG CHUNG cho trang phân tích riêng và tab "Phân tích"
// trong màn kết quả (docs/speaking-spec.md §6.1).
//
// Tách ra vì hai chỗ hiển thị đúng một thứ. Để hai bản song song thì sớm muộn sửa một
// bên quên bên kia — đúng cái đã xảy ra với bộ hiển thị dàn bài.
import React, { useCallback, useRef, useState } from 'react';
import {
    Play, Pause, Star, Check, RotateCcw, Mic, MicOff, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { recordingUrl, retakeAttempt } from './speakingApi';
import BandBadge from './BandBadge';

// Cùng con số với tab "Đề & Bài" của màn kết quả: hai tab liệt kê cùng một bộ câu, chia
// trang lệch nhau thì câu số 7 nhảy trang khác nhau ở mỗi tab, không ai lần ra được.
const QUESTIONS_PER_PAGE = 6;

const STATUS_LABEL = {
    answered: null,
    no_answer: 'No answer',
    auto_skipped: 'Skipped (silence)',
    time_expired: 'Time up',
};


/** Nghe lại liên tiếp các câu của một Part — tua theo Part chứ không phải một khối liền. */
const PartPlayer = ({ label, items, playing, onPlay, onStop }) => {
    const playable = items.filter((q) => q.has_audio);
    if (!playable.length) return null;
    const active = playing === label;
    return (
        <button type="button" onClick={() => (active ? onStop() : onPlay(label, playable))}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                    active ? 'bg-[#0096b1] text-white'
                           : 'bg-white text-[#eb7e37] border-2 border-[#eb7e37]/40 hover:border-[#eb7e37]'}`}>
            {active ? <Pause size={15} /> : <Play size={15} />}
            Replay {label}
            <span className="opacity-70">({playable.length} answers)</span>
        </button>
    );
};

const AnalysisPanel = ({ data, onOpenQuestion, onError, onRetake }) => {
    const [playing, setPlaying] = useState(null);
    const [retaking, setRetaking] = useState(false);
    const [page, setPage] = useState(0);
    const audioRef = useRef(null);
    const queueRef = useRef([]);

    const playNext = useCallback(() => {
        const next = queueRef.current.shift();
        if (!next) { setPlaying(null); return; }
        const el = audioRef.current;
        if (!el) return;
        el.src = recordingUrl(next.answer_id);
        el.play().catch(() => playNext());   // một bản ghi hỏng không được chặn cả hàng
    }, []);

    const startPart = (label, items) => {
        queueRef.current = [...items];
        setPlaying(label);
        playNext();
    };

    const stopPart = () => {
        queueRef.current = [];
        if (audioRef.current) audioRef.current.pause();
        setPlaying(null);
    };

    const retake = async () => {
        setRetaking(true);
        try {
            const res = await retakeAttempt(data.attempt_id);
            onRetake(res);
        } catch (e) {
            onError(e.message);
            setRetaking(false);
        }
    };

    const byPart = (data.parts || []).map((p) => ({
        label: p.label, band: p.band,
        items: (data.questions || []).filter((q) => q.part_label === p.label),
    }));

    // Chia trang theo THỨ TỰ CÂU, không theo Part — cắt theo Part thì trang đầu 12 câu,
    // trang sau một câu. Tiêu đề Part chiếm trọn hàng nên các phần vẫn tách bạch. Giống
    // hệt tab "Đề & Bài" để hai tab cuộn và lật trang như nhau.
    const all = data.questions || [];
    const partBand = {};
    (data.parts || []).forEach((p) => { partBand[p.label] = p.band; });
    const totalPages = Math.max(1, Math.ceil(all.length / QUESTIONS_PER_PAGE));
    const safePage = Math.min(page, totalPages - 1);
    const shown = all.slice(safePage * QUESTIONS_PER_PAGE, (safePage + 1) * QUESTIONS_PER_PAGE);

    return (
        <div>
            <audio ref={audioRef} className="hidden" onEnded={playNext} />

            <div className="flex flex-wrap items-center gap-2">
                {byPart.map((p) => (
                    <PartPlayer key={p.label} label={p.label} items={p.items}
                                playing={playing} onPlay={startPart} onStop={stopPart} />
                ))}
                {data.can_retake && (
                    <button type="button" onClick={retake} disabled={retaking}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                                       bg-white text-[#eb7e37] border-2 border-[#eb7e37]/35 hover:border-[#eb7e37]
                                       disabled:opacity-50">
                        {retaking ? <Loader2 className="animate-spin" size={15} /> : <RotateCcw size={15} />}
                        Retake this exact question set
                    </button>
                )}
            </div>
            {data.can_retake && (
                <p className="text-sm text-gray-500 mt-2">
                    Your original score stays the same; the retake is recorded separately.
                </p>
            )}

            <ol className="mt-5 grid xl:grid-cols-2 gap-2.5 items-start">
                {shown.map((q, i) => {
                    const note = STATUS_LABEL[q.status];
                    return (
                        <React.Fragment key={q.answer_id}>
                            {(i === 0 || shown[i - 1].part_label !== q.part_label) && (
                                <li className="xl:col-span-2 flex items-center gap-2.5 pt-3 first:pt-0">
                                    {/* Điểm trên đầu trang là Overall; mỗi Part có điểm riêng
                                        ở đây, để thi full test còn biết mình yếu ở part nào. */}
                                    <h3 className="text-lg font-bold text-[#2b5356]">{q.part_label}</h3>
                                    {partBand[q.part_label] != null && (
                                        <BandBadge band={partBand[q.part_label]} size="sm" />
                                    )}
                                </li>
                            )}
                            <li className="h-full">
                                <button type="button" disabled={!q.question_id}
                                        onClick={() => onOpenQuestion(q.question_id)}
                                        className="w-full h-full text-left bg-white rounded-xl border-2 border-gray-100
                                                   p-4 hover:border-[#0096b1]/50 transition
                                                   disabled:opacity-60 disabled:hover:border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <span className="w-8 h-8 shrink-0 rounded-full bg-[#0096b1]/10 text-[#0096b1]
                                                         text-sm font-bold flex items-center justify-center tabular-nums">
                                            {q.order_index + 1}
                                        </span>
                                        <div className="grow min-w-0">
                                            <p className="text-[15px] text-gray-800 break-words">
                                                {q.question_text || 'Follow-up question asked during the test'}
                                            </p>
                                            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                                                {q.viewed ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                                        <Check size={13} /> Viewed
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-medium">Not viewed</span>
                                                )}
                                                {q.is_sample && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-[#eb7e37] font-semibold">
                                                        <Star size={13} className="fill-[#eb7e37]" /> Sample
                                                    </span>
                                                )}
                                                {note && <span className="text-xs text-gray-500">{note}</span>}
                                                {q.audio_expired && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                        <MicOff size={13} /> Recording expired
                                                    </span>
                                                )}
                                                {!q.audio_expired && q.has_audio && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                        <Mic size={13} /> Recorded
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <BandBadge band={q.band} size="xs" />
                                    </div>
                                </button>
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>

            {totalPages > 1 && (
                <nav className="flex items-center justify-between gap-3 pt-4 flex-wrap">
                    <button type="button" disabled={safePage === 0}
                            onClick={() => setPage(Math.max(0, safePage - 1))}
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border-2
                                       border-gray-200 text-[#2b5356] font-bold text-sm
                                       hover:border-gray-300 disabled:opacity-40">
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} type="button" onClick={() => setPage(i)}
                                    className={`w-9 h-9 rounded-lg text-sm font-bold tabular-nums ${
                                        i === safePage ? 'bg-[#0096b1] text-white'
                                            : 'text-[#2b5356] border-2 border-gray-200 hover:border-[#0096b1]/50'}`}>
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button type="button" disabled={safePage >= totalPages - 1}
                            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border-2
                                       border-gray-200 text-[#2b5356] font-bold text-sm
                                       hover:border-gray-300 disabled:opacity-40">
                        Next <ChevronRight size={16} />
                    </button>
                </nav>
            )}
        </div>
    );
};

export default AnalysisPanel;
