// Ghi âm câu trả lời + dò im lặng cho phòng thi Speaking (docs/speaking-spec.md §4.2).
//
// Không viết dưới dạng hook: phòng thi cần bật/tắt mic ngay bên trong máy trạng thái của
// nó, còn mức âm lượng thì cập nhật ~50 lần/giây — để trong state React sẽ render lại
// liên tục. Vì vậy tất cả nằm trong ref, chỉ phần hiển thị mới nhận qua callback.
//
// Mic hỏng theo bất kỳ kiểu nào (từ chối quyền, không có thiết bị, iOS chặn) đều KHÔNG
// làm hỏng bài thi: `init()` trả về false và phòng thi chuyển sang Subtitle Mode với
// nguyên cấu trúc đề (§4.1).

// Safari/iOS không nhận webm; thứ tự này lấy định dạng tốt nhất máy hỗ trợ.
const MIME_CANDIDATES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
];

const pickMime = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    return MIME_CANDIDATES.find((m) => {
        try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; }
    }) || '';
};

// Ngưỡng coi là "có tiếng". Đo trên RMS đã chuẩn hoá về 0–1; giọng nói bình thường ở
// khoảng 0.05–0.3, còn tiếng ồn phòng yên tĩnh dưới 0.01.
const SPEECH_RMS = 0.025;

export const createRecorder = () => {
    let stream = null;
    let recorder = null;
    let chunks = [];
    let audioCtx = null;
    let analyser = null;
    let raf = 0;
    let mime = '';

    // Trạng thái đo âm thanh của CÂU HIỆN TẠI, reset mỗi lần bắt đầu ghi.
    let spoke = false;
    let lastLoudAt = 0;
    let startedAt = 0;
    let onTick = null;

    const loop = () => {
        if (!analyser) return;
        const buf = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = Date.now();
        if (rms >= SPEECH_RMS) {
            spoke = true;
            lastLoudAt = now;
        }
        if (onTick) {
            onTick({
                level: Math.min(1, rms * 6),          // 0–1, chỉ để vẽ thanh âm lượng
                spoke,
                silentMs: now - (lastLoudAt || startedAt),
                elapsedMs: now - startedAt,
            });
        }
        raf = requestAnimationFrame(loop);
    };

    return {
        /** Xin quyền mic. false = mọi lý do hỏng, phòng thi tự sang Subtitle Mode. */
        /** Lý do lần init gần nhất hỏng — để giao diện nói được CỤ THỂ chuyện gì xảy ra
         *  thay vì "không mở được micro". Trước đây mọi lý do đều trả về false như nhau,
         *  nên bấm nút mà im lặng thì không ai biết vì sao. */
        lastError: null,

        async init() {
            this.lastError = null;
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    this.lastError = 'unsupported';
                    return false;
                }
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                });
                mime = pickMime();
                if (typeof MediaRecorder === 'undefined') return false;
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) {
                    audioCtx = new Ctx();
                    analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 1024;
                    audioCtx.createMediaStreamSource(stream).connect(analyser);
                }
                return true;
            } catch (e) {
                // NotAllowedError = người dùng bấm Chặn hoặc trình duyệt chặn sẵn;
                // NotFoundError  = máy không có micro nào.
                this.lastError = e && e.name ? e.name : 'unknown';
                return false;
            }
        },

        /** Bắt đầu ghi một câu. `tick` nhận mức âm lượng + thời gian im lặng liên tục. */
        start(tick) {
            if (!stream) return false;
            chunks = [];
            spoke = false;
            startedAt = Date.now();
            lastLoudAt = 0;
            onTick = tick || null;
            try {
                recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            } catch (e) {
                recorder = new MediaRecorder(stream);
            }
            recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
            // Cắt nhỏ 1 giây: nếu tab chết giữa chừng thì phần đã ghi vẫn nằm trong mảng,
            // thay vì mất trắng cả câu.
            recorder.start(1000);
            // iOS treo AudioContext khi tab vừa mở lại; resume ở đây là chỗ chắc chắn có
            // cử chỉ người dùng gần nhất.
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
            if (analyser && !raf) raf = requestAnimationFrame(loop);
            return true;
        },

        /** Kết thúc câu. Trả về { blob, spoke, durationMs } — blob rỗng nếu không ghi được. */
        stop() {
            return new Promise((resolve) => {
                const durationMs = startedAt ? Date.now() - startedAt : 0;
                const didSpeak = spoke;
                onTick = null;
                if (raf) { cancelAnimationFrame(raf); raf = 0; }
                if (!recorder || recorder.state === 'inactive') {
                    resolve({ blob: null, spoke: didSpeak, durationMs });
                    return;
                }
                recorder.onstop = () => {
                    const blob = chunks.length
                        ? new Blob(chunks, { type: mime || 'audio/webm' })
                        : null;
                    chunks = [];
                    resolve({ blob, spoke: didSpeak, durationMs });
                };
                try { recorder.stop(); } catch (e) {
                    resolve({ blob: null, spoke: didSpeak, durationMs });
                }
            });
        },

        /** Tính lại mốc im lặng từ bây giờ — dùng sau khi thí sinh bấm nghe lại câu hỏi,
         *  quãng im lặng lúc nghe không được tính là "không trả lời". */
        resetSilence() {
            lastLoudAt = Date.now();
            startedAt = startedAt || Date.now();
        },

        get available() { return !!stream; },

        extension() {
            return (mime || '').includes('mp4') || (mime || '').includes('aac') ? 'm4a' : 'webm';
        },

        dispose() {
            if (raf) { cancelAnimationFrame(raf); raf = 0; }
            onTick = null;
            try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch (e) { /* đã dừng */ }
            if (stream) stream.getTracks().forEach((t) => t.stop());
            if (audioCtx) audioCtx.close().catch(() => {});
            stream = null; recorder = null; audioCtx = null; analyser = null;
        },
    };
};
