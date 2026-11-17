import React from 'react';

// Each examiner voice gets its own person, shown like a video call (feedback 2026-11-14:
// "mỗi giám khảo sẽ xuất hiện với một hình examiner đang ngồi kiểm tra thi qua video call").
// Illustrations are drawn in SVG so they load instantly and stay sharp at any size.
// To use real photos later, drop /img/examiners/<name>.webp and set `photo: true` below.

// Voice key (as stored in the DB / returned by /voices) → examiner name.
const VOICE_NAME = {
    'en-GB-Neural2-C': 'Alice', 'en-GB-Neural2-N': 'Emily', 'en-GB-Neural2-B': 'Tony', 'en-GB-Neural2-O': 'Oliver',
    'en-US-Neural2-F': 'Sophia', 'en-US-Neural2-G': 'Grace', 'en-US-Neural2-D': 'Daniel', 'en-US-Neural2-J': 'Ethan',
    'en-AU-Neural2-C': 'Chloe', 'en-AU-Neural2-A': 'Mia', 'en-AU-Neural2-B': 'Jack', 'en-AU-Neural2-D': 'Liam',
    'en-IN-Neural2-A': 'Priya', 'en-IN-Neural2-D': 'Anika', 'en-IN-Neural2-B': 'Rahul', 'en-IN-Neural2-C': 'Arjun',
};

// skin, hair colour, hair style, shirt, wall, extras
const EXAMINERS = {
    Alice:  { skin: '#f6d3bd', hair: '#c98b4a', style: 'long',  shirt: '#2b5356', wall: '#dfe9ea', glasses: false },
    Emily:  { skin: '#f3cdb3', hair: '#3b2a20', style: 'bun',   shirt: '#7b4b6b', wall: '#ece4dc', glasses: true },
    Tony:   { skin: '#eec3a5', hair: '#4a3426', style: 'short', shirt: '#1f3b57', wall: '#e2e6ec', glasses: false, beard: true },
    Oliver: { skin: '#f4d0b8', hair: '#a8a29e', style: 'side',  shirt: '#3f4a3c', wall: '#e8e4da', glasses: true },
    Sophia: { skin: '#e9b896', hair: '#1f1712', style: 'long',  shirt: '#b4532a', wall: '#f1e6dc', glasses: false },
    Grace:  { skin: '#8d5a3b', hair: '#1a1210', style: 'curly', shirt: '#0f766e', wall: '#e3ecea', glasses: false },
    Daniel: { skin: '#7a4a2e', hair: '#16100c', style: 'short', shirt: '#334155', wall: '#e5e7eb', glasses: true },
    Ethan:  { skin: '#f2cbb0', hair: '#d4a24c', style: 'side',  shirt: '#1e40af', wall: '#e0e7ef', glasses: false },
    Chloe:  { skin: '#f5d5c0', hair: '#e2b866', style: 'long',  shirt: '#be185d', wall: '#f3e5ea', glasses: false },
    Mia:    { skin: '#eac1a0', hair: '#5b3a24', style: 'bun',   shirt: '#4d7c0f', wall: '#e8eddc', glasses: false },
    Jack:   { skin: '#efc6a6', hair: '#8a4b22', style: 'curly', shirt: '#0e7490', wall: '#dfecef', glasses: false, beard: true },
    Liam:   { skin: '#f3cfb5', hair: '#2a1d15', style: 'short', shirt: '#57534e', wall: '#ebe7e2', glasses: false },
    Priya:  { skin: '#b9825a', hair: '#120d0a', style: 'long',  shirt: '#9d174d', wall: '#efe3e6', glasses: false },
    Anika:  { skin: '#c48f66', hair: '#1c1410', style: 'bun',   shirt: '#6d28d9', wall: '#e9e5f1', glasses: true },
    Rahul:  { skin: '#a8714b', hair: '#140e0b', style: 'side',  shirt: '#0f5132', wall: '#e1ebe5', glasses: false, beard: true },
    Arjun:  { skin: '#b57d55', hair: '#1a120e', style: 'short', shirt: '#7c2d12', wall: '#efe5dd', glasses: true },
};
const NAMES = Object.keys(EXAMINERS);

