// Hai pill hạn mức của Speaking, DÙNG CHUNG cho màn chuẩn bị thi, trang đề dự đoán và
// trang kết quả.
//
// Vì sao gom về một chỗ: ba màn từng tự vẽ lấy, nên màn Full Test hiện "0/1" (lượt THI đã
// dùng hết) còn trang đề dự đoán hiện "1/1" (lượt CHẤM chưa dùng) — hai con số đúng nhưng
// hai pill trông giống hệt nhau nên đọc thành mâu thuẫn (chủ dự án phản ánh 21/09). Giờ
// mỗi pill có nhãn riêng và luôn xuất hiện cùng nhau.
//
// Quy ước đếm: CÒN LẠI/TỔNG — chưa dùng là 1/1, dùng rồi là 0/1. `limit == null` nghĩa là
// không giới hạn (VIP), KHÁC hẳn 0 là đã hết.
import React from 'react';
import { Crown, Sparkles, Mic } from 'lucide-react';

const Pill = ({ icon, label, shortLabel, remaining, limit }) => {
    if (limit == null) {
        return (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0096b1]/30
                            bg-[#0096b1]/5 px-3.5 py-1.5">
                <Crown className="w-4 h-4 text-[#0096b1] shrink-0" />
                <span className="text-sm font-bold text-[#0096b1] whitespace-nowrap">
                    {label}: unlimited
                </span>
            </div>
        );
    }
    return (
        <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${
            remaining > 0
                ? 'border-[#eb7e37]/30 bg-gradient-to-r from-[#0096b1]/5 to-[#eb7e37]/10'
                : 'border-[#eb7e37]/50 bg-[#eb7e37]/10'}`}>
            {icon}
            <span className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline">{label}</span>
            <span className="text-sm text-gray-600 whitespace-nowrap sm:hidden">{shortLabel}</span>
            <span className="text-base font-extrabold text-[#eb7e37] tabular-nums">
                {remaining}<span className="text-gray-400 font-semibold text-sm">/{limit}</span>
            </span>
        </div>
    );
};

/** `info` cần có attempts_remaining/attempts_limit và/hoặc grade_remaining/grade_limit.
 *  Thiếu cặp nào thì pill đó không hiện — để trang kết quả chỉ khoe lượt chấm. */
const QuotaPills = ({ info, showAttempts = true, showGrade = true }) => {
    if (!info) return null;
    const hasAttempts = showAttempts && 'attempts_limit' in info;
    const hasGrade = showGrade && 'grade_limit' in info;
    if (!hasAttempts && !hasGrade) return null;
    return (
        <div className="flex items-center gap-2 flex-wrap justify-end">
            {hasAttempts && (
                <Pill icon={<Mic className="w-4 h-4 text-[#eb7e37] shrink-0" />}
                      label="Tests today" shortLabel="Tests"
                      remaining={info.attempts_remaining} limit={info.attempts_limit} />
            )}
            {hasGrade && (
                <Pill icon={<Sparkles className="w-4 h-4 text-[#eb7e37] shrink-0" />}
                      label="AI gradings today" shortLabel="AI gradings"
                      remaining={info.grade_remaining} limit={info.grade_limit} />
            )}
        </div>
    );
};

export default QuotaPills;
