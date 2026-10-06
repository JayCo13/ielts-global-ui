// Gọi API phòng thi Speaking (docs/speaking-spec.md §4).
import API_BASE from '../../config/api';

export const token = () => localStorage.getItem('token') || '';

const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

const asError = async (res) => {
    let detail = '';
    try { detail = (await res.json()).detail; } catch (e) { /* body rỗng */ }
    const err = new Error(detail || 'Could not reach the server.');
    err.status = res.status;
    return err;
};

const getJson = async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
    if (!res.ok) throw await asError(res);
    return res.json();
};

const postJson = async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
    });
    if (!res.ok) throw await asError(res);
    return res.json();
};

export const fetchSetup = () => getJson('/student/speaking/test/setup');
/** Lịch sử, lọc và phân trang ở MÁY CHỦ. `kind` = 'mock' | 'forecast' | bỏ trống. */
export const fetchAttempts = ({ limit = 20, offset = 0, kind } = {}) => {
    const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (kind) q.set('kind', kind);
    return getJson(`/student/speaking/test/attempts?${q.toString()}`);
};
export const startTest = (options) => postJson('/student/speaking/test/start', options);
export const fetchAttempt = (id) => getJson(`/student/speaking/test/attempts/${id}`);
export const fetchHelp = (questionId) =>
    getJson(`/student/speaking/test/questions/${questionId}/help`);
export const requestAiFollowup = (attemptId) =>
    postJson(`/student/speaking/test/attempts/${attemptId}/ai-followup`);
export const fetchResult = (attemptId) =>
    getJson(`/student/speaking/test/attempts/${attemptId}/result`);
export const requestRegrade = (attemptId) =>
    postJson(`/student/speaking/test/attempts/${attemptId}/grade`);
/** Dừng một lần chấm đang treo (feedback 15/09). Máy chủ hoàn lại lượt vừa trừ, nên sau
 *  đó bấm "Chấm lại" không mất thêm lượt nào. Chỉ mở sau `grade_cancel_after` giây. */
export const cancelGrade = (attemptId) =>
    postJson(`/student/speaking/test/attempts/${attemptId}/grade/cancel`);
/** §6.1: thi lại đúng bộ câu cũ — máy chủ dựng bài MỚI từ đề đã đóng băng.
 *  Không được dùng lại attempt_id cũ: bài đó đã kết thúc, mọi câu nộp vào đều bị chặn. */
export const retakeAttempt = (attemptId) =>
    postJson(`/student/speaking/test/attempts/${attemptId}/retake`);

export const finishTest = (attemptId, status, reason) =>
    postJson(`/student/speaking/test/attempts/${attemptId}/finish`, { status, reason });

// ── Forecast Parts (§7) ────────────────────────────────────────────────────────────────
// Luyện theo chủ đề dự đoán: không tổ hợp đề, không thi thử, hỏi đúng những câu đã hiện
// trong danh sách trước khi bấm Bắt đầu.
export const fetchForecast = ({ sort, hideDone, month } = {}) => {
    const q = new URLSearchParams();
    if (sort) q.set('sort', sort);
    if (hideDone) q.set('hide_done', 'true');
    if (month) q.set('month', month);
    const qs = q.toString();
    return getJson(`/student/speaking/forecast${qs ? `?${qs}` : ''}`);
};

export const fetchForecastTopic = (topicId, section) =>
    getJson(`/student/speaking/forecast/topics/${topicId}?section=${encodeURIComponent(section)}`);

export const startForecast = (options) => postJson('/student/speaking/forecast/start', options);

// ── Phân tích chi tiết (§6) ────────────────────────────────────────────────────────────
// Nhóm 1: CHỈ ĐỌC dữ liệu có sẵn. §6.8 cấm gọi AI chỉ vì học viên mở trang, nên mọi thứ
// dưới đây rẻ và gọi thoải mái.
export const fetchAnalysis = (attemptId) =>
    getJson(`/student/speaking/analysis/attempts/${attemptId}`);

export const fetchQuestionAnalysis = (questionId) =>
    getJson(`/student/speaking/analysis/questions/${questionId}`);

export const markQuestionViewed = (questionId) =>
    postJson(`/student/speaking/analysis/questions/${questionId}/viewed`);

export const chooseSampleAnswer = (questionId, answerId) =>
    postJson(`/student/speaking/analysis/questions/${questionId}/sample`, { answer_id: answerId });

/** Giữ một câu AI viết làm câu mẫu. Máy chủ đánh dấu rõ nguồn gốc để giao diện không để
 *  học viên tưởng đây là bài mình từng nói. */
export const chooseAiSample = (questionId, text) =>
    postJson(`/student/speaking/analysis/questions/${questionId}/sample`, { text });

// Nhóm 2: CÓ gọi AI — chỉ chạy sau khi học viên bấm nút, và target band chọn TRƯỚC.
export const improveAnswer = (questionId, { answerId, text, targetBand }) =>
    postJson(`/student/speaking/practice/questions/${questionId}/improve`,
             { answer_id: answerId, text, target_band: targetBand });

/** Khung "Tự soạn bài mẫu" (feedback 23/09) — của VIP, máy chủ tự chặn.
 *  `start`/`end` là CHỈ SỐ KÝ TỰ của phần bôi đen; bỏ trống thì AI xử lý cả bài. Gửi chỉ
 *  số chứ không gửi đoạn chữ vì một đoạn có thể xuất hiện nhiều lần trong bài. */
export const composeImprove = (questionId, { text, start, end, targetBand }) =>
    postJson(`/student/speaking/practice/questions/${questionId}/compose/improve`,
             { text, start, end, target_band: targetBand });

