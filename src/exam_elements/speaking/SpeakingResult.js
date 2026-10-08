// Bản chấm một bài Speaking (docs/speaking-spec.md §5.6).
//
// Mặc định chỉ hiện Band + nhận xét chung của từng tiêu chí; phần chẩn đoán chi tiết nằm
// sau nút "See detailed assessment". Đây là yêu cầu của spec chứ không phải để đỡ rối: đọc
// một lúc bốn bản phân tích dài thì không ai nhớ được gì.
//
// Chấm chạy nền nên trang này phải sống chung với trạng thái "chưa có điểm": hỏi lại 5
// giây một lần khi còn đang chấm, và nói rõ bài nào không bao giờ được chấm (§4.4).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Crown, Loader2, Lock, MicOff,
    RefreshCw, Target, ThumbsUp, FileDown, Sparkles, Play, StopCircle, Trophy, X,
} from 'lucide-react';
import { fetchResult, requestRegrade, cancelGrade, fetchAnalysis, recordingUrl } from './speakingApi';
import AnalysisPanel from './AnalysisPanel';
import QuotaPills from './QuotaPills';
import Leaderboard from '../../components/Leaderboard';
import BandBadge, { bandText, toneHex } from './BandBadge';

const CRITERIA = [
    ['fluency_coherence', 'Fluency & Coherence'],
    ['lexical_resource', 'Lexical Resource'],
    ['grammar', 'Grammatical Range & Accuracy'],
    ['pronunciation', 'Pronunciation'],
];

// Nhãn ngắn cho bảng điểm — cùng cách gọi với trang phân tích từng câu, để hai màn đọc
// như một. Tên IELTS đầy đủ vẫn giữ ở phần Nhận xét.
const CRITERIA_SHORT = {
    fluency_coherence: 'Fluency & Coherence',
    lexical_resource: 'Lexical Resource',
    grammar: 'Grammar',
    pronunciation: 'Pronunciation',
};

const POLL_MS = 5000;
// Số câu mỗi trang ở tab "Đề & Bài". Một bài Full Test có hơn hai chục câu; đổ hết ra
// một trang thì cuộn mãi không hết (user báo 09/09). Số chẵn để lưới hai cột ở màn rộng
// không thừa ra một ô trống ở hàng cuối.
const QUESTIONS_PER_PAGE = 6;

const VIEWS = [['work', 'Questions & Answers'], ['feedback', 'Feedback'],
               ['analysis', 'Analysis'], ['export', 'Export PDF/Word']];


