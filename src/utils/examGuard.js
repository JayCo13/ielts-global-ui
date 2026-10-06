// Chặn phím tắt trong phòng thi — cùng bộ quy tắc Listening / Reading đang dùng.
//
// Tách thành hook vì Speaking là kỹ năng thứ ba cần nó (feedback 07/09). Hai kỹ năng kia
// vẫn giữ bản chép trong `main_layout.js` của mình; đụng vào đó lúc này là rủi ro không
// cần thiết, nhưng bản dùng chung này là chỗ nên gom về khi có dịp.
//
// Cố ý KHÔNG chặn Ctrl+C / Ctrl+V: thí sinh vẫn cần copy được ghi chú của mình, và chặn
// cũng không ngăn được ai thật sự muốn chép — chỉ làm phiền người dùng ngay thật.
import { useEffect } from 'react';

const warn = (message) => {
    if (document.getElementById('exam-guard-toast')) return;
    const el = document.createElement('div');
    el.id = 'exam-guard-toast';
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);'
        + 'background:#eb7e37;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;'
        + 'font-weight:600;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,.15)';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity .3s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 2500);
};

/**
 * @param {boolean} active  bật khi đang trong bài
 * @param {boolean} strict  chế độ thi thử: chặn thêm Ctrl+F (tìm trên trang)
 */
export const useExamGuard = (active, strict = false) => {
    useEffect(() => {
        if (!active) return undefined;

        const onKeyDown = (e) => {
            const k = (e.key || '').toLowerCase();
            const mod = e.ctrlKey || e.metaKey;
            // Lưu trang / in trang: hai đường chép đề dễ nhất.
            if (mod && ['s', 'p'].includes(k)) { e.preventDefault(); warn('This function is not available during the test.'); return false; }
            // Tìm trên trang chỉ chặn ở Thi thử — Luyện tập thì vẫn cho tra cứu.
            if (strict && mod && k === 'f') { e.preventDefault(); warn('Page search is disabled during a mock test.'); return false; }
            if (e.key === 'PrintScreen') { e.preventDefault(); return false; }
            if (e.key === 'F12') { e.preventDefault(); return false; }
            if (mod && e.shiftKey && ['i', 'j', 'c'].includes(k)) { e.preventDefault(); return false; }
            return undefined;
        };

        const onContextMenu = (e) => { e.preventDefault(); return false; };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('contextmenu', onContextMenu);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('contextmenu', onContextMenu);
        };
    }, [active, strict]);
};

export default useExamGuard;
