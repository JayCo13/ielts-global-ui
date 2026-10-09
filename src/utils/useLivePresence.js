import { useEffect, useRef, useState } from 'react';
import API_BASE from '../config/api';

// Live "N people are taking this test" presence (ported from VN). Backed by
// /student/live-presence (Redis, with an in-memory fallback) — it never touches the
// database, and every call here is best-effort: a failure just leaves the count at 0.
//
// A "scope" is the exam id for a full test ("53") or "<exam>p<part>" for one focus
// part ("53p2").
const HEARTBEAT_MS = 20000;   // backend treats a taker as gone after 60s of silence
const LIST_POLL_MS = 30000;

const getToken = () => localStorage.getItem('token');

/**
 * Exam rooms: heartbeats the current user into `scope` while `active` is true and
 * returns the current number of takers (this user included). Sends a `leave` on
 * unmount. Independent of useExamHeartbeat (which records tab switches in the DB).
 */
export default function useLivePresence(scope, active) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active || !scope) return undefined;
    const token = getToken();
    if (!token) return undefined;
    let cancelled = false;

    const beat = async () => {
      try {
        const res = await fetch(`${API_BASE}/student/live-presence/${scope}/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCount(data.count || 0);
        }
      } catch (e) {
        /* best-effort */
      }
    };

    beat();
    intervalRef.current = setInterval(beat, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      try {
        fetch(`${API_BASE}/student/live-presence/${scope}/leave`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {});
      } catch (e) {
        /* best-effort */
      }
    };
  }, [scope, active]);

  return count;
}

/**
 * List pages: live counts for the cards currently on screen, as { [scope]: count }.
 * Pass only the visible page's scopes — the request is one small batch, refreshed
 * every 30s and skipped while the tab is hidden. Logged-out visitors get {} (the
 * endpoint needs a login) and no request is made.
 */
export function useLiveCounts(scopes) {
  const [counts, setCounts] = useState({});
  const key = (scopes || []).filter(Boolean).join(',');

  useEffect(() => {
    if (!key) return undefined;
    const token = getToken();
    if (!token) return undefined;
    let cancelled = false;

    const fetchCounts = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch(`${API_BASE}/student/live-presence?exam_ids=${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Merge: counts of cards on other pages stay until they are refreshed.
          if (!cancelled) setCounts((prev) => ({ ...prev, ...(data.counts || {}) }));
        }
      } catch (e) {
        /* best-effort */
      }
    };

    fetchCounts();
    const iv = setInterval(fetchCounts, LIST_POLL_MS);
    return () => { cancelled = true; clearInterval(iv); };
  }, [key]);

  return counts;
}
