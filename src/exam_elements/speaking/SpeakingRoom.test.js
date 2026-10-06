// Máy trạng thái phòng thi Speaking — những luật của docs/speaking-spec.md §4 mà nhìn
// code không thấy được, phải chạy mới biết đúng hay sai:
//   • nộp xong một câu thì đi tiếp, KHÔNG hỏi lại chính câu đó;
//   • hết đề thì dừng ở màn chờ, chỉ học viên bấm Nộp bài mới kết thúc;
//   • im lặng quá ngưỡng thì tự sang câu và ghi nhận là bỏ qua;
//   • mất mic thì chuyển sang gõ chữ, giữ nguyên đề.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SpeakingRoom from './SpeakingRoom';

// ── Giả lập trình duyệt ──
const setupMedia = ({ mic = true, silent = true } = {}) => {
    // Thẻ <audio> của jsdom không phát được gì; cho nó "phát xong" ngay để đi tiếp.
    window.HTMLMediaElement.prototype.play = function play() {
        setTimeout(() => { if (this.onended) this.onended(); }, 5);
        return Promise.resolve();
    };
    global.MediaRecorder = class {
        constructor() { this.state = 'recording'; }
        start() { this.state = 'recording'; }
        stop() { this.state = 'inactive'; if (this.onstop) this.onstop(); }
    };
    global.MediaRecorder.isTypeSupported = () => true;
    const analyser = {
        fftSize: 1024,
        // 128 = đường im lặng; lệch khỏi 128 mới là có tiếng.
        getByteTimeDomainData: (buf) => buf.fill(silent ? 128 : 200),
    };
    global.AudioContext = class {
        constructor() { this.state = 'running'; }
        createAnalyser() { return analyser; }
        createMediaStreamSource() { return { connect: () => {} }; }
        close() { return Promise.resolve(); }
    };
    navigator.mediaDevices = {
        getUserMedia: mic
            ? () => Promise.resolve({ getTracks: () => [{ stop: () => {} }] })
            : () => Promise.reject(new Error('denied')),
    };
};

const plan = (over = {}) => ({
    test_type: 'part1',
    mode: 'practice',
    voice: 'Achird',
    silence_sec: 60,
    question_count: 1,
    steps: [
        { kind: 'script', key: 'script:opening', text: 'This is the Speaking Test.' },
        {
            kind: 'question', part: 'part1', question_id: 5, topic_id: 1,
            topic_title: 'Work', text: 'Do you work or are you a student?',
            audio_key: 'question:5', limit_sec: null, order_index: 0,
        },
        { kind: 'script', key: 'script:closing', text: 'That is the end of the test.' },
    ],
    ...over,
});

const mockFetch = (answerBody = {}) => {
    const calls = [];
    global.fetch = jest.fn((url, opts) => {
        calls.push({ url: String(url), method: (opts && opts.method) || 'GET', body: opts && opts.body });
        const body = String(url).includes('/answers')
            ? { answer: { answer_id: 1, order_index: 0, status: 'answered' }, suggest_retry: false, ...answerBody }
            : { status: 'completed', submitted: true, gradable: true };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
    });
    return calls;
};

// Màn kết quả được thay bằng một chỗ đánh dấu: từ 09/09 nộp bài xong là phòng thi chuyển
// thẳng sang đó, nên bài test phải có route để đi tới, và kiểm chính việc đã đi tới.
const renderRoom = (p = plan()) => render(
    <MemoryRouter initialEntries={[{ pathname: '/speaking_test', state: { attemptId: 7, plan: p } }]}>
        <Routes>
            <Route path="/speaking_test" element={<SpeakingRoom />} />
            <Route path="/speaking_result" element={<div>RESULT SCREEN</div>} />
        </Routes>
    </MemoryRouter>,
);

beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    jest.restoreAllMocks();
});

test('after answering it moves on and does not re-ask the submitted question', async () => {
    setupMedia();
    const calls = mockFetch();
    renderRoom();

    await screen.findByText('RECORDING', {}, { timeout: 4000 });
    fireEvent.click(screen.getByText('Done'));

    await screen.findByText('You have answered every question', {}, { timeout: 4000 });
    const answerPosts = calls.filter((c) => c.url.includes('/answers'));
    expect(answerPosts).toHaveLength(1);
    // Chưa bấm Nộp bài thì chưa được kết thúc (§4.4).
    expect(calls.some((c) => c.url.includes('/finish'))).toBe(false);
});

