// Màn hình thiết lập trước khi vào phòng thi Speaking (docs/speaking-spec.md §4.1).
//
// Mic được xin quyền ngay tại đây chứ không đợi vào phòng: học viên cần biết mình sẽ thi
// bằng giọng nói hay bằng chữ TRƯỚC khi giám khảo bắt đầu nói. Hỏng mic không chặn bài —
// bài thi giữ nguyên cấu trúc, chỉ đổi cách trả lời (Subtitle Mode).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Mic, MicOff, Loader2, Lock, Crown, AlertCircle, Volume2, Wrench, Sparkles,
} from 'lucide-react';
import { fetchSetup, startTest, examinerAudioUrl } from './speakingApi';
import QuotaPills from './QuotaPills';
import AttemptHistory from './AttemptHistory';

const TEST_TYPES = [
    { value: 'full', label: 'Full Test', hint: 'Part 1 + 2 + 3, just like the real test' },
    { value: 'part1', label: 'Part 1', hint: '3 topics about yourself' },
    { value: 'part2', label: 'Part 2', hint: 'Cue card + follow-up questions' },
    { value: 'part3', label: 'Part 3', hint: '7 discussion questions' },
];

const MODES = [
    { value: 'practice', label: 'Practice', hint: 'No time limit, questions and hints visible' },
    { value: 'mock', label: 'Mock test', hint: 'Timed like the real test, no hints' },
];

const PRIORITIES = [
    { value: 'default', label: 'Default' },
    { value: 'undone', label: 'Prefer topics not done yet' },
    { value: 'done', label: 'Prefer topics already done' },
];

const monthLabel = (iso) => {
    const [y, m] = iso.split('-');
    return `${m}/${y}`;
};