export function examinerName(voice) {
    if (!voice) return 'Tony';
    if (VOICE_NAME[voice]) return VOICE_NAME[voice];
    if (EXAMINERS[voice]) return voice;
    // Other TTS engines use different voice ids: pick a stable examiner for each.
    let h = 0;
    for (let i = 0; i < voice.length; i += 1) h = (h * 31 + voice.charCodeAt(i)) >>> 0;
    return NAMES[h % NAMES.length];
}

const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
};

// The scene: examiner sitting at a desk in a small office, framed like a webcam shot.
function Scene({ e, uid }) {
    const hairDark = shade(e.hair, 0.8);
    return (
        <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" className="block w-full h-full" aria-hidden="true">
            <defs>
                <linearGradient id={`w${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={e.wall} />
                    <stop offset="1" stopColor={shade(e.wall, 0.9)} />
                </linearGradient>
            </defs>
            <rect width="160" height="120" fill={`url(#w${uid})`} />
            {/* bookshelf */}
            <rect x="10" y="22" width="34" height="46" rx="2" fill={shade(e.wall, 0.82)} />
            {[30, 46, 62].map((y) => <rect key={y} x="10" y={y} width="34" height="2" fill={shade(e.wall, 0.7)} />)}
            {[[13, '#c2410c'], [18, '#0f766e'], [22, '#1e3a8a'], [27, '#a16207'], [32, '#7e22ce'], [37, '#475569']].map(([x, c]) => (
                <rect key={x} x={x} y="34" width="4" height="12" rx="0.6" fill={c} opacity="0.75" />
            ))}
            {[[14, '#334155'], [19, '#b45309'], [24, '#15803d'], [30, '#9f1239']].map(([x, c]) => (
                <rect key={x} x={x} y="50" width="5" height="12" rx="0.6" fill={c} opacity="0.7" />
            ))}
            {/* plant */}
            <rect x="128" y="56" width="14" height="14" rx="2" fill={shade(e.wall, 0.72)} />
            <ellipse cx="131" cy="50" rx="5" ry="9" fill="#4d7c0f" opacity="0.8" transform="rotate(-20 131 50)" />
            <ellipse cx="139" cy="49" rx="5" ry="10" fill="#65a30d" opacity="0.8" transform="rotate(18 139 49)" />
            <ellipse cx="135" cy="45" rx="4" ry="10" fill="#3f6212" opacity="0.85" />

            {/* long hair falls behind the shoulders */}
            {e.style === 'long' && <path d="M58 52 Q56 92 64 100 L96 100 Q104 92 102 52 Q80 30 58 52Z" fill={hairDark} />}

            {/* torso */}
            <path d="M44 120 Q46 92 66 86 L94 86 Q114 92 116 120Z" fill={e.shirt} />
            <path d="M70 86 L80 100 L90 86Z" fill={shade(e.shirt, 1.35)} />
            <rect x="74" y="72" width="12" height="16" rx="4" fill={shade(e.skin, 0.92)} />

            {/* head */}
            <ellipse cx="80" cy="56" rx="16" ry="19" fill={e.skin} />
            <ellipse cx="64.5" cy="58" rx="2.6" ry="4" fill={shade(e.skin, 0.94)} />
            <ellipse cx="95.5" cy="58" rx="2.6" ry="4" fill={shade(e.skin, 0.94)} />

            {/* hair */}
            {e.style === 'short' && <path d="M64 52 Q63 34 80 34 Q97 34 96 52 Q93 42 80 42 Q67 42 64 52Z" fill={e.hair} />}
            {e.style === 'side' && <path d="M64 54 Q61 33 82 33 Q99 35 96 52 Q90 40 74 43 Q67 45 64 54Z" fill={e.hair} />}
            {e.style === 'long' && <path d="M62 62 Q58 34 80 33 Q102 34 98 62 Q96 46 86 41 Q74 46 66 48 Q63 54 62 62Z" fill={e.hair} />}
            {e.style === 'bun' && (
                <>
                    <circle cx="80" cy="30" r="7" fill={e.hair} />
                    <path d="M63 56 Q61 35 80 35 Q99 35 97 56 Q94 42 80 41 Q66 42 63 56Z" fill={e.hair} />
                </>
            )}
            {e.style === 'curly' && (
                <g fill={e.hair}>
                    {[[66, 46], [70, 38], [78, 35], [86, 35], [93, 39], [96, 47], [64, 54], [97, 55]].map(([x, y]) => (
                        <circle key={`${x}${y}`} cx={x} cy={y} r="6.5" />
                    ))}
                </g>
            )}

            {/* face */}
            <path d="M71 50 Q74 48.5 77 50" stroke={hairDark} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M83 50 Q86 48.5 89 50" stroke={hairDark} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <circle cx="74" cy="55" r="1.7" fill="#1f2937" />
            <circle cx="86" cy="55" r="1.7" fill="#1f2937" />
            <path d="M80 57 Q79 61 81 62" stroke={shade(e.skin, 0.78)} strokeWidth="1" fill="none" strokeLinecap="round" />
            {e.beard
                ? <path d="M66 60 Q68 75 80 76 Q92 75 94 60 Q90 69 80 69 Q70 69 66 60Z" fill={e.hair} opacity="0.9" />
                : null}
            <path d="M75 66 Q80 69.5 85 66" stroke="#9a3b3b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            {e.glasses && (
                <g stroke="#1f2937" strokeWidth="1.1" fill="rgba(255,255,255,0.18)">
                    <rect x="68.5" y="51" width="11" height="8" rx="3" />
                    <rect x="80.5" y="51" width="11" height="8" rx="3" />
                    <path d="M79.5 54.5 H80.5" />
                </g>
            )}

            {/* headset mic: an examiner on a call */}
            <path d="M63 54 Q63 30 80 30 Q97 30 97 54" stroke="#334155" strokeWidth="2" fill="none" />
            <rect x="60" y="52" width="6" height="10" rx="2.5" fill="#334155" />
            <path d="M63 62 Q65 70 74 69" stroke="#334155" strokeWidth="1.4" fill="none" />

            {/* desk + laptop */}
            <rect x="0" y="106" width="160" height="14" fill={shade(e.wall, 0.62)} />
            <path d="M104 106 L110 92 L140 92 L134 106Z" fill="#cbd5e1" />
            <rect x="100" y="105" width="38" height="2.5" rx="1" fill="#94a3b8" />
        </svg>
    );
}

