import { useEffect, useState } from 'react';

/**
 * State mirrored into web storage, used by the Reading/Listening/Writing test lists.
 *
 * Two preferences ride on this:
 *   - which page of the list the student was on. Kept in sessionStorage so coming back
 *     from a test lands on the page that test was on, instead of resetting to page 1 and
 *     making them hunt for it again. Session-scoped on purpose: a fresh visit starts at
 *     the top rather than resuming a position from days ago.
 *   - whether to hide tests already done. Kept in localStorage — that's a lasting
 *     preference, not something to re-tick every visit.
 *
 * Storage failures (Safari private mode, quota) fall back to plain in-memory state.
 */
export default function usePersistedState(key, initialValue, scope = 'session') {
  const read = () => {
    try {
      const store = scope === 'local' ? window.localStorage : window.sessionStorage;
      const raw = store.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch (_) {
      return initialValue;
    }
  };

  const [value, setValue] = useState(read);

  useEffect(() => {
    try {
      const store = scope === 'local' ? window.localStorage : window.sessionStorage;
      store.setItem(key, JSON.stringify(value));
    } catch (_) {
      /* not worth breaking the page over */
    }
  }, [key, scope, value]);

  return [value, setValue];
}
