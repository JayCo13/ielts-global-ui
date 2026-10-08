// Forecast Parts — luyện theo chủ đề dự đoán (docs/speaking-spec.md §7).
//
// Khác phòng thi Full Test ở chỗ KHÔNG tổ hợp đề: học viên chọn chủ đề nào thì luyện
// đúng chủ đề đó, và §7 bắt phải hiện danh sách câu hỏi TRƯỚC rồi mới có nút Bắt đầu.
// Vì thế trang này có hai tầng — danh sách chủ đề, rồi bảng chi tiết câu hỏi — chứ không
// bấm phát vào thẳng phòng thi.
//
// Phòng thi dùng lại nguyên `SpeakingRoom`: nó chỉ cần { attemptId, plan } qua router
// state, không quan tâm đề được tổ hợp hay được chọn tay.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Star, Loader2, Lock, Crown, AlertCircle, Play, X, Check, Wrench,
    Search, Target, Volume2, FileSearch, CalendarDays, Sparkles, PenLine,
} from 'lucide-react';
import { fetchForecast, fetchForecastTopic, startForecast, fetchSetup, examinerAudioUrl } from './speakingApi';
import ComposeSample from './ComposeSample';
import QuotaPills from './QuotaPills';
import AttemptHistory, { History } from './AttemptHistory';
import DifficultyBadge from '../../components/DifficultyBadge';

const SECTIONS = [
    { key: 'part1', label: 'Part 1', hint: 'Topics about yourself' },
    { key: 'part2', label: 'Part 2', hint: 'Cue card, speak for 1–2 minutes' },
    { key: 'part3', label: 'Part 3', hint: 'In-depth discussion questions' },
];

const SORTS = [
    { value: 'forecast', label: 'Important Levels', vipOnly: true },
    { value: 'newest', label: 'Newest', vipOnly: false },
    { value: 'title', label: 'Name A→Z', vipOnly: false },
];

/** Bốn mức dự đoán, cùng thang với Reading/Listening/Writing. */
/** Chú thích bốn mức dự đoán — cùng cách gọi với Listening / Reading / Writing. */
const FORECAST_LEGEND = [[4, 'Very Important'], [3, 'Important'], [2, 'Moderately Important'], [1, 'Slightly Important']];

const Legend = () => (
    <div className="flex items-center gap-3 flex-wrap rounded-xl bg-[#eb7e37]/8 border border-[#eb7e37]/25 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2b5356]">
            <Target size={15} className="text-[#eb7e37]" /> Important Levels:
        </span>
        {FORECAST_LEGEND.map(([n, label]) => (
            <span key={n} className="inline-flex items-center gap-1 text-sm text-gray-700">
                <span className="inline-flex">
                    {Array.from({ length: n }, (_, i) => (
                        <Star key={i} size={12} className="text-[#eb7e37] fill-[#eb7e37]" />
                    ))}
                </span>
                {label}
            </span>
        ))}
    </div>
);

const Stars = ({ level }) => (
    <span className="inline-flex items-center gap-0.5" title={`Important Level ${level || 0}/4`}>
        {[1, 2, 3, 4].map((n) => (
            <Star key={n} size={13}
                  className={n <= (level || 0) ? 'text-[#eb7e37] fill-[#eb7e37]' : 'text-gray-300'} />
        ))}
    </span>
);

const BandPill = ({ band }) => (
    <span className="px-2.5 py-1 rounded-lg bg-[#0096b1]/12 text-[#0096b1] text-sm font-bold tabular-nums">
        {Number(band).toFixed(1)}
    </span>
);

// feedback 08/09: chỗ nào hiện điểm cũng phải hiện 4 tiêu chí. Một con số 5.5 trần trụi
// không cho học viên biết mình yếu ở đâu.
const CRIT = [['fluency_coherence', 'F&C'], ['lexical_resource', 'LR'],
              ['grammar', 'GRA'], ['pronunciation', 'Pr']];