let seq = 0;

/**
 * Examiner as a video-call tile. `speaking` adds the glowing "talking" ring,
 * `dim` greys it out (paused). Width/height follow `size` (height) at 4:3.
 */
export default function ExaminerAvatar({ voice, size = 96, speaking = false, dim = false, showName = true }) {
    const uidRef = React.useRef(null);
    if (uidRef.current == null) { seq += 1; uidRef.current = seq; }
    const name = examinerName(voice);
    const e = EXAMINERS[name] || EXAMINERS.Tony;
    const w = Math.round(size * 4 / 3);
    const small = size < 70;
    return (
        <div className="relative shrink-0" style={{ width: w, height: size, opacity: dim ? 0.55 : 1 }}>
            {speaking && (
                <span aria-hidden="true" className="ttm-ring absolute inset-0"
                      style={{ borderRadius: 14, border: '2px solid #7dd3fc' }} />
            )}
            <div className="relative w-full h-full overflow-hidden bg-slate-800"
                 style={{ borderRadius: small ? 10 : 14,
                          boxShadow: speaking ? '0 0 0 2px #7dd3fc, 0 8px 24px rgba(0,0,0,0.25)' : '0 6px 18px rgba(0,0,0,0.22)' }}>
                {e.photo
                    ? <img src={`/img/examiners/${name.toLowerCase()}.webp`} alt="" className="w-full h-full object-cover" />
                    : <Scene e={e} uid={uidRef.current} />}
                {!small && (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
                        <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE
                    </span>
                )}
                {showName && !small && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          data-no-translate>
                        {name} · Examiner
                    </span>
                )}
            </div>
            <span className="sr-only">Examiner {name}</span>
        </div>
    );
}

// Small round face for voice pickers.
export function ExaminerFace({ voice, size = 22 }) {
    const uidRef = React.useRef(null);
    if (uidRef.current == null) { seq += 1; uidRef.current = seq; }
    const e = EXAMINERS[examinerName(voice)] || EXAMINERS.Tony;
    return (
        <span className="inline-block shrink-0 overflow-hidden rounded-full align-middle bg-slate-200"
              style={{ width: size, height: size }} aria-hidden="true">
            <span className="block" style={{ width: size * 2.6, height: size * 1.95, marginLeft: -size * 0.8, marginTop: -size * 0.42 }}>
                <Scene e={e} uid={uidRef.current} />
            </span>
        </span>
    );
}
