import { useEffect, useState } from 'react';

// Counts how many times the student leaves the exam tab while taking a test.
// One switch = the exam tab becomes hidden (they clicked another tab/window or
// minimised). We use the `visibilitychange` → `document.hidden` signal, NOT
// window `blur`, because blur also fires for devtools/alt-tab within the same
// tab and would over-count. Returns the live count; feed it to the exam
// heartbeat so the submit can record it on the result.
//
// Usage: const tabSwitches = useTabSwitchCount(!!examId);
export default function useTabSwitchCount(enabled = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const onVisibility = () => {
      if (document.hidden) setCount((c) => c + 1);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled]);

  return count;
}
