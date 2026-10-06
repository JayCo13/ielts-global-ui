// Huy hiệu điểm band — dùng chung cho MỌI chỗ hiện điểm của Speaking.
//
// Trước đây mỗi màn tự vẽ một kiểu: viên teal đặc ở màn kết quả, viên teal nhạt ở trang
// phân tích, viên slate đặc ở tiêu đề Part, viên teal nhạt nữa ở lịch sử — bốn kiểu cho
// cùng một thứ, nhìn sang màn khác lại phải đọc lại từ đầu.
//
// Dạng vòng tròn để ăn nhập với vòng điểm lớn ở khối "Kết quả Speaking", và vì band là
// thang có trần (0–9): cung tròn đầy tới đâu là biết ngay đang ở đâu trên thang đó, thứ
// mà một con số trần không nói được.
import React from 'react';

export const BAND_MAX = 9;

export const bandText = (b) => (b === null || b === undefined ? '–' : Number(b).toFixed(1));

// Ba mức đọc lướt: đạt (≥7) · trung bình (5.5–6.5) · cần cải thiện (<5.5). Chỉ dùng ba
// màu thương hiệu, không đặt thêm màu mới.
export const toneHex = (b) => (
    b === null || b === undefined ? '#cbd5d8'
        : b >= 7 ? '#0096b1'
        : b >= 5.5 ? '#2b5356'
        : '#eb7e37'
);

const SIZES = {
    xs: { d: 34, w: 3, f: 12 },
    sm: { d: 40, w: 3.5, f: 14 },
    md: { d: 48, w: 4, f: 16 },
    lg: { d: 60, w: 5, f: 20 },
};

const BandBadge = ({ band, size = 'md', title }) => {
    const { d, w, f } = SIZES[size] || SIZES.md;
    const color = toneHex(band);
    const r = (d - w) / 2;
    const circ = 2 * Math.PI * r;
    const filled = band === null || band === undefined
        ? 0 : Math.max(0, Math.min(1, band / BAND_MAX)) * circ;

    return (
        <span className="relative inline-flex shrink-0 items-center justify-center align-middle"
              style={{ width: d, height: d }}
              title={title || (band == null ? 'Not scored yet' : `Band ${bandText(band)} / 9.0`)}>
            <svg width={d} height={d} className="absolute inset-0 -rotate-90" aria-hidden="true">
                {/* Nền vòng cùng màu nhưng rất nhạt, không dùng xám: xám cạnh cam nhìn ra
                    hai màu khác nhau, còn cùng tông thì đọc ra "phần còn thiếu". */}
                <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={color}
                        strokeOpacity="0.16" strokeWidth={w} />
                <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={color}
                        strokeWidth={w} strokeLinecap="round"
                        strokeDasharray={`${filled} ${circ}`} />
            </svg>
            <span className="relative font-bold tabular-nums leading-none"
                  style={{ color, fontSize: f }}>
                {bandText(band)}
            </span>
        </span>
    );
};

export default BandBadge;
