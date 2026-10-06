// Chi tiết một câu hỏi — nơi học viên thực sự học (docs/speaking-spec.md §6.2–§6.7).
//
// Trang này gom sáu mục của spec vào một chỗ vì chúng nói về CÙNG một câu: bài đã nói,
// lỗi AI bắt được, câu mẫu, lịch sử qua các lần, các cách cải thiện, và luyện phát âm.
//
// Ràng buộc chi phối cách bố trí: §6.8 — không gọi AI chỉ vì học viên mở trang. Nên phần
// nào tốn tiền đều nằm sau một nút, và target band phải chọn TRƯỚC khi bấm.
// §6.4 cũng nói rõ menu cải thiện "không hiện hết mặc định", nên nó là menu xổ.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronDown, Loader2, AlertCircle, Play, Star, Mic, MicOff, Square,
    Sparkles, Lightbulb, Volume2, RotateCcw, History, Flag, Check, X, BookOpen, Headphones,
    PenLine,
} from 'lucide-react';
import {
    fetchQuestionAnalysis, markQuestionViewed, chooseSampleAnswer, improveAnswer,
    answerFromIdeas, scorePronunciation, modelAudioUrl, recordingUrl, startForecast,
    chooseAiSample, fetchShadowQuota, scoreShadowing,
    reportSpeakingError,
} from './speakingApi';
import ComposeSample from './ComposeSample';
import { createRecorder } from './recorder';
import Outline from './Outline';
import WordStress from './WordStress';
import BandBadge from './BandBadge';
import SelectionMenu from './SelectionMenu';

// Bốn mức mục tiêu theo bản feedback 23/09 (mức thấp nhất đổi 4.5-5.5 → 5.0-5.5).
const BANDS = ['5.0-5.5', '6.0-6.5', '7.0-7.5', '8.0-9.0'];

// Năm chiều của AI Shadowing, đúng thứ tự và cách gọi trong feedback.
const SHADOW_LABEL = {
    pronunciation: 'Pronunciation: wrong sounds or words',
    word_stress: 'Word Stress: stress on the wrong syllable',
    sentence_stress: 'Sentence Stress: the wrong words emphasised',
    intonation: 'Intonation: pitch movement sounds unnatural',
    connected_speech: 'Connected Speech: linking and weak forms sound unnatural',
    rhythm_fluency: 'Rhythm & Fluency: pausing and pace',
};

const CRITERIA_LABEL = {
    pronunciation: 'Pronunciation',
    fluency_coherence: 'Fluency & Coherence',
    lexical_resource: 'Lexical Resource',
    grammar: 'Grammar',
};

// §6.7 — bộ loại lỗi riêng của Speaking, khoá phải khớp VALID_ERROR_TYPES ở backend.
const ERROR_TYPES = [
    ['spelling', 'Spelling mistake in the question'],
    ['question_problem', 'Problem with the question'],
    ['score_fluency', 'Fluency & Coherence score is wrong'],
    ['score_lexical', 'Lexical Resource score is wrong'],
    ['score_grammar', 'Grammar score is wrong'],
    ['score_pronunciation', 'Pronunciation score is wrong'],
    ['wrong_error_detection', 'AI flagged errors incorrectly'],
    ['wrong_feedback', 'Feedback is inaccurate'],
    ['other', 'Other'],
];

// Điểm band dùng chung huy hiệu BandBadge — xem ghi chú trong file đó.
const Band = ({ value }) => <BandBadge band={value} size="sm" />;

const Section = ({ title, icon: Icon, children, note, action }) => (
    <section className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-start gap-3">
            <h2 className="grow min-w-0 flex items-center gap-2 text-lg font-bold text-[#2b5356]">
                {Icon && <Icon size={19} className="text-[#0096b1] shrink-0" />}{title}
            </h2>
            {action}
        </div>
        {note && <p className="text-sm text-gray-500 mt-1">{note}</p>}
        <div className="mt-4">{children}</div>
    </section>
);

/**
 * Một công cụ trong thanh bên hông.
 *
 * Bản đầu là menu xổ dọc: sáu mục chồng lên nhau, mở cái này phải cuộn qua cái kia mới
 * thấy nội dung. Feedback nói thẳng "để xổ xuống rất khó dùng, kiểu nó là một bộ công cụ".
 * Nên giờ chỉ hiện đúng công cụ đang chọn, còn danh sách nằm ở cột bên trái — nhìn một
 * cái là biết có những gì.
 */
const Panel = ({ title, icon: Icon, open, children }) => (!open ? null : (
    <div>
        <h3 className="flex items-center gap-2 text-lg font-bold text-[#2b5356] mb-3">
            {Icon && <Icon size={18} className="text-[#0096b1]" />}{title}
        </h3>
        {children}
    </div>
));

// Số ô tối đa của một danh sách khi đang xem bản rút gọn: 2 từ vựng, 2 bài mẫu, 2 đoạn
// dàn bài. Mở "Xem chi tiết" thì hiện đủ.
const TOOL_ITEMS = 2;

// true khi nội dung đang nằm trong hộp thoại "Xem chi tiết". Đi bằng context vì thứ cần
// biết (danh sách nào cắt bớt) nằm sâu trong JSX của trang, mà ToolContent thì bọc từ
// ngoài — chuyền prop qua từng tầng chỉ để nói đúng một chữ đúng/sai thì không đáng.
const ToolFullCtx = createContext(false);

/** Một danh sách tự cắt còn TOOL_ITEMS ô, trừ khi đang ở trong hộp thoại. */
const Clamped = ({ items, render }) => {
    const full = useContext(ToolFullCtx);
    return <>{(full ? items : items.slice(0, TOOL_ITEMS)).map(render)}</>;
};

/** Phần chỉ xuất hiện trong hộp thoại, bản rút gọn thì giấu hẳn. */
const OnlyFull = ({ children }) => (useContext(ToolFullCtx) ? children : null);

/** Dàn bài, cắt bớt theo cùng một luật. */
const OutlineBox = ({ part, data }) => {
    const full = useContext(ToolFullCtx);
    return <Outline part={part} data={data} max={full ? undefined : TOOL_ITEMS} />;
};

// Cao hơn ngần này thì cắt bớt. Chọn theo màn 13" — vừa đủ thấy hết một bài AI viết lại
// cỡ trung bình mà không đẩy Lịch sử ra khỏi tầm mắt.
const TOOL_MAX_H = 460;

/**
 * Vỏ của nội dung công cụ. Ngắn thì hiện nguyên; dài thì cắt ở TOOL_MAX_H, làm mờ dần ở
 * mép dưới và đưa ra nút "Xem chi tiết" mở hộp thoại đọc trọn.
 *
 * Đo chiều cao thật chứ không liệt kê trước công cụ nào dài: cùng một công cụ, "Từ vựng"
 * 6 từ với 24 từ khác hẳn nhau, mà bài AI viết lại thì dài ngắn tuỳ câu.
 *
 * Lúc mở hộp thoại thì bản cắt được gỡ đi — không render nội dung hai lần, tránh hai
 * textarea hay hai nút ghi âm cùng sống một lúc.
 */