test('pressing Submit ends the test and goes straight to the review screen', async () => {
    setupMedia();
    const calls = mockFetch();
    renderRoom();

    await screen.findByText('RECORDING', {}, { timeout: 4000 });
    fireEvent.click(screen.getByText('Done'));
    // "Nộp bài" xuất hiện cả trong câu hướng dẫn lẫn trên nút, nên tìm theo vai trò.
    const submit = await screen.findByRole('button', { name: /Submit/ }, { timeout: 4000 });
    fireEvent.click(submit);

    // feedback 09/09: bỏ hẳn màn "Đã nộp bài" ba nút — vào thẳng phần xem lại bài.
    await screen.findByText('RESULT SCREEN', {}, { timeout: 4000 });
    expect(screen.queryByText('Submitted')).toBeNull();
    const finish = calls.find((c) => c.url.includes('/finish'));
    expect(finish).toBeTruthy();
    expect(JSON.parse(finish.body).status).toBe('completed');
});

test('too-short answer: offers a retry without re-asking the question (Practice)', async () => {
    setupMedia();
    const calls = mockFetch({ suggest_retry: true });
    renderRoom();

    await screen.findByText('RECORDING', {}, { timeout: 4000 });
    fireEvent.click(screen.getByText('Done'));

    await screen.findByText('Answer again', {}, { timeout: 4000 });
    expect(calls.filter((c) => c.url.includes('/answers'))).toHaveLength(1);

    fireEvent.click(screen.getByText('Next question'));
    await screen.findByText('You have answered every question', {}, { timeout: 4000 });
});

test('silence past the threshold moves on and records the question as skipped', async () => {
    setupMedia({ silent: true });
    const calls = mockFetch();
    renderRoom(plan({ silence_sec: 1 }));

    await screen.findByText('You have answered every question', {}, { timeout: 6000 });
    const post = calls.find((c) => c.url.includes('/answers'));
    expect(post.body.get('answer_status')).toBe('auto_skipped');
}, 10000);

test('without a mic it switches to typing and keeps the same paper', async () => {
    setupMedia({ mic: false });
    mockFetch();
    renderRoom();

    await screen.findByPlaceholderText('Type your answer…', {}, { timeout: 4000 });
    expect(screen.getByText(/Subtitle Mode/)).toBeInTheDocument();
    expect(screen.queryByText('RECORDING')).toBeNull();
});

// ── Những lỗi test viên báo ngày 31/08 ──
test('the question text only shows after pressing the eye button, and hides on a second press', async () => {
    setupMedia();
    mockFetch();
    renderRoom();

    await screen.findByText('RECORDING', {}, { timeout: 4000 });
    const question = 'Do you work or are you a student?';
    expect(screen.queryByText(question)).toBeNull();      // không được tự hiện

    fireEvent.click(screen.getByRole('button', { name: /Show question text/ }));
    expect(await screen.findByText(question)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show question text/ }));
    await waitFor(() => expect(screen.queryByText(question)).toBeNull());
});

test('pressing hints a second time closes them', async () => {
    setupMedia();
    mockFetch();
    renderRoom();

    await screen.findByText('RECORDING', {}, { timeout: 4000 });
    fireEvent.click(screen.getByRole('button', { name: /Hints & vocabulary/ }));
    expect(await screen.findByText('Hints')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Hints & vocabulary/ }));
    await waitFor(() => expect(screen.queryByText('Hints')).toBeNull());
});

test('pausing while recording stops at once, and continuing re-asks that question', async () => {
    setupMedia();
    const calls = mockFetch();
    renderRoom();

    await screen.findByText('RECORDING', {}, { timeout: 4000 });
    fireEvent.click(screen.getByRole('button', { name: /Pause/ }));

    // Dừng NGAY: không còn màn ghi âm, và hiện nút tiếp tục.
    await screen.findByText('The test is paused', {}, { timeout: 4000 });
    expect(screen.queryByText('RECORDING')).toBeNull();
    // Câu bỏ dở không được nộp.
    expect(calls.filter((c) => c.url.includes('/answers'))).toHaveLength(0);

    fireEvent.click(screen.getByText('Continue test'));
    // Giám khảo đọc lại câu hỏi rồi mới ghi âm tiếp.
    await screen.findByText('RECORDING', {}, { timeout: 4000 });
});
