// Word stress trong phần chấm phát âm (feedback 09/09: "cho nó cover thêm wordstress
// để chấm và nhận xét").
//
// Trước đây backend vẫn trả `word_stress`, nhưng prompt bảo "để trống nếu không nghe rõ"
// nên gần như lúc nào cũng rỗng, và giao diện thì không có chỗ nào nói về trọng âm cả —
// nhìn vào bản chấm chỉ thấy điểm với vài âm lẻ. Giờ mỗi từ nhiều âm tiết đều được liệt
// kê, cả từ đọc ĐÚNG, vì học viên cần biết mình đang làm được gì.
import React from 'react';
import { Check, X } from 'lucide-react';

// "com-FOR-ta-ble" → âm tiết viết hoa được tô đậm; phần còn lại để nhạt.
const Syllables = ({ text, tone }) => {
    if (!text) return null;
    return (
        <span className="font-mono">
            {String(text).split('-').map((syl, i, all) => {
                const stressed = syl.length > 1 && syl === syl.toUpperCase();
                return (
                    <React.Fragment key={i}>
                        <span className={stressed ? `font-bold ${tone}` : 'text-gray-500'}>{syl}</span>
                        {i < all.length - 1 && <span className="text-gray-300">-</span>}
                    </React.Fragment>
                );
            })}
        </span>
    );
};

const WordStress = ({ items, verdict, compact }) => {
    const rows = (items || []).filter((w) => w && w.word);
    if (!rows.length && !verdict) return null;
    const size = compact ? 'text-xs' : 'text-sm';
    return (
        <div className="mt-3">
            <p className={`font-bold uppercase tracking-wide text-[#eb7e37] mb-1.5 ${
                compact ? 'text-[11px]' : 'text-[12px]'}`}>
                Word stress
            </p>
            {verdict && <p className={`${size} text-gray-600 mb-2`}>{verdict}</p>}
            {!!rows.length && (
                <ul className="space-y-1.5">
                    {rows.map((w, i) => {
                        // `ok` thiếu thì suy ra từ việc hai cách đọc có khớp nhau không —
                        // bản chấm cũ chưa có trường này.
                        const ok = w.ok === undefined || w.ok === null
                            ? (!w.said || !w.correct || String(w.said) === String(w.correct))
                            : !!w.ok;
                        return (
                            <li key={i} className={`${size} rounded-lg px-3 py-2 flex items-start gap-2 ${
                                ok ? 'bg-[#0096b1]/5' : 'bg-[#eb7e37]/8'}`}>
                                {ok ? <Check size={14} className="text-[#0096b1] shrink-0 mt-0.5" />
                                    : <X size={14} className="text-[#eb7e37] shrink-0 mt-0.5" />}
                                <span className="min-w-0 break-words">
                                    <span className="font-semibold text-[#2b5356]">{w.word}</span>
                                    {ok ? (
                                        w.correct && (
                                            <span className="ml-2"><Syllables text={w.correct} tone="text-[#0096b1]" /></span>
                                        )
                                    ) : (
                                        <span className="ml-2">
                                            <Syllables text={w.said} tone="text-red-600" />
                                            <span className="mx-1.5 text-gray-400">→</span>
                                            <Syllables text={w.correct} tone="text-emerald-600" />
                                        </span>
                                    )}
                                    {w.how && <span className="block text-gray-600 mt-0.5">{w.how}</span>}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default WordStress;