const ToolContent = ({ children, more }) => {
    const [full, setFull] = useState(false);
    const [long, setLong] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const check = () => setLong(el.scrollHeight > TOOL_MAX_H + 48);
        check();
        // AI trả kết quả về là nội dung dài ra ngay tại chỗ, không có lần render mới nào
        // để bắt — nên theo dõi kích thước thay vì đo một lần.
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [full]);

    // Mở rộng NGAY TẠI CHỖ, không bật hộp thoại (user chốt 14/09: "thay vì bấm ra bảng
    // rất khó thao tác, tất cả design lại là xổ xuống dưới và thu gọn lại"). Hộp thoại
    // che mất bài nói ở bên trái, mà đó lại là thứ cần nhìn cùng lúc với từ vựng hay nhận
    // xét; đóng vào rồi thì mất dấu đang đọc tới đâu.
    if (full) {
        return (
            <>
                <ToolFullCtx.Provider value>{children}</ToolFullCtx.Provider>
                <button type="button" onClick={() => setFull(false)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl
                                   border-2 border-[#0096b1]/30 text-[#0096b1] text-sm font-bold
                                   hover:bg-[#0096b1]/8 transition">
                    <ChevronDown size={15} className="rotate-180" /> Show less
                </button>
            </>
        );
    }
    // `more` = danh sách bên trong đã bị cắt bớt ô. Không có nó thì bản rút gọn ngắn tũn,
    // `long` bằng false, và nút mở rộng biến mất đúng lúc cần nó nhất.
    const cut = long || more;
    return (
        <>
            <div className="relative" style={long ? { maxHeight: TOOL_MAX_H, overflow: 'hidden' } : undefined}>
                <div ref={ref}>{children}</div>
                {long && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20
                                    bg-gradient-to-t from-white to-transparent" />
                )}
            </div>
            {cut && (
                <button type="button" onClick={() => setFull(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl
                                   border-2 border-[#0096b1]/30 text-[#0096b1] text-sm font-bold
                                   hover:bg-[#0096b1]/8 transition">
                    <ChevronDown size={15} /> Show more
                </button>
            )}
        </>
    );
};

const TOOLS = [
    ['retry', 'Answer again', RotateCcw],
    ['improve', 'Improve with AI', Sparkles],
    ['compose', 'Write your own sample', PenLine],
    ['ideas', 'Build an answer from ideas', Lightbulb],
    ['outline', 'Outline & sample answers', BookOpen],
    ['vocab', 'Topic vocabulary', BookOpen],
    ['pron', 'Pronunciation practice', Volume2],
    ['shadow', 'AI Shadowing', Headphones],
];

const BandPicker = ({ value, onChange }) => (
    // Lưới 2×2 chứ không để hàng ngang tự xuống dòng: trong cột phải 400px nó vỡ thành
    // 3 + 1, mức cuối trơ trọi một mình nhìn như lỗi hiển thị.
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5">
        {BANDS.map((b) => (
            <button key={b} type="button" onClick={() => onChange(b)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition ${
                        value === b ? 'bg-[#eb7e37] text-white border-[#eb7e37]'
                                    : 'bg-white text-[#2b5356] border-gray-200 hover:border-[#eb7e37]/60'}`}>
                {b}
            </button>
        ))}
    </div>
);

/**
 * Transcript có tô lỗi (§6.2). Mỗi lỗi AI trả về đều kèm trích dẫn NGUYÊN VĂN phần sai,
 * nên chỉ cần tìm chuỗi đó trong transcript rồi bọc lại — không đoán vị trí.
 * Phần không khớp thì lỗi vẫn hiện ở danh sách dưới, chỉ là không tô được.
 */
const Transcript = ({ text, errors, onPick }) => {
    if (!text) return <p className="text-sm text-gray-400">No content.</p>;
    const marks = [];
    (errors || []).forEach((e, i) => {
        const needle = (e.incorrect || '').trim();
        if (!needle) return;
        const at = text.indexOf(needle);
        if (at >= 0) marks.push({ at, len: needle.length, index: i, err: e });
    });
    marks.sort((a, b) => a.at - b.at);

    const out = [];
    let cursor = 0;
    marks.forEach((m) => {
        if (m.at < cursor) return;                       // hai lỗi chồng nhau: giữ lỗi đầu
        if (m.at > cursor) out.push(<span key={`t${cursor}`}>{text.slice(cursor, m.at)}</span>);
        out.push(
            <button key={`e${m.index}`} type="button" onClick={() => onPick(m.err)}
                    className="rounded px-0.5 bg-red-50 text-red-600 underline decoration-red-300
                               decoration-wavy underline-offset-2 hover:bg-red-100">
                {text.slice(m.at, m.at + m.len)}
            </button>,
        );
        cursor = m.at + m.len;
    });
    if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>);
    return <p className="text-[17px] text-gray-800 leading-[1.75] whitespace-pre-line">{out}</p>;
};

const SpeakingQuestionDetail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const questionId = location.state?.questionId;
    // Quay lại phải về ĐÚNG bước trước — tab "Phân tích" của màn kết quả, hay bảng chủ đề
    // đang mở ở trang Forecast — chứ không phải tab mặc định của trang đó. `navigate(-1)`
    // chỉ lùi một bước lịch sử: trang kia mount lại nên tab, chủ đề đang mở đều reset.
    // Vì thế nơi đến được nói rõ bằng `state.back` ngay lúc mở trang này.
    const back = location.state?.back;
    const goBack = () => (back ? navigate(back.to, { state: back.state }) : navigate(-1));

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [openDrawer, setOpenDrawer] = useState('improve');
    const [sampleOpen, setSampleOpen] = useState(false);   // khối câu mẫu xổ xuống
    const [historyOpen, setHistoryOpen] = useState(false);  // khối lịch sử xổ xuống
    const [noteOpen, setNoteOpen] = useState(false);        // nhận xét chung xổ xuống
    const [picked, setPicked] = useState(null);          // lỗi đang xem giải thích
    const [openCriterion, setOpenCriterion] = useState(null);  // tiêu chí đang mở ở câu này
    const [busy, setBusy] = useState('');

    // §6.4
    const [targetBand, setTargetBand] = useState('6.0-6.5');
    const [improved, setImproved] = useState(null);
    const [ideas, setIdeas] = useState('');
    const [fromIdeas, setFromIdeas] = useState(null);

    // §6.5
    const [vocabBand, setVocabBand] = useState(BANDS[1]);
    const [practiceText, setPracticeText] = useState('');
    const [recording, setRecording] = useState(false);
    const [pronScore, setPronScore] = useState(null);
    // Lỗi của khung luyện phát âm phải hiện NGAY TRONG khung. Bản đầu đẩy hết lên ô lỗi
    // ở đầu trang, mà học viên đang cuộn ở cuối trang — bấm nút thấy không có gì xảy ra,
    // đúng cái team báo là "luyện phát âm chưa chạy".
    const [pronError, setPronError] = useState('');
    // AI Shadowing — luyện cả đoạn, một lượt mỗi ngày.
    const [shadowText, setShadowText] = useState('');
    const [shadowRec, setShadowRec] = useState(false);
    const [shadowOut, setShadowOut] = useState(null);
    const [shadowErr, setShadowErr] = useState('');
    const [shadowLeft, setShadowLeft] = useState(undefined);   // undefined = chưa biết
    const shadowRef = useRef(null);
    const [recSec, setRecSec] = useState(0);
    const recRef = useRef(null);
    const audioRef = useRef(null);

    // §6.7
    const [reportOpen, setReportOpen] = useState(false);
    const [reportTypes, setReportTypes] = useState([]);
    const [reportNote, setReportNote] = useState('');
    const [reportDone, setReportDone] = useState(false);

    const load = useCallback(() => {
        if (!questionId) { setError('There is no question to show.'); setLoading(false); return; }
        setLoading(true);
        fetchQuestionAnalysis(questionId)
            .then((d) => {
                setData(d);
                setPracticeText(d.question_text || '');
                setShadowText((d.sample && d.sample.text) || d.current.text || d.question_text || '');
                // §6.1: mở là đánh dấu đã xem, nhưng phải LƯU LẠI — nên gọi lên máy chủ.
                if (!d.viewed) markQuestionViewed(questionId).catch(() => {});
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [questionId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { fetchShadowQuota().then((q) => setShadowLeft(q.remaining)).catch(() => {}); }, []);
    useEffect(() => () => { if (recRef.current) recRef.current.dispose(); }, []);

    // Đồng hồ khi đang ghi: học viên phải THẤY là máy đang nghe mình nói.
    useEffect(() => {
        if (!recording) return undefined;
        const t = setInterval(() => setRecSec((n) => n + 1), 1000);
        return () => clearInterval(t);
    }, [recording]);

    const play = (url) => {
        if (!audioRef.current) return;
        audioRef.current.src = url;
        audioRef.current.play().catch(() => setError('Could not play the recording.'));
    };

    const runImprove = async () => {
        setBusy('improve'); setImproved(null);
        try {
            setImproved(await improveAnswer(questionId, {
                answerId: data.current.answer_id, targetBand,
            }));
        } catch (e) { setError(e.message); } finally { setBusy(''); }
    };

    const runIdeas = async () => {
        setBusy('ideas'); setFromIdeas(null);
        try {
            setFromIdeas(await answerFromIdeas(questionId, { ideas, targetBand }));
        } catch (e) { setError(e.message); } finally { setBusy(''); }
    };

    /** §6.4 "Trả lời lại": đi đúng đường luyện một câu của §7 để câu mới được chấm và vào lịch sử. */
    const retryAnswer = async () => {
        setBusy('retry');
        try {
            const res = await startForecast({
                topic_id: data.topic_id, section: data.retry_section, question_id: questionId,
            });
            navigate('/speaking_test', { state: { attemptId: res.attempt_id, plan: res.plan } });
        } catch (e) { setError(e.message); setBusy(''); }
    };

    /** Đổi lý do kỹ thuật thành câu người dùng làm được gì với nó. */
    const micReason = (name) => {
        if (name === 'NotAllowedError' || name === 'SecurityError') {
            return 'Your browser is blocking the microphone. Click the lock icon next to the address bar, '
                + 'allow Microphone, then reload the page.';
        }
        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
            return 'No microphone was found. Plug in a headset with a mic or check your recording device.';
        }
        if (name === 'NotReadableError') {
            return 'The microphone is being used by another app (Zoom, Meet…). Close it and try again.';
        }
        if (name === 'unsupported') {
            return 'This browser cannot record audio. Try a recent version of Chrome or Safari.';
        }
        return 'Could not open the microphone. Try reloading the page, or use a recent Chrome / Safari.';
    };

    const stopRecording = async () => {
        setRecording(false);
        const rec = recRef.current;
        recRef.current = null;
        if (!rec) return;
        setBusy('pron');
        // Bọc CẢ luồng, không chỉ lời gọi mạng. Bản trước chỉ bọc `scorePronunciation`,
        // nên một lỗi lập trình ngay trước đó (gọi nhầm tên hàm dọn dẹp) văng ra ngoài và
        // chết lặng — nút bấm không phản ứng gì, không báo lỗi, không gửi gì lên máy chủ.
        try {
            const { blob } = await rec.stop();
            try { rec.dispose(); } catch (e) { /* dọn dẹp hỏng không được chặn việc chấm */ }
            if (!blob || !blob.size) {
                setPronError('No sound was recorded. Check your microphone and try again.');
                return;
            }
            setPronScore(await scorePronunciation(practiceText, blob, 'webm'));
        } catch (e) {
            setPronError(e.message || 'Could not score the recording. Please try again.');
        } finally { setBusy(''); }
    };

    const startRecording = async () => {
        setPronScore(null); setPronError(''); setRecSec(0);
        // Hộp thoại xin quyền của trình duyệt có thể đứng chờ khá lâu, hoặc bị bỏ qua nếu
        // người dùng không để ý. Báo trạng thái ngay để nút không "bấm mà im".
        setBusy('mic');
        const rec = createRecorder();
        const ok = await rec.init();
        setBusy('');
        if (!ok) { setPronError(micReason(rec.lastError)); return; }
        recRef.current = rec;
        rec.start(() => {});
        setRecording(true);
    };

    const toggleRecording = () => (recording ? stopRecording() : startRecording());

    const keepAsSample = async (text) => {
        if (!text) return;
        setBusy('pickai');
        try {
            await chooseAiSample(questionId, text);
            load();
        } catch (e) { setError(e.message); } finally { setBusy(''); }
    };

    const toggleShadow = async () => {
        if (shadowRec) {
            setShadowRec(false);
            const rec = shadowRef.current; shadowRef.current = null;
            if (!rec) return;
            setBusy('shadow');
            try {
                const { blob } = await rec.stop();
                try { rec.dispose(); } catch (e) { /* xem ghi chú ở stopRecording */ }
                if (!blob || !blob.size) { setShadowErr('No sound was recorded.'); return; }
                const out = await scoreShadowing(shadowText, blob, 'webm');
                setShadowOut(out);
                setShadowLeft(out.remaining);
            } catch (e) {
                setShadowErr(e.message || 'Could not score the recording. Please try again.');
            } finally { setBusy(''); }
            return;
        }
        setShadowOut(null); setShadowErr('');
        setBusy('mic');
        const rec = createRecorder();
        const ok = await rec.init();
        setBusy('');
        if (!ok) { setShadowErr(micReason(rec.lastError)); return; }
        shadowRef.current = rec;
        rec.start(() => {});
        setShadowRec(true);
    };

    const pickSample = async (answerId) => {
        try {
            await chooseSampleAnswer(questionId, answerId);
            load();
        } catch (e) { setError(e.message); }
    };

    const sendReport = async () => {
        setBusy('report');
        try {
            await reportSpeakingError({
                skill: 'speaking',
                exam_title: (data.question_text || '').slice(0, 250),
                error_types: reportTypes,
                wrong_answer_questions: String(questionId),
                description: reportNote,
            });
            setReportDone(true); setReportOpen(false);
            setReportTypes([]); setReportNote('');
        } catch (e) { setError(e.message); } finally { setBusy(''); }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#0096b1]" size={32} />
            </div>
        );
    }
    if (error && !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
                    <AlertCircle className="mx-auto text-[#eb7e37] mb-4" size={30} />
                    <p className="text-gray-700 mb-6">{error}</p>
                    <button onClick={goBack}
                            className="px-6 py-2.5 rounded-lg bg-[#0096b1] text-white font-semibold hover:bg-[#007a90]">
                        Back
                    </button>
                </div>
            </div>
        );
    }

    const cur = data.current;
    const vocabShown = data.vocabulary.filter((v) => v.band_level === vocabBand);
    // Công cụ đang mở có danh sách bị cắt bớt ô hay không — để ToolContent biết mà vẫn
    // đưa ra nút "Xem chi tiết" kể cả khi bản rút gọn thấp hơn ngưỡng chiều cao.
    const toolMore =
        (openDrawer === 'vocab' && vocabShown.length > TOOL_ITEMS)
        || (openDrawer === 'outline' && (
            !!Object.keys(data.band_samples || {}).length
            || (data.outline?.explanation || []).length > TOOL_ITEMS
            || (data.outline?.cue_cards || []).length > TOOL_ITEMS));

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <audio ref={audioRef} className="hidden" />

            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-[1360px] mx-auto px-4 py-2 flex items-center">
                    <button onClick={goBack}
                            className="inline-flex items-center gap-1 pl-1.5 pr-3 py-1.5 rounded-lg
                                       text-sm font-semibold text-[#2b5356] hover:bg-gray-100 shrink-0">
                        <ChevronLeft size={20} /> Back
                    </button>
                </div>
            </header>

            {/* Bôi đen một từ bất kỳ trong bài nói, câu mẫu hay bài AI viết đều tra
                được từ điển và thêm vào New Words (feedback 06/09). */}
            <SelectionMenu source="speaking" className="max-w-[1360px] mx-auto px-4 pt-6 sm:pt-9 space-y-4">
                {/* Đề bài, số lần đã trả lời, điểm câu này và nút báo lỗi (user chốt
                    10/09). Trước đây cả cụm nằm trên thanh tiêu đề dính: câu hỏi dài thì
                    thanh cao lên, chiếm mất một phần màn hình suốt lúc cuộn, mà đề bài thì
                    chỉ cần đọc một lần. Giờ thanh trên chỉ giữ nút quay lại. */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm
                                p-5 sm:p-6 flex items-start gap-4">
                    <div className="grow min-w-0">
                        <p className="text-base sm:text-lg font-bold text-[#2b5356] break-words">
                            {data.question_text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Answered {data.times_answered}×
                        </p>
                    </div>
                    <Band value={cur.band} />
                    {/* §6.7 — báo lỗi đứng ngay cạnh đề bài. Trước đây nó nằm tít dưới
                        đáy trang, sau cả lịch sử trả lời: đúng lúc phát hiện đề sai thì
                        phải cuộn hết trang mới thấy nút. Bảng chọn lỗi thả xuống ngay
                        dưới nút, vẫn nhìn thấy câu hỏi đang báo. */}
                    <div className="relative shrink-0">
                        {reportDone ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                                <Check size={16} />
                                <span className="hidden sm:inline">Report sent</span>
                            </span>
                        ) : (
                            <button type="button" onClick={() => setReportOpen(!reportOpen)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                                text-sm font-semibold border-2 transition ${reportOpen
                                        ? 'text-red-600 bg-red-50 border-red-200'
                                        : 'text-red-600 border-red-200/70 hover:bg-red-50 hover:border-red-300'}`}>
                                <Flag size={15} />
                                <span className="hidden sm:inline">Report this question</span>
                            </button>
                        )}
                        {reportOpen && !reportDone && (
                            <div className="absolute right-0 top-full mt-2 z-30 w-[300px] sm:w-[340px]
                                            bg-white rounded-2xl border border-gray-100 shadow-xl p-5">
                                <div className="space-y-1.5">
                                    {ERROR_TYPES.map(([key, label]) => (
                                        <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={reportTypes.includes(key)}
                                                   onChange={(e) => setReportTypes(e.target.checked
                                                       ? [...reportTypes, key]
                                                       : reportTypes.filter((t) => t !== key))}
                                                   className="rounded border-gray-300 text-[#0096b1] focus:ring-[#0096b1]" />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)} rows={2}
                                          placeholder="More details (optional)"
                                          className="w-full mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm
                                                     focus:border-[#0096b1] focus:ring-1 focus:ring-[#0096b1] outline-none" />
                                <div className="mt-3 flex items-center gap-2">
                                    <button type="button" onClick={sendReport}
                                            disabled={!reportTypes.length || busy === 'report'}
                                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold
                                                       hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2">
                                        {busy === 'report' && <Loader2 className="animate-spin" size={14} />}
                                        Send report
                                    </button>
                                    <button type="button" onClick={() => setReportOpen(false)}
                                            className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {error && (
                    <p className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
                    </p>
                )}

                {/* §6.2 — câu trả lời hiện tại */}
                {/* Màn rộng thì tách hai cột. Cột trái là chỗ ĐỌC: bài mình nói, rồi ngay
                    dưới là nội dung của công cụ vừa chọn. Cột phải là chỗ BẤM: menu công cụ,
                    dính theo khi cuộn.

                    Hai cột là hai khối riêng để mỗi bên tự trôi theo chiều cao của mình.
                    Bản trước xếp cả bốn thẻ vào một lưới rồi chỉ định hàng/cột: thẻ menu
                    cao hơn thẻ bài nói nên hàng 1 lấy theo cái cao nhất, chừa một mảng
                    trống to đùng dưới bài nói.

                    Dưới lg hai khối chuyển sang `contents`, chúng biến mất khỏi cây bố
                    cục, bốn thẻ thành con trực tiếp của flex ngoài cùng, nên `order` mới
                    xếp lại được đúng thứ tự đọc: bài nói → menu → nội dung công cụ. Không
                    có nó thì trên điện thoại nội dung công cụ chen lên trước menu chọn công
                    cụ. */}
                <div className="flex flex-col gap-4
                                lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
                    <div className="contents lg:block lg:space-y-4 min-w-0">
                        <div className="min-w-0 order-1 lg:order-none">
                            <Section title="Your answer" icon={Mic}
                                     action={(
                                         <div className="shrink-0 flex items-center gap-2">
                                             {data.sample && (
                                                 <button type="button" onClick={() => setSampleOpen((v) => !v)}
                                                         className={`inline-flex items-center gap-1.5 px-2.5 py-1.5
                                                                     rounded-xl border-2 text-xs font-bold transition ${sampleOpen
                                                                 ? 'border-[#eb7e37] bg-[#eb7e37]/12 text-[#eb7e37]'
                                                                 : 'border-[#eb7e37]/35 text-[#eb7e37] hover:bg-[#eb7e37]/10'}`}>
                                                     <Star size={13} className="fill-[#eb7e37]" />
                                                     Sample
                                                     {data.sample.band != null && (
                                                         <span className="tabular-nums">{Number(data.sample.band).toFixed(1)}</span>
                                                     )}
                                                 </button>
                                             )}
                                             {/* Lịch sử cũng thu về một nút như câu mẫu: nó chỉ có ích
                                                 khi đã trả lời nhiều lần, mà lúc đó học viên chủ động
                                                 đi tìm, không đáng chiếm hẳn một thẻ trong trang. */}
                                             {!!data.history.length && (
                                                 <button type="button" onClick={() => setHistoryOpen((v) => !v)}
                                                         className={`inline-flex items-center gap-1.5 px-2.5 py-1.5
                                                                     rounded-xl border-2 text-xs font-bold transition ${historyOpen
                                                                 ? 'border-[#0096b1] bg-[#0096b1]/12 text-[#0096b1]'
                                                                 : 'border-[#0096b1]/30 text-[#0096b1] hover:bg-[#0096b1]/10'}`}>
                                                     <History size={13} />
                                                     History
                                                     <span className="tabular-nums">{data.history.length}</span>
                                                 </button>
                                             )}
                                         </div>
                                     )}>
                                <div className="flex items-center gap-2 mb-3">
                                    {cur.has_audio && (
                                        <button type="button" onClick={() => play(recordingUrl(cur.answer_id))}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                                           text-[#eb7e37] border-2 border-[#eb7e37]/40 hover:bg-[#eb7e37]/8">
                                            <Play size={13} /> Replay
                                        </button>
                                    )}
                                    {cur.audio_expired && (
                                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                            <MicOff size={13} /> Recording has expired
                                        </span>
                                    )}
                                </div>
                                <Transcript text={cur.text} errors={[...cur.grammar_errors, ...cur.vocabulary_errors]}
                                            onPick={setPicked} />

                                {picked && (
                                    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-semibold text-[#2b5356]">
                                                {picked.type || 'Vocabulary'}
                                            </p>
                                            <button onClick={() => setPicked(null)} aria-label="Close"
                                                    className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
                                        </div>
                                        <p className="text-sm mt-1.5">
                                            <span className="text-red-600 line-through">{picked.incorrect}</span>
                                            <span className="mx-2 text-gray-400">→</span>
                                            <span className="text-emerald-600 font-medium">
                                                {picked.correct || picked.better}
                                            </span>
                                        </p>
                                        {(picked.impact || picked.why) && (
                                            <p className="text-xs text-gray-600 mt-1.5">{picked.impact || picked.why}</p>
                                        )}
                                    </div>
                                )}

                                {/* feedback 09/09: "đẩy sâu nhận xét cho từng câu — bấm vào từng tiêu
                                    chí nó sẽ hiện tiếp ra lỗi chi tiết của từng câu". Bốn ô điểm giờ
                                    là bốn nút; bấm vào ô nào thì mở phần nhận xét của riêng tiêu chí
                                    đó, cho riêng câu trả lời này. */}
                                {cur.scores && (
                                    <div className="mt-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {Object.entries(CRITERIA_LABEL).map(([k, label]) => {
                                                const block = (cur.criteria || {})[k];
                                                const has = !!(block && (block.verdict || (block.issues || []).length));
                                                const on = openCriterion === k;
                                                return (
                                                    <button key={k} type="button"
                                                            disabled={!has}
                                                            onClick={() => setOpenCriterion(on ? null : k)}
                                                            className={`rounded-xl px-3 py-2 text-left border-2 transition-colors ${
                                                                on ? 'border-[#eb7e37] bg-[#eb7e37]/10'
                                                                   : 'border-transparent bg-gray-50'} ${
                                                                has ? 'hover:border-[#eb7e37]/50 cursor-pointer'
                                                                    : 'cursor-default'}`}>
                                                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                                            {label}
                                                            {has && <ChevronDown size={11}
                                                                className={on ? 'rotate-180 transition-transform' : 'transition-transform'} />}
                                                        </p>
                                                        <p className={`text-sm font-bold tabular-nums ${
                                                            on ? 'text-[#c25f1c]' : 'text-[#2b5356]'}`}>
                                                            {cur.scores[k] != null ? Number(cur.scores[k]).toFixed(1) : '–'}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {openCriterion && (cur.criteria || {})[openCriterion] && (
                                            <div className="mt-2 rounded-xl border-2 border-[#eb7e37]/25 bg-[#eb7e37]/[0.04] p-4">
                                                <p className="text-[13px] font-bold uppercase tracking-wide text-[#c25f1c] mb-1.5">
                                                    {CRITERIA_LABEL[openCriterion]} · this answer
                                                </p>
                                                {cur.criteria[openCriterion].verdict && (
                                                    <p className="text-sm text-gray-700 leading-relaxed break-words">
                                                        {cur.criteria[openCriterion].verdict}
                                                    </p>
                                                )}
                                                {!!(cur.criteria[openCriterion].issues || []).length ? (
                                                    <ul className="mt-2.5 space-y-2">
                                                        {cur.criteria[openCriterion].issues.map((it, i) => (
                                                            <li key={i} className="rounded-lg bg-white px-3 py-2.5 text-sm break-words">
                                                                {/* Hàng đầu: lỗi GÌ và Ở ĐÂU. Yêu cầu 11/09 bắt mọi lỗi
                                                                    phải chỉ đích danh, âm vị, vị trí trong từ, giây thứ
                                                                    mấy, lặp mấy lần, nên chỗ nào model điền được thì
                                                                    hiện ra hết, cái nào trống thì bỏ qua. */}
                                                                {(it.label || it.target || it.position || it.timestamp
                                                                  || it.count > 1) && (
                                                                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                                                        {it.label && (
                                                                            <span className="px-2 py-0.5 rounded-md bg-[#eb7e37]/12
                                                                                             text-[11px] font-bold text-[#c25f1c]">
                                                                                {it.label}
                                                                            </span>
                                                                        )}
                                                                        {it.target && (
                                                                            <span className="text-[11px] font-bold text-[#0096b1]">{it.target}</span>
                                                                        )}
                                                                        {it.position && (
                                                                            <span className="text-[11px] text-gray-500">{it.position}</span>
                                                                        )}
                                                                        {it.timestamp && (
                                                                            <span className="text-[11px] text-gray-500 tabular-nums">{it.timestamp}</span>
                                                                        )}
                                                                        {it.count > 1 && (
                                                                            <span className="text-[11px] font-bold text-gray-500 tabular-nums">
                                                                                ×{it.count}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {/* Lỗi có bản sửa thì hiện cặp sai → đúng, cùng cách tô
                                                                    màu với bảng lỗi ngữ pháp phía trên để đọc quen mắt. */}
                                                                {it.incorrect ? (
                                                                    <p>
                                                                        <span className="text-red-600 line-through">{it.incorrect}</span>
                                                                        {it.correct && (
                                                                            <>
                                                                                <span className="mx-2 text-gray-400">→</span>
                                                                                <span className="text-emerald-600 font-medium">{it.correct}</span>
                                                                            </>
                                                                        )}
                                                                    </p>
                                                                ) : it.quote && (
                                                                    <p className="text-[#2b5356] font-medium">“{it.quote}”</p>
                                                                )}
                                                                {it.problem && <p className="text-gray-600 mt-0.5">{it.problem}</p>}
                                                                {it.fix && (
                                                                    <p className="text-[#0096b1] mt-1 font-medium">{it.fix}</p>
                                                                )}
                                                                {/* Lỗi phát âm thì cho nghe mẫu và luyện lại ngay tại chỗ
                                                                    (§10), biết sai ở từ nào mà không sửa được ngay thì
                                                                    học viên cũng chỉ đọc rồi quên. */}
                                                                {openCriterion === 'pronunciation' && (it.quote || it.incorrect) && (
                                                                    <div className="flex items-center gap-1.5 mt-2">
                                                                        <button type="button"
                                                                                onClick={() => play(modelAudioUrl(it.quote || it.incorrect, null, true))}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg
                                                                                           text-[11px] font-bold text-[#0096b1] hover:bg-[#0096b1]/10">
                                                                            <Volume2 size={13} /> Listen
                                                                        </button>
                                                                        <button type="button"
                                                                                onClick={() => {
                                                                                    setPracticeText(it.quote || it.incorrect);
                                                                                    setOpenDrawer('pron');
                                                                                }}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg
                                                                                           text-[11px] font-bold text-[#0096b1] hover:bg-[#0096b1]/10">
                                                                            <Mic size={13} /> Practise
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        No significant issues for this criterion in this answer.
                                                    </p>
                                                )}
                                                {!!(cur.criteria[openCriterion].how_to_improve || []).length && (
                                                    <div className="mt-2.5 rounded-lg bg-white px-3 py-2.5">
                                                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#0096b1] mb-1">
                                                            How to improve
                                                        </p>
                                                        <ul className="space-y-1">
                                                            {cur.criteria[openCriterion].how_to_improve.map((h, i) => (
                                                                <li key={i} className="text-sm text-gray-700 flex gap-1.5">
                                                                    <span className="text-[#0096b1]">•</span>{h}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Nhận xét chung gấp lại, bấm mới xổ ra (user chốt 14/09). Đoạn
                                    này dài cỡ một khổ văn và luôn mở, nên bảng điểm bốn tiêu chí
                                    cùng hai nút Câu mẫu / Lịch sử bị đẩy xuống dưới màn hình. */}
                                {(cur.comment || cur.relevance || cur.audio_quality) && (
                                    <div className="mt-3">
                                        <button type="button" onClick={() => setNoteOpen((v) => !v)}
                                                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2b5356]
                                                           hover:text-[#0096b1] transition-colors">
                                            <ChevronDown size={15}
                                                         className={noteOpen ? 'rotate-180 transition-transform'
                                                                             : 'transition-transform'} />
                                            Overall comment on this answer
                                        </button>
                                        {noteOpen && (
                                            <div className="mt-2">
                                                {cur.comment && <p className="text-sm text-gray-700">{cur.comment}</p>}
                                                {cur.relevance && (
                                                    <p className="text-xs text-gray-500 mt-1.5">Relevance to the question: {cur.relevance}</p>
                                                )}
                                                {cur.audio_quality && (
                                                    <p className="text-xs text-gray-500 mt-2 rounded-lg bg-gray-50 px-3 py-2">
                                                        Recording quality: {cur.audio_quality}
                                                        <span className="block text-gray-400 mt-0.5">
                                                            Just to help you record better — it does not count towards the 4 IELTS criteria.
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Câu mẫu và Lịch sử xổ ngay dưới bài nói, bấm nút ở đầu thẻ
                                    để đóng mở (user chốt 14/09). Trước đây hai thứ này bật ra
                                    hộp thoại che kín màn hình: muốn so câu mình vừa nói với câu
                                    mẫu thì phải nhớ, vì không nhìn được cả hai cùng lúc. */}
                                {sampleOpen && data.sample && (
                                    <div className="mt-5 pt-5 border-t-2 border-gray-100">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <Star size={16} className="text-[#eb7e37] fill-[#eb7e37]" />
                                            <h3 className="text-[15px] font-bold text-[#2b5356]">{data.sample.label}</h3>
                                            <Band value={data.sample.band} />
                                            {data.sample.has_audio && (
                                                <button type="button" onClick={() => play(recordingUrl(data.sample.answer_id))}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                                                                   text-[#eb7e37] border-2 border-[#eb7e37]/40 hover:bg-[#eb7e37]/8">
                                                    <Play size={12} /> Nghe
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {data.sample.chosen_by_user
                                                ? 'You picked this answer yourself; the system will not replace it.'
                                                : 'The system picks your highest-scoring attempt. You can choose another one under History.'}
                                        </p>
                                        <p className="text-[16px] text-gray-800 leading-[1.7] whitespace-pre-line">
                                            {data.sample.text}
                                        </p>
                                    </div>
                                )}

                                {historyOpen && (
                                    <div className="mt-5 pt-5 border-t-2 border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <History size={16} className="text-[#0096b1]" />
                                            <h3 className="text-[15px] font-bold text-[#2b5356]">Answer history</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2.5">
                                            Every attempt is kept. You can pick one as your sample answer.
                                        </p>
                                        <ol className="space-y-2">
                                            {data.history.map((h, i) => (
                                                <li key={h.answer_id}
                                                    className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                                                    <span className="w-6 h-6 shrink-0 rounded-full bg-gray-100 text-gray-600
                                                                     text-xs font-bold flex items-center justify-center tabular-nums">
                                                        {data.history.length - i}
                                                    </span>
                                                    <div className="grow min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Band value={h.band} />
                                                            {h.is_sample && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] text-[#eb7e37] font-medium">
                                                                    <Star size={11} className="fill-[#eb7e37]" /> Sample
                                                                </span>
                                                            )}
                                                            {h.audio_expired && (
                                                                <span className="text-[11px] text-gray-400">Recording expired</span>
                                                            )}
                                                        </div>
                                                        {h.text && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{h.text}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {h.has_audio && (
                                                            <button type="button" aria-label="Replay"
                                                                    onClick={() => play(recordingUrl(h.answer_id))}
                                                                    className="p-1.5 rounded-lg text-[#0096b1] hover:bg-[#0096b1]/10">
                                                                <Play size={14} />
                                                            </button>
                                                        )}
                                                        {h.status === 'answered' && (
                                                            <button type="button"
                                                                    onClick={() => pickSample(h.is_sample && data.sample?.chosen_by_user
                                                                        ? null : h.answer_id)}
                                                                    className={`p-1.5 rounded-lg ${
                                                                        h.is_sample ? 'text-[#eb7e37] hover:bg-[#eb7e37]/10'
                                                                                    : 'text-gray-300 hover:text-[#eb7e37] hover:bg-[#eb7e37]/10'}`}
                                                                    aria-label="Use as sample answer">
                                                                <Star size={15} className={h.is_sample ? 'fill-[#eb7e37]' : ''} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </Section>
                        </div>

                        {/* Nội dung công cụ đang chọn — nằm ở cột trái vì đây là chỗ chữ
                            nhiều nhất: bài AI viết lại, bảng từ vựng, nhận xét phát âm. Nhét
                            vào cột 400px bên phải thì chữ vỡ vụn. */}
                        {openDrawer && (
                            <div className="min-w-0 order-3 lg:order-none">
                                <section className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 sm:p-6">
                                    <ToolContent more={toolMore}>
                                        <Panel title="Answer again" icon={RotateCcw}
                                                open={openDrawer === 'retry'}
                                                onToggle={() => setOpenDrawer(openDrawer === 'retry' ? null : 'retry')}>
                                            <p className="text-xs text-gray-600 mb-3">
                                                Record again from scratch. Your previous answer stays in History and is not deleted.
                                            </p>
                                            <button type="button" onClick={retryAnswer} disabled={busy === 'retry'}
                                                    className="px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-semibold
                                                               hover:bg-[#007a90] disabled:opacity-50 inline-flex items-center gap-2">
                                                {busy === 'retry' && <Loader2 className="animate-spin" size={14} />}
                                                Go to practice room
                                            </button>
                                        </Panel>

                                        <Panel title="Write your own sample" icon={PenLine}
                                                open={openDrawer === 'compose'}
                                                onToggle={() => setOpenDrawer(openDrawer === 'compose' ? null : 'compose')}>
                                            <ComposeSample
                                                questionId={questionId}
                                                seedText={(data.sample && data.sample.text) || ''}
                                                locked={data.compose_locked}
                                                onSaved={(t) => { setShadowText(t); load(); }}
                                            />
                                        </Panel>

                                        <Panel title="Improve with AI" icon={Sparkles}
                                                open={openDrawer === 'improve'}
                                                onToggle={() => setOpenDrawer(openDrawer === 'improve' ? null : 'improve')}>
                                            <p className="text-xs text-gray-600 mb-3">
                                                The AI rewrites the answer you gave, keeping your ideas and opinion.
                                            </p>
                                            <button type="button" onClick={runImprove} disabled={busy === 'improve' || !cur.text}
                                                    className="px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-semibold
                                                               hover:bg-[#007a90] disabled:opacity-50 inline-flex items-center gap-2">
                                                {busy === 'improve' && <Loader2 className="animate-spin" size={14} />}
                                                Improve to {targetBand}
                                            </button>
                                            {improved && (
                                                <div className="mt-4 space-y-3">
                                                    <div>
                                                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Your answer</p>
                                                        <p className="text-sm text-gray-600 mt-1 break-words">{improved.original}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-semibold text-[#0096b1] uppercase tracking-wide">Improved version</p>
                                                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-line break-words">{improved.improved}</p>
                                                    </div>
                                                    {!!(improved.changes || []).length && (
                                                        <ul className="space-y-1.5">
                                                            {improved.changes.map((c, i) => (
                                                                <li key={i} className="text-xs rounded-lg bg-gray-50 px-3 py-2 break-words">
                                                                    <span className="text-red-600 line-through">{c.from}</span>
                                                                    <span className="mx-1.5 text-gray-400">→</span>
                                                                    <span className="text-emerald-600 font-medium">{c.to}</span>
                                                                    {c.why && <span className="block text-gray-500 mt-0.5">{c.why}</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {improved.note && <p className="text-xs text-gray-500">{improved.note}</p>}
                                                    <button type="button" disabled={busy === 'pickai'}
                                                            onClick={() => keepAsSample(improved.improved)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                                                       text-sm font-bold text-[#eb7e37] border-2 border-[#eb7e37]/35
                                                                       hover:border-[#eb7e37] disabled:opacity-50">
                                                        <Star size={14} /> Use as sample answer
                                                    </button>
                                                </div>
                                            )}
                                        </Panel>

                                        <Panel title="Build an answer from ideas" icon={Lightbulb}
                                                open={openDrawer === 'ideas'}
                                                onToggle={() => setOpenDrawer(openDrawer === 'ideas' ? null : 'ideas')}>
                                            <p className="text-xs text-gray-600 mb-2">
                                                Jot down your ideas — any language is fine. The AI will stick to them.
                                            </p>
                                            <textarea value={ideas} onChange={(e) => setIdeas(e.target.value)} rows={3}
                                                      placeholder="E.g. friendly neighbours, often share food, but rarely chat because everyone is busy"
                                                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                                                                 focus:border-[#0096b1] focus:ring-1 focus:ring-[#0096b1] outline-none" />
                                            <button type="button" onClick={runIdeas} disabled={busy === 'ideas' || !ideas.trim()}
                                                    className="mt-2 px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-semibold
                                                               hover:bg-[#007a90] disabled:opacity-50 inline-flex items-center gap-2">
                                                {busy === 'ideas' && <Loader2 className="animate-spin" size={14} />}
                                                Build a {targetBand} answer
                                            </button>
                                            {fromIdeas && (
                                                <div className="mt-4">
                                                    <p className="text-sm text-gray-800 whitespace-pre-line break-words">{fromIdeas.answer}</p>
                                                    {/* Giữ lại làm bản tham chiếu. Nhãn sẽ ghi rõ "(AI viết)" —
                                                        đây không phải bài học viên tự nói. */}
                                                    <button type="button" disabled={busy === 'pickai'}
                                                            onClick={() => keepAsSample(fromIdeas.answer)}
                                                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                                                       text-sm font-bold text-[#eb7e37] border-2 border-[#eb7e37]/35
                                                                       hover:border-[#eb7e37] disabled:opacity-50">
                                                        <Star size={14} /> Use as sample answer
                                                    </button>
                                                    {!!(fromIdeas.used_ideas || []).length && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Ideas used: {fromIdeas.used_ideas.join(' · ')}
                                                        </p>
                                                    )}
                                                    {fromIdeas.note && <p className="text-xs text-gray-500 mt-1">{fromIdeas.note}</p>}
                                                </div>
                                            )}
                                        </Panel>

                                        {data.outline && (
                                            <Panel title="Outline & sample answers" icon={BookOpen}
                                                    open={openDrawer === 'outline'}
                                                    onToggle={() => setOpenDrawer(openDrawer === 'outline' ? null : 'outline')}>
                                                <OutlineBox part={data.part} data={data.outline} />
                                                {/* Bản rút gọn dừng lại ở dàn bài (ý 1, ý 2). Bài mẫu bốn
                                                    mức band nằm sau đó, mỗi mức một đoạn văn, để lẫn vào
                                                    đây là thẻ công cụ dài gấp mấy lần bài nói. */}
                                                <OnlyFull>{data.band_samples && (
                                                    <div className="mt-3 space-y-2">
                                                        <Clamped items={Object.entries(data.band_samples)}
                                                                 render={([band, text]) => (
                                                                     <div key={band}>
                                                                         <p className="text-[11px] font-semibold text-[#0096b1]">Band {band}</p>
                                                                         <p className="text-sm text-gray-700 whitespace-pre-line">{text}</p>
                                                                     </div>
                                                                 )} />
                                                    </div>
                                                )}</OnlyFull>
                                            </Panel>
                                        )}

                                        {!!data.vocabulary.length && (
                                            <Panel title={`Topic vocabulary (${data.vocabulary.length})`} icon={BookOpen}
                                                    open={openDrawer === 'vocab'}
                                                    onToggle={() => setOpenDrawer(openDrawer === 'vocab' ? null : 'vocab')}>
                                                {/* §FB: xếp theo 4 mức band, chọn mức nào chỉ xổ mức đó —
                                                    24 mục đổ liền một mạch thì dài quá không ai đọc. */}
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {BANDS.filter((b) => data.vocabulary.some((v) => v.band_level === b))
                                                        .map((b) => (
                                                            <button key={b} type="button" onClick={() => setVocabBand(b)}
                                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                                        vocabBand === b ? 'bg-[#0096b1] text-white'
                                                                                        : 'bg-white text-gray-600 border border-gray-200'}`}>
                                                                {b}
                                                                <span className="ml-1 opacity-70">
                                                                    ({data.vocabulary.filter((v) => v.band_level === b).length})
                                                                </span>
                                                            </button>
                                                        ))}
                                                </div>
                                                <ul className="space-y-2">
                                                    <Clamped items={vocabShown} render={(v, i) => (
                                                        <li key={i} className="rounded-lg bg-gray-50 px-3 py-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-sm font-semibold text-[#2b5356]">{v.term}</p>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button type="button" aria-label="Listen"
                                                                            onClick={() => play(modelAudioUrl(v.term, null, true))}
                                                                            className="p-1 rounded text-[#0096b1] hover:bg-[#0096b1]/10">
                                                                        <Volume2 size={14} />
                                                                    </button>
                                                                    <button type="button"
                                                                            onClick={() => { setPracticeText(v.example || v.term); setOpenDrawer('pron'); }}
                                                                            className="text-[11px] font-semibold text-[#0096b1] hover:underline">
                                                                        Practise
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {v.meaning && <p className="text-xs text-gray-600 mt-0.5">{v.meaning}</p>}
                                                            {v.example && <p className="text-xs text-gray-500 mt-0.5 italic">{v.example}</p>}
                                                        </li>
                                                    )} />
                                                </ul>
                                            </Panel>
                                        )}

                                        {/* §6.5 */}
                                        <Panel title="Pronunciation practice" icon={Volume2}
                                                open={openDrawer === 'pron'}
                                                onToggle={() => setOpenDrawer(openDrawer === 'pron' ? null : 'pron')}>
                                            <textarea value={practiceText} onChange={(e) => setPracticeText(e.target.value)} rows={2}
                                                      placeholder="Enter a word, phrase or sentence to practise"
                                                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                                                                 focus:border-[#0096b1] focus:ring-1 focus:ring-[#0096b1] outline-none" />
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <button type="button" disabled={!practiceText.trim()}
                                                        onClick={() => play(modelAudioUrl(practiceText.trim(), null, true))}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
                                                                   text-[#eb7e37] border-2 border-[#eb7e37]/40 hover:bg-[#0096b1]/5 disabled:opacity-50">
                                                    <Volume2 size={15} /> Listen
                                                </button>
                                                <button type="button" onClick={toggleRecording}
                                                        disabled={!practiceText.trim() || busy === 'pron'}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
                                                                    disabled:opacity-50 ${recording
                                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                                            : 'bg-[#0096b1] text-white hover:bg-[#007a90]'}`}>
                                                    {busy === 'pron' || busy === 'mic'
                                                        ? <Loader2 className="animate-spin" size={15} />
                                                        : recording ? <Square size={15} /> : <Mic size={15} />}
                                                    {busy === 'mic' ? 'Requesting microphone…'
                                                        : recording ? `Stop and score (${recSec}s)` : 'Tap to speak'}
                                                </button>
                                                {recording && (
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                        Listening to you…
                                                    </span>
                                                )}
                                                {busy === 'pron' && !recording && (
                                                    <span className="text-xs text-gray-500">AI is scoring…</span>
                                                )}
                                            </div>

                                            {pronError && (
                                                <p className="mt-2 flex items-start gap-2 text-xs text-[#eb7e37] bg-[#eb7e37]/10 rounded-lg px-3 py-2">
                                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />{pronError}
                                                </p>
                                            )}

                                            {pronScore && (
                                                <div className="mt-4 rounded-xl border border-gray-100 p-3">
                                                    {pronScore.score == null ? (
                                                        <p className="text-sm text-[#eb7e37]">{pronScore.problem}</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-2xl font-bold text-[#2b5356] tabular-nums">
                                                                {pronScore.score}<span className="text-sm text-gray-400 font-normal">/100</span>
                                                            </p>
                                                            <p className="text-[11px] text-gray-400">{pronScore.scale_note}</p>
                                                        </>
                                                    )}
                                                    {!!(pronScore.sounds || []).length && (
                                                        <ul className="mt-3 space-y-1.5">
                                                            {pronScore.sounds.map((s, i) => (
                                                                <li key={i} className="text-xs rounded-lg bg-gray-50 px-3 py-2">
                                                                    <span className="font-semibold text-[#2b5356]">{s.sound}</span>
                                                                    {s.heard_as && <span className="text-gray-500"> heard as {s.heard_as}</span>}
                                                                    {!!(s.in_words || []).length && (
                                                                        <span className="text-gray-500">: {s.in_words.join(', ')}</span>
                                                                    )}
                                                                    {s.how && <span className="block text-gray-600 mt-0.5">{s.how}</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    <WordStress items={pronScore.word_stress}
                                                                verdict={pronScore.word_stress_verdict} compact />
                                                    {pronScore.clarity && <p className="text-xs text-gray-600 mt-2">{pronScore.clarity}</p>}
                                                    {!!(pronScore.tips || []).length && (
                                                        <ul className="mt-2 list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                                            {pronScore.tips.map((t, i) => <li key={i}>{t}</li>)}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </Panel>

                                        <Panel title="AI Shadowing" icon={Headphones} open={openDrawer === 'shadow'}>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Pick any passage, listen to the model, then read it back.
                                            </p>
                                            {/* Chỉ báo khi SẮP HẾT hoặc ĐÃ HẾT lượt (user chốt 14/09).
                                                Dòng "VIP, không giới hạn" hiện thường trực chẳng giúp ai
                                                quyết định gì, chỉ chiếm chỗ ngay trên ô nhập. */}
                                            {shadowLeft != null && shadowLeft <= 3 && (
                                                <p className="text-sm font-semibold mb-3">
                                                    {shadowLeft > 0
                                                        ? <span className="text-[#0096b1]">{shadowLeft} left today</span>
                                                        : <span className="text-[#eb7e37]">No practices left today — upgrade to VIP for unlimited use</span>}
                                                </p>
                                            )}
                                            <textarea value={shadowText} onChange={(e) => setShadowText(e.target.value)} rows={4}
                                                      placeholder="Paste or type the passage you want to shadow"
                                                      className="w-full rounded-xl border-2 border-gray-200 px-3.5 py-2.5 text-[15px]
                                                                 focus:border-[#0096b1] focus:ring-1 focus:ring-[#0096b1] outline-none" />
                                            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                                {/* Bản đọc mẫu TỰ NHIÊN: chậm hơn và ngắt nghỉ theo cụm
                                                    nghĩa, shadowing là bắt chước nên phải theo kịp được. */}
                                                <button type="button" disabled={!shadowText.trim()}
                                                        onClick={() => play(modelAudioUrl(shadowText.trim(), null, true))}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold
                                                                   text-[#eb7e37] border-2 border-[#eb7e37]/40 hover:border-[#eb7e37]
                                                                   disabled:opacity-50">
                                                    <Volume2 size={16} /> Listen
                                                </button>
                                                <button type="button" onClick={toggleShadow}
                                                        disabled={!shadowText.trim() || busy === 'shadow'
                                                                  || (shadowLeft === 0 && !shadowRec)}
                                                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold
                                                                    disabled:opacity-50 ${shadowRec
                                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                                            : 'bg-[#0096b1] text-white hover:bg-[#007a90]'}`}>
                                                    {busy === 'shadow' || busy === 'mic'
                                                        ? <Loader2 className="animate-spin" size={16} />
                                                        : shadowRec ? <Square size={16} /> : <Mic size={16} />}
                                                    {busy === 'mic' ? 'Requesting microphone…'
                                                        : shadowRec ? 'Stop and score' : 'Read it back'}
                                                </button>
                                                {shadowRec && (
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-red-500 font-semibold">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                        Listening to you…
                                                    </span>
                                                )}
                                            </div>

                                            {shadowErr && (
                                                <p className="mt-2 flex items-start gap-2 text-sm text-[#eb7e37] bg-[#eb7e37]/10 rounded-lg px-3 py-2">
                                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />{shadowErr}
                                                </p>
                                            )}

                                            {shadowOut && (
                                                <div className="mt-4 rounded-xl border-2 border-gray-100 p-4">
                                                    {shadowOut.score == null ? (
                                                        <p className="text-sm text-[#eb7e37]">{shadowOut.problem}</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-3xl font-bold text-[#2b5356] tabular-nums">
                                                                {shadowOut.score}
                                                                <span className="text-base text-gray-400 font-normal">/100</span>
                                                            </p>
                                                            <p className="text-xs text-gray-400">{shadowOut.scale_note}</p>
                                                        </>
                                                    )}
                                                    <ul className="mt-3.5 space-y-2.5">
                                                        {(shadowOut.dimensions || []).map((d) => (
                                                            <li key={d.key} className="rounded-xl bg-gray-50 px-4 py-3">
                                                                <p className="text-sm font-bold text-[#2b5356]">
                                                                    {SHADOW_LABEL[d.key] || d.key}
                                                                </p>
                                                                {d.verdict && (
                                                                    <p className="text-sm text-gray-700 mt-1">{d.verdict}</p>
                                                                )}
                                                                {(d.examples || []).map((e, i) => (
                                                                    <p key={i} className="text-sm mt-1.5">
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
                                                    {shadowOut.summary && (
                                                        <p className="text-sm text-gray-700 mt-3">{shadowOut.summary}</p>
                                                    )}
                                                </div>
                                            )}
                                        </Panel>
                                    </ToolContent>
                                </section>
                            </div>
                        )}
                    </div>

                    <div className="contents lg:block lg:space-y-4 min-w-0">
                        <div className="min-w-0 order-2 lg:order-none
                                        lg:sticky lg:top-[72px]">
                            <Section title="Improve your answer" icon={Sparkles}
                                     note="Choose your target band first, then press — each press uses one AI call.">
                                <div className="mb-4"><BandPicker value={targetBand} onChange={setTargetBand} /></div>
                                {/* Bản đầu là một hàng ngang cuộn được: bảy công cụ mà chỉ nhìn
                                    thấy một cái rưỡi, cái thứ hai bị cắt ngay mép màn hình nên
                                    không ai biết còn gì phía sau, đúng lỗi "nhóm này trên điện
                                    thoại k xem được" (feedback 09/09). Dưới lg là lưới hai cột,
                                    thấy hết cả bảy; trong cột phải 400px thì xếp dọc, mỗi công
                                    cụ một dòng, không nhãn nào phải xuống dòng. */}
                                <nav className="grid grid-cols-2 lg:flex lg:flex-col gap-1.5">
                                    {TOOLS.map(([key, label, Icon]) => {
                                        const on = openDrawer === key;
                                        if (key === 'outline' && !data.outline) return null;
                                        if (key === 'vocab' && !data.vocabulary.length) return null;
                                        return (
                                            <button key={key} type="button" onClick={() => setOpenDrawer(key)}
                                                    className={`min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-xl
                                                                text-sm lg:text-[15px] font-bold text-left leading-tight
                                                                transition ${
                                                        on ? 'bg-[#0096b1] text-white'
                                                           : 'text-[#2b5356] bg-gray-50 lg:bg-transparent hover:bg-[#0096b1]/8'}`}>
                                                <Icon size={17} className={`shrink-0 ${on ? '' : 'text-[#0096b1]'}`} />
                                                <span className="min-w-0 break-words">
                                                    {key === 'vocab' ? `Vocabulary (${data.vocabulary.length})` : label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </Section>
                        </div>

                    </div>
                </div>
            </SelectionMenu>
        </div>
    );
};

export default SpeakingQuestionDetail;
