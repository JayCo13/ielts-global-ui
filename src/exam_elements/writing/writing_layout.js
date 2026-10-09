import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomRichTextEditor from '../../components/CustomRichTextEditor';
import ForceLogoutDialog from '../../components/ForceLogoutDialog';
import { Bell, Menu, Wifi, Volume2, FileText, Plus, BookOpen, MessageSquare, X, ArrowUpCircle } from 'lucide-react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Split from 'react-split';
import { toast, Toaster } from 'react-hot-toast';
import { TranslatorDialog } from '../../translator';
import API_BASE from '../../config/api';
import fetchWithTimeout from '../../utils/fetchWithTimeout';
import useLivePresence from '../../utils/useLivePresence';
import LiveTakers from '../../components/LiveTakers';

// VN port: count words in the rich-text answer (HTML string) for the live counter.
const countWords = (html) => {
  const text = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

// VN port: render AI answers with light markdown: **bold**, "- " bullets, paragraphs.
const formatAiAnswer = (t) => {
  const esc = (x) => (x || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const h = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const lines = h.split('\n');
  const out = []; let inList = false;
  for (const ln of lines) {
    const m = ln.match(/^\s*[-•]\s+(.*)/);
    if (m) { if (!inList) { out.push('<ul class="list-disc pl-5 space-y-0.5 my-1">'); inList = true; } out.push(`<li>${m[1]}</li>`); }
    else { if (inList) { out.push('</ul>'); inList = false; } if (ln.trim()) out.push(`<p class="mb-1">${ln}</p>`); }
  }
  if (inList) out.push('</ul>');
  return out.join('');
};

const processInstructions = (instructions) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(instructions, 'text/html');

  doc.querySelectorAll('img').forEach(img => {
    // Read the raw attribute, not img.src — the getter resolves against the
    // document base URL and will never start with '/'.
    const rawSrc = img.getAttribute('src');
    if (rawSrc && rawSrc.startsWith('/')) {
      img.setAttribute('src', `${API_BASE}${rawSrc}`);
    }
  });

  return doc.body.innerHTML;
};

const WritingLayout = () => {
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const location = useLocation();
  // VN port: location.state is lost on a full page reload — persist the task identity
  // so reloading the writing room (or the review page) restores it.
  const navState = useMemo(() => {
    const st = location.state;
    if (st && st.taskId) {
      try { sessionStorage.setItem('writing_room_nav', JSON.stringify({ taskId: st.taskId, testId: st.testId, isForecast: st.isForecast, mode: st.mode, partNumber: st.partNumber })); } catch (e) { /* ignore */ }
      return st;
    }
    try {
      const saved = sessionStorage.getItem('writing_room_nav');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return st || {};
  }, [location.state]);
  const { taskId, testId, isForecast } = navState;
  // VN port: Practice (no timer, submit anytime) vs Mock Exam (timer + auto-submit),
  // picked in TestModeDialog. Forecast keeps its timer. Entries without a mode keep
  // the previous global behaviour (timer on).
  const isPracticeMode = navState.mode === 'practice' && !isForecast;
  // Live presence ("N people are taking this test"): Redis-only, no DB write.
  // Scope = test id, or "<test>p<part>" for a single focus task.
  const liveTakers = useLivePresence(
    testId ? (isForecast && navState.partNumber ? `${testId}p${navState.partNumber}` : String(testId)) : null,
    !!testId
  );
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());   // for "Time taken"
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [textSize, setTextSize] = useState('regular');
  const [colorTheme, setColorTheme] = useState('black-on-white');
  const menuRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [parts, setParts] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submissionData, setSubmissionData] = useState(null);
  const [showForceLogoutDialog, setShowForceLogoutDialog] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(40);
  const [logoutMessage, setLogoutMessage] = useState('');
  const [sampleOpen, setSampleOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // VN port: word-click dictionary + "Add to New Words" on the readable panels (prompt
  // + sample essay) — never on the answer editor.
  const [vocabMenu, setVocabMenu] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [dict, setDict] = useState({ open: false, text: '', pos: { x: 0, y: 0 } });
  const vocabMenuRef = useRef(null);
  // VN port: AI Assistant (Check Errors / Ask AI) available throughout the test.
  const [askOpen, setAskOpen] = useState(false);
  const [askChat, setAskChat] = useState([]);
  const [askInput, setAskInput] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askContext, setAskContext] = useState('');   // last highlighted excerpt
  const [assistTab, setAssistTab] = useState('check'); // check | ask
  const [assistErrors, setAssistErrors] = useState(null);
  const [assistChecking, setAssistChecking] = useState(false);
  const wordCount = useMemo(() => countWords(studentAnswer), [studentAnswer]);

  // Capture whatever is selected in the essay/prompt (before the panel steals focus).
  const captureSelection = () => {
    const t = (window.getSelection()?.toString() || '').trim();
    if (t.length >= 2) setAskContext(t);
  };
  const askAI = async () => {
    const q = askInput.trim();
    if (!q || askLoading) return;
    setAskInput(''); setAskLoading(true);
    setAskChat((c) => [...c, { role: 'user', text: q }]);
    try {
      const res = await fetch(`${API_BASE}/ai/writing/assist/ask`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: askContext || '', task_id: task?.task_id }),
      });
      const data = await res.json();
      setAskChat((c) => [...c, { role: 'ai', text: res.ok ? (data.answer || '') : (data.detail || 'Error') }]);
    } catch (e) {
      setAskChat((c) => [...c, { role: 'ai', text: 'Error while asking the AI' }]);
    } finally { setAskLoading(false); }
  };
  const runAssistCheck = async () => {
    if (!askContext) return;
    setAssistChecking(true);
    try {
      const res = await fetch(`${API_BASE}/ai/writing/assist/check`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: askContext, part_number: task?.part_number || 2 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || 'Check failed'); return; }
      setAssistErrors((data.errors || []).map((e) => ({ ...e, _show: false })));
    } catch (e) { toast.error('Error while checking'); } finally { setAssistChecking(false); }
  };
  const applyAssistFix = (idx, useHigh = false) => {
    const er = (assistErrors || [])[idx];
    if (!er) return;
    const repl = useHigh ? (er.high_band || er.suggestion) : er.suggestion;
    if (!studentAnswer.includes(er.error)) { toast.error('Could not find that text in your essay (it may already be fixed).'); return; }
    handleEditorChange(studentAnswer.replace(er.error, repl));
    setAssistErrors((es) => es.filter((_, i) => i !== idx));
    toast.success('Applied.');
  };

  const handleWordSelect = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = (selection?.toString() || '').trim();
      if (text && text.length < 50 && !text.includes(' ')) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        setVocabMenu({ visible: true, x: rect.left + rect.width / 2, y: rect.bottom + 5, text });
      }
    }, 10);
  };
  const saveWritingVocab = async () => {
    if (!vocabMenu.text) return;
    try {
      const res = await fetch(`${API_BASE}/student/vocabulary`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: vocabMenu.text,
          source_type: 'writing',
          source_exam_id: testId ? parseInt(testId, 10) : null,
          source_exam_title: task?.part_number ? `Writing Task ${task.part_number}` : 'Writing Test',
        }),
      });
      if (res.ok) toast.success(`"${vocabMenu.text}" added to New Words!`);
      else toast.error('Could not save the word');
    } catch (e) {
      toast.error('Error while saving the word');
    }
    setVocabMenu({ visible: false, x: 0, y: 0, text: '' });
  };
  const openDict = () => {
    setDict({ open: true, text: vocabMenu.text, pos: { x: vocabMenu.x, y: vocabMenu.y } });
    setVocabMenu({ visible: false, x: 0, y: 0, text: '' });
  };
  useEffect(() => {
    const onDocClick = (e) => {
      if (vocabMenuRef.current && !vocabMenuRef.current.contains(e.target)) {
        setVocabMenu((m) => (m.visible ? { ...m, visible: false } : m));
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const isSubmitEnabled = (timeRemaining) => {
    return timeRemaining <= 120 || timeRemaining <= 0; // Enable when 2 minutes or less remaining
  };
  const textSizeClasses = {
    regular: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl'
  };
  const colorThemeClasses = {
    'black-on-white': 'bg-white text-black',
    'white-on-black': 'bg-black text-white',
    'yellow-on-black': 'bg-black text-yellow-300'
  };
  useEffect(() => {
    const fetchTestParts = async () => {
      const token = localStorage.getItem('token');
      if (!token || !testId || isForecast) return;

      try {
        const response = await fetchWithTimeout(`${API_BASE}/student/writing/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const currentTest = data.find(test => test.test_id === parseInt(testId));
          if (currentTest) {
            setParts(currentTest.parts);
            const currentIndex = currentTest.parts.findIndex(part => part.task_id === parseInt(taskId));
            setCurrentPartIndex(currentIndex);
          }
        }
      } catch (error) {
        console.error('Error fetching test parts:', error);
      }
    };

    fetchTestParts();
  }, [testId, taskId, isForecast]);

  // Remove answers from dependency array
  useEffect(() => {
    const fetchTaskDetails = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetchWithTimeout(`${API_BASE}/student/writing/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const instr = data?.instructions || '';
          console.log('[WRITING-EXAM-DIAG] taskId:', taskId, 'instructions length:', instr.length);
          console.log('[WRITING-EXAM-DIAG] first 120 chars:', instr.slice(0, 120));
          console.log('[WRITING-EXAM-DIAG] last 120 chars:', instr.slice(-120));
          const imgMatches = instr.match(/<img\b[^>]*>/gi) || [];
          console.log('[WRITING-EXAM-DIAG] img tag count:', imgMatches.length);
          imgMatches.forEach((tag, i) => {
            const srcMatch = tag.match(/\bsrc=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
            const src = srcMatch ? (srcMatch[1] || srcMatch[2] || srcMatch[3]) : '(no src)';
            console.log(`[WRITING-EXAM-DIAG] img[${i}] srcLen=${src.length}, starts="${src.slice(0, 60)}"`);
            console.log(`[WRITING-EXAM-DIAG] img[${i}] ends="${src.slice(-60)}"`);
          });
          setTask(data);
          setTimeLeft(data.duration * 60);
          setCurrentPartIndex(data.part_number - 1);

          // Use saved answer if exists, otherwise use previous answer from server
          const savedAnswer = answers[taskId];
          if (savedAnswer) {
            setStudentAnswer(savedAnswer);
          } else if (data.previous_answer) {
            setStudentAnswer(data.previous_answer.answer_text);
          } else {
            setStudentAnswer('');
          }
        } else if (response.status === 401) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId, navigate]); // Removed answers from dependencies

  useEffect(() => {
    // Practice mode (VN port): no countdown / auto-submit.
    if (timeLeft === null || isPracticeMode) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit(); // Auto submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPracticeMode]);

  // Add this new state to track both answers
  const [allAnswers, setAllAnswers] = useState({
    part1_answer: '',
    part2_answer: ''
  });

  // Modify handleEditorChange to update both states
  const handleEditorChange = (content) => {
    setStudentAnswer(content);
    // Update the specific part's answer
    setAllAnswers(prev => ({
      ...prev,
      [task.part_number === 1 ? 'part1_answer' : 'part2_answer']: content
    }));
  };

  // Replace the existing handleSubmit with this new version
  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    try {
      const currentAnswer = studentAnswer;
      const timeTaken = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
      setAllAnswers(prev => ({
        ...prev,
        [task.part_number === 1 ? 'part1_answer' : 'part2_answer']: currentAnswer
      }));

      if (isForecast) {
        // VN port: single-part save (a resubmit of a graded part is kept as a retake
        // in history server-side), then straight to the review + AI grading page.
        const response = await fetchWithTimeout(
          `${API_BASE}/student/writing/part/${taskId}/essay`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              answer_text: currentAnswer,
              time_taken: timeTaken
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSubmissionData(data);
          setNotification({
            show: true,
            message: 'Answer submitted successfully! Opening your review...',
            type: 'success'
          });
          setTimeout(() => {
            navigate('/writing_review', { state: { testId, isForecast, partNumber: task?.part_number } });
          }, 1200);
        } else {
          setNotification({
            show: true,
            message: 'Failed to submit your answer. Please try again.',
            type: 'error'
          });
        }
        return;
      }

      const response = await fetchWithTimeout(
        `${API_BASE}/student/writing/test/${testId}/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            part1_answer: task.part_number === 1 ? currentAnswer : allAnswers.part1_answer,
            part2_answer: task.part_number === 2 ? currentAnswer : allAnswers.part2_answer,
            time_taken: timeTaken
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubmissionData(data);

        setNotification({
          show: true,
          message: 'Test submitted successfully! Opening your review...',
          type: 'success'
        });

        setTimeout(() => {
          navigate('/writing_review', { state: { testId, isForecast } });
        }, 1200);
      } else if (response.status === 409) {
        const errorData = await response.json();
        setLogoutMessage(errorData.detail || 'Your account has been logged in from another device.');
        setShowForceLogoutDialog(true);
        let countdown = 40;
        setLogoutCountdown(countdown);
        const timer = setInterval(() => {
          countdown -= 1;
          setLogoutCountdown(countdown);
          if (countdown <= 0) {
            clearInterval(timer);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        }, 1000);
      } else {
        setNotification({
          show: true,
          message: 'Failed to submit your test. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to submit your test. Please try again.',
        type: 'error'
      });
    }
  };

  // VN port: manual submit asks for confirmation first (the timer auto-submit calls
  // handleSubmit directly).
  const requestSubmit = () => setSubmitConfirmOpen(true);
  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      await handleSubmit();
    } finally {
      setSubmitting(false);
      setSubmitConfirmOpen(false);
    }
  };

  // Update the submit button text in the return section
  <button
    onClick={handleSubmit}
    className={`flex items-center gap-2 px-7 py-5 rounded-lg transition-colors ${colorTheme === 'black-on-white' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'
      }`}
  >
    <Check className="w-5 h-5" />
    <span>Submit Test</span>
  </button>

  const handlePreviousPart = async () => {
    if (currentPartIndex > 0) {
      // Save current answer before switching
      const previousPart = parts[currentPartIndex - 1];
      setAllAnswers(prev => ({
        ...prev,
        [task.part_number === 1 ? 'part1_answer' : 'part2_answer']: studentAnswer
      }));

      setLoading(true);
      try {
        const response = await fetchWithTimeout(`${API_BASE}/student/writing/tasks/${previousPart.task_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTask(data);
          // Remove the setTimeLeft line to maintain current timer
          setStudentAnswer(data.part_number === 1 ? allAnswers.part1_answer : allAnswers.part2_answer || '');
          setCurrentPartIndex(currentPartIndex - 1);
        }
      } catch (error) {
        console.error('Error fetching previous task:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNextPart = async () => {
    if (currentPartIndex < parts.length - 1) {
      // Save current answer before switching
      const nextPart = parts[currentPartIndex + 1];
      setAllAnswers(prev => ({
        ...prev,
        [task.part_number === 1 ? 'part1_answer' : 'part2_answer']: studentAnswer
      }));

      setLoading(true);
      try {
        const response = await fetchWithTimeout(`${API_BASE}/student/writing/tasks/${nextPart.task_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTask(data);
          // Remove the setTimeLeft line to maintain current timer
          setStudentAnswer(data.part_number === 1 ? allAnswers.part1_answer : allAnswers.part2_answer || '');
          setCurrentPartIndex(currentPartIndex + 1);
        }
      } catch (error) {
        console.error('Error fetching next task:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Task not found</div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${colorThemeClasses[colorTheme]}`}>
      <header className={`border-b border-zinc-500 px-4 py-4 flex justify-between items-center ${colorThemeClasses[colorTheme]}`}>
        <div className="flex items-center space-x-8">
          <div className={`text-sm ${colorThemeClasses[colorTheme]}`}>
            <div><p className="font-bold">Test taker ID</p></div>
            <div>
              {isPracticeMode ? 'Practice · no time limit' : `${formatTime(timeLeft)} remaining`}
            </div>
            <LiveTakers count={liveTakers} min={2} className="mt-0.5" />
          </div>
        </div>

        <div className="flex items-center space-x-4 font-medium whitespace-nowrap">
          <button
            onClick={() => setSampleOpen(true)}
            disabled={!task?.sample_essay}
            className={`p-1 rounded inline-flex items-center gap-2 ${!task?.sample_essay ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
            title={task?.sample_essay ? 'View Sample Writing' : 'No sample available'}
          >
            <span className="text-sm inline-flex items-center gap-2">View Sample
              <FileText className={`w-5 h-5 ${colorTheme !== 'black-on-white' ? 'text-white' : 'text-gray-600'}`} />
            </span>
          </button>
          <button
            onMouseDown={captureSelection}
            onClick={() => setAskOpen(true)}
            className="px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-[#eb7e37] text-white hover:bg-[#d66e2a] font-semibold"
            title="AI Assistant: check errors & ask questions"
          >
            <span className="text-sm inline-flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> AI Assistant
            </span>
          </button>
          <Wifi className={`w-5 h-5 ${colorTheme !== 'black-on-white' ? 'text-white' : 'text-gray-600'}`} />
          <Bell className={`w-5 h-5 ${colorTheme !== 'black-on-white' ? 'text-white' : 'text-gray-600'}`} />
          <div className="relative" ref={menuRef}>
            <Menu
              className={`w-5 h-5 cursor-pointer ${colorTheme !== 'black-on-white' ? 'text-white' : 'text-gray-600'}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
            {isMenuOpen && (
              <div className="fixed inset-0 z-50">
                <div className={`min-h-screen w-full flex flex-col items-center justify-center ${colorThemeClasses[colorTheme]}`}>
                  <div className="w-full max-w-3xl bg-opacity-95 p-12 rounded-2xl">
                    <div className="flex justify-between items-center mb-12">
                      <h2 className="text-3xl font-bold">Settings</h2>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="text-2xl hover:opacity-70 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-16">
                      <div className="space-y-8">
                        <div>
                          <h3 className="font-semibold text-2xl mb-6">Text Size</h3>
                          <div className="p-6 border rounded-xl mb-8 text-center">
                            <p className={`${textSizeClasses[textSize]}`}>
                              Sample Text Preview
                            </p>
                          </div>
                          <div className="space-y-4">
                            <label className="flex items-center p-4 bg-white text-black rounded-lg cursor-pointer hover:ring-2 hover:ring-lime-500 transition-all">
                              <input
                                type="radio"
                                name="textSize"
                                value="regular"
                                checked={textSize === 'regular'}
                                onChange={(e) => setTextSize(e.target.value)}
                                className="w-5 h-5 text-lime-500"
                              />
                              <span className="text-base ml-4">Regular</span>
                            </label>
                            <label className="flex items-center p-4 bg-white text-black rounded-lg cursor-pointer hover:ring-2 hover:ring-lime-500 transition-all">
                              <input
                                type="radio"
                                name="textSize"
                                value="large"
                                checked={textSize === 'large'}
                                onChange={(e) => setTextSize(e.target.value)}
                                className="w-5 h-5 text-lime-500"
                              />
                              <span className="text-lg ml-4">Large</span>
                            </label>
                            <label className="flex items-center p-4 bg-white text-black rounded-lg cursor-pointer hover:ring-2 hover:ring-lime-500 transition-all">
                              <input
                                type="radio"
                                name="textSize"
                                value="extra-large"
                                checked={textSize === 'extra-large'}
                                onChange={(e) => setTextSize(e.target.value)}
                                className="w-5 h-5 text-lime-500"
                              />
                              <span className="text-xl ml-4">Extra Large</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <h3 className="font-semibold text-2xl mb-6">Color Theme</h3>
                          <div className="space-y-4">
                            <label className="flex items-center p-4 bg-white text-black rounded-lg cursor-pointer hover:ring-2 hover:ring-lime-500 transition-all">
                              <input
                                type="radio"
                                name="colorTheme"
                                value="black-on-white"
                                checked={colorTheme === 'black-on-white'}
                                onChange={(e) => setColorTheme(e.target.value)}
                                className="w-5 h-5 text-lime-500"
                              />
                              <span className="text-lg ml-4">Black on White</span>
                            </label>
                            <label className="flex items-center p-4 bg-black text-white rounded-lg cursor-pointer hover:ring-2 hover:ring-lime-500 transition-all">
                              <input
                                type="radio"
                                name="colorTheme"
                                value="white-on-black"
                                checked={colorTheme === 'white-on-black'}
                                onChange={(e) => setColorTheme(e.target.value)}
                                className="w-5 h-5 text-lime-500"
                              />
                              <span className="text-lg ml-4">White on Black</span>
                            </label>
                            <label className="flex items-center p-4 bg-black text-yellow-300 rounded-lg cursor-pointer hover:ring-2 hover:ring-lime-500 transition-all">
                              <input
                                type="radio"
                                name="colorTheme"
                                value="yellow-on-black"
                                checked={colorTheme === 'yellow-on-black'}
                                onChange={(e) => setColorTheme(e.target.value)}
                                className="w-5 h-5 text-lime-500"
                              />
                              <span className="text-lg ml-4">Yellow on Black</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}    </div>
        </div>
      </header>

      <div className={`flex-1 flex flex-col h-[calc(100vh-72px)] ${colorThemeClasses[colorTheme]}`}>
        <div className={`mx-4 mt-2 p-3 rounded-lg border border-gray-300 ${colorThemeClasses[colorTheme]}`}>
          <h3 className={`font-bold text-lg mb-1 ${textSizeClasses[textSize]}`}>Part {task.part_number}</h3>
          <p className={textSizeClasses[textSize]}>
            You should spend about {task.duration} minutes on this task. Write at least {task.word_limit} words.
          </p>
        </div>

        <Split
          className={`flex-1 flex ${isMobile ? 'flex-col h-auto min-h-[calc(100vh-200px)]' : 'flex-row h-[calc(100vh-200px)]'}`}
          direction={isMobile ? 'vertical' : 'horizontal'}
          sizes={isMobile ? [40, 60] : [50, 50]}
          minSize={isMobile ? 150 : 300}
          gutterSize={10}
        >
          <div className={`overflow-y-auto p-4 ${colorThemeClasses[colorTheme]} ${isMobile ? 'border-b border-gray-200' : ''}`} onMouseUp={handleWordSelect}>
            <div
              className={`leading-relaxed ${textSizeClasses[textSize]} [&_img]:max-w-full [&_img]:h-auto`}
              dangerouslySetInnerHTML={{ __html: processInstructions(task.instructions) }}
            />
          </div>

          <div className={`p-4 flex flex-col ${colorThemeClasses[colorTheme]}`} onMouseUp={captureSelection}>
            <CustomRichTextEditor
              value={studentAnswer}
              onChange={handleEditorChange}
              textSize={textSize}
              colorTheme={colorTheme}
              key={`${textSize}-${colorTheme}`}
              className={colorThemeClasses[colorTheme]}
            />
            <div className={`flex justify-between items-center mt-4 gap-3 ${colorThemeClasses[colorTheme]}`}>
              <span className={`text-sm font-medium ${(!task.word_limit || wordCount >= task.word_limit) ? 'text-green-600' : 'text-gray-500'}`}>
                {wordCount} words{task.word_limit ? ` / minimum ${task.word_limit}` : ''}
              </span>
              {!isForecast && (
                <div className="flex gap-2">
                  <button
                    className={`p-3 border rounded-lg shadow-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${colorTheme === 'black-on-white' ? 'bg-black text-white' : 'bg-white text-black'
                      }`}
                    onClick={handlePreviousPart}
                    disabled={currentPartIndex === 0}
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                  <button
                    className={`p-3 border rounded-lg shadow-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${colorTheme === 'black-on-white' ? 'bg-black text-white' : 'bg-white text-black'
                      }`}
                    onClick={handleNextPart}
                    disabled={currentPartIndex === parts.length - 1}
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Split>

        <div className={`border-t border-lime-500 py-2 px-6 ${colorThemeClasses[colorTheme]}`}>
          <div className="flex justify-between items-center text-lg font-bold">
            <div>
              Part {task.part_number}
            </div>
            <div className="flex gap-2">
              <button
                onClick={requestSubmit}
                className={`flex items-center gap-2 px-7 py-5 rounded-lg transition-colors ${colorTheme === 'black-on-white' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'
                  }`}
              >
                <Check className="w-5 h-5" />
                <span>{isForecast ? 'Submit Answer' : 'Submit Test'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {submitConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white text-black rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#2b5356] mb-2">Submit your answer?</h3>
            <p className="text-gray-600 text-sm mb-6">
              {isForecast
                ? 'Are you sure you want to submit? Your essay will open on the review page where you can evaluate it with AI.'
                : 'Are you sure you want to submit the test? Please check both parts before submitting.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSubmitConfirmOpen(false)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0096b1] text-white hover:bg-[#007a90] disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full p-6 ${colorThemeClasses[colorTheme]}`}>
            <div className="text-center">
              <div className={`text-2xl mb-4 ${notification.type === 'success' ? 'text-lime-600' : 'text-red-600'
                }`}>
                {notification.type === 'success' ? '✓' : '✕'}
              </div>
              <p className={`text-lg mb-6 ${colorThemeClasses[colorTheme]}`}>{notification.message}</p>
              <button
                onClick={() => {
                  setNotification({ show: false, message: '', type: '' });
                  if (notification.type === 'success' && !submissionData?.other_part) {
                    // Done → the review + AI grading page (VN flow).
                    navigate('/writing_review', { state: { testId, isForecast, partNumber: task?.part_number } });
                  }
                }}
                className={`px-6 py-6 rounded-lg text-white ${notification.type === 'success' ? 'bg-lime-500 hover:bg-lime-600' : 'bg-red-500 hover:bg-red-600'
                  } transition-colors`}
              >
                {notification.type === 'success' ?
                  (submissionData?.other_part ? 'Continue to Next Part' : 'View my review')
                  : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sampleOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className={`rounded-2xl max-w-5xl w-full p-8 ${colorThemeClasses[colorTheme]}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Sample Writing</h2>
              <button onClick={() => setSampleOpen(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Close</button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto whitespace-pre-wrap text-lg leading-relaxed" onMouseUp={handleWordSelect}>
              {task?.sample_essay || 'No sample available'}
            </div>
          </div>
        </div>
      )}

      {/* VN port: AI Assistant — floating panel with Check Errors + Ask AI */}
      {askOpen && (
        <div className="fixed z-[95] right-3 top-20 w-[92vw] max-w-md bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#eb7e37] text-white rounded-t-2xl">
            <div className="flex items-center gap-2 font-bold"><MessageSquare className="w-4 h-4" /> AI Assistant</div>
            <button onClick={() => setAskOpen(false)} className="p-1 rounded hover:bg-white/20" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex border-b border-gray-200 shrink-0">
            {[['check', 'Check Errors'], ['ask', 'Ask AI']].map(([k, lb]) => (
              <button key={k} onClick={() => setAssistTab(k)} className={`flex-1 py-2 text-sm font-semibold ${assistTab === k ? 'text-[#eb7e37] border-b-2 border-[#eb7e37]' : 'text-gray-500'}`}>{lb}</button>
            ))}
          </div>
          {askContext ? (
            <div className="px-4 py-2 bg-[#0096b1]/5 border-b border-gray-100 text-xs text-gray-600 shrink-0">
              <span className="font-medium">Selected text: </span>
              <span className="italic">"{askContext.slice(0, 140)}{askContext.length > 140 ? '…' : ''}"</span>
              <button onClick={() => { setAskContext(''); setAssistErrors(null); }} className="ml-2 text-gray-400 hover:text-gray-600 underline">clear</button>
            </div>
          ) : (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 shrink-0">
              Tip: highlight part of your essay <b>then click "AI Assistant"</b> to check it or ask about it.
            </div>
          )}

          {assistTab === 'check' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[160px]">
              {askContext
                ? <button onClick={runAssistCheck} disabled={assistChecking} className="w-full py-1.5 rounded-lg bg-[#eb7e37] text-white text-sm font-semibold hover:bg-[#d66e2a] disabled:opacity-60">{assistChecking ? 'Checking...' : 'Check selected text'}</button>
                : <p className="text-sm text-gray-400">Highlight part of your essay to check Grammar / Vocabulary / Context / Naturalness.</p>}
              {assistErrors && assistErrors.length === 0 && <p className="text-sm text-green-600">This text looks good.</p>}
              {assistErrors && assistErrors.map((er, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-2 text-sm bg-white">
                  <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mb-1">{er.type}</span>
                  <div className="text-red-600 line-through break-words">{er.error}</div>
                  <div className="text-green-600 break-words">{er.suggestion}</div>
                  {er.high_band && <div className="text-purple-700 break-words mt-0.5"><span className="text-[10px] font-bold uppercase">High-band: </span>{er.high_band}</div>}
                  {er._show && er.explain && <div className="text-gray-500 mt-1">{er.explain}</div>}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <button onClick={() => applyAssistFix(i)} className="px-2 py-0.5 rounded bg-green-500 text-white text-xs font-semibold">Apply</button>
                    {er.high_band && <button onClick={() => applyAssistFix(i, true)} className="px-2 py-0.5 rounded bg-purple-600 text-white text-xs font-semibold inline-flex items-center gap-0.5"><ArrowUpCircle className="w-3 h-3" /> Higher band</button>}
                    <button onClick={() => setAssistErrors((es) => es.map((e, j) => j === i ? { ...e, _show: !e._show } : e))} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-semibold">Explain</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {assistTab === 'ask' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[160px]">
                {askChat.length === 0 && <p className="text-sm text-gray-400">Ask the AI about the task, how to write it, vocabulary, structures...</p>}
                {askChat.map((m, i) => (
                  m.role === 'ai'
                    ? <div key={i} className="text-sm rounded-lg px-3 py-2 bg-gray-100 mr-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatAiAnswer(m.text) }} />
                    : <div key={i} className="text-sm rounded-lg px-3 py-2 bg-[#0096b1]/10 ml-6 whitespace-pre-wrap">{m.text}</div>
                ))}
                {askLoading && <div className="text-sm text-gray-400">The AI is answering...</div>}
              </div>
              <div className="flex gap-2 p-3 border-t border-gray-100 shrink-0">
                <input value={askInput} onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); askAI(); } }}
                  placeholder="Type your question..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <button onClick={askAI} disabled={askLoading} className="px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-semibold disabled:opacity-60">Send</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* VN port: word-click menu — Add to New Words + dictionary lookup */}
      {vocabMenu.visible && (
        <div
          ref={vocabMenuRef}
          className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[190px]"
          style={{ left: vocabMenu.x, top: vocabMenu.y }}
        >
          <button
            onClick={saveWritingVocab}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#0096b1]/10 hover:text-[#0096b1] flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add to New Words
          </button>
          <button
            onClick={openDict}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#0096b1]/10 hover:text-[#0096b1] flex items-center gap-2 transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Dictionary
          </button>
        </div>
      )}

      <TranslatorDialog
        isOpen={dict.open}
        selectedText={dict.text}
        position={dict.pos}
        onClose={() => setDict({ open: false, text: '', pos: { x: 0, y: 0 } })}
        colorTheme={colorTheme}
      />

      <Toaster position="top-right" />

      <ForceLogoutDialog
        isOpen={showForceLogoutDialog}
        message={logoutMessage}
        secondsRemaining={logoutCountdown}
      />
    </div>
  );
};

export default WritingLayout;
