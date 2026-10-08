// Phòng thi Speaking (docs/speaking-spec.md §4).
//
// Đề đã được máy chủ tổ hợp và đóng băng lúc bấm Bắt đầu; ở đây chỉ đi tuần tự qua
// `plan.steps` và nộp từng câu một. Nhờ vậy tải lại trang hay rớt mạng giữa chừng thì
// vẫn là đúng bộ đề đó, và những câu đã trả lời không mất.
//
// Ba luật dễ làm sai, đều nằm trong §4:
//   • Chỉ bài `completed` và học viên tự bấm Nộp bài mới được chấm. Thoát giữa chừng,
//     im lặng 3 câu liên tiếp, rời màn hình quá lâu — tất cả đều lưu lịch sử nhưng
//     không bao giờ đi tới AI.
//   • Mất mic không đổi đề: vẫn đủ số câu, đúng thứ tự, đúng thời gian, chỉ gõ thay nói.
//   • Thi thử bấm giờ và khoá gợi ý; Luyện tập thì không giới hạn giờ và mở gợi ý.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useExamHeartbeat from '../../utils/useExamHeartbeat';
import useTabSwitchCount from '../../utils/useTabSwitchCount';
import {
    AlertCircle, CheckCircle2, ChevronDown, Eye, Lightbulb, Loader2, LogOut, MicOff,
    Pause, Play, Send, Star, Volume2,
} from 'lucide-react';
import {
    beaconFinish, examinerAudioUrl, fetchAttempt, fetchHelp, finishTest,
    requestAiFollowup, submitAnswer,
} from './speakingApi';
import { createRecorder } from './recorder';
import Outline from './Outline';
import { useExamGuard } from '../../utils/examGuard';

const ANSWER_KINDS = ['question', 'cue_card', 'ai_followup'];
// §4.4 — rời màn hình quá ngưỡng này thì bài bị dừng.
const AWAY_LIMIT_MS = 30000;
const SILENT_STREAK_LIMIT = 3;

const PART_LABEL = {
    part1: 'Part 1', part2: 'Part 2', part2_followup: 'Part 2', part3: 'Part 3',
};

