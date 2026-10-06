import API_BASE from '../config/api';

// Highlights/notes live in the two global localStorage arrays the exam rooms
// already use ('ielts-highlights' / 'ielts-notes'), each element tagged with its
// examId. We persist them to the result at submit so the data survives even after
// the exam's questions are later edited. (Re-painting them in review is handled
// separately and intentionally kept out of here for now.)

const readArray = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

// examId can round-trip through sessionStorage/location.state as string or number;
// compare numerically so a type mismatch never silently drops entries.
const sameExam = (a, b) => Number(a) === Number(b);

// Best-effort: POST this exam's highlights/notes for a just-submitted result.
// Never throws — must not block post-submit navigation.
export async function saveExamAnnotations(resultId, examId) {
  try {
    if (!resultId) return;
    const highlights = readArray('ielts-highlights').filter((h) => h && sameExam(h.examId, examId));
    const notes = readArray('ielts-notes').filter((n) => n && sameExam(n.examId, examId));
    if (highlights.length === 0 && notes.length === 0) return; // nothing worth saving
    await fetch(`${API_BASE}/student/exam-result/${resultId}/annotations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ highlights, notes }),
    });
  } catch (e) {
    console.warn('saveExamAnnotations failed', e);
  }
}
