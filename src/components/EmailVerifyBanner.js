import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config/api';

// Ported from VN: prompts logged-in users with an unverified email (not Google
// accounts) to verify it. The button opens the profile "edit" tab, where they
// verify with a 6-digit code. Dismissing hides it for a week.
const DISMISS_KEY = 'email_verify_banner_dismissed_at';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const wasDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < DISMISS_FOR_MS;
  } catch (e) {
    return false;
  }
};

export default function EmailVerifyBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(wasDismissed);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || dismissed) return;
    fetch(`${API_BASE}/student/email-status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStatus(d); })
      .catch(() => {});
  }, [token, dismissed]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* storage unavailable */ }
    setDismissed(true);
  };

  if (dismissed || !status || !status.show_verify) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-start sm:items-center gap-3">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <p className="text-sm text-gray-700 min-w-0 flex-1">
            <span className="font-semibold text-[#07223d]">Verify your email</span>
            {' '}to keep your account secure and to be able to reset your password if you forget it.
          </p>
          <button
            onClick={() => navigate('/profile?tab=edit')}
            className="self-start sm:self-auto shrink-0 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#07223d] hover:bg-[#0b2f52] whitespace-nowrap"
          >
            Verify now
          </button>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          title="Dismiss"
          className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-amber-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