const mmss = (sec) => {
    const s = Math.max(0, Math.ceil(sec));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Ước lượng thời gian đọc khi không có clip giọng giám khảo, để câu chữ không trôi vụt. */
const readingMs = (text) => Math.min(12000, Math.max(2200, ((text || '').split(/\s+/).length / 2.6) * 1000));

/**
 * Bảng gợi ý trong phòng thi phải hiện ĐÚNG những gì admin đã duyệt ở trang quản lý đề:
 * dàn bài theo thứ tự cố định, bốn bài mẫu theo band, rồi từ vựng. Bản trước đổ thẳng
 * đối tượng JSON ra nên vừa sai thứ tự vừa thiếu hẳn phần bài mẫu (feedback 31/08).
 *
 * Ba dạng dàn bài (part 1 / part 2 cue cards / part 3 hai ý) khớp với `Outline` bên
 * ielts-practice-ui — sửa một bên thì nhớ bên kia.
 */
const BANDS = ['4.5-5.5', '6.0-6.5', '7.0-7.5', '8.0-9.0'];
const wordCount = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;

/* Hiệu ứng của phòng thi. Bốn cái, đều có việc chứ không phải trang trí:
   vòng lan , giám khảo đang nói;
   cột sóng , micro đang nghe thấy tiếng;
   chấm nháy, đang ghi âm thật;
   hơi thở  , mảng sáng trôi rất chậm sau sân khấu, để nền tối không chết cứng.
   Máy bật `prefers-reduced-motion` thì tắt sạch. */
const ROOM_CSS = `
@keyframes ttm-ring { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(1.35); opacity: 0; } }
@keyframes ttm-wave { 0%, 100% { transform: scaleY(.22); } 50% { transform: scaleY(1); } }
@keyframes ttm-blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
@keyframes ttm-breathe {
  0%, 100% { transform: scale(1) translate3d(0, 0, 0); opacity: .12; }
  50% { transform: scale(1.12) translate3d(-14px, 12px, 0); opacity: .2; }
}
/* Vệt sáng quét từ trên xuống. Đi hết 100vh nên xuyên qua sân khấu dù cao thấp thế nào,
   phần thừa bị khung cắt. */
@keyframes ttm-scan {
  0% { transform: translateY(-90px); opacity: 0; }
  15% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}
.ttm-ring { animation: ttm-ring 1.8s ease-out infinite; }
.ttm-wave { animation: ttm-wave 1.05s ease-in-out infinite; transform-origin: center; }
.ttm-blink { animation: ttm-blink 1.2s ease-in-out infinite; }
.ttm-breathe { animation: ttm-breathe 7s ease-in-out infinite; }
.ttm-scan { animation: ttm-scan 6.5s cubic-bezier(.4, 0, .6, 1) infinite; }
@media (prefers-reduced-motion: reduce) {
  .ttm-ring, .ttm-wave, .ttm-blink, .ttm-breathe, .ttm-scan { animation: none; opacity: 0; }
}
`;

/**
 * Giám khảo. Có mặt ở MỌI trạng thái để phòng thi luôn có một điểm neo cố định — mắt biết
 * nhìn vào đâu ngay khi màn đổi. `ring` chỉ bật lúc đang đọc đề: vòng lan nghĩa là đang
 * phát ra tiếng, bật ở trạng thái khác là nói dối người dùng.
 */
const Mascot = ({ size = 72, ring = false, dim = false }) => (
    <div className="relative flex items-center justify-center shrink-0">
        {ring && (
            <span aria-hidden="true" className="ttm-ring absolute"
                  style={{ width: size, height: size, borderRadius: size * 0.26,
                           border: '2px solid #7dd3fc' }} />
        )}
        <div className="relative bg-white flex items-center justify-center overflow-hidden"
             style={{ width: size, height: size, borderRadius: size * 0.22,
                      opacity: dim ? 0.55 : 1 }}>
            <img src="/img/logo-eoc-icon.png" alt="Examiner"
                 style={{ width: size * 0.88, height: size * 0.88, objectFit: 'contain' }} />
        </div>
    </div>
);

/**
 * Cột sóng âm. `level` là âm lượng micro thật (0–1): có nó thì cột nhảy theo tiếng nói,
 * không có thì chạy nhịp đều — dùng cho lúc giám khảo đang đọc đề.
 */
const Bars = ({ color, count, height, level = null }) => (
    <div className="flex items-center justify-center gap-[5px]" style={{ height }}>
        {Array.from({ length: count }, (_, i) => {
            const base = 0.35 + 0.65 * Math.abs(Math.sin((i + 1) * 1.7));
            const live = level != null;
            return (
                <span key={i}
                      className={live ? 'block w-1 rounded-full' : 'block w-1 rounded-full ttm-wave'}
                      style={{
                          height: Math.round(height * base),
                          background: color,
                          ...(live
                              ? { transform: `scaleY(${(0.2 + Math.min(1, level) * 0.8).toFixed(2)})`,
                                  transition: 'transform 80ms linear' }
                              : { animationDelay: `${(i * 0.06).toFixed(2)}s` }),
                      }} />
            );
        })}
    </div>
);

/**
 * Thẻ nội dung của phòng thi. Trước đây chuỗi class này được chép ra tám chỗ, đã bắt đầu
 * lệch nhau (chỗ `p-5`, chỗ `p-6`, chỗ `p-8`, chỗ `p-10`) nên các màn nối tiếp nhau trong
 * cùng một bài thi lại nhảy kích thước.
 */
const Card = ({ className = '', children }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 ${className}`}>
        {children}
    </div>
);

const HintPanel = ({ hints, part }) => {
    const [band, setBand] = useState(BANDS[1]);
    // Mặc định đóng: mở phần gợi ý là để xem dàn bài, không phải để đọc lại bài cũ.
    const [showPrev, setShowPrev] = useState(false);
    const vocab = (hints && hints.vocabulary) || {};
    const sample = (hints && hints.samples && hints.samples[band]) || '';

    return (
        <Card>
            <p className="text-xs font-bold uppercase tracking-wide text-[#0096b1] mb-3">Hints</p>
            {!hints ? (
                <Loader2 className="animate-spin text-gray-400" size={20} />
            ) : !hints.available ? (
                <p className="text-sm text-gray-500">No hints for this question yet.</p>
            ) : (
                <div className="space-y-5">
                    {/* Câu mẫu MÌNH đã nói lần trước (feedback 06/09) — chỉ hiện khi đã làm
                        câu này rồi, để bấm lên xem lại rồi nói tốt hơn. Đặt trên cùng vì
                        đó là thứ học viên muốn liếc nhanh nhất khi luyện lại. */}
                    {hints.previous_best && (
                        <div className="rounded-xl border-2 border-[#eb7e37]/30 bg-[#eb7e37]/5 p-4">
                            <button type="button" onClick={() => setShowPrev((v) => !v)}
                                className="w-full flex items-center justify-between gap-2 text-left">
                                <span className="text-sm font-bold text-[#2b5356] inline-flex items-center gap-1.5">
                                    <Star size={14} className="text-[#eb7e37] fill-[#eb7e37]" />
                                    {hints.previous_best.label}
                                    {hints.previous_best.band != null && (
                                        <span className="px-2 py-0.5 rounded-md bg-white text-[#eb7e37] text-xs tabular-nums">
                                            {Number(hints.previous_best.band).toFixed(1)}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown size={16}
                                    className={`text-gray-400 transition-transform ${showPrev ? 'rotate-180' : ''}`} />
                            </button>
                            {showPrev && (
                                <p className="mt-2.5 text-sm text-gray-800 whitespace-pre-line">
                                    {hints.previous_best.text}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-bold text-[#2b5356] mb-2">Outline</h4>
                        <Outline part={part} data={hints.outline} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <h4 className="text-sm font-bold text-[#2b5356]">Sample answers by band</h4>
                            <div className="flex gap-1">
                                {BANDS.map((b) => (
                                    <button key={b} onClick={() => setBand(b)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                            band === b ? 'bg-[#0096b1] text-white'
                                                       : 'bg-white text-gray-600 border border-gray-300'}`}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {sample ? (
                            <>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-200">
                                    {sample}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{wordCount(sample)} words</p>
                            </>
                        ) : <p className="text-sm text-gray-400">No sample answers yet.</p>}
                    </div>

                    {/* Từ vựng đi THEO band đang chọn ở trên, không đổ cả bốn band một
                        lượt (feedback 08/09). Đang thi mà phải cuộn qua 24 mục của bốn mức
                        để tìm mức của mình thì gợi ý thành vướng chân. */}
                    {!!(vocab[band] || []).length && (
                        <div>
                            <h4 className="text-sm font-bold text-[#2b5356] mb-1.5">
                                Vocabulary band {band}
                                <span className="ml-1.5 text-xs font-normal text-gray-400">
                                    {vocab[band].length} items
                                </span>
                            </h4>
                            <ul className="space-y-1.5">
                                {vocab[band].map((v, i) => (
                                    <li key={`${v.term}-${i}`} className="text-sm">
                                        <span className="font-semibold text-[#2b5356]">{v.term}</span>
                                        {v.meaning_vi ? <span className="text-gray-600">, {v.meaning_vi}</span> : null}
                                        {v.example ? (
                                            <span className="block text-gray-500 italic">{v.example}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};


const SpeakingRoom = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const audioRef = useRef(null);
    const recorderRef = useRef(null);

    const [attemptId, setAttemptId] = useState(location.state?.attemptId || null);
    const [plan, setPlan] = useState(location.state?.plan || null);
    const [loadError, setLoadError] = useState('');
    const [stepIndex, setStepIndex] = useState(0);
    const [phase, setPhase] = useState('booting');   // booting|examiner|prep|answer|saving|paused|ended

    // Chặn phím tắt y hệt Listening / Reading (feedback 07/09). Tắt khi bài đã kết thúc:
    // lúc đó học viên đang xem lại, chặn chuột phải nữa thì chỉ gây khó chịu.
    useExamGuard(phase !== 'ended', plan?.mode === 'mock');
    const [subtitle, setSubtitle] = useState(false);

    const [remaining, setRemaining] = useState(null);   // giây còn lại của câu (thi thử)
    const [spoken, setSpoken] = useState(0);            // giây đã nói (luyện tập)
    const [prepLeft, setPrepLeft] = useState(null);
    const [level, setLevel] = useState(0);
    const [silentFor, setSilentFor] = useState(0);
    const [typed, setTyped] = useState('');
    const [notes, setNotes] = useState('');
    const [showQuestion, setShowQuestion] = useState(false);
    const [hints, setHints] = useState(null);
    const [hintsOpen, setHintsOpen] = useState(false);
    const [retryOffer, setRetryOffer] = useState(false);
    const [exitOpen, setExitOpen] = useState(false);
    const [ended, setEnded] = useState(null);          // {status, reason, submitted}
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState('');
    const [ready, setReady] = useState(false);
    const [replaying, setReplaying] = useState(false);
    const [countdown, setCountdown] = useState(null);

    // Cờ điều khiển máy trạng thái — để trong ref vì các callback đo âm thanh và đồng hồ
    // chạy ngoài chu kỳ render, đọc state ở đó sẽ lấy phải giá trị cũ.
    // Mỗi lần bắt đầu / tạm dừng / tiếp tục một bước sẽ tăng số này lên. Mọi việc chạy
    // dở (đang phát tiếng giám khảo, đang đếm phút chuẩn bị) so lại số của mình, khác thì
    // tự bỏ. Thiếu nó thì bấm tạm dừng xong bước cũ vẫn chạy tiếp ở nền: màn hình báo
    // "đang tạm dừng" nhưng vẫn ghi âm, rồi tự nhảy sang câu mới trong khi loa đọc câu
    // cũ — đúng những gì test báo ngày 31/08.
    const runIdRef = useRef(0);
    const busyRef = useRef(false);
    const answeringRef = useRef(null);   // step đang trả lời
    const silentStreak = useRef(0);
    const endedRef = useRef(false);
    const pausedRef = useRef(false);
    const hiddenAt = useRef(0);
    const replayingRef = useRef(false);

    const steps = useMemo(() => plan?.steps || [], [plan]);
    const step = steps[stepIndex] || null;
    const isMock = plan?.mode === 'mock';
    const answered = steps.slice(0, stepIndex).filter((s) => ANSWER_KINDS.includes(s.kind)).length;
    const total = plan?.question_count || 0;

    // Bảng "Theo dõi trực tuyến" của giáo viên (feedback 28/09). Trước đây chỉ ba kỹ năng
    // kia gửi nhịp tim, nên học viên đang thi Speaking thì biến mất khỏi bảng — giáo viên
    // tưởng em đó chưa vào làm bài.
    //
    // Không có exam_id: Speaking ghép đề từ chủ đề chứ không lấy từ bảng `exams`, nên cột
    // "Đề" để trống và chủ đề đang hỏi đi vào cột "Nội dung".
    const tabSwitches = useTabSwitchCount(!!attemptId && phase !== 'ended');
    useExamHeartbeat({
        enabled: !!attemptId && phase !== 'ended',
        skill: 'speaking',
        examId: null,
        title: step?.topic_title || (isMock ? 'Speaking mock test' : 'Speaking practice'),
        questionsDone: answered,
        totalQuestions: total,
        lastQuestion: answered + 1,
        // 'part2_followup' vẫn là Part 2 dưới mắt giáo viên.
        part: step?.part ? Number(String(step.part).replace(/[^0-9]/g, '')) || null : null,
        tabSwitches,
    });

    // ── Nạp lại đề khi vào thẳng bằng URL (F5 giữa bài) ──
    useEffect(() => {
        if (plan || !attemptId) {
            if (!plan && !attemptId) {
                const id = new URLSearchParams(location.search).get('attempt');
                if (id) setAttemptId(Number(id));
                else setLoadError('There is no open test.');
            }
            return;
        }
        fetchAttempt(attemptId)
            .then((data) => {
                setPlan(data.plan);
                setSubtitle(data.input_method === 'subtitle');
                if (data.status !== 'in_progress') {
                    // Bài đã nộp xong thì không dừng lại ở màn thông báo nữa
                    // (feedback 09/09) — vào thẳng phần xem lại bài.
                    if (data.status === 'completed' && data.submitted) {
                        navigate('/speaking_result', { state: { attemptId }, replace: true });
                        return;
                    }
                    setEnded({ status: data.status, submitted: data.submitted });
                    setPhase('ended');
                    return;
                }
                // Tiếp đúng câu chưa trả lời đầu tiên.
                const done = new Set(data.answers.filter((a) => a.status !== 'no_answer')
                    .map((a) => a.order_index));
                const next = (data.plan.steps || []).findIndex(
                    (s) => ANSWER_KINDS.includes(s.kind) && !done.has(s.order_index));
                setStepIndex(next < 0 ? (data.plan.steps || []).length - 1 : next);
            })
            .catch((e) => setLoadError(e.message));
    }, [attemptId, plan, location.search, navigate]);

    // ── Mic ──
    const hasPlan = !!plan;
    useEffect(() => {
        if (!hasPlan) return undefined;
        let alive = true;
        const rec = createRecorder();
        recorderRef.current = rec;
        rec.init().then((ok) => {
            if (!alive) return;
            if (!ok) {
                setSubtitle(true);
                setBanner('Microphone is unavailable. The test has switched to Subtitle Mode, so you can continue normally.');
            }
            setPhase((p) => (p === 'booting' ? 'examiner' : p));
            setReady(true);
        });
        return () => { alive = false; rec.dispose(); recorderRef.current = null; };
    }, [hasPlan]);

    // ── Kết thúc bài ──
    const endAttempt = useCallback(async (status, reason) => {
        if (endedRef.current) return;
        endedRef.current = true;
        busyRef.current = true;
        try { if (recorderRef.current) await recorderRef.current.stop(); } catch (e) { /* mic đã tắt */ }
        if (audioRef.current) { audioRef.current.pause(); }
        setPhase('ended');
        setEnded({ status, reason, submitted: status === 'completed' });
        try {
            await finishTest(attemptId, status, reason);
        } catch (e) {
            // Nộp bài bị máy chủ từ chối (409 nhiều phiên đăng nhập) thì PHẢI quay lại và
            // nói rõ, không được nuốt lỗi rồi chuyển sang màn kết quả: bài chưa nộp mà
            // học viên tưởng đã nộp là mất trắng bài nói. Các trạng thái bỏ dở thì cứ im
            // lặng như cũ, chúng đến từ đóng tab hay mất mạng.
            if (status === 'completed') {
                endedRef.current = false;
                busyRef.current = false;
                setEnded(null);
                setPhase('review');
                setBanner(e.message || 'Could not submit the test. Please try again.');
                return;
            }
        }
        // feedback 09/09: "bấm nộp bài thì bỏ hết các bước, vào thẳng mục xem lại bài".
        // Màn "Đã nộp bài" với ba nút chỉ là một cú bấm thừa — bài đã nộp thì thứ học
        // viên muốn xem là chính bài mình vừa nói. Bài bỏ dở thì KHÔNG chuyển: nó không
        // được chấm, nên vẫn phải nói rõ chuyện đó ở màn dừng.
        // Chuyển sau khi `finishTest` xong, không phải trước: rời trang giữa chừng thì
        // yêu cầu đóng sổ bài thi có thể bị huỷ và bài treo mãi ở in_progress.
        if (status === 'completed') {
            navigate('/speaking_result', { state: { attemptId }, replace: true });
        }
    }, [attemptId, navigate]);

    // Đóng tab giữa chừng vẫn phải đóng sổ bài thi, nếu không nó treo mãi ở
    // in_progress và chiếm lượt của học viên.
    useEffect(() => {
        const onUnload = () => {
            if (!endedRef.current && attemptId) {
                beaconFinish(attemptId, 'interrupted', 'Tab closed during test');
            }
        };
        window.addEventListener('beforeunload', onUnload);
        return () => window.removeEventListener('beforeunload', onUnload);
    }, [attemptId]);

    const pause = useCallback(() => {
        if (endedRef.current || pausedRef.current) return;
        pausedRef.current = true;
        runIdRef.current += 1;          // huỷ mọi việc đang chạy dở của bước hiện tại
        if (audioRef.current) audioRef.current.pause();
        // Dừng hẳn micro: tạm dừng mà vẫn ghi thì thí sinh nói gì lúc nghỉ cũng bị tính.
        if (recorderRef.current) recorderRef.current.stop().catch(() => {});
        answeringRef.current = null;
        busyRef.current = false;
        setRemaining(null);
        setSpoken(0);
        setPrepLeft(null);
        setSilentFor(0);
        setPhase('paused');
    }, []);

    // Rời màn hình (§4.4). Trên điện thoại một cuộc gọi đến cũng làm ẩn tab, nên chỉ
    // Thi thử mới dừng bài — Luyện tập chỉ tạm dừng rồi học viên bấm tiếp (§11).
    useEffect(() => {
        const onVisibility = () => {
            if (endedRef.current || !plan) return;
            if (document.hidden) {
                hiddenAt.current = Date.now();
                if (!isMock) pause();
                return;
            }
            const away = Date.now() - (hiddenAt.current || Date.now());
            if (isMock && away > AWAY_LIMIT_MS) {
                endAttempt('terminated', 'User left test screen > 30 seconds');
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [isMock, plan, endAttempt, pause]);

    // ── Giọng giám khảo ──
    // Đọc một lời của giám khảo rồi mới đi tiếp. Luôn có đồng hồ chặn: đường truyền
    // rớt gói thì thẻ <audio> có thể không bao giờ bắn 'ended' — bài thi không được
    // đứng im vì một clip không tải nổi. Chưa sinh được clip thì phần chữ trên màn hình
    // thay thế, và chờ đúng bằng thời gian đọc câu đó.
    const speak = useCallback((key, text, runId) => new Promise((resolve) => {
        const el = audioRef.current;
        let settled = false;
        let guard = null;
        const done = () => {
            if (settled) return;
            settled = true;
            if (guard) clearTimeout(guard);
            resolve();
        };
        // Bước đã bị huỷ (tạm dừng, thoát bài) thì không phát nữa.
        if (runId !== undefined && runId !== runIdRef.current) { resolve(); return; }
        if (!el || !key) { guard = setTimeout(done, readingMs(text)); return; }
        guard = setTimeout(done, readingMs(text) + 8000);
        el.onended = done;
        el.onerror = () => { if (guard) clearTimeout(guard); guard = setTimeout(done, 400); };
        el.onloadedmetadata = () => {
            if (Number.isFinite(el.duration) && el.duration > 0) {
                if (guard) clearTimeout(guard);
                guard = setTimeout(done, el.duration * 1000 + 3000);
            }
        };
        el.src = examinerAudioUrl(key, plan?.voice || 'Achird');
        // Safari cũ trả undefined thay vì Promise.
        const started = el.play();
        if (started && started.catch) {
            started.catch(() => { if (guard) clearTimeout(guard); guard = setTimeout(done, readingMs(text)); });
        }
    }), [plan]);

    const replay = () => {
        const el = audioRef.current;
        if (!el || !el.src) return;
        // Trong lúc nghe lại thì thí sinh đương nhiên im lặng — để nguyên bộ đếm im lặng
        // là câu hỏi dài sẽ bị tự ngắt giữa chừng. Nghe xong mới đếm lại từ đầu, và đồng
        // hồ trả lời cũng về đủ giờ (feedback 31/08).
        replayingRef.current = true;
        setReplaying(true);
        const finish = () => {
            replayingRef.current = false;
            setReplaying(false);
            if (recorderRef.current) recorderRef.current.resetSilence();
            setSilentFor(0);
            const current = answeringRef.current;
            if (current && current.limit_sec != null) setRemaining(current.limit_sec);
        };
        el.onended = finish;
        el.onerror = finish;
        const started = el.play();
        if (started && started.catch) started.catch(finish);
    };

    // ── Nộp một câu ──
    const sendAnswer = useCallback(async (status, { isRetry = false } = {}) => {
        const current = answeringRef.current;
        if (!current) return null;
        setPhase('saving');
        let blob = null;
        let durationMs = 0;
        let spoke = false;
        if (!subtitle && recorderRef.current) {
            const out = await recorderRef.current.stop();
            blob = out.blob; durationMs = out.durationMs; spoke = out.spoke;
        }
        const text = subtitle ? typed.trim() : '';
        const finalStatus = status || ((spoke || text) ? 'answered' : 'no_answer');
        try {
            const res = await submitAnswer(attemptId, {
                orderIndex: current.order_index,
                status: finalStatus,
                durationMs,
                text,
                isRetry,
                blob,
                ext: recorderRef.current ? recorderRef.current.extension() : 'webm',
            });
            return res;
        } catch (e) {
            // Mất mạng một câu không được làm hỏng cả bài: đi tiếp, câu đó ở lại trạng
            // thái chưa trả lời và học viên vẫn còn lịch sử của những câu khác.
            setBanner('This answer could not be sent. The test will continue.');
            return null;
        }
    }, [attemptId, subtitle, typed]);

    // ── Chạy một bước của đề ──
    const advance = useCallback(() => {
        busyRef.current = false;
        answeringRef.current = null;
        setRetryOffer(false);
        setHints(null);
        setHintsOpen(false);
        setShowQuestion(false);
        setTyped('');
        setStepIndex((i) => i + 1);
    }, []);

    const finishAnswer = useCallback(async (status, opts) => {
        const current = answeringRef.current || (opts && opts.step);
        if (!current) return;
        answeringRef.current = current;
        const res = await sendAnswer(status, opts);
        const silent = status === 'auto_skipped' || status === 'no_answer'
            || (res && res.answer && res.answer.status !== 'answered');
        silentStreak.current = silent ? silentStreak.current + 1 : 0;
        if (silentStreak.current >= SILENT_STREAK_LIMIT) {
            await endAttempt('terminated', 'No answer for 3 consecutive questions');
            return;
        }
        // Câu quá ngắn: Luyện tập được mời trả lời lại, Thi thử thì hệ thống không can thiệp.
        if (!isMock && res && res.suggest_retry && !(opts && opts.isRetry)) {
            setPhase('answer');
            setRetryOffer(true);
            return;
        }
        // Sau phần nói dài, giám khảo nói "Thank you." trước khi sang câu nối.
        if (current.kind === 'cue_card' && current.stop_key) {
            await speak(current.stop_key, 'Thank you.', runIdRef.current);
        }
        advance();
    }, [sendAnswer, isMock, endAttempt, advance, speak]);

    const finishRef = useRef(finishAnswer);
    useEffect(() => { finishRef.current = finishAnswer; }, [finishAnswer]);

    const beginAnswer = useCallback((current) => {
        answeringRef.current = current;
        setPhase('answer');
        setRetryOffer(false);
        setSilentFor(0);
        setRemaining(current.limit_sec != null ? current.limit_sec : null);
        setSpoken(0);

        if (subtitle || !recorderRef.current || !recorderRef.current.available) return;
        const silenceMs = (plan?.silence_sec || 10) * 1000;
        recorderRef.current.start(({ level: lv, spoke, silentMs }) => {
            setLevel(lv);
            setSilentFor(silentMs);
            // §4.2 — im lặng liên tục quá ngưỡng thì tự chuyển câu.
            if (silentMs >= silenceMs && !replayingRef.current
                && answeringRef.current === current) {
                // Callback vẫn chạy tiếp cho tới khi recorder dừng hẳn; gỡ câu khỏi ref
                // ngay để lần tick sau không nộp câu này lần thứ hai. finishAnswer đã
                // giữ tham chiếu của mình từ trước.
                answeringRef.current = null;
                finishRef.current(spoke ? 'answered' : 'auto_skipped', { step: current });
            }
        });
    }, [subtitle, plan]);

    const runStep = useCallback(async () => {
        if (!plan || busyRef.current || endedRef.current || pausedRef.current) return;
        const current = steps[stepIndex];
        // Hết bước: KHÔNG tự kết thúc. §4.4 — chỉ bài `completed` mà học viên tự bấm
        // Nộp bài mới được chấm, nên ở đây chỉ dừng lại chờ họ bấm.
        if (!current) { setPhase('review'); return; }
        busyRef.current = true;
        runIdRef.current += 1;
        const runId = runIdRef.current;
        // Bước đã bị huỷ trong lúc chờ (tạm dừng, thoát bài) thì dừng ngay tại đây.
        const stale = () => runId !== runIdRef.current || endedRef.current;

        if (current.kind === 'script') {
            setPhase('examiner');
            await speak(current.key, current.text, runId);
            if (stale()) return;
            advance();
            return;
        }

        if (current.kind === 'ai_followup') {
            setPhase('examiner');
            let question = current.text;
            let key = current.audio_key;
            if (!question) {
                try {
                    const res = await requestAiFollowup(attemptId);
                    question = res.question;
                    key = res.audio_key;
                    // Ghi ngược vào đề đang chạy để tải lại trang vẫn hỏi đúng câu này.
                    setPlan((p) => {
                        const next = { ...p, steps: p.steps.slice() };
                        next.steps[stepIndex] = { ...current, text: question, audio_key: key };
                        return next;
                    });
                } catch (e) {
                    question = 'And how do you think this might change in the future?';
                }
            }
            if (stale()) return;
            await speak(key, question, runId);
            if (stale()) return;
            busyRef.current = false;
            beginAnswer({ ...current, text: question });
            return;
        }

        if (current.kind === 'cue_card') {
            setPhase('examiner');
            await speak(current.audio_key, current.text, runId);
            if (stale()) return;
            // Một phút chuẩn bị: được ghi chú, KHÔNG ghi âm.
            setPhase('prep');
            setPrepLeft(current.prep_sec);
            const finishedPrep = await new Promise((resolve) => {
                let left = current.prep_sec;
                const tick = setInterval(() => {
                    // Bấm tạm dừng giữa phút chuẩn bị: bỏ hẳn bộ đếm này thay vì để nó
                    // treo rồi chạy chồng lên bộ đếm mới lúc tiếp tục.
                    if (stale()) { clearInterval(tick); resolve(false); return; }
                    left -= 1;
                    setPrepLeft(left);
                    if (left <= 0) { clearInterval(tick); resolve(true); }
                }, 1000);
            });
            if (!finishedPrep || stale()) return;
            setPrepLeft(null);
            // Giám khảo thật không đếm "một, hai, ba" — chỉ hiện số nhấp nháy trên màn
            // hình rồi vào thẳng lời dặn (feedback 31/08). Ba clip countdown vẫn còn
            // trong kho nhưng không dùng nữa.
            setPhase('countdown');
            for (let n = 3; n >= 1; n -= 1) {
                setCountdown(n);
                await new Promise((r) => setTimeout(r, 800));
                if (stale()) { setCountdown(null); return; }
            }
            setCountdown(null);
            setPhase('examiner');
            await speak(current.start_key, 'You can start speaking now, please.', runId);
            if (stale()) return;
            busyRef.current = false;
            beginAnswer(current);
            return;
        }

        setPhase('examiner');
        await speak(current.audio_key, current.text, runId);
        if (stale()) return;
        busyRef.current = false;
        beginAnswer(current);
    }, [plan, steps, stepIndex, speak, advance, attemptId, beginAnswer]);

    const runStepRef = useRef(runStep);
    useEffect(() => { runStepRef.current = runStep; }, [runStep]);

    useEffect(() => {
        if (!ready || endedRef.current || pausedRef.current) return;
        runStepRef.current();
    }, [stepIndex, ready]);

    // Luyện tập không có giới hạn giờ, nhưng người học vẫn cần biết mình đã nói bao lâu
    // (user chốt 14/09: "thêm đồng hồ đếm thời gian cho mọi người theo dõi là đã nói được
    // bao lâu rồi, nhưng k có stop bài nói"). Đồng hồ này CHỈ ĐẾM, không bao giờ tự kết
    // thúc câu: hết ý thì học viên tự bấm Trả lời xong.
    useEffect(() => {
        if (phase !== 'answer' || remaining != null || replaying) return undefined;
        const t = setInterval(() => setSpoken((n) => n + 1), 1000);
        return () => clearInterval(t);
    }, [phase, remaining, replaying]);

    // Đồng hồ câu trả lời (chỉ Thi thử có giới hạn).
    useEffect(() => {
        if (phase !== 'answer' || remaining == null || replaying) return undefined;
        if (remaining <= 0) {
            const current = answeringRef.current;
            if (current) finishRef.current('time_expired');
            return undefined;
        }
        const t = setTimeout(() => setRemaining((r) => (r == null ? null : r - 1)), 1000);
        return () => clearTimeout(t);
    }, [phase, remaining, replaying]);

    const toggleHints = async () => {
        if (hintsOpen) { setHintsOpen(false); return; }
        setHintsOpen(true);
        if (hints || !step?.question_id) return;
        try { setHints(await fetchHelp(step.question_id)); } catch (e) { setHints({ available: false }); }
    };

    // Tiếp tục = làm lại bước đang dở TỪ ĐẦU: giám khảo đọc lại câu hỏi rồi mới ghi âm.
    // Nối tiếp giữa chừng thì thí sinh không biết mình đang ở đâu, và đồng hồ đếm dở sẽ
    // nhảy lung tung.
    const resume = () => {
        pausedRef.current = false;
        busyRef.current = false;
        answeringRef.current = null;
        runIdRef.current += 1;
        setPhase('examiner');
        runStepRef.current();
    };

    const submitForMarking = async () => {
        setSubmitting(true);
        await endAttempt('completed', null);
        setSubmitting(false);
    };

    // ── Giao diện ──
    if (loadError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
                    <AlertCircle className="text-[#eb7e37] mx-auto mb-4" size={32} />
                    <p className="text-[#2b5356] font-semibold mb-5">{loadError}</p>
                    <button onClick={() => navigate('/speaking_test_setup')}
                        className="px-5 py-2.5 rounded-xl bg-[#0096b1] text-white font-semibold">
                        Back to setup
                    </button>
                </div>
            </div>
        );
    }

    if (!plan || phase === 'booting') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#0096b1]" size={30} />
                <p className="text-gray-500 text-sm">Preparing the test room…</p>
            </div>
        );
    }

    // Chỉ còn MỘT màn kết thúc: bài bỏ dở. Bài nộp hoàn chỉnh không dừng ở đây nữa —
    // `endAttempt` đưa thẳng sang trang xem lại bài (feedback 09/09: "bấm nộp bài thì bỏ
    // hết các bước"). Trong khoảnh khắc chờ chuyển trang thì hiện vòng xoay, không hiện
    // màn "Đã nộp bài" với ba nút nữa.
    if (phase === 'ended') {
        if (ended?.status === 'completed') {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-[#0096b1]" size={30} />
                    <p className="text-gray-500 text-sm">Opening your review…</p>
                </div>
            );
        }
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
                    <AlertCircle className="text-[#eb7e37] mx-auto mb-4" size={40} />
                    <h2 className="text-xl font-bold text-[#2b5356] mb-2">The test has stopped</h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        The test ended early, so it will not be scored. You can review it
                        in your history and try again at any time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button onClick={() => navigate('/speaking_test_setup')}
                            className="flex-1 px-5 py-2.5 rounded-xl bg-[#0096b1] text-white font-semibold hover:bg-[#007a90]">
                            Take another test
                        </button>
                        <button onClick={() => navigate('/speaking_list')}
                            className="flex-1 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#2b5356] font-semibold hover:border-gray-300">
                            Back to list
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const partLabel = PART_LABEL[step?.part] || '';
    const lowTime = remaining != null && remaining <= 10;

    // Dãy vạch tiến trình trên thanh đầu: mỗi câu một vạch, nhóm theo Part. Đọc được ngay
    // "đang ở đâu trong bài" mà không cần đếm — thứ mà một con số "4/11" không nói được.
    const partTicks = [];
    steps.forEach((st, i) => {
        if (!ANSWER_KINDS.includes(st.kind)) return;
        const label = PART_LABEL[st.part] || 'Speaking';
        let group = partTicks.find((g) => g.label === label);
        if (!group) { group = { label, ticks: [] }; partTicks.push(group); }
        group.ticks.push(i);
    });

    // Nhãn nhỏ đầu mỗi màn. Màu mặc định là trắng ngà; truyền màu khác khi trạng thái đó
    // cần báo động (tạm dừng = bài đang đứng yên, học viên phải biết ngay).
    const eyebrow = (text, color = '#f2fbfb') => (
        <span className="text-[11px] font-extrabold tracking-[0.14em]" style={{ color }}>{text}</span>
    );

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#eef1f1' }}>
            <style>{ROOM_CSS}</style>
            <audio ref={audioRef} className="hidden" />

            {/* ── Thanh đầu: đang ở Part nào, câu thứ mấy, còn bao lâu ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-[22px] sm:py-[28px]
                                flex items-center gap-4 sm:gap-5 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1.5 rounded-lg bg-[#0096b1]/10 text-[#0096b1] text-lg font-extrabold">
                            {partLabel || 'Speaking'}
                        </span>
                        <span className="text-sm font-extrabold uppercase tracking-[0.06em] text-gray-400">
                            {isMock ? 'Mock test' : 'Practice'}
                        </span>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-lg font-extrabold text-gray-700 tabular-nums">
                            Question {Math.min(answered + 1, total)}/{total}
                        </span>
                        {remaining != null ? (
                            <span className={`inline-flex items-baseline gap-2 px-3.5 py-1.5 rounded-full ${
                                lowTime ? 'bg-[#eb7e37]/15' : 'bg-gray-100'}`}>
                                <span className="text-[13px] font-extrabold tracking-[0.06em] text-gray-500">REMAINING</span>
                                <span className={`font-mono text-[22px] font-extrabold tabular-nums ${
                                    lowTime ? 'text-[#eb7e37]' : 'text-gray-800'}`}>
                                    {mmss(remaining)}
                                </span>
                            </span>
                        ) : phase === 'answer' && (
                            /* Luyện tập: đếm LÊN, và chỉ để theo dõi. Không tô cam, không
                               nhấp nháy, không tự dừng bài — nó không phải hạn giờ. */
                            <span className="inline-flex items-baseline gap-2 px-3.5 py-1.5 rounded-full bg-gray-100">
                                <span className="text-[13px] font-extrabold tracking-[0.06em] text-gray-500">SPOKEN</span>
                                <span className="font-mono text-[22px] font-extrabold tabular-nums text-gray-800">
                                    {mmss(spoken)}
                                </span>
                            </span>
                        )}
                        <button onClick={() => setExitOpen(true)} title="Exit test"
                                className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-xl
                                           border border-gray-200 text-gray-500 bg-white
                                           hover:border-red-400 hover:text-red-500 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {banner && (
                <div className="bg-[#eb7e37]/10 border-b border-[#eb7e37]/20 px-4 py-2.5">
                    <p className="max-w-[760px] mx-auto text-sm text-[#8a4a17] flex items-start gap-2">
                        <MicOff size={16} className="shrink-0 mt-0.5" />
                        <span>{banner}</span>
                    </p>
                </div>
            )}

            {/* ── Sân khấu: một mặt xanh đậm duy nhất, luôn nằm giữa màn hình ──
                Bản trước là mấy thẻ trắng xếp dọc trên nền xám, mỗi màn một kích thước, mắt
                phải tìm lại trọng tâm sau mỗi câu. Giữ đúng MỘT khối để suốt bài thi mắt chỉ
                nhìn một chỗ; khung, nền và bề ngang không đổi, chỉ ruột thay. */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-5 py-6 sm:py-7">
                <div className="w-full max-w-[760px] space-y-4">
                    {/* Đang ở đâu trong bài — một dải riêng, nằm ngoài sân khấu. Sân khấu là
                        thứ thay ruột liên tục theo từng trạng thái; dải này thì không đổi suốt
                        bài, nên để lẫn vào trong sẽ bị đọc nhầm là một phần của nội dung. */}
                    {partTicks.length > 0 && (
                        <div className="flex items-center justify-center gap-5 flex-wrap">
                            {partTicks.map((g) => {
                                const current = g.ticks.includes(stepIndex);
                                return (
                                    <div key={g.label}
                                         className={`flex items-center gap-2.5 ${current ? '' : 'opacity-55'}`}>
                                        <span className="text-[13px] font-extrabold tracking-[0.08em] uppercase
                                                         text-gray-500">
                                            {g.label}
                                        </span>
                                        <span className="flex items-center gap-[5px]">
                                            {g.ticks.map((idx) => (
                                                <span key={idx}
                                                      className="h-2 rounded-full transition-all"
                                                      style={{
                                                          width: idx === stepIndex ? 36 : 22,
                                                          background: idx === stepIndex ? '#0096b1'
                                                              : idx < stepIndex ? '#2b5356' : '#cbd5d5',
                                                      }} />
                                            ))}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="relative isolate overflow-hidden rounded-[20px] text-white
                                    px-6 sm:px-9 py-8 sm:py-10"
                         style={{ background: '#17494f', border: '1px solid rgba(235,240,240,0.24)', borderTop: '3px solid #e6ebeb' }}>
                        <div aria-hidden="true" className="ttm-breathe pointer-events-none absolute z-0"
                             style={{ top: '-30%', right: '-25%', width: '70%', height: '90%',
                                      background: '#ffffff', opacity: 0.14, borderRadius: '46% 54% 40% 60%' }} />
                        <div aria-hidden="true" className="ttm-scan pointer-events-none absolute inset-x-0 top-0 z-0"
                             style={{ height: 90,
                                      background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.22), transparent)' }} />
                        <div className="relative z-[1]">

                            {phase === 'examiner' && (
                                <div className="flex flex-col items-center gap-5 text-center">
                                    {eyebrow('THE EXAMINER IS ASKING')}
                                    <Mascot size={108} ring />
                                    <Bars color="#7dd3fc" count={23} height={40} />
                                    {/* Thi thử không được xem chữ (§4.2); Luyện tập thì phải tự bấm con mắt. */}
                                    {!isMock && showQuestion && step?.text ? (
                                        <p className="m-0 text-[22px] sm:text-[27px] font-bold leading-[1.35] max-w-[560px]">
                                            {step.text}
                                        </p>
                                    ) : (
                                        <p className="m-0 text-[15px] text-[#dff0f1] max-w-[460px]">
                                            Listen to the whole question, then answer. The microphone turns on when the examiner finishes.
                                        </p>
                                    )}
                                </div>
                            )}

                            {phase === 'countdown' && (
                                <div className="flex flex-col items-center gap-4 text-center py-4">
                                    <Mascot size={72} />
                                    {eyebrow('GET READY TO SPEAK')}
                                    <p key={countdown} className="m-0 font-mono text-[72px] font-bold leading-none">
                                        {countdown}
                                    </p>
                                </div>
                            )}

                            {phase === 'prep' && step?.kind === 'cue_card' && (
                                <div className="flex flex-col gap-5">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <span className="flex items-center gap-3">
                                            <Mascot size={52} />
                                            {eyebrow('PREPARATION TIME · PART 2')}
                                        </span>
                                        <span className={`font-mono text-[32px] font-bold leading-none ${
                                            prepLeft <= 10 ? 'text-[#ffd0ae]' : 'text-white'}`}>
                                            {mmss(prepLeft || 0)}
                                        </span>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 text-gray-900">
                                        <pre className="m-0 whitespace-pre-wrap font-sans text-[17px] leading-[1.45]
                                                        font-bold text-[#2b5356]">{step.text}</pre>
                                    </div>
                                    <div>
                                        <p className="m-0 mb-2 text-[13px] font-bold tracking-[0.06em] text-[#dff0f1]">
                                            YOUR NOTES
                                        </p>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Jot down your ideas…"
                                            className="w-full min-h-[130px] rounded-xl p-3.5 text-[15px] text-white
                                                       placeholder:text-white/45 outline-none resize-none
                                                       focus:border-white/55"
                                            style={{ background: 'rgba(255,255,255,0.08)',
                                                     border: '1px solid rgba(255,255,255,0.25)' }}
                                        />
                                        <p className="m-0 mt-2 text-[13px] text-[#dff0f1]">
                                            The microphone is off — this is your one minute of preparation.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(phase === 'answer' || phase === 'saving') && (
                                <div className="flex flex-col items-center gap-5 text-center">
                                    <Mascot size={64} />
                                    <div className="flex items-center gap-2.5">
                                        {!subtitle && <span aria-hidden="true" className="ttm-blink block w-2.5 h-2.5 rounded-full"
                                                            style={{ background: '#f43f5e' }} />}
                                        {eyebrow(subtitle ? 'TYPE YOUR ANSWER' : 'RECORDING')}
                                    </div>

                                    {step?.kind === 'cue_card' ? (
                                        <div className="w-full bg-white rounded-2xl p-5 text-left text-gray-900">
                                            <pre className="m-0 whitespace-pre-wrap font-sans text-[15px] leading-[1.5]
                                                            font-semibold text-[#2b5356]">{step.text}</pre>
                                            {notes && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <p className="m-0 mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                                        Your notes
                                                    </p>
                                                    <pre className="m-0 whitespace-pre-wrap font-sans text-sm text-gray-600">{notes}</pre>
                                                </div>
                                            )}
                                        </div>
                                    ) : showQuestion && step?.text && (
                                        <p className="m-0 text-[18px] sm:text-[20px] font-semibold leading-[1.4]
                                                      text-[#dfeaea] max-w-[560px]">
                                            {step.text}
                                        </p>
                                    )}

                                    {subtitle ? (
                                        <textarea
                                            value={typed}
                                            onChange={(e) => setTyped(e.target.value)}
                                            autoFocus
                                            placeholder="Type your answer…"
                                            className="w-full min-h-[170px] rounded-xl p-3.5 text-[15px] text-left text-white
                                                       placeholder:text-white/45 outline-none resize-none"
                                            style={{ background: 'rgba(255,255,255,0.08)',
                                                     border: '1px solid rgba(255,255,255,0.25)' }}
                                        />
                                    ) : (
                                        <>
                                            {/* Cột sóng chạy theo âm lượng THẬT của micro — nó vừa là trang trí
                                                vừa là bằng chứng máy đang nghe thấy mình. */}
                                            <Bars color="#fb7185" count={31} height={56} level={level} />
                                            <p className="m-0 text-[13px] text-[#dff0f1]">
                                                {silentFor > 1200
                                                    ? `Silent for ${(silentFor / 1000).toFixed(0)}s — after ${plan.silence_sec}s of silence the test moves to the next question.`
                                                    : 'Speak naturally; press Done when you have finished.'}
                                            </p>
                                        </>
                                    )}

                                    {phase === 'answer' && !retryOffer && (
                                        <button
                                            onClick={() => finishAnswer(subtitle && !typed.trim() ? 'no_answer' : 'answered')}
                                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white
                                                       text-[#17494f] text-[15px] font-bold hover:bg-[#e8f2f2] transition-colors">
                                            <CheckCircle2 size={18} /> Done
                                        </button>
                                    )}
                                    {phase === 'saving' && (
                                        <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#dff0f1]">
                                            <Loader2 className="animate-spin" size={18} /> Saving…
                                        </span>
                                    )}

                                    {/* Vàng cảnh báo: đây là chỗ DUY NHẤT trong phòng thi mà máy nói
                                        "câu vừa rồi chưa đạt". Để chung màu trắng với phần còn lại thì
                                        nó trôi qua như một dòng hướng dẫn nữa. */}
                                    {retryOffer && (
                                        <div className="w-full rounded-2xl p-4 text-left"
                                             style={{ background: 'rgba(245,158,11,0.14)',
                                                      border: '1px solid rgba(245,158,11,0.55)' }}>
                                            <p className="m-0 flex items-start gap-2 text-sm leading-relaxed text-[#fdecc8]">
                                                <AlertCircle size={17} className="shrink-0 mt-0.5 text-[#fbbf24]" />
                                                <span>
                                                    Try to give a more detailed answer. If you are short of ideas, check the hints.
                                                    You can answer this question again; your first answer is still saved.
                                                </span>
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-2 mt-3">
                                                <button
                                                    onClick={() => {
                                                        setRetryOffer(false);
                                                        setTyped('');
                                                        beginAnswer(answeringRef.current || step);
                                                    }}
                                                    className="flex-1 px-4 py-3 rounded-xl bg-[#f59e0b] text-[#42290a]
                                                               font-bold hover:bg-[#d97706] hover:text-white transition-colors">
                                                    Answer again
                                                </button>
                                                <button onClick={advance}
                                                        className="flex-1 px-4 py-3 rounded-xl font-bold text-[#fbbf24]
                                                                   hover:bg-[#f59e0b]/15 transition-colors"
                                                        style={{ border: '1px solid rgba(245,158,11,0.55)' }}>
                                                    Next question
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {phase === 'review' && (
                                <div className="flex flex-col items-center gap-5 text-center">
                                    <Mascot size={92} />
                                    {eyebrow(`COMPLETE · ${total}/${total} QUESTIONS`)}
                                    <p className="m-0 text-[24px] sm:text-[27px] font-extrabold leading-[1.3]">
                                        You have answered every question
                                    </p>
                                    <p className="m-0 text-[15px] leading-relaxed text-[#dff0f1] max-w-[440px]">
                                        Press <span className="font-bold text-white">Submit</span> to send it for grading. A test is only
                                        graded when you submit it; if you leave now it is only saved to your history.
                                    </p>
                                    <button onClick={submitForMarking} disabled={submitting}
                                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#eb7e37]
                                                       text-white text-[15px] font-bold hover:bg-[#d86f2b]
                                                       disabled:opacity-60 transition-colors">
                                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                        Submit
                                    </button>
                                </div>
                            )}

                            {phase === 'paused' && (
                                <div className="flex flex-col items-center gap-4 text-center py-3">
                                    <Mascot size={72} dim />
                                    {eyebrow('PAUSED', '#fb7185')}
                                    <p className="m-0 text-[24px] font-bold leading-[1.35]">The test is paused</p>
                                    <p className="m-0 text-[15px] leading-relaxed text-[#dff0f1] max-w-[420px]">
                                        The microphone is off. Press continue to hear the current question again from the start.
                                    </p>
                                    <button onClick={resume}
                                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#eb7e37]
                                                       text-white text-[15px] font-bold hover:bg-[#d86f2b] transition-colors">
                                        <Play size={18} /> Continue test
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>

                    {hintsOpen && <HintPanel hints={hints} part={step?.part} />}
                </div>
            </main>

            {/* ── Thanh công cụ dưới đáy. Chỉ còn CÔNG CỤ: việc chính của mỗi màn (trả lời
                xong, nộp bài, tiếp tục) đã nằm ngay trong sân khấu, cạnh nội dung nó tác
                động tới, chứ không phải tít dưới đáy màn hình. ── */}
            <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-6"
                    style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
                <div className="max-w-[1180px] mx-auto flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        {phase === 'answer' && !subtitle ? (
                            <>
                                <Bars color="#22c55e" count={4} height={16} level={level} />
                                <span className="text-base font-bold text-gray-600">Microphone on</span>
                            </>
                        ) : (
                            <span className="text-[15px] font-bold text-gray-400">
                                {isMock ? 'Mock test mode — questions and hints are hidden'
                                        : 'Practice mode'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={replay}
                                className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border text-base
                                            font-bold transition-colors ${replaying
                                        ? 'border-[#0096b1] bg-[#0096b1] text-white'
                                        : 'border-gray-200 text-gray-700 hover:border-[#0096b1] hover:text-[#007b94]'}`}>
                            <Volume2 size={16} />
                            <span className="hidden sm:inline">Replay</span>
                        </button>

                        {!isMock && (
                            <>
                                <button onClick={() => setShowQuestion((v) => !v)}
                                        className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border text-base
                                                    font-bold transition-colors ${showQuestion
                                                ? 'border-[#0096b1] bg-[#0096b1] text-white'
                                                : 'border-gray-200 text-gray-700 hover:border-[#0096b1] hover:text-[#007b94]'}`}>
                                    <Eye size={16} />
                                    <span className="hidden sm:inline">Show question text</span>
                                </button>
                                <button onClick={toggleHints} disabled={!step?.question_id}
                                        className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border text-base
                                                    font-bold transition-colors disabled:opacity-40 ${hintsOpen
                                                ? 'border-[#0096b1] bg-[#0096b1] text-white'
                                                : 'border-gray-200 text-gray-700 hover:border-[#0096b1] hover:text-[#007b94]'}`}>
                                    <Lightbulb size={16} />
                                    <span className="hidden sm:inline">Hints &amp; vocabulary</span>
                                </button>
                                {phase !== 'paused' && (
                                    <button onClick={pause}
                                            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border
                                                       border-gray-200 text-gray-700 text-base font-bold
                                                       hover:border-gray-400 transition-colors">
                                        <Pause size={16} />
                                        <span className="hidden sm:inline">Pause</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </footer>


            {exitOpen && (
                <div className="fixed inset-0 z-30 bg-black/40 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-[#2b5356] mb-2">Exit the test?</h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-5">
                            Are you sure you want to exit? Your current progress will not be scored.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={() => setExitOpen(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0096b1] text-white font-semibold">
                                Stay
                            </button>
                            <button onClick={() => endAttempt('abandoned', 'User exited test')}
                                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-[#2b5356] font-semibold">
                                Exit test
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpeakingRoom;
