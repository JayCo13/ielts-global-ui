// Pronunciation Lessons — nhánh thứ tư của Speaking (feedback 09/09).
//
// Mỗi Unit gồm hai nửa: LÝ THUYẾT admin viết tay, và LUYỆN TẬP do AI sinh từ chính lý
// thuyết đó. Từ thì chấm phát âm, câu thì shadowing — cùng hai cơ chế đang dùng ở trang
// phân tích, chỉ khác nội dung, nên học viên không phải học một cách bấm mới.
//
// Một trang gồm hai tầng (danh sách Unit → chi tiết Unit) thay vì hai route: chuyển qua
// lại giữa các Unit là việc hay làm, mỗi lần đổi route lại tải lại cả trang thì rất nặng.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle, BookOpen, ChevronLeft, Crown, Headphones, Loader2, Lock, Mic,
    RefreshCw, Square, Volume2, Wrench,
} from 'lucide-react';
import {
    fetchLessons, fetchLesson, refreshLessonItems, scoreLessonItem, modelAudioUrl,
} from './speakingApi';
import { createRecorder } from './recorder';
import WordStress from './WordStress';

// Năm chiều của shadowing, cùng cách gọi với trang phân tích để hai chỗ đọc như một.
/**
 * Lý thuyết cho phép in đậm bằng `**chữ**` (feedback 19/09: "nội dung cho trình bày in
 * đậm"). Dựng thẳng thành phần tử React, KHÔNG đi qua innerHTML — admin gõ gì thì học viên
 * cũng chỉ thấy đúng chữ đó, không có đường nào chèn mã vào trang.
 * Dấu `**` lẻ (quên đóng) thì để nguyên như chữ thường, đừng nuốt mất nội dung.
 */
export const renderBold = (text) => {
    const parts = String(text || '').split('**');
    if (parts.length < 3) return text;
    return parts.map((chunk, i) => {
        const isBold = i % 2 === 1 && i < parts.length - 1;
        if (isBold) return <strong key={i} className="font-bold text-[#2b5356]">{chunk}</strong>;
        // Đoạn cuối của một dấu ** không có cặp: trả lại dấu đã bị cắt.
        if (i % 2 === 1) return <React.Fragment key={i}>{'**' + chunk}</React.Fragment>;
        return <React.Fragment key={i}>{chunk}</React.Fragment>;
    });
};