export const composeFix = (questionId, { text, start, end }) =>
    postJson(`/student/speaking/practice/questions/${questionId}/compose/fix`,
             { text, start, end });

export const answerFromIdeas = (questionId, { ideas, targetBand }) =>
    postJson(`/student/speaking/practice/questions/${questionId}/from-ideas`,
             { ideas, target_band: targetBand });

/** Nghe mẫu một từ/cụm/câu bất kỳ. Token đi theo query vì <audio> không gửi được header. */
export const modelAudioUrl = (text, voice, natural) =>
    `${API_BASE}/student/speaking/practice/model-audio?text=${encodeURIComponent(text)}`
    + (voice ? `&voice=${encodeURIComponent(voice)}` : '')
    + (natural ? '&natural=true' : '')
    + `&token=${encodeURIComponent(token())}`;

export const scorePronunciation = async (targetText, blob, ext) => {
    const form = new FormData();
    form.append('target_text', targetText);
    form.append('audio', blob, `practice.${ext || 'webm'}`);
    const res = await fetch(`${API_BASE}/student/speaking/practice/pronunciation`, {
        method: 'POST', headers: authHeaders(), body: form,
    });
    if (!res.ok) throw await asError(res);
    return res.json();
};

/** AI Shadowing: nghe mẫu → nhắc lại → nhận xét 5 chiều. Một lượt mỗi ngày, nên hỏi
 *  hạn mức TRƯỚC để không bắt học viên ghi âm xong mới báo hết lượt. */
export const fetchShadowQuota = () => getJson('/student/speaking/practice/shadowing/quota');

export const scoreShadowing = async (targetText, blob, ext) => {
    const form = new FormData();
    form.append('target_text', targetText);
    form.append('audio', blob, `shadow.${ext || 'webm'}`);
    const res = await fetch(`${API_BASE}/student/speaking/practice/shadowing`, {
        method: 'POST', headers: authHeaders(), body: form,
    });
    if (!res.ok) throw await asError(res);
    return res.json();
};

/** §6.7 — dùng chung bảng báo lỗi của 3 kỹ năng kia, chỉ khác bộ loại lỗi. */
export const reportSpeakingError = (body) => postJson('/student/error-report', body);

/** Nghe lại một câu đã trả lời. Token đi theo query như mọi endpoint audio khác. */
export const recordingUrl = (answerId, retry) =>
    `${API_BASE}/student/speaking/test/recordings/${answerId}`
    + `?token=${encodeURIComponent(token())}${retry ? '&retry=true' : ''}`;

/** Giọng giám khảo. Token đi theo query vì thẻ <audio> không gửi được header. */
export const examinerAudioUrl = (key, voice) =>
    `${API_BASE}/student/speaking/test/audio?key=${encodeURIComponent(key)}`
    + `&voice=${encodeURIComponent(voice)}&token=${encodeURIComponent(token())}`;

/**
 * Nộp một câu trả lời. Gửi ngay sau mỗi câu chứ không gom tới cuối bài: trình duyệt
 * sập giữa chừng thì những câu đã trả lời vẫn còn.
 */
export const submitAnswer = async (attemptId, { orderIndex, status, durationMs, text,
                                                isRetry, blob, ext }) => {
    const form = new FormData();
    form.append('order_index', String(orderIndex));
    form.append('answer_status', status || 'answered');
    if (durationMs != null) form.append('duration_ms', String(Math.round(durationMs)));
    if (text) form.append('text', text);
    if (isRetry) form.append('is_retry', 'true');
    if (blob && blob.size) form.append('audio', blob, `answer.${ext || 'webm'}`);

    const res = await fetch(`${API_BASE}/student/speaking/test/attempts/${attemptId}/answers`, {
        method: 'POST', headers: authHeaders(), body: form,
    });
    if (!res.ok) throw await asError(res);
    return res.json();
};

/**
 * Báo kết thúc bài khi học viên đóng tab giữa chừng. fetch() thường bị huỷ lúc trang
 * unload, nên dùng sendBeacon — nhưng sendBeacon không gắn được header Authorization,
 * vì thế token đi theo query như hai endpoint audio.
 */
export const beaconFinish = (attemptId, status, reason) => {
    try {
        const url = `${API_BASE}/student/speaking/test/attempts/${attemptId}/finish`;
        const body = new Blob([JSON.stringify({ status, reason })], { type: 'application/json' });
        if (navigator.sendBeacon) return navigator.sendBeacon(`${url}?token=${encodeURIComponent(token())}`, body);
    } catch (e) { /* đóng tab thì cũng không làm gì thêm được */ }
    return false;
};

// ── Pronunciation Lessons (feedback 09/09) ─────────────────────────────────────────────
// Unit = lý thuyết do admin viết + bộ từ/câu do AI sinh. Từ thì chấm phát âm, câu thì
// shadowing — dùng lại đúng hai cơ chế đã có, chỉ khác chỗ gọi.
export const fetchLessons = () => getJson('/student/speaking/lessons');
export const fetchLesson = (unitId) => getJson(`/student/speaking/lessons/${unitId}`);
export const refreshLessonItems = (unitId) =>
    postJson(`/student/speaking/lessons/${unitId}/refresh`);

export const scoreLessonItem = async (itemId, blob, ext) => {
    const form = new FormData();
    form.append('audio', blob, `practice.${ext || 'webm'}`);
    const res = await fetch(`${API_BASE}/student/speaking/lessons/items/${itemId}/score`, {
        method: 'POST', headers: authHeaders(), body: form,
    });
    if (!res.ok) throw await asError(res);
    return res.json();
};