const Section = ({ title, icon, children }) => (
    <div className="mt-4">
        <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide text-[#eb7e37] mb-2">
            {icon}{title}
        </p>
        {children}
    </div>
);

/**
 * Một tiêu chí, gộp mọi Part vào một thẻ.
 *
 * Bản đầu bắt học viên bấm chuyển tab giữa Part 1 / 2 / 3 mới đọc hết được nhận xét —
 * feedback nói thẳng là không muốn chia như vậy, điểm phải là điểm overall. Giờ điểm trên
 * đầu thẻ là điểm chung của tiêu chí, còn nhận xét từng Part xếp bên trong, có nhãn.
 */
const CriterionCard = ({ label, band, entries, locked }) => {
    const [open, setOpen] = useState(false);
    const rows = (entries || []).filter((e) => e.block);
    if (!rows.length) return null;
    const multi = rows.length > 1;
    const hasDetail = rows.some((e) => (e.block.diagnostics || []).length
        || (e.block.priorities || []).length || (e.block.strengths || []).length);

    return (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#2b5356]">{label}</h3>
                    <div className="mt-2 space-y-2">
                        {rows.map((e) => (
                            <div key={e.partLabel}>
                                {multi && (
                                    <span className="inline-block mb-1 px-2 py-0.5 rounded-md bg-[#0096b1]/10
                                                     text-[#0096b1] text-xs font-bold">
                                        {e.partLabel} · {bandText(e.block.band)}
                                    </span>
                                )}
                                <p className="text-[15px] text-gray-700 leading-relaxed">
                                    {e.block.general_comment || '–'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <BandBadge band={band} size="md" />
            </div>

            {locked ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#eb7e37]/5 border border-[#eb7e37]/25 px-4 py-3">
                    <Lock size={16} className="text-[#eb7e37] shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">
                        A detailed breakdown of each mistake and how to improve is available to VIP accounts.
                    </p>
                </div>
            ) : hasDetail ? (
                <>
                    <button onClick={() => setOpen((v) => !v)}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0096b1] hover:underline">
                        See detailed assessment
                        <ChevronDown size={16} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    </button>
                    {open && rows.map((entry) => {
                        const { diagnostics = [], priorities = [], strengths = [] } = entry.block;
                        return (
                        <div className="mt-1" key={entry.partLabel}>
                            {multi && (
                                <p className="mt-3 mb-1 text-[13px] font-bold uppercase tracking-wide text-[#2b5356]">
                                    {entry.partLabel}
                                </p>
                            )}
                            {diagnostics.length > 0 && (
                                <Section title="Evidence and impact">
                                    <ul className="space-y-2.5">
                                        {diagnostics.map((d, i) => (
                                            <li key={i} className="text-sm">
                                                <span className="font-semibold text-[#2b5356]">{d.factor}</span>
                                                {d.evidence && (
                                                    <span className="block text-gray-700 mt-0.5">“{d.evidence}”</span>
                                                )}
                                                {d.impact && (
                                                    <span className="block text-gray-500 mt-0.5">{d.impact}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}
                            {priorities.length > 0 && (
                                <Section title="Fix these first" icon={<Target size={13} />}>
                                    <ul className="space-y-3">
                                        {priorities.map((p, i) => (
                                            <li key={i} className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                                                <p className="font-semibold text-[#2b5356]">{p.problem}</p>
                                                {p.why && <p className="text-gray-600 mt-1">{p.why}</p>}
                                                {p.impact && <p className="text-gray-500 mt-1">{p.impact}</p>}
                                                {p.how && (
                                                    <p className="text-[#0096b1] mt-1.5 font-medium">{p.how}</p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}
                            {strengths.length > 0 && (
                                <Section title="Keep these strengths" icon={<ThumbsUp size={13} />}>
                                    <ul className="space-y-3">
                                        {strengths.map((s, i) => (
                                            <li key={i} className="rounded-xl bg-[#0096b1]/5 px-4 py-3 text-sm">
                                                <p className="font-semibold text-[#2b5356]">{s.strength}</p>
                                                {s.evidence && (
                                                    <p className="text-gray-600 mt-1">“{s.evidence}”</p>
                                                )}
                                                {s.keep_doing && (
                                                    <p className="text-gray-500 mt-1">{s.keep_doing}</p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}
                        </div>
                        );
                    })}
                </>
            ) : null}
        </div>
    );
};

/**
 * Bảng điểm — rãnh phải, xếp dọc (user chốt 09/09).
 *
 * Vòng tròn thay cho con số trần: band là một thang có trần (0–9), nên nhìn cung tròn đầy
 * tới đâu là biết ngay mình đang ở đâu trên thang đó — điều mà một dòng chữ "3.5" không
 * nói được. Bốn tiêu chí bên dưới cũng có thanh ngang cùng ý đó.
 *
 * Bản trước còn lặp: tiêu đề ghi "Part 1 Band" rồi ngay dưới lại có một khối "Part 1" nữa
 * với đúng bốn con số ấy. Giờ phần "By part" CHỈ hiện khi bài có nhiều hơn một
 * Part — bài lẻ một Part thì bốn tiêu chí trên đầu đã là của chính Part đó.
 */


// Viền cam quanh chữ trắng, vẽ bằng 8 hướng đổ bóng 0px — cách duy nhất chạy đều trên mọi
// trình duyệt mà không làm mảnh nét chữ.
const OUTLINE = ['-2px 0', '2px 0', '0 -2px', '0 2px',
                 '-1.5px -1.5px', '1.5px -1.5px', '-1.5px 1.5px', '1.5px 1.5px']
    .map((d) => `${d} 0 #eb7e37`).join(', ');

// Sóng chạy ở đáy khối điểm. Hai lớp, hai tốc độ, chạy ngược chiều nhau — một lớp thì
// trông như một hình vẽ đứng yên, hai lớp lệch nhau mới ra cảm giác nước.
//
// Đường sóng vẽ bằng lệnh TƯƠNG ĐỐI lặp lại 8 lần, mỗi chu kỳ 360px → tổng 2880px, đúng
// gấp đôi bề ngang hiển thị. Nhờ vậy dịch đi -50% là khớp lại đúng vị trí cũ, vòng lặp
// không thấy mối nối.
const WAVE_A = `M0,42 ${'c 90,-22 270,22 360,0 '.repeat(8)}V80 H0 Z`;
const WAVE_B = `M0,52 ${'c 120,20 240,-20 360,0 '.repeat(8)}V80 H0 Z`;
const PAGE_CSS = `
@keyframes spk-wave-a { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
@keyframes spk-wave-b { from { transform: translateX(-50%); } to { transform: translateX(0); } }
.spk-wave-a { animation: spk-wave-a 16s linear infinite; }
.spk-wave-b { animation: spk-wave-b 24s linear infinite; }
/* Thanh chạy vô định của trạng thái "đang chấm" — không biết còn bao lâu nên không thể
   vẽ phần trăm thật; một vệt chạy qua lại là cách trung thực nhất. */
@keyframes spk-bar { 0% { transform: translateX(-110%); } 100% { transform: translateX(320%); } }
.spk-bar { animation: spk-bar 1.5s ease-in-out infinite; }
/* Tiêu đề trang: chữ chuyển màu teal→slate, hiện lên nhẹ một lần khi vào trang, và một
   vệt sáng quét ngang. Vệt sáng dùng background-position nên không vẽ thêm lớp nào đè
   lên chữ, chữ vẫn bôi đen chọn được, vẫn đọc được bằng trình đọc màn hình. */
@keyframes spk-title-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes spk-title-sheen { 0% { background-position: 180% 0; } 60%, 100% { background-position: -80% 0; } }
.spk-title {
  background-image: linear-gradient(100deg,
    #2b5356 0%, #2b5356 38%, #0096b1 46%, #7fe6f5 50%, #0096b1 54%, #2b5356 62%, #2b5356 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: spk-title-in .5s ease-out both, spk-title-sheen 4.5s ease-in-out 0.5s infinite;
}
.spk-title-sub { animation: spk-title-in .5s ease-out .12s both; }
@media (prefers-reduced-motion: reduce) {
  .spk-wave-a, .spk-wave-b, .spk-bar, .spk-title, .spk-title-sub { animation: none; }
  .spk-title { color: #2b5356; }
}
`;

/** Vòng tròn điểm. `track`/`color` truyền vào vì nó nằm trên cả nền tối lẫn nền trắng. */
const Ring = ({ band, size, stroke, color, track, children }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const filled = band == null ? 0 : Math.max(0, Math.min(1, band / 9)) * circ;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                        stroke={track} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                        stroke={color} strokeWidth={stroke} strokeLinecap="round"
                        strokeDasharray={`${filled} ${circ}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                {children}
            </div>
        </div>
    );
};

/** Một tiêu chí: nhãn, điểm, và thanh ngang cùng thang 0–9 với vòng tròn ở trên. */
const CriterionRow = ({ label, band }) => (
    <div className="px-5 py-2">
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-gray-600 leading-tight">{label}</span>
            <span className="text-[15px] font-bold tabular-nums shrink-0"
                  style={{ color: toneHex(band) }}>
                {bandText(band)}
            </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all"
                 style={{ width: `${band == null ? 0 : (band / 9) * 100}%`,
                          backgroundColor: toneHex(band) }} />
        </div>
    </div>
);

const ScoreBoard = ({ data }) => {
    const parts = data.parts || [];
    if (!parts.length && !data.has_overall) return null;

    // Bài lẻ một Part không có Overall (§7) — lúc đó chính Part Band là con số đứng đầu,
    // và bốn tiêu chí trên đầu là của Part đó.
    const single = !data.has_overall && parts.length === 1;
    const headline = data.has_overall ? data.overall_band : (parts[0] && parts[0].band);
    const headBand = (key) => {
        if (data.has_overall) return data.criteria ? data.criteria[key] : null;
        const block = parts[0] && (parts[0].criteria || {})[key];
        return block ? block.band : null;
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Nền teal thương hiệu thay cho slate tối (user 09/09: "sáng 1 tí"), cộng
                hai tầng gợn sóng: vòng tròn đồng tâm toả ra từ điểm số, và sóng chạy ở
                đáy để khối màu chảy vào phần trắng bên dưới thay vì cắt ngang một đường
                thẳng. */}
            {/* pt lớn hơn pb: lớp sóng ở đáy cao 34px và đỉnh sóng trắng ăn lên thêm
                khoảng 16px nữa, nên phần teal trống bên dưới chữ luôn dày hơn bên trên.
                Đẩy nội dung xuống (pt-10 / pb-6) thì hai khoảng trống mới cân (user 09/09). */}
            <div className="relative overflow-hidden text-white px-5 pt-10 pb-6 flex flex-col items-center
                            bg-gradient-to-br from-[#12b3cd] via-[#0096b1] to-[#00819a]">
                {/* Nền: hai quầng sáng nhoè và một vệt sáng chéo.
                    Bản trước là mấy vòng tròn đồng tâm vẽ nét, chúng cùng hình với vòng
                    điểm ở giữa nên nhìn thành một cái bia bắn, và nét mảnh 1px trên nền
                    chuyển sắc thì lộ răng cưa. Quầng sáng nhoè không có đường viền nào để
                    tranh chấp với vòng điểm, chỉ tạo chiều sâu cho khối màu. */}
                <div aria-hidden="true"
                     className="pointer-events-none absolute -top-20 -left-14 w-64 h-64 rounded-full
                                bg-white/25 blur-3xl" />
                <div aria-hidden="true"
                     className="pointer-events-none absolute -bottom-16 -right-16 w-72 h-72 rounded-full
                                bg-[#7fe6f5]/30 blur-3xl" />
                <div aria-hidden="true"
                     className="pointer-events-none absolute inset-0
                                bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent" />

                <p className="relative text-[11px] uppercase tracking-[0.18em] text-white font-bold">
                    Speaking Result
                </p>
                <div className="relative mt-3.5">
                    {/* Cung CAM trên nền teal: user vẫn muốn điểm nhấn cam (feedback
                        08/09), và trên nền sáng thì cam bắt mắt hơn hẳn trắng-trên-trắng. */}
                    <Ring band={headline} size={148} stroke={11}
                          color="#eb7e37" track="rgba(255,255,255,0.25)">
                        {/* Chữ trắng viền cam: trắng trơn trên nền teal sáng thì chìm, mà
                            đổi hẳn sang cam thì lại lẫn với cung tròn cũng màu cam. Viền vẽ
                            bằng 8 hướng text-shadow chứ không dùng -webkit-text-stroke,
                            text-stroke ăn vào trong nét chữ, số 3.5 cỡ 44px sẽ mảnh hẳn đi. */}
                        <span className="text-[46px] font-bold tabular-nums text-white"
                              style={{ textShadow: OUTLINE }}>
                            {bandText(headline)}
                        </span>
                        <span className="text-[12px] font-bold text-white mt-1.5 tabular-nums">/ 9.0</span>
                    </Ring>
                </div>
                <p className="relative text-[12px] uppercase tracking-[0.12em] text-white font-bold mt-3.5">
                    {data.has_overall ? 'Overall Band' : (parts[0] ? `${parts[0].label} Band` : 'Band')}
                </p>
                {/* Sai số ±0.5 (user chốt 14/09). Đây là điểm AI chấm, không phải điểm thi
                    thật: nói rõ khoảng dao động ngay cạnh con số thì học viên đọc đúng bản
                    chất của nó, thay vì coi 5.0 là phán quyết cuối cùng. */}
                <p className="relative text-[12px] font-bold text-white/85 mt-1">margin ± 0.5</p>

                {/* Sóng đáy: lớp mờ chạy chậm phía sau, lớp trắng đặc chạy nhanh phía trước */}
                <div className="absolute inset-x-0 bottom-0 h-[34px] overflow-hidden pointer-events-none"
                     aria-hidden="true">
                    <svg className="spk-wave-b absolute bottom-0 left-0 w-[200%] h-full"
                         viewBox="0 0 2880 80" preserveAspectRatio="none">
                        <path d={WAVE_B} fill="#ffffff" fillOpacity="0.35" />
                    </svg>
                    <svg className="spk-wave-a absolute bottom-0 left-0 w-[200%] h-full"
                         viewBox="0 0 2880 80" preserveAspectRatio="none">
                        <path d={WAVE_A} fill="#ffffff" />
                    </svg>
                </div>
            </div>

            <div className="py-2">
                {CRITERIA.map(([key, label]) => (
                    <CriterionRow key={key} label={label} band={headBand(key)} />
                ))}
            </div>

            {!single && parts.length > 0 && (
                <div className="border-t border-gray-100 pt-3 pb-1">
                    <p className="px-5 text-[10px] uppercase tracking-[0.14em] font-bold text-gray-400 mb-1">
                        By part
                    </p>
                    {parts.map((p) => (
                        <div key={p.part} className="px-5 py-2.5 flex items-center gap-3.5">
                            <Ring band={p.band} size={50} stroke={5}
                                  color={toneHex(p.band)} track="#f1f3f4">
                                <span className="text-[15px] font-bold tabular-nums"
                                      style={{ color: toneHex(p.band) }}>
                                    {bandText(p.band)}
                                </span>
                            </Ring>
                            <div className="min-w-0 grow">
                                <p className="text-[13px] font-bold text-[#2b5356]">{p.label}</p>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
                                    {CRITERIA.map(([key]) => {
                                        const block = (p.criteria || {})[key];
                                        const b = block ? block.band : null;
                                        return (
                                            <span key={key} className="text-[11px] text-gray-500 flex justify-between gap-1">
                                                <span className="truncate">{CRITERIA_SHORT[key]}</span>
                                                <span className="font-bold tabular-nums shrink-0"
                                                      style={{ color: toneHex(b) }}>
                                                    {bandText(b)}
                                                </span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="px-5 py-3 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed">
                AI-generated reference assessment, not an official test score.
            </p>
        </div>
    );
};

const SpeakingResult = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const attemptId = location.state?.attemptId
        || Number(new URLSearchParams(location.search).get('attempt')) || null;

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    // Từ trang phân tích một câu quay về thì phải rơi đúng tab vừa đứng. Trang này mount
    // lại nên tab chỉ còn sống trong state của route.
    const [view, setView] = useState(
        VIEWS.some(([k]) => k === location.state?.view) ? location.state.view : 'work');
    const [partTab, setPartTab] = useState(0);   // Part đang xem trong tab Nhận xét
    const [page, setPage] = useState(0);         // trang câu hỏi ở tab Đề & Bài
    const [analysis, setAnalysis] = useState(null);
    const [regrading, setRegrading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showRanking, setShowRanking] = useState(false);   // bảng xếp hạng (feedback 21/09)
    const timer = useRef(null);
    const audioRef = useRef(null);
    // Chỉ hỏi lại máy chủ khi CHÍNH học viên vừa bấm chấm. Bản đầu hỏi lại vô điều kiện
    // mỗi khi thấy 'pending', mà giờ 'pending' là trạng thái mặc định của mọi bài chưa
    // chấm — sẽ thành hỏi lại mãi mãi cho một bản chấm không ai gọi.
    const gradingRef = useRef(false);

    const load = useCallback(async () => {
        if (!attemptId) { setError('There is no test to show.'); return; }
        try {
            const res = await fetchResult(attemptId);
            setData(res);
            // Chấm chạy nền: hỏi lại cho tới khi xong hoặc hỏng.
            // Hỏi lại khi CHÍNH học viên vừa bấm, HOẶC khi máy chủ còn nhớ mốc bấm của
            // lần trước (`grade_waited_seconds`). Vế thứ hai là để tải lại trang giữa
            // chừng vẫn theo tiếp được bản chấm đang chạy, thay vì rơi về thẻ "Chấm bài"
            // rồi bấm thêm một lượt nữa cho cùng một bài.
            if (res.gradable && ['pending', 'running'].includes(res.grade_status)
                && (gradingRef.current || res.grade_waited_seconds != null)) {
                timer.current = setTimeout(load, POLL_MS);
            }
            if (res.grade_status === 'done') gradingRef.current = false;
            // Tab "Đề & Bài" phải đọc được NGAY khi vừa nộp, chưa cần chấm (feedback
            // 09/09) — nên gọi ở mọi trạng thái, không riêng lúc 'done'. Endpoint này chỉ
            // đọc dữ liệu đã có, không gọi AI (§6.8), nên gọi sớm không tốn gì.
            // Ba tab "Đề & Bài", "Phân tích" và "Xuất file" dùng chung một lần gọi này.
            fetchAnalysis(attemptId).then(setAnalysis).catch(() => {});
        } catch (e) {
            setError(e.message);
        }
    }, [attemptId]);

    useEffect(() => {
        load();
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [load]);

    const grade = async () => {
        setRegrading(true);
        setError('');
        try {
            await requestRegrade(attemptId);
            gradingRef.current = true;    // từ đây mới bật hỏi lại theo chu kỳ
            await load();
        } catch (e) {
            setError(e.message);
        }
        setRegrading(false);
    };

    // Dừng một lần chấm treo (feedback 15/09: "chạy hoài mà k chấm được ... thì mình có
    // thể bấm dừng. Chấm lại"). Máy chủ hoàn lại lượt, nên cú "Chấm lại" ngay sau đó không
    // tốn thêm lượt nào — không hoàn thì tài khoản thường mất trắng cả ngày vì một lần treo.
    const stopGrading = async () => {
        setCancelling(true);
        setError('');
        try {
            await cancelGrade(attemptId);
            gradingRef.current = false;
            if (timer.current) clearTimeout(timer.current);
            await load();
        } catch (e) {
            setError(e.message);
        }
        setCancelling(false);
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
                    <AlertCircle className="text-[#eb7e37] mx-auto mb-4" size={32} />
                    <p className="text-[#2b5356] font-semibold mb-5">{error}</p>
                    <button onClick={() => navigate('/speaking_list')}
                        className="px-5 py-2.5 rounded-xl bg-[#0096b1] text-white font-semibold">
                        Back to list
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#0096b1]" size={30} />
            </div>
        );
    }

    /**
     * Bản xuất gồm: điểm tổng → nhận xét 4 tiêu chí → phân tích từng câu (câu hỏi, câu
     * trả lời, điểm, nhận xét). Đúng ba thứ feedback liệt kê.
     *
     * Dựng HTML rồi để trình duyệt lo phần còn lại — Word đọc được HTML, còn PDF thì in
     * qua cửa sổ mới. Cùng cách màn Writing đang dùng, để hai bên ra file giống nhau.
     */
    const buildReportHtml = () => {
        const esc = (v) => String(v == null ? '' : v)
            .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        const d = data || {};
        const a = analysis || {};
        let h = `<h1>Speaking Result</h1>`;
        if (d.has_overall) h += `<p><b>Overall Band: ${esc(bandText(d.overall_band))}</b> (margin ± 0.5)</p>`;
        h += `<p>${CRITERIA.map(([k, lb]) =>
            `${esc(lb)}: <b>${esc(bandText(d.criteria ? d.criteria[k] : null))}</b>`).join(' &nbsp;·&nbsp; ')}</p>`;

        h += `<h2>Feedback</h2>`;
        CRITERIA.forEach(([key, label]) => {
            h += `<h3>${esc(label)}</h3>`;
            (d.parts || []).forEach((pt) => {
                const b = (pt.criteria || {})[key];
                if (!b) return;
                if ((d.parts || []).length > 1) h += `<p><i>${esc(pt.label)}: ${esc(bandText(b.band))}</i></p>`;
                if (b.general_comment) h += `<p>${esc(b.general_comment)}</p>`;
                (b.priorities || []).forEach((x) => {
                    h += `<p>• <b>${esc(x.problem)}</b>: ${esc(x.how || x.why || '')}</p>`;
                });
                (b.strengths || []).forEach((x) => {
                    h += `<p>• Strength: ${esc(x.strength)}</p>`;
                });
            });
        });

        h += `<h2>Detailed analysis</h2>`;
        (a.parts || []).forEach((pt) => {
            h += `<h3>${esc(pt.label)}${pt.band != null ? `: ${esc(bandText(pt.band))}` : ''}</h3>`;
            (a.questions || []).filter((q) => q.part_label === pt.label).forEach((q) => {
                h += `<p><b>${q.order_index + 1}. ${esc(q.question_text || 'Follow-up question asked during the test')}</b>`
                    + `${q.band != null ? `: ${esc(bandText(q.band))}` : ''}</p>`;
                h += `<p style="white-space:pre-wrap">${esc(q.answer_text) || '<i>No answer</i>'}</p>`;
                if (q.comment) h += `<p><i>${esc(q.comment)}</i></p>`;
            });
        });
        h += `<p style="color:#666;font-size:12px">AI-generated reference assessment, `
            + `not an official test score.</p>`;
        return h;
    };

    const exportWord = () => {
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' `
            + `xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>`
            + `<head><meta charset='utf-8'></head><body>${buildReportHtml()}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const el = document.createElement('a');
        el.href = url; el.download = `Speaking_result_${attemptId}.doc`;
        document.body.appendChild(el); el.click(); el.remove(); URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
        const w = window.open('', '_blank');
        if (!w) { setError('Your browser is blocking the print window. Allow pop-ups and try again.'); return; }
        w.document.write(`<html><head><meta charset='utf-8'><title>Speaking Result</title>`
            + `<style>body{font-family:Arial,sans-serif;max-width:800px;margin:24px auto;padding:0 16px;`
            + `line-height:1.55}h1{font-size:20px}h2{font-size:17px;margin-top:22px}h3{font-size:15px}`
            + `</style></head><body>${buildReportHtml()}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => { try { w.print(); } catch (e) { /* người dùng tự in */ } }, 350);
    };

    // Bài luyện theo dự đoán mang `forecast_topic_id` trong đề đã đóng băng; bài thi thử
    // thì không. Đó là dấu hiệu tin được, không phải đoán theo test_type.
    const fromForecast = !!data.is_forecast_practice;
    const backTo = fromForecast ? '/speaking_forecast' : '/speaking_test_setup';

    const playAnswer = (answerId) => {
        if (!audioRef.current) return;
        audioRef.current.src = recordingUrl(answerId);
        audioRef.current.play().catch(() => setError('Could not play the recording.'));
    };
    const parts = data.parts || [];
    const currentPart = parts[Math.min(partTab, Math.max(0, parts.length - 1))];

    // Phân trang tab "Đề & Bài". Cắt theo thứ tự câu, không theo Part.
    const allQuestions = (analysis && analysis.questions) || [];
    const totalPages = Math.max(1, Math.ceil(allQuestions.length / QUESTIONS_PER_PAGE));
    // Kẹp lại phòng khi dữ liệu ngắn đi sau khi tải lại: giữ nguyên `page` cũ thì trang
    // rỗng, mà rỗng thì trông như mất bài.
    const safePage = Math.min(page, totalPages - 1);
    const pageQuestions = allQuestions.slice(safePage * QUESTIONS_PER_PAGE,
                                             (safePage + 1) * QUESTIONS_PER_PAGE);
    // Điểm từng Part để gắn cạnh tiêu đề Part khi trang bước sang Part mới.
    const partBand = {};
    ((analysis && analysis.parts) || []).forEach((pt) => { partBand[pt.label] = pt.band; });
    const graded = data.grade_status === 'done';
    // `pending` là trạng thái MẶC ĐỊNH của mọi bài chưa chấm, không phải "đang chấm".
    // Bản trước coi hai thứ đó là một, nên vòng xoay "Đang chấm bài" hiện ngay khi vừa nộp
    // và nút "Chấm bài" không bao giờ xuất hiện — đúng lỗi team báo.
    //   • `running`  = job đang chạy thật, luôn hiện vòng xoay (kể cả khi tải lại trang).
    //   • `pending`  = chỉ là "đang chấm" nếu CHÍNH học viên vừa bấm ở phiên này.
    // Máy chủ chỉ trả `grade_waited_seconds` khi bài ĐÃ từng được xếp hàng chấm — đó là
    // cách phân biệt 'pending' mặc định (chưa ai bấm) với 'pending' đang chờ job chạy.
    const queued = data.grade_waited_seconds != null;
    const waiting = data.gradable && (
        data.grade_status === 'running'
        || (data.grade_status === 'pending' && (gradingRef.current || queued)));
    const needsGrading = data.gradable && data.grade_status === 'pending'
        && !gradingRef.current && !queued;
    // Bài chấm lúc tài khoản chưa VIP chỉ có điểm. Giờ đã là VIP thì mời chấm lại — đó là
    // cách duy nhất để sinh phần nhận xét, và máy chủ cũng cho phép đúng trường hợp này.
    const needsFeedbackGrade = graded && data.is_vip && data.has_feedback === false;
    // `regrading` là quãng CHỜ MÁY CHỦ TRẢ LỜI ngay sau cú bấm, trước khi `grade_status`
    // kịp đổi. Gộp nó vào trạng thái "đang chấm" để không có một nhịp trang đứng im —
    // học viên tưởng nút hỏng thì sẽ bấm lại, mà mỗi lần bấm là một lượt.
    const showWaiting = waiting || regrading;
    // `regrading` là quãng vừa bấm xong nên KHÔNG tính vào đây: mốc chờ lúc đó vẫn là của
    // lần trước, hiện nút Dừng ngay sau cú bấm là sai.
    const canCancel = waiting && !regrading && !cancelling
        && data.grade_waited_seconds != null
        && data.grade_waited_seconds >= (data.grade_cancel_after || 180);
    const showGradeCard = needsGrading && !showWaiting;

    const lockedView = (k) => (k === 'feedback' && data.feedback_locked)
        || (k === 'analysis' && data.analysis_locked)
        || (k === 'export' && data.export_locked);

    const VIP_COPY = {
        feedback: ['Detailed feedback is for VIP',
                   'VIP gives feedback on every criterion in every Part: where you are strong, where you slip, and what to fix first.'],
        analysis: ['Question-by-question analysis is for VIP',
                   'VIP points out every mistake in your answers, with fixes, sample answers and pronunciation practice for that question.'],
        export: ['PDF/Word export is for VIP',
                 'VIP lets you export all scores, feedback and analysis to a file to keep or send to your teacher.'],
    };
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <audio ref={audioRef} className="hidden" />
            <style>{PAGE_CSS}</style>
            <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-2.5 flex items-center gap-3">
                    {/* Quay về đúng chỗ vừa đi ra: thi thử thì về màn chuẩn bị để thi lại
                        ngay, còn luyện theo dự đoán thì về danh sách chủ đề (feedback 07/09).
                        Trước đây cả hai đều đổ về trang Speaking, phải bấm thêm mấy lần. */}
                    <button onClick={() => navigate(backTo)}
                        className="inline-flex items-center gap-1 pl-1.5 pr-3 py-1.5 -ml-1.5 rounded-lg
                                   text-sm font-semibold text-[#2b5356] hover:bg-gray-100">
                        <ChevronLeft size={20} /> Back
                    </button>
                    {/* Hai nút đi tiếp nằm cùng hàng tiêu đề (user chốt 09/09). Trước đây
                        chúng là một thẻ riêng dưới rãnh phải, chiếm chỗ của bảng điểm mà
                        thực ra chỉ là điều hướng, không phải nội dung. */}
                    <div className="ml-auto flex items-center gap-2">
                        {/* Ba kỹ năng kia đều có lối vào bảng xếp hạng ngay ở màn kết quả,
                            Speaking thì chưa (feedback 21/09). Bài Speaking không nằm trong
                            bảng xếp hạng THEO ĐỀ nên mở thẳng vào Cúp tháng của Speaking. */}
                        <button onClick={() => setShowRanking(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl
                                       border-2 border-[#eb7e37]/40 text-[#eb7e37] font-bold text-sm
                                       hover:border-[#eb7e37] whitespace-nowrap">
                            <Trophy size={16} /> Leaderboard
                        </button>
                        <button onClick={() => navigate('/speaking_test_setup')}
                            className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#0096b1] text-white
                                       font-bold text-sm hover:bg-[#007a90] whitespace-nowrap">
                            Take another test
                        </button>
                        <button onClick={() => navigate(backTo)}
                            className="px-3.5 sm:px-4 py-2 rounded-xl border-2 border-gray-200
                                       text-[#2b5356] font-bold text-sm hover:border-gray-300
                                       whitespace-nowrap">
                            {fromForecast ? 'Back to Focus' : 'Back to setup'}
                        </button>
                    </div>
                </div>
            </header>

            {showRanking && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4"
                     onClick={() => setShowRanking(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[88vh] overflow-y-auto relative"
                         onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowRanking(false)}
                            className="sticky top-3 float-right mr-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5
                                       rounded-full bg-white border-2 border-gray-200 text-sm font-bold
                                       text-[#2b5356] hover:border-[#eb7e37] hover:text-[#eb7e37]">
                            <X size={15} /> Close
                        </button>
                        <Leaderboard initialTab="cup" initialSkill="speaking" pageSize={20} />
                    </div>
                </div>
            )}

            {/*
              Hai cột từ lg trở lên (user 09/09: "để trống 2 bên phí quá").
              Bản trước bó cả trang trong `max-w-5xl` nên màn 1440px thừa ra hai dải trống
              rất rộng. Nhưng kéo giãn nguyên khối cũ ra full width thì tệ hơn: dòng chữ
              dài 1300px không ai đọc nổi. Nên chia việc:
                • cột chính , bảng điểm và nội dung tab, thứ THỰC SỰ cần bề ngang;
                • rãnh phải , trạng thái chấm, hạn mức, nút điều hướng: mấy khối ngắn mà
                  trước đây nằm chen giữa nội dung, đẩy bảng điểm tụt xuống dưới màn hình.
              Rãnh phải `sticky` nên nút "Chấm điểm" luôn trong tầm mắt dù cuộn tới đâu.
              Dưới lg thì rãnh nhảy LÊN TRÊN (`order-first`): trên điện thoại việc đầu tiên
              cần thấy vẫn là nút chấm, không phải để nó rơi xuống tận cuối trang.
            */}
            {/* Nội dung ngắn hơn màn hình thì CĂN GIỮA theo chiều dọc (user 09/09: "đưa
                tất cả element vào giữa màn hình, khoảng trống bên dưới còn rộng quá").
                `my-auto` chứ không phải `justify-center`: khi nội dung dài hơn màn hình,
                margin auto tự về 0 và trang cuộn bình thường, còn `justify-center` thì
                cắt mất phần trên, không cuộn tới được. */}
            <main className="grow flex w-full max-w-[1360px] mx-auto px-4 lg:px-6 py-7">                {/*
                  Khu vực trên cùng, TRẢI HẾT BỀ NGANG (user 09/09).
                  Trạng thái chấm trước đây nằm trong rãnh phải cạnh bảng điểm. Nhưng khi
                  chưa chấm thì rãnh đó chẳng có bảng điểm nào, nên trang thành một cột hẹp
                  cộng một cột trống, mà thứ quan trọng nhất lúc ấy (nút Chấm điểm) lại bị
                  nhét vào cột hẹp. Giờ nó là một dải ngang trên đầu, và trang chỉ chia hai
                  cột SAU KHI đã có điểm để hiện bên phải.
                */}
                <div className="w-full my-auto space-y-4">

                    {/* Suất xem thử bài đầu tiên (feedback 23/09). Nói thẳng đây là một
                        lần duy nhất, để học viên không tưởng mình đã có VIP. */}
                    {data.free_preview && (
                        <div className="rounded-xl border border-[#0096b1]/30 bg-[#0096b1]/5 px-4 py-3
                                        text-sm text-[#2b5356] flex items-start gap-2">
                            <Sparkles size={18} className="text-[#0096b1] shrink-0 mt-0.5" />
                            <span>
                                <b>Your first test is fully unlocked.</b> You can open Feedback and
                                Analysis for this test. From your second test onwards, these two sections are for
                                VIP accounts.
                            </span>
                        </div>
                    )}

                    {/* Tiêu đề trang. Không nằm trên thanh dính (thanh đó chỉ còn nút quay
                        lại và hai nút đi tiếp), cũng không nằm trong cột trái, ở trong cột
                        thì nó căn giữa theo CỘT, mà cột trái lệch hẳn sang trái khi bên phải
                        có rãnh 324px. Đặt ở đây thì nó căn giữa theo cả bề ngang trang. */}
                    <div className="text-center">
                        <h1 className="spk-title inline-block text-[32px] sm:text-[44px] lg:text-5xl
                                       font-extrabold tracking-tight leading-[1.15] pb-1">
                            Speaking Result
                        </h1>
                        {/* Gạch cam ngắn dưới tiêu đề — chấm phá thương hiệu, cũng là vạch
                            ngăn giữa tiêu đề và dòng mô tả. */}
                        <div className="spk-title-sub mx-auto mt-1 h-1 w-16 rounded-full bg-[#eb7e37]" />
                        <p className="spk-title-sub text-sm sm:text-[15px] text-gray-500 mt-3">
                            Scores, feedback and detailed corrections for your speaking, assessed by AI.
                        </p>
                    </div>

                    {data.warning && (
                        <div className="flex items-start gap-2 rounded-xl bg-[#eb7e37]/10 border border-[#eb7e37]/25 px-4 py-3">
                            <MicOff size={17} className="text-[#eb7e37] shrink-0 mt-0.5" />
                            <p className="text-sm text-[#8a4a17]">{data.warning}</p>
                        </div>
                    )}

                    {!data.gradable && (
                        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 sm:p-6 flex items-start gap-4">
                            <AlertCircle className="text-[#eb7e37] shrink-0 mt-0.5" size={26} />
                            <div>
                                <p className="text-lg font-bold text-[#2b5356] mb-1">This test is not scored</p>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    The test ended early, so it is only saved to your history. You can
                                    try again at any time.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* feedback 07/09: nộp xong KHÔNG chấm luôn. 09/09 đi thêm một bước — nộp
                        bài là vào thẳng đây, đọc lại đề và bài mình vừa nói ở dưới; muốn có
                        ĐIỂM thì bấm, và mỗi lần bấm tiêu một lượt. */}
                    {showGradeCard && (
                        <div className="rounded-2xl bg-white border-2 border-[#eb7e37]/30 shadow-sm p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                <div className="min-w-0 grow">
                                    <p className="text-lg font-bold text-[#2b5356] mb-1">This test has not been scored yet</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Your questions and answers are below — review them freely, it costs
                                        nothing. Each grading uses one AI grading credit.
                                    </p>
                                </div>
                                <div className="shrink-0 sm:text-right">
                                    <button onClick={grade} disabled={data.grade_remaining === 0}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                                                   px-7 py-3.5 rounded-xl bg-[#eb7e37] text-white font-bold
                                                   hover:bg-[#d86f2b] disabled:opacity-50">
                                        <Sparkles size={18} /> Grade
                                    </button>
                                    {/* Chỉ lượt CHẤM ở đây: bài đã thi xong rồi, lượt thi
                                        không còn liên quan. */}
                                    <div className="mt-2 flex sm:justify-end">
                                        <QuotaPills info={data} showAttempts={false} />
                                    </div>
                                    {data.grade_remaining === 0 && (
                                        <button onClick={() => navigate('/vip-packages')}
                                            className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-1.5
                                                       px-4 py-2.5 rounded-xl border-2 border-[#eb7e37]/40 text-[#eb7e37]
                                                       font-bold text-sm hover:border-[#eb7e37]">
                                            <Crown size={16} /> Upgrade to VIP
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Đang chấm: thanh chạy vô định + vòng xoay. Bấm xong mà trang không đổi
                        gì thì học viên tưởng nút hỏng và bấm lại, mỗi lần bấm là một lượt. */}
                    {showWaiting && (
                        <div className="rounded-2xl bg-white border-2 border-[#0096b1]/30 shadow-sm p-5 sm:p-6">
                            <div className="flex items-start gap-4">
                                <Loader2 className="animate-spin text-[#0096b1] shrink-0 mt-0.5" size={26} />
                                <div className="min-w-0 grow">
                                    <p className="text-lg font-bold text-[#2b5356]">
                                        The AI examiner is grading your test
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                        {/* Câu chữ do chủ dự án chốt (feedback 21/09) — nói rõ chấm lâu
                                            là để phân tích kỹ, để học viên đỡ tưởng hệ thống treo. */}
                                        Listening to each answer. This can take 1–5 minutes
                                        to analyse carefully and give a more accurate result.
                                        Stay on this page — it will update automatically when the score is ready.
                                    </p>
                                    <div className="mt-4 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div className="spk-bar h-full w-1/3 rounded-full bg-[#0096b1]" />
                                    </div>
                                    {/* Nút Dừng chỉ ló ra khi đã chờ quá lâu thật (máy chủ
                                        quyết định, xem `grade_cancel_after`) — hiện sẵn từ
                                        giây đầu thì học viên bấm huỷ một lần chấm vẫn đang
                                        chạy ngon lành, mà mỗi lần chấm là một lần trả tiền. */}
                                    {canCancel && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                                It has been over {Math.floor((data.grade_cancel_after || 180) / 60)} minutes
                                                without a score. You can stop this grading and
                                                start again — the grading credit will be refunded, not lost.
                                            </p>
                                            <button onClick={stopGrading} disabled={cancelling}
                                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                                                           border-2 border-[#eb7e37]/40 text-[#eb7e37] font-bold text-sm
                                                           hover:border-[#eb7e37] disabled:opacity-60">
                                                {cancelling ? <Loader2 className="animate-spin" size={16} />
                                                            : <StopCircle size={16} />}
                                                Stop this grading
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {needsFeedbackGrade && (
                        <div className="rounded-2xl bg-white border-2 border-[#0096b1]/30 shadow-sm p-5 sm:p-6
                                        flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                            <div className="min-w-0 grow">
                                <p className="text-lg font-bold text-[#2b5356] mb-1">This test only has scores</p>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Your account was not VIP when it was graded, so only scores were produced.
                                    Grade again to get feedback and question-by-question analysis.
                                </p>
                            </div>
                            <button onClick={grade} disabled={regrading}
                                className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                                           bg-[#0096b1] text-white font-bold hover:bg-[#007a90] disabled:opacity-60">
                                <Sparkles size={17} /> Re-grade with feedback
                            </button>
                        </div>
                    )}

                    {data.grade_status === 'failed' && !showWaiting && (
                        <div className="rounded-2xl bg-white border-2 border-[#eb7e37]/30 shadow-sm p-5 sm:p-6
                                        flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                            <div className="min-w-0 grow">
                                {/* Học viên tự bấm Dừng thì đừng báo như một sự cố — họ biết
                                    thừa vì sao bài chưa có điểm, thứ họ cần biết là lượt đã
                                    được hoàn lại. */}
                                <p className="text-lg font-bold text-[#2b5356] mb-1">
                                    {data.grade_error === 'cancelled'
                                        ? 'You stopped the previous grading'
                                        : 'This test could not be graded'}
                                </p>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {data.grade_error === 'cancelled'
                                        ? 'Your grading credit was refunded — press Re-grade to start again. Your answers are kept.'
                                        : 'The grading service is busy or the connection dropped. Your answers are kept.'}
                                </p>
                            </div>
                            <button onClick={grade} disabled={regrading}
                                className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                                           bg-[#0096b1] text-white font-semibold disabled:opacity-60">
                                <RefreshCw size={17} /> Re-grade
                            </button>
                        </div>
                    )}

                    {/* Chỉ chia hai cột KHI ĐÃ CÓ ĐIỂM — chưa chấm thì bên phải trống, chia
                        cột chỉ tổ bóp hẹp phần bài làm. */}
                    <div className={graded
                        ? 'grid lg:grid-cols-[minmax(0,1fr)_324px] gap-5 lg:gap-6 items-start'
                        : ''}>
                        <div className="min-w-0 space-y-4">

                        {/* Bốn tab hiện NGAY từ lúc vào trang, không chờ chấm (feedback 09/09:
                            "tách các hạng mục ra ... cho AI khởi tạo nội dung Đề & bài trước").
                            Trước đây cả khối này nằm sau `grade_status === 'done'`, nên nộp bài
                            xong màn kết quả trống trơn cho tới khi chịu tiêu một lượt chấm. */}
                        <div className="border-b-2 border-gray-200">
                            {/* Tab bám mép trái (user chốt 10/09). Căn giữa thì chúng lệch
                                khỏi mọi thứ nằm dưới, thẻ câu hỏi, bảng điểm đều bắt đầu từ
                                mép trái cột. Thứ căn giữa theo cả bề ngang trang là tiêu đề
                                "Kết quả Speaking", không phải hàng tab. */}
                            <div className="flex gap-1 overflow-x-auto">
                                {VIEWS.map(([k, lb]) => (
                                    <button key={k} onClick={() => setView(k)}
                                        className={`shrink-0 px-5 py-2.5 text-[15px] font-bold rounded-t-lg -mb-0.5 border-b-[3px] ${
                                            view === k ? 'border-[#0096b1] text-[#0096b1] bg-white'
                                                       : 'border-transparent text-gray-500 hover:text-[#2b5356]'} ${
                                            lockedView(k) ? 'opacity-60' : ''}`}>
                                        {lb}
                                        {lockedView(k) && <Lock size={13} className="inline ml-1.5 -mt-0.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {view === 'work' && (
                            <div className="space-y-3">
                                {/* Đề & Bài đọc được ngay sau khi nộp: nó chỉ là bài chính học viên
                                    vừa nói, không cần AI. Điểm từng câu xuất hiện thêm vào đây SAU
                                    khi bấm chấm. */}
                                <p className="text-sm text-gray-500">
                                    All your questions, answers and recordings, exactly as they were during
                                    the test. This is the version used for grading, so it cannot be edited.
                                    {graded && <> For detailed corrections of each answer, open the <b>Analysis</b> tab.</>}
                                </p>
                                {!analysis ? (
                                    <div className="py-10 flex justify-center">
                                        <Loader2 className="animate-spin text-[#0096b1]" size={26} />
                                    </div>
                                ) : (
                                    <>
                                        {/* Phân trang + hai cột từ xl: một bài Full Test có tới
                                            hơn hai chục câu, đổ hết ra một cột thì cuộn mãi
                                            không hết (user 09/09). Chia trang theo THỨ TỰ CÂU
                                            chứ không theo Part, cắt theo Part thì trang đầu
                                            12 câu, trang sau một câu. Tiêu đề Part chiếm trọn
                                            hàng nên vẫn tách bạch được các phần. */}
                                        <ol className="grid xl:grid-cols-2 gap-2.5 items-start">
                                            {pageQuestions.map((q, i) => (
                                                <React.Fragment key={q.answer_id}>
                                                    {(i === 0 || pageQuestions[i - 1].part_label !== q.part_label) && (
                                                        <li className="xl:col-span-2 flex items-center gap-2.5 pt-3 first:pt-0">
                                                            <h3 className="text-lg font-bold text-[#2b5356]">
                                                                {q.part_label}
                                                            </h3>
                                                            {partBand[q.part_label] != null && (
                                                                <BandBadge band={partBand[q.part_label]} size="sm" />
                                                            )}
                                                        </li>
                                                    )}
                                                    <li className="bg-white rounded-xl border-2 border-gray-100 p-4 h-full">
                                                        <div className="flex items-start gap-3">
                                                            <span className="w-8 h-8 shrink-0 rounded-full bg-[#0096b1]/10
                                                                             text-[#0096b1] text-sm font-bold flex items-center
                                                                             justify-center tabular-nums">
                                                                {q.order_index + 1}
                                                            </span>
                                                            <div className="grow min-w-0">
                                                                <p className="text-[15px] font-semibold text-[#2b5356] break-words">
                                                                    {q.question_text || 'Follow-up question asked during the test'}
                                                                </p>
                                                                <p className="text-[15px] text-gray-700 mt-1.5 whitespace-pre-line break-words">
                                                                    {q.answer_text || <span className="text-gray-400">No answer</span>}
                                                                </p>
                                                                {/* Nghe lại được NGAY, không phải chờ chấm
                                                                    (feedback 08/09): đọc lại bài mình đã nói là
                                                                    quyền cơ bản, không phải phần thưởng sau khi
                                                                    tiêu một lượt chấm. */}
                                                                {q.has_audio && (
                                                                    <button type="button"
                                                                        onClick={() => playAnswer(q.answer_id)}
                                                                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5
                                                                                   rounded-lg text-sm font-bold text-[#eb7e37]
                                                                                   border-2 border-[#eb7e37]/40 hover:border-[#eb7e37]">
                                                                        <Play size={14} /> Replay
                                                                    </button>
                                                                )}
                                                                {q.audio_expired && (
                                                                    <span className="mt-2 block text-xs text-gray-400">
                                                                        Recording has expired
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {q.band != null && <BandBadge band={q.band} size="xs" />}
                                                        </div>
                                                    </li>
                                                </React.Fragment>
                                            ))}
                                        </ol>

                                        {totalPages > 1 && (
                                            <nav className="flex items-center justify-between gap-3 pt-2 flex-wrap">
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
                                                    Sau <ChevronRight size={16} />
                                                </button>
                                            </nav>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {view !== 'work' && lockedView(view) && (
                            <div className="rounded-2xl bg-white border-2 border-[#eb7e37]/30 p-8 text-center">
                                <Crown className="mx-auto text-[#eb7e37] mb-3" size={30} />
                                <p className="text-lg font-bold text-[#2b5356] mb-1">{VIP_COPY[view][0]}</p>
                                <p className="text-sm text-gray-600 mb-5 leading-relaxed max-w-md mx-auto">
                                    {VIP_COPY[view][1]}
                                </p>
                                <button onClick={() => navigate('/vip-packages')}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#eb7e37]
                                               text-white font-bold hover:bg-[#d86f2b]">
                                    <Crown size={18} /> Upgrade to VIP
                                </button>
                            </div>
                        )}

                        {/* Ba tab còn lại đều cần bản chấm; chưa chấm thì nói rõ chứ không để trống. */}
                        {view !== 'work' && !lockedView(view) && !graded && (
                            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
                                <Sparkles className="mx-auto text-[#0096b1] mb-3" size={26} />
                                <p className="font-bold text-[#2b5356] mb-1">Available after grading</p>
                                <p className="text-sm text-gray-600">
                                    Press <b>Grade</b> at the top of the page, then come back to this tab.
                                </p>
                            </div>
                        )}

                        {view === 'feedback' && !lockedView('feedback') && graded && (
                            /* Nhận xét theo đúng bản 05/09 (user chọn 09/09): hàng nút chuyển
                               Part kèm điểm, rồi 4 thẻ tiêu chí RIÊNG của Part đang chọn. Bản
                               gộp-4-tiêu-chí-qua-mọi-Part trước đó đọc gọn hơn nhưng mất chỗ đối
                               chiếu Part nào yếu ở tiêu chí nào.
                               Điểm thì đã có bảng ở đầu trang; ở đây là phần CHỮ. */
                            <div className="space-y-3">
                                {parts.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {parts.map((p, i) => (
                                            <button key={p.part} onClick={() => setPartTab(i)}
                                                className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-[15px] border-2 transition-colors ${
                                                    i === partTab ? 'border-[#eb7e37] bg-[#eb7e37]/10 text-[#c25f1c]'
                                                        : 'border-gray-200 text-[#2b5356] hover:border-[#eb7e37]/50'}`}>
                                                {p.label} · {bandText(p.band)}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {currentPart && (
                                    <>
                                        <div className="flex items-center justify-between bg-white rounded-2xl border-2 border-gray-100 shadow-sm px-5 py-4">
                                            <div>
                                                <p className="text-lg font-bold text-[#2b5356]">{currentPart.label}</p>
                                                {currentPart.note && (
                                                    <p className="text-sm text-gray-500 mt-0.5">{currentPart.note}</p>
                                                )}
                                                {currentPart.band == null && !currentPart.note && (
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        There is not enough evidence to score this part — the answer was too short
                                                        or the recording was inaudible. Please try again.
                                                    </p>
                                                )}
                                            </div>
                                            <BandBadge band={currentPart.band} size="lg" />
                                        </div>
                                        {/* Hai cột từ xl: bốn thẻ tiêu chí xếp dọc trên màn rộng
                                            thì phải cuộn qua ba thẻ mới thấy thẻ thứ tư. */}
                                        <div className="grid xl:grid-cols-2 gap-3 items-start">
                                            {CRITERIA.map(([key, label]) => (
                                                <CriterionCard key={key} label={label}
                                                    band={(currentPart.criteria || {})[key]
                                                        ? (currentPart.criteria || {})[key].band : null}
                                                    entries={[{ partLabel: currentPart.label,
                                                                block: (currentPart.criteria || {})[key] }]}
                                                    locked={false} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {view === 'analysis' && !lockedView('analysis') && graded && (
                            !analysis ? (
                                <div className="py-10 flex justify-center">
                                    <Loader2 className="animate-spin text-[#0096b1]" size={26} />
                                </div>
                            ) : (
                                <AnalysisPanel
                                    data={analysis}
                                    onError={setError}
                                    onOpenQuestion={(qid) => navigate('/speaking_question', {
                                        state: {
                                            questionId: qid, attemptId,
                                            back: { to: '/speaking_result',
                                                    state: { attemptId, view: 'analysis' } },
                                        },
                                    })}
                                    onRetake={(res) => navigate('/speaking_test', {
                                        state: { attemptId: res.attempt_id, plan: res.plan },
                                    })}
                                />
                            )
                        )}

                        {view === 'export' && !lockedView('export') && graded && (
                            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2b5356] mb-1">Export PDF/Word</h3>
                                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                                    The file includes your overall score, feedback on each criterion and the analysis,
                                    with every question, answer and per-question comment.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={exportPdf} disabled={!analysis}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                                                   bg-[#0096b1] text-white hover:bg-[#007a90] disabled:opacity-50">
                                        <FileDown size={17} /> Download PDF
                                    </button>
                                    <button onClick={exportWord} disabled={!analysis}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                                                   bg-white border-2 border-gray-300 text-[#2b5356] hover:border-gray-400
                                                   disabled:opacity-50">
                                        <FileDown size={17} /> Download Word
                                    </button>
                                </div>
                                {!analysis && (
                                    <p className="text-xs text-gray-400 mt-3">Loading your test data…</p>
                                )}
                            </div>
                        )}                        </div>

                        {/* ── Rãnh phải: bảng điểm ── */}
                        {graded && (
                            <aside className="order-first lg:order-none lg:sticky lg:top-[68px] mt-4 lg:mt-0
                                              lg:max-h-[calc(100vh-84px)] lg:overflow-y-auto lg:pb-2">
                                <ScoreBoard data={data} />
                            </aside>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SpeakingResult;
