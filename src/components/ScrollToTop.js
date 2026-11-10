import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Start every newly opened page at the top. Without this, React Router keeps
 * the previous scroll position, so a link clicked in the footer (e.g. "Work
 * With Us") opens the next page scrolled to its bottom.
 *
 * - Back/Forward (POP) is left alone so the browser can restore the position.
 * - Links with a #hash are left alone so in-page anchors still work.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === 'POP' || hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navType]);

  return null;
}
