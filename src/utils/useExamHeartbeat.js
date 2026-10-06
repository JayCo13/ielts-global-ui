import { useEffect, useRef } from 'react';
import API_BASE from '../config/api';

// Reports a student's live exam progress to the backend while they take a test.
// The backend keeps ONE exam_progress row per student; at submit it reads that
// row's tab_switches and stores it on the result (see backend
// app/utils/exam_progress.py). Fire-and-forget: this must NEVER disrupt the
// exam — every call is wrapped and errors are swallowed.
//
// Usage (call once at the top level of an exam layout, before any early return):
//   useExamHeartbeat({
//     enabled: !!examId,
//     skill: 'listening',
//     examId,
//     title: examData?.exam_title,
//     questionsDone,
//     totalQuestions,
//     lastQuestion: currentQuestion,
//     tabSwitches,
//   });
const HEARTBEAT_INTERVAL_MS = 15000;

const post = (path, body) => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      keepalive: true,
    }).catch(() => {});
  } catch (e) {
    /* never disrupt the exam */
  }
};

export default function useExamHeartbeat({
  enabled,
  skill,
  examId,
  title,
  questionsDone,
  totalQuestions,
  lastQuestion,
  part,
  tabSwitches,
  wordCount,   // writing only — number of words written so far
}) {
  // Keep the latest values in a ref so the interval always sends fresh data
  // without re-subscribing on every keystroke.
  const dataRef = useRef({});
  dataRef.current = {
    skill,
    exam_id: examId ?? null,
    title: title ?? null,
    questions_done: questionsDone ?? 0,
    total_questions: totalQuestions ?? null,
    last_question: lastQuestion ?? null,
    part: part ?? null,
    tab_switches: tabSwitches ?? 0,
    word_count: wordCount ?? null,
  };

  useEffect(() => {
    if (!enabled) return undefined;

    // Immediate first beat, then a steady pulse.
    post('/student/exam/heartbeat', dataRef.current);
    const id = setInterval(() => post('/student/exam/heartbeat', dataRef.current), HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(id);
      post('/student/exam/heartbeat/stop');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, examId]);

  // Push a beat as soon as the tab-switch count changes, so a switch shortly
  // before submitting is not lost between two interval beats.
  const firstTabRender = useRef(true);
  useEffect(() => {
    if (firstTabRender.current) { firstTabRender.current = false; return; }
    if (!enabled) return;
    post('/student/exam/heartbeat', dataRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabSwitches]);
}