const CritScores = ({ scores }) => {
    if (!scores) return null;
    const shown = CRIT.filter(([k]) => scores[k] != null);
    if (!shown.length) return null;
    return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
            {shown.map(([k, lb]) => (
                <span key={k} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-semibold tabular-nums">
                    {lb} {Number(scores[k]).toFixed(1)}
                </span>
            ))}
        </span>
    );
};

const TopicCard = ({ topic, onOpen }) => (
    <button type="button" onClick={() => onOpen(topic)}
            className="w-full text-left bg-white rounded-xl border-2 border-gray-100 shadow-sm
                       hover:border-[#0096b1]/60 hover:shadow transition p-4">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <Stars level={topic.forecast_level} />
                    {topic.is_important && (
                        <span className="px-2 py-0.5 rounded-md bg-[#eb7e37]/10 text-[#eb7e37] text-[11px] font-semibold">
                            Key topic
                        </span>
                    )}
                    {/* Cùng nhãn độ khó với 3 kỹ năng kia. Chưa đủ lượt để xếp hạng thì
                        component tự không hiện gì, im lặng đúng hơn là "chưa rõ". */}
                    <DifficultyBadge label={topic.difficulty} />
                </div>
                <h3 className="mt-1.5 text-[17px] font-bold text-[#2b5356] leading-snug break-words">
                    {topic.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1.5">
                    {topic.question_count} questions
                    {topic.times_practised > 0 && ` · practised ${topic.times_practised}×`}
                </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
                {topic.best_band != null && <BandPill band={topic.best_band} />}
                <CritScores scores={topic.best_scores} />
                {topic.done && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <Check size={12} /> Done
                    </span>
                )}
            </div>
        </div>
    </button>
);

/** Bảng chi tiết: danh sách câu hỏi + nút luyện cả chủ đề hoặc từng câu (§7). */
const TopicDetail = ({ topicId, section, onClose, onStart, onOpenAnalysis, onCompose, onNeedVip, starting }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;
        setData(null); setError('');
        fetchForecastTopic(topicId, section)
            .then((d) => { if (alive) setData(d); })
            .catch((e) => { if (alive) setError(e.message); });
        return () => { alive = false; };
    }, [topicId, section]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[88vh] flex flex-col">
                <header className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0096b1] uppercase tracking-wide">
                            {SECTIONS.find((s) => s.key === section)?.label}
                        </p>
                        <h2 className="font-bold text-[#2b5356] leading-snug break-words">
                            {data?.title || 'Loading…'}
                        </h2>
                    </div>
                    <button onClick={onClose} aria-label="Close"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
                        <X size={20} />
                    </button>
                </header>

                <div className="overflow-y-auto p-5 grow">
                    {error && (
                        <p className="flex items-start gap-2 text-sm text-red-600">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
                        </p>
                    )}
                    {!data && !error && (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="animate-spin text-[#0096b1]" size={26} />
                        </div>
                    )}
                    {data && (
                        <ol className="space-y-2.5">
                            {data.questions.map((q, i) => (
                                <li key={q.question_id}
                                    className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                                    <span className="w-6 h-6 shrink-0 rounded-full bg-gray-100 text-gray-600
                                                     text-xs font-bold flex items-center justify-center tabular-nums">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 grow">
                                        <p className="text-[15px] text-gray-800 whitespace-pre-line break-words">
                                            {q.text}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            {q.times_practised > 0 ? (
                                                <span className="text-[11px] text-gray-500">
                                                    Practised {q.times_practised}×
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-gray-400">Not practised</span>
                                            )}
                                            {q.best_band != null && <BandPill band={q.best_band} />}
                                        </div>
                                        <div className="mt-1.5"><CritScores scores={q.best_scores} /></div>
                                    </div>
                                    <div className="shrink-0 flex flex-col gap-1.5">
                                        <button type="button" disabled={starting}
                                                onClick={() => onStart(data.topic_id, section, q.question_id)}
                                                className="px-3 py-1.5 rounded-lg text-sm font-bold
                                                           text-white bg-[#0096b1] hover:bg-[#007a90]
                                                           disabled:opacity-50">
                                            Practise this question
                                        </button>
                                        {/* Câu đã làm rồi thì phải sang thẳng được phần sửa bài của
                                            chính câu đó, không bắt vòng qua lịch sử bài thi. */}
                                          {/* Feedback 28/09: mở khung soạn bài cho MỌI câu, kể cả câu chưa
                        luyện — soạn trước rồi mới nói mới đúng thứ tự học. Không đưa sang
                        màn phân tích vì API ở đó trả 404 khi chưa có câu trả lời nào. */}
                    <button type="button"
                            onClick={() => (data.compose_locked ? onNeedVip() : onCompose(q))}
                            title={data.compose_locked ? 'VIP accounts only' : undefined}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2
                                        inline-flex items-center gap-1.5 ${
                                data.compose_locked
                                    ? 'text-gray-400 border-gray-200'
                                    : 'text-[#0096b1] border-[#0096b1]/35 hover:border-[#0096b1]'}`}>
                        {data.compose_locked ? <Lock size={14} /> : <PenLine size={14} />}
                        Write your own sample
                    </button>
                  {q.times_practised > 0 && (
                                            <button type="button"
                                                    onClick={() => (data.analysis_locked
                                                        ? onNeedVip() : onOpenAnalysis(q.question_id))}
                                                    title={data.analysis_locked ? 'VIP accounts only' : undefined}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold
                                                               border-2 inline-flex items-center gap-1.5 ${
                                                        data.analysis_locked
                                                            ? 'text-gray-400 border-gray-200'
                                                            : 'text-[#eb7e37] border-[#eb7e37]/35 hover:border-[#eb7e37]'}`}>
                                                {data.analysis_locked ? <Lock size={14} /> : <FileSearch size={14} />}
                                                View corrections
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                <footer className="p-5 border-t border-gray-100">
                    <button type="button" disabled={!data || starting}
                            onClick={() => onStart(data.topic_id, section, null)}
                            className="w-full py-3 rounded-xl bg-[#0096b1] text-white font-semibold
                                       hover:bg-[#007a90] disabled:opacity-50 flex items-center justify-center gap-2">
                        {starting ? <Loader2 className="animate-spin" size={18} />
                                  : <Play size={18} />}
                        Practise the whole topic{data ? ` (${data.questions.length} questions)` : ''}
                    </button>
                </footer>
            </div>
        </div>
    );
};

const SpeakingForecast = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Quay lại từ trang phân tích một câu thì bảng chủ đề phải mở lại y như lúc rời đi —
    // đúng Part, đúng chủ đề. Trang mount lại nên hai thứ đó đi kèm trong state của route.
    // Bài tập giáo viên giao trỏ tới đây bằng ĐƯỜNG DẪN (/speaking_forecast?topic=..&section=..)
    // chứ không phải route state — state không sống qua một lần mở link mới (feedback 28/09,
    // mục giao bài Speaking). Ưu tiên state (quay lại từ màn phân tích) rồi mới tới query.
    const linkParams = new URLSearchParams(location.search);
    const qSection = linkParams.get('section');
    const qTopic = Number(linkParams.get('topic')) || null;
    const [tab, setTab] = useState(
        ['part1', 'part2', 'part3'].includes(location.state?.section) ? location.state.section
            : ['part1', 'part2', 'part3'].includes(qSection) ? qSection : 'part1');
    const [sort, setSort] = useState('forecast');
    const [hideDone, setHideDone] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [locked, setLocked] = useState(false);      // 503 = Speaking đang khoá tạm
    const [open, setOpen] = useState(location.state?.openTopicId ?? qTopic);  // chủ đề đang mở
    // Câu đang mở khung soạn bài (feedback 28/09). Giữ cả object chứ không chỉ id vì khung
    // soạn cần hiện lại đề bài để học viên khỏi phải nhớ mình đang trả lời câu nào.
    const [composeQ, setComposeQ] = useState(null);
    const [starting, setStarting] = useState(false);
    const [query, setQuery] = useState('');           // tìm theo tên chủ đề
    const [voices, setVoices] = useState([]);         // chọn giọng ngay ở đây, không phải
    const [voice, setVoice] = useState('');           // quay về màn thi thử mới đổi được
    const [months, setMonths] = useState([]);         // tháng thi có đề Forecast
    const [month, setMonth] = useState('');
    const previewRef = useRef(null);                  // nghe thử giọng ngay tại chỗ

    const load = useCallback(() => {
        setLoading(true); setError('');
        fetchForecast({ sort, hideDone, month })
            .then((d) => { setData(d); setSort(d.sort); })
            .catch((e) => { if (e.status === 503) setLocked(true); else setError(e.message); })
            .finally(() => setLoading(false));
    }, [sort, hideDone, month]);

    useEffect(() => { load(); }, [load]);

    // Giọng giám khảo cũng phải chọn được ở đây (feedback 06/09): luyện theo chủ đề là
    // một nhánh riêng, không ai muốn quay về màn thi thử chỉ để đổi giọng.
    useEffect(() => {
        fetchSetup()
            .then((d) => {
                setVoices(d.voices || []); setVoice(d.default_voice || '');
                setMonths(d.forecast_months || []);
            })
            .catch(() => {});
    }, []);

    // Bấm một giọng là chọn VÀ nghe thử luôn, giống màn thi thử (feedback 09/09: "chỗ
    // này chưa có đọc thử"). Dùng chính câu mở đầu của giám khảo — clip đã sinh sẵn cho
    // mọi giọng, nên không tốn thêm lượt gọi TTS nào.
    const pickVoice = (name) => {
        setVoice(name);
        const el = previewRef.current;
        if (!el) return;
        el.src = examinerAudioUrl('script:opening', name);
        el.play().catch(() => { /* chưa có clip cho giọng này thì thôi */ });
    };

    const start = async (topicId, section, questionId) => {
        setStarting(true);
        try {
            const res = await startForecast({
                topic_id: topicId, section, question_id: questionId, voice: voice || undefined,
            });
            navigate('/speaking_test', {
                state: { attemptId: res.attempt_id, plan: res.plan },
            });
        } catch (e) {
            setError(e.message);
            setOpen(null);
        } finally {
            setStarting(false);
        }
    };

    if (locked) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#eb7e37]/10 flex items-center justify-center mx-auto mb-5">
                        <Wrench className="text-[#eb7e37]" size={30} strokeWidth={2} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#2b5356] mb-3">Feature update in progress</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Speaking is being finished. Please check back in a few days.
                    </p>
                    <button onClick={() => navigate('/')}
                            className="px-6 py-2.5 rounded-lg bg-[#0096b1] text-white font-semibold hover:bg-[#007a90]">
                        Back to home
                    </button>
                </div>
            </div>
        );
    }

    // Lọc ngay trên máy: danh sách vài chục chủ đề, gọi lại máy chủ mỗi lần gõ là thừa.
    const match = (t) => !query.trim()
        || (t.title || '').toLowerCase().includes(query.trim().toLowerCase());
    const raw = data?.sections?.[tab];
    const section = raw && (raw.topics
        ? { ...raw, topics: raw.topics.filter(match) }
        : { ...raw, groups: (raw.groups || []).map((g) => ({ ...g, topics: g.topics.filter(match) }))
            .filter((g) => g.topics.length) });

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate('/speaking_list')} aria-label="Back"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                        <ChevronLeft size={22} />
                    </button>
                    <div>
                        <h1 className="font-bold text-[#2b5356]">Speaking Focus</h1>
                        <p className="text-xs text-gray-500">
                            Pick a topic to practise — every question is asked; this does not count as a mock test
                        </p>
                    </div>
                    {/* Cùng bộ pill với màn chuẩn bị thi: luyện theo đề dự đoán tiêu
                        CHUNG cả lượt thi lẫn lượt chấm với thi thử. */}
                    <div className="ml-auto shrink-0"><QuotaPills info={data} /></div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 pt-4">
                <div className="flex gap-2">
                    {SECTIONS.map((s) => (
                        <button key={s.key} onClick={() => setTab(s.key)}
                                className={`px-5 py-2.5 rounded-xl text-base font-bold transition ${
                                    tab === s.key ? 'bg-[#0096b1] text-white'
                                                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0096b1]/40'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    {SECTIONS.find((s) => s.key === tab)?.hint}
                </p>

                {!!voices.length && (
                    <div className="mt-3 rounded-xl bg-white border-2 border-gray-100 px-4 py-3">
                        <audio ref={previewRef} className="hidden" />
                        <p className="text-sm font-bold text-[#2b5356] mb-1 inline-flex items-center gap-1.5">
                            <Volume2 size={15} className="text-[#0096b1]" /> Examiner voice
                        </p>
                        <p className="text-xs text-gray-500 mb-2">Click a voice to preview it.</p>
                        <div className="flex flex-wrap gap-1.5">
                            {voices.map((v) => (
                                <button key={v.name} type="button" onClick={() => pickVoice(v.name)}
                                        title={`Preview ${v.label || v.name}`}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${
                                            voice === v.name
                                                ? 'border-[#0096b1] bg-[#0096b1]/8 text-[#0096b1]'
                                                : 'border-gray-200 text-gray-600 hover:border-[#0096b1]/50'}`}>
                                    <Volume2 size={12} className="inline mr-1 -mt-0.5 opacity-70" />
                                    {v.label || v.name}
                                    <span className="ml-1 text-xs opacity-60">{v.accent_label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        {SORTS.map((s) => {
                            const blocked = s.vipOnly && data?.sort_locked;
                            return (
                                <button key={s.value} disabled={blocked}
                                        onClick={() => setSort(s.value)}
                                        title={blocked ? 'Sorting by Important Levels is for VIP accounts' : undefined}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                                            sort === s.value ? 'bg-[#2b5356] text-white'
                                                             : 'bg-white text-gray-600 border border-gray-200'} ${
                                            blocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {blocked && <Lock size={11} />}{s.label}
                                </button>
                            );
                        })}
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={hideDone}
                               onChange={(e) => setHideDone(e.target.checked)}
                               className="rounded border-gray-300 text-[#0096b1] focus:ring-[#0096b1]" />
                        Hide topics already done
                    </label>
                </div>

                <div className="mt-4"><Legend /></div>

                <div className="relative mt-3">
                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search topics by name…"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-gray-200 text-[15px]
                                   focus:border-[#0096b1] focus:ring-1 focus:ring-[#0096b1] outline-none"
                    />
                </div>

                {/* Forecast theo tháng thi — giống màn thi thử. Ngân hàng đề gắn cửa sổ
                    xuất hiện theo tháng, nên ai sắp thi tháng nào cần lọc đúng tháng đó. */}
                {!!months.length && (
                    <div className="mt-3 rounded-xl bg-white border-2 border-gray-100 px-4 py-3">
                        <p className="text-sm font-bold text-[#2b5356] mb-2 inline-flex items-center gap-1.5">
                            <CalendarDays size={15} className="text-[#eb7e37]" /> Focus by exam month
                            {data?.month_locked && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#eb7e37]">
                                    <Crown size={12} /> VIP
                                </span>
                            )}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setMonth('')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${
                                        !month ? 'border-[#eb7e37] bg-[#eb7e37]/8 text-[#eb7e37]'
                                               : 'border-gray-200 text-gray-600 hover:border-[#eb7e37]/50'}`}>
                                All
                            </button>
                            {months.map((m) => (
                                <button key={m} type="button" disabled={data?.month_locked}
                                        onClick={() => setMonth(m)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${
                                            month === m ? 'border-[#eb7e37] bg-[#eb7e37]/8 text-[#eb7e37]'
                                                        : 'border-gray-200 text-gray-600 hover:border-[#eb7e37]/50'}`}>
                                    {m.split('-')[1]}/{m.split('-')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {data?.sort_locked && (
                    <p className="mt-3 flex items-center gap-2 text-xs text-[#eb7e37] bg-[#eb7e37]/10 rounded-lg px-3 py-2">
                        <Crown size={14} className="shrink-0" />
                        Sorting by Important Levels is for VIP accounts.
                    </p>
                )}

                {error && (
                    <p className="mt-4 flex items-start gap-2 text-sm text-red-600">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
                    </p>
                )}

                {loading ? (
                    <div className="py-16 flex justify-center">
                        <Loader2 className="animate-spin text-[#0096b1]" size={30} />
                    </div>
                ) : (
                    <div className="mt-5 space-y-6">
                        {/* Part 1 phẳng; Part 2 và Part 3 chia 6 nhóm chủ đề (§7). */}
                        {section?.topics && (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {section.topics.map((t) => (
                                    <TopicCard key={t.topic_id} topic={t}
                                               onOpen={(x) => setOpen(x.topic_id)} />
                                ))}
                            </div>
                        )}
                        {section?.groups?.map((g) => (
                            <section key={g.key}>
                                <h2 className="text-xl font-bold text-[#2b5356] mb-3">
                                    {g.label}
                                    <span className="ml-2 text-sm font-medium text-gray-500">
                                        {g.topics.length} topics
                                    </span>
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {g.topics.map((t) => (
                                        <TopicCard key={t.topic_id} topic={t}
                                                   onOpen={(x) => setOpen(x.topic_id)} />
                                    ))}
                                </div>
                            </section>
                        ))}
                        {!section?.topics?.length && !section?.groups?.length && (
                            <p className="py-16 text-center text-sm text-gray-500">
                                {query.trim() ? `No topics match “${query.trim()}”.`
                                    : hideDone ? 'You have practised every topic in this part.'
                                               : 'No focus topics for this part yet.'}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Lịch sử RIÊNG của nhánh luyện theo dự đoán — không trộn với bài thi thử. */}
            <div className="max-w-5xl mx-auto px-4 mt-8">
                <h2 className="text-xl font-bold text-[#2b5356] mb-3 inline-flex items-center gap-2">
                    <History size={18} className="text-[#0096b1]" /> Practice history
                </h2>
                <AttemptHistory kind="forecast" />
            </div>

            {open != null && (
                <TopicDetail topicId={open} section={tab} starting={starting}
                             onClose={() => setOpen(null)} onStart={start}
                             onOpenAnalysis={(qid) => navigate('/speaking_question', {
                                 state: {
                                     questionId: qid,
                                     back: { to: '/speaking_forecast',
                                             state: { openTopicId: open, section: tab } },
                                 },
                             })}
                             onCompose={setComposeQ}
                             onNeedVip={() => navigate('/vip-packages')} />
            )}

            {/* Khung soạn bài mẫu, mở đè lên bảng chủ đề (z cao hơn) để đóng lại là về
                đúng danh sách câu vừa xem, không mất chỗ. */}
            {composeQ && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
                     onClick={() => setComposeQ(null)}>
                    <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
                         onClick={(e) => e.stopPropagation()}>
                        <header className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3.5 flex items-start gap-3">
                            <div className="min-w-0 grow">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0096b1]">
                                    Write your own sample
                                </p>
                                <p className="text-[15px] text-gray-800 mt-0.5 break-words">{composeQ.text}</p>
                            </div>
                            <button type="button" onClick={() => setComposeQ(null)}
                                    className="shrink-0 p-1.5 -mr-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                                <X size={18} />
                            </button>
                        </header>
                        <div className="p-5">
                            <ComposeSample questionId={composeQ.question_id} seedText="" locked={false} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpeakingForecast;
