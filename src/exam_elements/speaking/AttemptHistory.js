// Lịch sử bài thi — DÙNG CHUNG cho màn chuẩn bị thi thử và trang đề dự đoán.
//
// Feedback 06/09: "Mình đang thiếu phần lịch sử bài thi ở cả 2 phần thi thử và luyện tập
// theo dự đoán." Dữ liệu đã có sẵn ở `GET /speaking/test/attempts` từ lâu, chỉ là chưa
// chỗ nào hiện ra.
//
// `kind` lọc đúng nhánh của trang đang gọi: hai nhánh có lịch sử riêng, trộn vào nhau thì
// học viên không biết con số nào thuộc bài nào.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Loader2, ChevronRight } from 'lucide-react';
import { fetchAttempts } from './speakingApi';
import BandBadge from './BandBadge';

const TYPE_LABEL = { full: 'Full Test', part1: 'Part 1', part2: 'Part 2', part3: 'Part 3' };

const STATUS_LABEL = {
    in_progress: 'In progress',
    abandoned: 'Abandoned',
    terminated: 'Stopped',
    interrupted: 'Interrupted',
};

const when = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Feedback 19/09: "lịch sử nên xem hết, hiện chỉ xem được 6 bài gần nhất". Bản trước lấy
// 40 bài của CẢ HAI nhánh rồi mới lọc và cắt 8 ở đây, nên không có đường xem bài cũ hơn.
// Giờ máy chủ lọc theo nhánh và trả từng trang; xin dư một bài để biết còn trang sau không.
const PAGE = 10;

const AttemptHistory = ({ kind = 'mock' }) => {
    const navigate = useNavigate();
    const [rows, setRows] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        fetchAttempts({ kind, limit: PAGE + 1, offset: 0 })
            .then((r) => { setRows(r.slice(0, PAGE)); setHasMore(r.length > PAGE); })
            .catch(() => setRows([]));
    }, [kind]);

    const loadMore = () => {
        setLoadingMore(true);
        fetchAttempts({ kind, limit: PAGE + 1, offset: rows.length })
            .then((r) => {
                setRows((prev) => [...prev, ...r.slice(0, PAGE)]);
                setHasMore(r.length > PAGE);
            })
            .catch(() => setHasMore(false))
            .finally(() => setLoadingMore(false));
    };

    if (rows === null) {
        return (
            <div className="py-8 flex justify-center">
                <Loader2 className="animate-spin text-[#0096b1]" size={22} />
            </div>
        );
    }

    const list = rows;

    if (!list.length) {
        return (
            <p className="text-sm text-gray-500 py-3">
                {kind === 'forecast'
                    ? 'You have not practised any topic yet. Pick a topic above to start.'
                    : 'You have not taken any test yet. Press Start to take your first mock test.'}
            </p>
        );
    }

    return (
        <ul className="space-y-2">
            {list.map((a) => {
                // `display_band`: Overall nếu có, không thì điểm của Part duy nhất — bài lẻ
                // một Part và bài luyện dự đoán trước đây toàn hiện "–" (feedback 19/09).
                const band = a.display_band != null ? a.display_band : a.overall_band;
                const graded = a.grade_status === 'done' && band != null;
                const note = STATUS_LABEL[a.status];
                return (
                    <li key={a.attempt_id}>
                        <button type="button"
                                onClick={() => navigate('/speaking_result', { state: { attemptId: a.attempt_id } })}
                                className="w-full text-left flex items-center gap-3 rounded-xl border-2 border-gray-100
                                           bg-white px-4 py-3 hover:border-[#0096b1]/50 transition">
                            <div className="grow min-w-0">
                                <p className="text-[15px] font-semibold text-[#2b5356] truncate">
                                    {a.topic_title || TYPE_LABEL[a.test_type] || a.test_type}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {when(a.started_at)}
                                    {a.question_count ? ` · ${a.question_count} questions` : ''}
                                    {note ? ` · ${note}` : ''}
                                    {/* Chỉ khi máy chủ nói đang chấm THẬT. 'pending' trơn là
                                        bài chưa ai bấm chấm, trước đây cũng bị gắn "đang chấm". */}
                                    {a.grading ? ' · grading' : ''}
                                </p>
                            </div>
                            {graded ? (
                                <BandBadge band={band} size="xs" />
                            ) : (
                                <span className="shrink-0 text-sm text-gray-400">–</span>
                            )}
                            <ChevronRight size={17} className="shrink-0 text-gray-300" />
                        </button>
                    </li>
                );
            })}
            {hasMore && (
                <li>
                    <button type="button" onClick={loadMore} disabled={loadingMore}
                            className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold
                                       text-[#2b5356] hover:border-[#0096b1]/50 disabled:opacity-60
                                       inline-flex items-center justify-center gap-2">
                        {loadingMore && <Loader2 className="animate-spin" size={15} />}
                        Show more
                    </button>
                </li>
            )}
        </ul>
    );
};

export { History };
export default AttemptHistory;
