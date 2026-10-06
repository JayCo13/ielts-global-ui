// Bôi đen một từ trong bài nói → hiện menu "Add to New Words" / "Tra từ điển".
//
// Feedback 06/09 xin đúng hai chức năng này cho Speaking; Writing và Reading đã có sẵn nên
// ở đây dùng cùng endpoint (`/student/vocabulary`, `/student/dictionary` qua
// TranslatorDialog) để New Words của học viên là MỘT kho chung, không phải mỗi kỹ năng
// một kho.
//
// Bọc quanh vùng chữ cần tra:
//     <SelectionMenu source="speaking"><p>…</p></SelectionMenu>
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, BookOpen, Check } from 'lucide-react';
import TranslatorDialog from '../../translator/TranslatorDialog';
import API_BASE from '../../config/api';

const HIDDEN = { visible: false, x: 0, y: 0, text: '' };

const SelectionMenu = ({ children, source = 'speaking', className = '' }) => {
    const [menu, setMenu] = useState(HIDDEN);
    const [dict, setDict] = useState({ open: false, text: '', pos: { x: 0, y: 0 } });
    const [saved, setSaved] = useState('');
    const boxRef = useRef(null);

    const onSelect = useCallback(() => {
        // Hoãn một nhịp: lúc mouseup vùng chọn đôi khi chưa cập nhật xong.
        setTimeout(() => {
            const sel = window.getSelection();
            const text = (sel?.toString() || '').trim();
            // Một từ, không phải cả câu — tra từ điển cả đoạn thì vô nghĩa.
            if (!text || text.length > 60 || /\s/.test(text)) { setMenu(HIDDEN); return; }
            try {
                const rect = sel.getRangeAt(0).getBoundingClientRect();
                setMenu({
                    visible: true, text,
                    x: Math.min(rect.left + rect.width / 2, window.innerWidth - 210),
                    y: rect.bottom + 6,
                });
            } catch (e) { setMenu(HIDDEN); }
        }, 0);
    }, []);

    // Bấm ra ngoài thì đóng. Gắn ở document vì menu là `fixed`, nằm ngoài cây con.
    useEffect(() => {
        if (!menu.visible) return undefined;
        const away = (e) => { if (!e.target.closest?.('[data-selmenu]')) setMenu(HIDDEN); };
        document.addEventListener('mousedown', away);
        return () => document.removeEventListener('mousedown', away);
    }, [menu.visible]);

    const addWord = async () => {
        const word = menu.text;
        setMenu(HIDDEN);
        try {
            const res = await fetch(`${API_BASE}/student/vocabulary`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ word, source_type: source }),
            });
            if (res.ok) {
                setSaved(word);
                setTimeout(() => setSaved(''), 2200);
            }
        } catch (e) { /* thêm từ hỏng thì im lặng, không chắn việc đang làm */ }
    };

    return (
        <div ref={boxRef} onMouseUp={onSelect} className={className}>
            {children}

            {menu.visible && (
                <div data-selmenu
                     className="fixed z-[100] bg-white rounded-xl shadow-xl border-2 border-gray-200 py-1 min-w-[200px]"
                     style={{ left: menu.x, top: menu.y }}>
                    <button onClick={addWord}
                            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700
                                       hover:bg-[#0096b1]/10 hover:text-[#0096b1] flex items-center gap-2">
                        <Plus size={16} /> Add to New Words
                    </button>
                    <button onClick={() => {
                                setDict({ open: true, text: menu.text, pos: { x: menu.x, y: menu.y } });
                                setMenu(HIDDEN);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700
                                       hover:bg-[#0096b1]/10 hover:text-[#0096b1] flex items-center gap-2">
                        <BookOpen size={16} /> Look up
                    </button>
                </div>
            )}

            {saved && (
                <div className="fixed z-[110] bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2
                                px-4 py-2.5 rounded-xl bg-[#2b5356] text-white text-sm font-semibold shadow-lg">
                    <Check size={16} /> Added “{saved}” to New Words
                </div>
            )}

            <TranslatorDialog isOpen={dict.open} selectedText={dict.text} position={dict.pos}
                              onClose={() => setDict({ open: false, text: '', pos: { x: 0, y: 0 } })}
                              colorTheme="black-on-white" />
        </div>
    );
};

export default SelectionMenu;
