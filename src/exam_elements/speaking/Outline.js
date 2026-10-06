// Hiển thị dàn bài gợi ý — DÙNG CHUNG cho phòng thi và trang phân tích (§2.3, §6.4).
//
// Trước đây phòng thi có bản này còn trang phân tích tự đổ `JSON.stringify`, nên cùng một
// dàn bài chỗ thì đẹp chỗ thì ra khối JSON thô — đúng lỗi team báo. Tách ra một chỗ để
// không bao giờ lệch nữa.
//
// LƯU Ý: bên `ielts-practice-ui` (admin) có một bản song song cùng ba dạng dữ liệu này.
// Sửa hình dạng dàn bài ở đây thì nhớ sửa cả bên đó.
import React from 'react';

const Line = ({ label, children }) => (children ? (
    <div className="flex gap-2 text-sm">
        <span className="shrink-0 font-semibold text-[#2b5356]">{label}:</span>
        <span className="text-gray-700">{children}</span>
    </div>
) : null);

/**
 * `max` — chỉ hiện ngần ấy đoạn cue card đầu. Trang phân tích truyền vào khi đang xem
 * bản rút gọn: cả dàn bài đổ ra một lượt thì thẻ công cụ dài gấp mấy lần bài nói, mà
 * phần lớn lúc học viên chỉ liếc qua. Bỏ trống là hiện hết (phòng thi luôn hiện hết).
 */
const Outline = ({ part, data, max }) => {
    if (!data) return <p className="text-sm text-gray-400">No outline yet.</p>;
    // Bản rút gọn (`max`) chỉ giữ xương sống: trả lời thẳng và ý chính của từng ý. Ví dụ,
    // kết quả, cảm xúc, dạng câu hỏi đều là phần khai triển — đọc kỹ thì mở chi tiết.
    const compact = !!max;

    if (part === 'part2' && Array.isArray(data.cue_cards)) {
        const cards = max ? data.cue_cards.slice(0, max) : data.cue_cards;
        return (
            <div className="space-y-3">
                {cards.map((c, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-3">
                        <div className="text-xs font-bold text-[#0096b1] mb-1.5">
                            Paragraph {i + 1}: {c.cue}
                        </div>
                        <Line label="Main point">{c.main_point}</Line>
                        {!compact && (
                            <>
                                {(c.development || []).map((d, k) => (
                                    <Line key={k} label={`Development ${k + 1}`}>{d}</Line>
                                ))}
                                <Line label="Specific detail">{c.specific_detail}</Line>
                                <Line label="Feeling">{c.feeling}</Line>
                                <Line label="Result">{c.result}</Line>
                            </>
                        )}
                        <Line label="Reflection">{c.reflection}</Line>
                    </div>
                ))}
            </div>
        );
    }

    if (data.idea_1 || data.idea_2) {
        return (
            <div className="space-y-2">
                {!compact && <Line label="Question type">{data.question_type}</Line>}
                <Line label="Direct answer">{data.direct_answer}</Line>
                {['idea_1', 'idea_2'].map((k, i) => (data[k] ? (
                    <div key={k} className="rounded-xl border border-gray-200 p-3 space-y-1">
                        <Line label={`Idea ${i + 1}`}>{data[k].idea}</Line>
                        {!compact && <Line label="Example">{data[k].example}</Line>}
                        {!compact && <Line label="Result">{data[k].result}</Line>}
                    </div>
                ) : null))}
            </div>
        );
    }

    if (data.direct_answer || data.explanation) {
        return (
            <div className="space-y-1.5">
                {!compact && <Line label="Question type">{data.question_type}</Line>}
                <Line label="Direct answer">{data.direct_answer}</Line>
                {(max ? (data.explanation || []).slice(0, max) : (data.explanation || []))
                    .map((e, i) => (
                        <Line key={i} label={`Idea ${i + 1}`}>{e}</Line>
                    ))}
            </div>
        );
    }

    // Model trả dạng lạ: thà hiện JSON còn hơn hiện trống trơn.
    return (
        <pre className="text-xs whitespace-pre-wrap text-gray-600 bg-gray-50 rounded-xl p-3">
            {JSON.stringify(data, null, 2)}
        </pre>
    );
};

export { Line };
export default Outline;