const SHADOW_LABEL = {
    pronunciation: 'Pronunciation: wrong sounds or words',
    word_stress: 'Word Stress: stress on the wrong syllable',
    sentence_stress: 'Sentence Stress: the wrong words emphasised',
    intonation: 'Intonation: pitch movement sounds unnatural',
    connected_speech: 'Connected Speech: linking and weak forms sound unnatural',
    rhythm_fluency: 'Rhythm & Fluency: pausing and pace',
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

const Quota = ({ quota }) => {
    if (!quota) return null;
    if (quota.limit === null || quota.limit === undefined) {
        return <span className="text-sm font-semibold text-[#0096b1]">VIP · unlimited practice</span>;
    }
    return (
        <span className={`text-sm font-semibold ${quota.remaining > 0 ? 'text-[#0096b1]' : 'text-[#eb7e37]'}`}>
            {quota.remaining > 0
                ? `${quota.remaining}/${quota.limit} practices left today`
                : 'No practices left today — upgrade to VIP for unlimited practice'}
        </span>
    );
};

/**
 * Một mục luyện tập: từ thì bấm đọc rồi AI chấm âm và trọng âm, câu thì nghe mẫu rồi đọc
 * lại để AI soi nhịp. Ghi âm nằm gọn trong từng thẻ — mỗi thẻ một máy ghi riêng, để đang
 * chấm mục này vẫn bấm được mục khác.
 */
const PracticeItem = ({ item, index, onScored, onQuotaError, locked, lockedMessage }) => {
    const navigate = useNavigate();
    const [recording, setRecording] = useState(false);
    const [busy, setBusy] = useState('');
    const [out, setOut] = useState(null);
    const [error, setError] = useState('');
    const recRef = useRef(null);
    const audioRef = useRef(null);
    const isSentence = item.kind === 'sentence';

    useEffect(() => () => { if (recRef.current) { try { recRef.current.dispose(); } catch (e) { /* đã đóng */ } } }, []);

    const play = () => {
        if (!audioRef.current) return;
        audioRef.current.src = modelAudioUrl(item.content, null, true);
        audioRef.current.play().catch(() => setError('Could not play the model audio.'));
    };

    const toggle = async () => {
        if (recording) {
            setRecording(false);
            const rec = recRef.current; recRef.current = null;
            if (!rec) return;
            setBusy('score');
            // Bọc cả luồng chứ không riêng lời gọi mạng: một lỗi trước bước gửi từng làm
            // nút chết lặng, không báo gì (xem ghi chú cùng chỗ ở SpeakingQuestionDetail).
            try {
                const { blob } = await rec.stop();
                try { rec.dispose(); } catch (e) { /* dọn dẹp hỏng không chặn việc chấm */ }
                if (!blob || !blob.size) { setError('No sound was recorded.'); return; }
                const res = await scoreLessonItem(item.item_id, blob, 'webm');
                setOut(res);
                onScored(res.quota);
            } catch (e) {
                if (e.status === 429) onQuotaError(e.message);
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
        <li className="bg-white rounded-2xl border-2 border-gray-100 p-4 sm:p-5">
            <audio ref={audioRef} className="hidden" />
            <div className="flex items-start gap-3">
                <span className="w-8 h-8 shrink-0 rounded-full bg-[#0096b1]/10 text-[#0096b1]
                                 text-sm font-bold flex items-center justify-center tabular-nums">
                    {index + 1}
                </span>
                <div className="min-w-0 grow">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold mb-1.5 ${
                        isSentence ? 'bg-[#eb7e37]/12 text-[#c25f1c]' : 'bg-[#0096b1]/12 text-[#0096b1]'}`}>
                        {isSentence ? <><Headphones size={11} /> Shadowing</>
                                    : <><Volume2 size={11} /> Pronunciation</>}
                    </span>
                    <p className="text-[17px] font-semibold text-[#2b5356] break-words">{item.content}</p>
                    {item.note && <p className="text-sm text-gray-500 mt-1 break-words">{item.note}</p>}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button type="button" onClick={play}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold
                                       text-[#eb7e37] border-2 border-[#eb7e37]/40 hover:border-[#eb7e37]">
                            <Volume2 size={15} /> Listen
                        </button>
                        {/* Tài khoản thường XEM được mọi bài, chỉ không LUYỆN được từ bài thứ 7
                            (feedback 21/09) — nên chỉ khoá đúng nút này, nội dung vẫn đọc bình thường. */}
                        {locked ? (
                            <button type="button" onClick={() => navigate('/vip-packages')}
                                title={lockedMessage}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold
                                           border-2 border-[#eb7e37]/40 text-[#eb7e37] hover:border-[#eb7e37]">
                                <Lock size={15} /> VIP needed to practise this lesson
                            </button>
                        ) : (
                        <button type="button" onClick={toggle} disabled={busy === 'score'}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold
                                        disabled:opacity-50 ${recording
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-[#0096b1] text-white hover:bg-[#007a90]'}`}>
                            {busy ? <Loader2 className="animate-spin" size={15} />
                                : recording ? <Square size={15} /> : <Mic size={15} />}
                            {busy === 'mic' ? 'Requesting microphone…'
                                : busy === 'score' ? 'AI is scoring…'
                                : recording ? 'Stop and score'
                                : isSentence ? 'Read again' : 'Tap to speak'}
                        </button>
                        )}
                    </div>

                    {error && (
                        <p className="mt-2 flex items-start gap-2 text-sm text-[#eb7e37] bg-[#eb7e37]/10 rounded-lg px-3 py-2">
                            <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
                        </p>
                    )}

                    {out && (
                        <div className="mt-3 rounded-xl border-2 border-gray-100 p-4">
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

                            {isSentence ? (
                                <>
                                    <ul className="mt-3 space-y-2.5">
                                        {(out.dimensions || []).map((d) => (
                                            <li key={d.key} className="rounded-xl bg-gray-50 px-4 py-3">
                                                <p className="text-sm font-bold text-[#2b5356]">
                                                    {SHADOW_LABEL[d.key] || d.key}
                                                </p>
                                                {d.verdict && <p className="text-sm text-gray-700 mt-1">{d.verdict}</p>}
                                                {(d.examples || []).map((e, i) => (
                                                    <p key={i} className="text-sm mt-1.5 break-words">
                                                        <span className="text-red-600">{e.said}</span>
                                                        <span className="mx-1.5 text-gray-400">→</span>
                                                        <span className="text-emerald-600 font-medium">{e.should_be}</span>
                                                        {e.note && (
                                                            <span className="block text-gray-500 text-xs mt-0.5">{e.note}</span>
                                                        )}
                                                    </p>
                                                ))}
                                            </li>
                                        ))}
                                    </ul>
                                    {out.summary && <p className="text-sm text-gray-700 mt-3">{out.summary}</p>}
                                </>
                            ) : (
                                <>
                                    {!!(out.sounds || []).length && (
                                        <ul className="mt-3 space-y-1.5">
                                            {out.sounds.map((s, i) => (
                                                <li key={i} className="text-sm rounded-lg bg-gray-50 px-3 py-2 break-words">
                                                    <span className="font-bold text-[#2b5356]">{s.sound}</span>
                                                    {s.heard_as && <span className="text-gray-500"> heard as {s.heard_as}</span>}
                                                    {!!(s.in_words || []).length && (
                                                        <span className="text-gray-500">: {s.in_words.join(', ')}</span>
                                                    )}
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
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};

const PronunciationLessons = () => {
    const navigate = useNavigate();
    const [list, setList] = useState(null);
    const [unit, setUnit] = useState(null);
    const [openId, setOpenId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [locked, setLocked] = useState(false);      // 503 = Speaking đang khoá tạm
    const [refreshing, setRefreshing] = useState(false);
    // Feedback 21/09: "cho trình bày theo thứ tự alphabet và cho sort được. Trình bày theo
    // trang cho đẹp bớt kéo từ trên xuống hơi lâu."
    const [sortBy, setSortBy] = useState('title');   // 'title' | 'default'
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchLessons()
            .then(setList)
            .catch((e) => { if (e.status === 503) setLocked(true); else setError(e.message); })
            .finally(() => setLoading(false));
    }, []);

    const open = useCallback((unitId) => {
        setOpenId(unitId); setUnit(null); setError('');
        fetchLesson(unitId).then(setUnit).catch((e) => setError(e.message));
    }, []);

    const refresh = async () => {
        setRefreshing(true); setError('');
        try {
            const res = await refreshLessonItems(openId);
            setUnit((u) => ({ ...u, ...res }));
        } catch (e) {
            setError(e.message);
        } finally { setRefreshing(false); }
    };

    // Hạn mức dùng chung cả trang: chấm xong một mục thì con số ở đầu trang phải đổi theo,
    // không để học viên bấm tiếp rồi mới biết đã hết lượt.
    const onScored = (quota) => {
        if (quota) setUnit((u) => (u ? { ...u, quota } : u));
    };

    // Sắp theo tên bài, so sánh kiểu tiếng Việt và hiểu số ("Unit 2" trước "Unit 10").
    const UNITS_PER_PAGE = 8;
    const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
    const sortedUnits = (() => {
        const arr = [...((list && list.units) || [])];
        if (sortBy === 'title') return arr.sort((a, b) => collator.compare(a.title || '', b.title || ''));
        if (sortBy === 'title_desc') return arr.sort((a, b) => collator.compare(b.title || '', a.title || ''));
        return arr;      // giữ nguyên thứ tự admin xếp
    })();
    const pageCount = Math.max(1, Math.ceil(sortedUnits.length / UNITS_PER_PAGE));
    const safePage = Math.min(page, pageCount);
    const pageUnits = sortedUnits.slice((safePage - 1) * UNITS_PER_PAGE, safePage * UNITS_PER_PAGE);

    if (locked) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#eb7e37]/10 flex items-center justify-center mx-auto mb-5">
                        <Wrench className="text-[#eb7e37]" size={30} strokeWidth={2} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#2b5356] mb-3">Feature update in progress</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Speaking is being upgraded. We will reopen it as soon as it is ready.
                    </p>
                    <button onClick={() => navigate('/')}
                        className="px-6 py-2.5 rounded-lg bg-[#0096b1] text-white font-semibold hover:bg-[#007a90]">
                        Back to home
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#0096b1]" size={30} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => (openId ? (setOpenId(null), setUnit(null)) : navigate('/speaking_list'))}
                        className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-[#2b5356]">
                        <ChevronLeft size={22} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-[#2b5356] truncate">
                            {openId && unit ? unit.title : 'Pronunciation Lessons'}
                        </h1>
                        {!openId && (
                            <p className="text-xs text-gray-500">
                                Study the theory, then practise right away with words and sentences the AI builds for that lesson.
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
                {error && (
                    <div className="flex items-start gap-2 rounded-xl bg-[#eb7e37]/10 border border-[#eb7e37]/25 px-4 py-3">
                        <AlertCircle size={17} className="text-[#eb7e37] shrink-0 mt-0.5" />
                        <p className="text-sm text-[#8a4a17]">{error}</p>
                    </div>
                )}

                {!openId && (
                    !(list && list.units.length) ? (
                        <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center">
                            <BookOpen className="mx-auto text-gray-300 mb-3" size={30} />
                            <p className="text-gray-500">No lessons yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <Quota quota={list.quota} />
                                <div className="flex items-center gap-2">
                                    <label htmlFor="pron-sort" className="text-sm text-gray-500">Sort</label>
                                    <select id="pron-sort" value={sortBy}
                                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                                        className="rounded-lg border-2 border-gray-200 px-2.5 py-1.5 text-sm font-semibold
                                                   text-[#2b5356] focus:border-[#0096b1] focus:outline-none">
                                        <option value="title">Title A → Z</option>
                                        <option value="title_desc">Title Z → A</option>
                                        <option value="default">Lesson order</option>
                                    </select>
                                </div>
                            </div>
                            {/* Bài bị khoá vẫn hiện đủ trong danh sách, chỉ đổi sang màu xám
                                và bấm thì mời nâng cấp. Giấu hẳn đi thì học viên không biết
                                mình đang bỏ lỡ gì, mà đằng nào máy chủ cũng chặn. */}
                            <ul className="space-y-2.5">
                                {pageUnits.map((u) => (
                                    <li key={u.unit_id}>
                                        <button type="button"
                                            onClick={() => open(u.unit_id)}
                                            className={`w-full text-left rounded-2xl border-2 px-5 py-4 transition-colors ${
                                                u.practice_locked
                                                    ? 'bg-gray-50 border-gray-100 hover:border-[#eb7e37]/40'
                                                    : 'bg-white border-gray-100 hover:border-[#0096b1]/50'}`}>
                                            <div className="flex items-center gap-2">
                                                {u.practice_locked && <Lock size={15} className="shrink-0 text-[#eb7e37]" />}
                                                <p className="text-[17px] font-bold break-words text-[#2b5356]">
                                                    {u.title}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {`${u.practice_count} practice items`}
                                                {u.practice_locked && ' · viewable, VIP needed to practise'}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {pageCount > 1 && (
                                <nav className="flex items-center justify-between gap-3 flex-wrap">
                                    <button type="button" disabled={safePage === 1}
                                        onClick={() => setPage(safePage - 1)}
                                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border-2
                                                   border-gray-200 text-sm font-bold text-[#2b5356]
                                                   hover:border-gray-300 disabled:opacity-40">
                                        <ChevronLeft size={16} /> Previous
                                    </button>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                                            <button key={n} type="button" onClick={() => setPage(n)}
                                                className={`w-9 h-9 rounded-lg text-sm font-bold ${n === safePage
                                                    ? 'bg-[#0096b1] text-white'
                                                    : 'border-2 border-gray-200 text-[#2b5356] hover:border-gray-300'}`}>
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                    <button type="button" disabled={safePage === pageCount}
                                        onClick={() => setPage(safePage + 1)}
                                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border-2
                                                   border-gray-200 text-sm font-bold text-[#2b5356]
                                                   hover:border-gray-300 disabled:opacity-40">
                                        Next <ChevronLeft size={16} className="rotate-180" />
                                    </button>
                                </nav>
                            )}
                            {list.free_units != null && (
                                <p className="text-sm text-gray-500">
                                    Free accounts can practise the first {list.free_units} lessons; later lessons can still be
                                    read. VIP unlocks practice for every lesson.
                                </p>
                            )}
                        </>
                    )
                )}

                {openId && !unit && (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="animate-spin text-[#0096b1]" size={26} />
                    </div>
                )}

                {openId && unit && (
                    <>
                        <section className="bg-white rounded-2xl border-2 border-gray-100 p-5 sm:p-6">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-[#2b5356] mb-3">
                                <BookOpen size={19} className="text-[#0096b1]" /> Theory
                            </h2>
                            {unit.theory ? (
                                <p className="text-[16px] text-gray-700 leading-[1.8] whitespace-pre-line break-words">
                                    {renderBold(unit.theory)}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400">This lesson has no theory yet.</p>
                            )}
                        </section>

                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <h2 className="text-lg font-bold text-[#2b5356]">Practice</h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Quota quota={unit.quota} />
                                {/* "Refresh practice items" — quyền VIP (feedback 09/09).
                                    Bộ mới là của RIÊNG học viên này, không đổi bài của cả lớp. */}
                                <button type="button" disabled={refreshing}
                                    onClick={() => (unit.refresh_locked ? navigate('/vip-packages') : refresh())}
                                    title={unit.refresh_locked ? 'VIP accounts only' : undefined}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold
                                                border-2 disabled:opacity-50 ${unit.refresh_locked
                                            ? 'text-gray-400 border-gray-200'
                                            : 'text-[#eb7e37] border-[#eb7e37]/40 hover:border-[#eb7e37]'}`}>
                                    {refreshing ? <Loader2 className="animate-spin" size={15} />
                                        : unit.refresh_locked ? <Lock size={15} /> : <RefreshCw size={15} />}
                                    Refresh practice items
                                </button>
                            </div>
                        </div>

                        {unit.personalised && (
                            <p className="text-xs text-gray-500 -mt-1">
                                This is your own practice set, freshly generated by the AI for this lesson.
                            </p>
                        )}

                        {unit.quota && unit.quota.remaining === 0 && (
                            <div className="rounded-2xl bg-white border-2 border-[#eb7e37]/30 p-5 flex items-start gap-3">
                                <Crown className="text-[#eb7e37] shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-bold text-[#2b5356]">No practices left today</p>
                                    <p className="text-sm text-gray-600 mt-0.5 mb-3">
                                        Free accounts get {unit.quota.limit} practices per day. VIP is unlimited.
                                    </p>
                                    <button onClick={() => navigate('/vip-packages')}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#eb7e37]
                                                   text-white font-bold hover:bg-[#d86f2b]">
                                        <Crown size={17} /> Upgrade to VIP
                                    </button>
                                </div>
                            </div>
                        )}

                        {!unit.items.length ? (
                            <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center text-gray-500">
                                This lesson has no practice items yet.
                            </div>
                        ) : (
                            <ul className="space-y-2.5">
                                {unit.items.map((it, i) => (
                                    <PracticeItem key={it.item_id} item={it} index={i}
                                        locked={!!unit.practice_locked}
                                        lockedMessage={unit.practice_locked_message}
                                        onScored={onScored} onQuotaError={setError} />
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default PronunciationLessons;