const Card = ({ title, children, note }) => (
    <section className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-[#2b5356]">{title}</h2>
        {note && <p className="text-[15px] text-gray-500 mt-1">{note}</p>}
        <div className="mt-4">{children}</div>
    </section>
);

/**
 * Ô lựa chọn ở màn chuẩn bị thi.
 *
 * Ô đang chọn dùng tông CAM chứ không phải xanh (feedback 08/09). Cả trang toàn màu xanh
 * nên ô được chọn cũng xanh thì nhìn lướt qua không biết mình đang chọn gì — cam là màu
 * nhấn duy nhất trên trang, đặt đúng chỗ cần nổi bật nhất.
 */
const Choice = ({ active, disabled, onClick, label, hint, badge }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors ${
            active
                ? 'border-[#eb7e37] bg-[#eb7e37]/10 ring-1 ring-[#eb7e37]/30'
                : 'border-gray-200 hover:border-[#eb7e37]/50 hover:bg-[#eb7e37]/[0.03]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <div className="flex items-center justify-between gap-2">
            <span className={`text-[17px] font-bold ${active ? 'text-[#c25f1c]' : 'text-[#2b5356]'}`}>
                {label}
            </span>
            {badge}
        </div>
        {hint && (
            <span className={`block text-[15px] mt-1 ${active ? 'text-[#8a4a17]' : 'text-gray-500'}`}>
                {hint}
            </span>
        )}
    </button>
);

const SpeakingSetup = () => {
    const navigate = useNavigate();
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locked, setLocked] = useState(false);
    const [error, setError] = useState('');
    const [starting, setStarting] = useState(false);

    const [testType, setTestType] = useState('full');   // đổi sang part1 nếu bị khoá VIP
    const [mode, setMode] = useState('practice');
    const [occupation, setOccupation] = useState('student');
    const [useForecast, setUseForecast] = useState(false);
    const [forecastMonth, setForecastMonth] = useState('');
    const [priority, setPriority] = useState('default');
    const [voice, setVoice] = useState('');

    // 'checking' | 'granted' | 'denied' — denied nghĩa là Subtitle Mode, không phải lỗi.
    const [mic, setMic] = useState('checking');
    const previewRef = useRef(null);

    const askMic = useCallback(async () => {
        setMic('checking');
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia
                || typeof MediaRecorder === 'undefined') {
                setMic('denied');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Nhả mic ngay: phòng thi sẽ tự xin lại, giữ mở ở đây làm đèn mic sáng suốt
            // lúc học viên còn đang chọn thiết lập.
            stream.getTracks().forEach((t) => t.stop());
            setMic('granted');
        } catch (e) {
            setMic('denied');
        }
    }, []);

    useEffect(() => {
        let alive = true;
        fetchSetup()
            .then((data) => {
                if (!alive) return;
                setInfo(data);
                setVoice(data.default_voice);
                // Thi nguyên bài khoá với tài khoản thường: chuyển sẵn sang Part 1 thay
                // vì để họ nhìn vào một lựa chọn mờ đang được chọn.
                if (data.full_test_locked) setTestType('part1');
                if (data.forecast_months && data.forecast_months.length) {
                    setForecastMonth(data.forecast_months[0]);
                }
            })
            .catch((e) => {
                if (!alive) return;
                if (e.status === 503) setLocked(true);
                else setError(e.message);
            })
            .finally(() => alive && setLoading(false));
        askMic();
        return () => { alive = false; };
    }, [askMic]);

    // Máy chủ trả về danh sách giọng kèm accent/giới tính; bản cũ chỉ trả mảng chuỗi nên
    // vẫn phải chấp nhận cả hai dạng.
    const voicesByAccent = (info?.voices || []).reduce((acc, raw) => {
        const v = typeof raw === 'string'
            ? { name: raw, accent_label: 'Neutral', gender_label: '' }
            : raw;
        const key = v.accent_label || 'Neutral';
        (acc[key] = acc[key] || []).push(v);
        return acc;
    }, {});

    const grouped = Object.keys(voicesByAccent).length > 1;

    const playVoiceSample = (name) => {
        setVoice(name);
        const el = previewRef.current;
        if (!el) return;
        el.src = examinerAudioUrl('script:opening', name);
        el.play().catch(() => { /* chưa có clip cho giọng này thì thôi */ });
    };

    const begin = async () => {
        setError('');
        setStarting(true);
        try {
            const data = await startTest({
                test_type: testType,
                mode,
                input_method: mic === 'granted' ? 'micro' : 'subtitle',
                occupation,
                voice,
                use_forecast: useForecast,
                forecast_month: useForecast ? forecastMonth : null,
                priority,
            });
            navigate('/speaking_test', { state: { attemptId: data.attempt_id, plan: data.plan } });
        } catch (e) {
            setError(e.message);
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-[#0096b1]" size={32} />
            </div>
        );
    }

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

    const outOfTurns = info && !info.can_start;

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            <audio ref={previewRef} className="hidden" />

            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate('/speaking_list')}
                        className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-[#2b5356]">
                        <ChevronLeft size={22} />
                    </button>
                    <h1 className="text-lg sm:text-xl font-bold text-[#2b5356]">Speaking Test</h1>
                    {/* Hai pill dùng chung với trang đề dự đoán và trang kết quả
                        (exam_elements/speaking/QuotaPills.js) — xem chú thích ở đó về lý do
                        phải hiện CẢ HAI túi lượt. */}
                    <div className="ml-auto shrink-0"><QuotaPills info={info} /></div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
                {/* Micro — thông báo, không phải rào chắn (§4.1) */}
                <div className={`rounded-2xl p-4 sm:p-5 border ${
                    mic === 'granted' ? 'bg-[#0096b1]/5 border-[#0096b1]/30'
                        : mic === 'denied' ? 'bg-[#eb7e37]/5 border-[#eb7e37]/30'
                            : 'bg-white border-gray-100'}`}>
                    <div className="flex items-start gap-3">
                        {mic === 'granted' ? <Mic className="text-[#0096b1] shrink-0" size={22} />
                            : mic === 'denied' ? <MicOff className="text-[#eb7e37] shrink-0" size={22} />
                                : <Loader2 className="animate-spin text-gray-400 shrink-0" size={22} />}
                        <div className="min-w-0">
                            <p className="text-[17px] font-bold text-[#2b5356]">
                                {mic === 'granted' ? 'Microphone ready'
                                    : mic === 'denied' ? 'Microphone unavailable — the test will switch to typing mode'
                                        : 'Checking microphone…'}
                            </p>
                            <p className="text-[15px] text-gray-600 mt-1">
                                {mic === 'denied'
                                    ? 'You can still take the test as normal: same questions, order and timing, you just type your answers. Pronunciation will not be scored.'
                                    : 'You will answer by speaking and your pronunciation will be scored too.'}
                            </p>
                            {mic === 'denied' && (
                                <button onClick={askMic}
                                    className="mt-2 text-sm font-semibold text-[#0096b1] hover:underline">
                                    Try granting microphone access again
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <Card title="Which part do you want to take?">
                    {/* Một hàng bốn cột: bốn lựa chọn xếp 2×2 làm trang dài ra vô ích,
                        học viên phải kéo lên kéo xuống nhiều (feedback 07/09). */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {TEST_TYPES.map((t) => {
                            // feedback 09/09: thi nguyên bài là quyền VIP, giống bài nguyên
                            // đề của ba kỹ năng kia. Khoá ngay ở đây thay vì để bấm Bắt đầu
                            // rồi mới báo 403.
                            const locked = t.value === 'full' && info.full_test_locked;
                            return (
                                <Choice key={t.value} active={testType === t.value} label={t.label}
                                    hint={locked ? 'VIP accounts only' : t.hint}
                                    disabled={locked}
                                    badge={locked ? <Lock size={15} className="text-[#eb7e37]" /> : undefined}
                                    onClick={() => setTestType(t.value)} />
                            );
                        })}
                    </div>
                </Card>

                <Card title="Mode">
                    <div className="grid grid-cols-2 gap-3">
                        {MODES.map((m) => (
                            <Choice key={m.value} active={mode === m.value} label={m.label}
                                hint={m.hint} onClick={() => setMode(m.value)} />
                        ))}
                    </div>
                </Card>

                {(testType === 'full' || testType === 'part1') && (
                    <Card title="Current situation"
                        note="The examiner will ask about either your studies or your work, not both.">
                        <div className="grid grid-cols-2 gap-3">
                            <Choice active={occupation === 'student'} label="Studying"
                                onClick={() => setOccupation('student')} />
                            <Choice active={occupation === 'working'} label="Working"
                                onClick={() => setOccupation('working')} />
                        </div>
                    </Card>
                )}

                <Card title="Question source">
                    <label className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 ${
                        useForecast ? 'border-[#eb7e37] bg-[#eb7e37]/10' : 'border-gray-200'
                    } ${info.forecast_locked ? 'opacity-60' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 accent-[#0096b1]"
                            checked={useForecast}
                            disabled={info.forecast_locked}
                            onChange={(e) => setUseForecast(e.target.checked)}
                        />
                        <span className="min-w-0">
                            <span className="font-semibold text-[#2b5356] flex items-center gap-2">
                                Practise with Focus topics
                                {info.forecast_locked && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#eb7e37]">
                                        <Lock size={13} /> VIP
                                    </span>
                                )}
                            </span>
                        </span>
                    </label>

                    {useForecast && !info.forecast_locked && (
                        <div className="mt-3">
                            <label className="block text-sm font-semibold text-[#2b5356] mb-1.5">
                                Expected month
                            </label>
                            {info.forecast_months.length ? (
                                <select
                                    value={forecastMonth}
                                    onChange={(e) => setForecastMonth(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 font-semibold text-[#2b5356] focus:border-[#0096b1] outline-none"
                                >
                                    {info.forecast_months.map((m) => (
                                        <option key={m} value={m}>{monthLabel(m)}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-[#eb7e37]">
                                    There are no active Focus topics at the moment.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-4">
                        <p className="text-sm font-semibold text-[#2b5356] mb-2">Topic priority</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {PRIORITIES.map((p) => (
                                <Choice key={p.value} active={priority === p.value} label={p.label}
                                    onClick={() => setPriority(p.value)} />
                            ))}
                        </div>
                    </div>
                </Card>

                <Card title="Examiner voice" note="Click to preview.">
                    {/* Xếp theo accent rồi tới giới tính, giống phòng thi thật mỗi nơi
                        một giọng khác nhau. Khi hệ thống còn chạy giọng trung tính thì
                        chỉ có một nhóm, bảng vẫn hiển thị bình thường. */}
                    {Object.entries(voicesByAccent).map(([label, list]) => (
                        <div key={label} className="mb-3 last:mb-0">
                            {grouped && (
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                                    {label}
                                </p>
                            )}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {list.map((v) => (
                                    <Choice key={v.name} active={voice === v.name}
                                        // TÊN giám khảo, không phải "Nữ/Nam" trống trơn — thí sinh
                                        // nhớ được "Alice" chứ không nhớ "giọng Anh nữ thứ nhất".
                                        // Mã kỹ thuật en-GB-Neural2-C thì tuyệt đối không hiện.
                                        label={v.display || v.label || v.name}
                                        hint={v.gender_label || undefined}
                                        badge={<Volume2 size={16} className="text-gray-400" />}
                                        onClick={() => playVoiceSample(v.name)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </Card>

                {/* Feedback 06/09: thiếu lịch sử bài thi. Dữ liệu đã có sẵn ở
                    /speaking/test/attempts từ lâu, chỉ là chưa chỗ nào hiện ra. */}
                <Card title="Test history" note="Click a row to review its result and analysis.">
                    <AttemptHistory kind="mock" />
                </Card>

                {error && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
            </main>

            {/* Nút bắt đầu neo dưới đáy: trên điện thoại danh sách thiết lập dài hơn màn hình */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    {outOfTurns ? (
                        /* Trước đây chỉ là một dòng chữ xám nhỏ cạnh nút, học viên không
                           thấy (chủ dự án phản ánh 21/09). Giờ là một thẻ cảnh báo có
                           viền cam, biểu tượng và nói rõ khi nào được thi lại. */
                        <div className="w-full rounded-2xl border-2 border-[#eb7e37]/40 bg-[#eb7e37]/5 p-4
                                        flex flex-col sm:flex-row sm:items-center gap-3">
                            <AlertCircle className="text-[#eb7e37] shrink-0" size={26} />
                            <div className="min-w-0 grow">
                                <p className="text-[17px] font-bold text-[#2b5356]">
                                    You have used all your Speaking tests for today
                                </p>
                                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                                    Free accounts get {info.attempts_limit} test(s) per day, renewed at
                                    midnight. Upgrade to VIP for unlimited tests and full-test access.
                                </p>
                            </div>
                            <button onClick={() => navigate('/vip-packages')}
                                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                                           bg-[#eb7e37] text-white font-bold hover:bg-[#d86f2b]">
                                <Crown size={18} /> Upgrade to VIP
                            </button>
                        </div>
                    ) : (
                        <button onClick={begin} disabled={starting}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-[#eb7e37] text-white font-bold text-lg hover:bg-[#d86f2b] disabled:opacity-60 shadow-sm">
                            {starting ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
                            {starting ? 'Preparing your test…' : 'Start test'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpeakingSetup;
