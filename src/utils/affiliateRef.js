import API_BASE from '../config/api';

// Affiliate referral plumbing (ported from the Vietnam tree, adapted for global).
//
// 1. captureReferral(): a visitor lands with ?ref=CODE → remember the code until they
//    register, and count the click once per browser per code.
// 2. claimReferral(): once the visitor is logged in, hand the remembered code to the
//    backend. The server decides whether to accept it (new account only, within a few
//    minutes of signup, never overwrites, no self-referral) — so calling this for an
//    existing account is harmless.
//
// Global attributes referrals ONLY through claim-ref, so the login/registration code
// is not involved at all.

const REF_KEY = 'ref_code';

export function captureReferral() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref || ref.length > 32) return;
    localStorage.setItem(REF_KEY, ref);
    // Count the click once per browser per code (avoid inflating on reloads).
    if (!localStorage.getItem(`ref_click_${ref}`)) {
      localStorage.setItem(`ref_click_${ref}`, '1');
      fetch(`${API_BASE}/customer/affiliate/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref }),
      }).catch(() => {});
    }
  } catch (e) { /* never block the app over referral tracking */ }
}

let claiming = false;

export function claimReferral() {
  try {
    const ref = localStorage.getItem(REF_KEY);
    const token = localStorage.getItem('token');
    if (!ref || !token || claiming) return;
    claiming = true;
    fetch(`${API_BASE}/customer/affiliate/claim-ref`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ref }),
    })
      .then((res) => {
        // Claimed (or rejected by the server's rules): either way it is settled.
        // Keep the code only when the request itself failed, so it can be retried.
        if (res.ok) localStorage.removeItem(REF_KEY);
      })
      .catch(() => {})
      .finally(() => { claiming = false; });
  } catch (e) { claiming = false; }
}
