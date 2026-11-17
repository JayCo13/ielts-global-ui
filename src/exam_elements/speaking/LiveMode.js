// Live Action with an Examiner (brief "5 Speaking Live action", 2026-11-14).
//
// Hai mảnh dùng chung cho màn Thi thử (SpeakingSetup) và Dự đoán (SpeakingForecast):
//   * FeedbackLanguageSelect — ngôn ngữ giám khảo NHẬN XÉT. Câu hỏi và câu trả lời luôn
//     là tiếng Anh; mặc định theo ngôn ngữ giao diện (gần nhất với tiếng mẹ đẻ).
//   * ModeChooser — modal hai lựa chọn Serious Practice / Live Action, hiện khi học viên
//     bấm luyện một câu hoặc cả chủ đề dự đoán.
import React, { useState } from 'react';
import { X, GraduationCap, Mic2, Loader2 } from 'lucide-react';
import { LANGUAGES, getLanguage } from '../../i18n';

const LIVE_PREF = 'speaking_live_lang';

export const defaultFeedbackLang = () => {
    try {
        const saved = localStorage.getItem(LIVE_PREF);
        if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
    } catch (e) { /* storage blocked */ }
    const ui = getLanguage();
    return LANGUAGES.some((l) => l.code === ui) ? ui : 'en';
};

export const saveFeedbackLang = (code) => {
    try { localStorage.setItem(LIVE_PREF, code); } catch (e) { /* storage blocked */ }
};

export const FeedbackLanguageSelect = ({ value, onChange }) => (
    <label className="block">
        <span className="block text-sm font-bold text-[#2b5356] mb-1">Feedback language</span>
        <select value={value}
                onChange={(e) => { saveFeedbackLang(e.target.value); onChange(e.target.value); }}
                data-no-translate
                className="w-full sm:w-72 rounded-xl border-2 border-gray-200 px-3 py-2 text-[15px]
                           focus:border-[#eb7e37] focus:ring-0">
            {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
            ))}
        </select>
        <span className="block text-xs text-gray-500 mt-1">
            The examiner always asks in English and you always answer in English. Only the feedback uses this language.
        </span>
    </label>
);

const Option = ({ active, icon, title, hint, onClick }) => (
    <button type="button" onClick={onClick}
            className={`w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors flex gap-3 ${
                active ? 'border-[#eb7e37] bg-[#eb7e37]/10 ring-1 ring-[#eb7e37]/30'
                       : 'border-gray-200 hover:border-[#eb7e37]/50'}`}>
        <span className={`shrink-0 mt-0.5 ${active ? 'text-[#c25f1c]' : 'text-[#0096b1]'}`}>{icon}</span>
        <span className="min-w-0">
            <span className={`block text-[16px] font-bold ${active ? 'text-[#c25f1c]' : 'text-[#2b5356]'}`}>{title}</span>
            <span className="block text-sm text-gray-500 mt-0.5">{hint}</span>
        </span>
    </button>
);

export const SERIOUS_HINT = 'Practise as usual and get your full score after you submit.';
export const LIVE_HINT = 'The examiner roasts your 1–2 biggest mistakes out loud after every answer, then shows you the fix.';

/** onPick({ live: bool, lang }) */
export const ModeChooser = ({ onClose, onPick, starting }) => {
    const [live, setLive] = useState(false);
    const [lang, setLang] = useState(defaultFeedbackLang);
    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
                <header className="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
                    <h2 className="font-bold text-[#2b5356] text-lg">Choose how to practise</h2>
                    <button onClick={onClose} aria-label="Close"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </header>
                <div className="p-5 space-y-3">
                    <Option active={!live} onClick={() => setLive(false)}
                            icon={<GraduationCap size={22} />} title="Serious Practice" hint={SERIOUS_HINT} />
                    <Option active={live} onClick={() => setLive(true)}
                            icon={<Mic2 size={22} />} title="Live Action with an Examiner" hint={LIVE_HINT} />
                    {live && (
                        <div className="pt-1">
                            <FeedbackLanguageSelect value={lang} onChange={setLang} />
                        </div>
                    )}
                </div>
                <footer className="p-5 border-t border-gray-100">
                    <button type="button" disabled={starting} onClick={() => onPick({ live, lang })}
                            className="w-full py-3 rounded-xl bg-[#0096b1] text-white font-semibold
                                       hover:bg-[#007a90] disabled:opacity-50 flex items-center justify-center gap-2">
                        {starting && <Loader2 className="animate-spin" size={18} />}
                        Start
                    </button>
                </footer>
            </div>
        </div>
    );
};
