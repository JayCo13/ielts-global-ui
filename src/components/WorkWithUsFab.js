import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// Blinking "Work With Us" tab on the right edge (brief 2026-11). Hidden inside
// exam rooms / reviews / payment flows and on the page itself.
const HIDE_PREFIXES = [
  '/work-with-us', '/listening_test_room', '/reading_test_room', '/speaking_test', '/speaking_result',
  '/writing_test_room', '/writing_review', '/writing_custom', '/result_review', '/payment', '/transaction-status',
  '/login', '/register', '/auth-callback', '/forgot-password', '/reset-password', '/dictation',
];

export default function WorkWithUsFab() {
  const { pathname } = useLocation();
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return (
    <Link
      to="/work-with-us"
      aria-label="Work With Us"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[997] group"
    >
      <span className="absolute inset-0 rounded-l-2xl bg-[#f28c28] animate-ping opacity-30" />
      <span className="relative flex flex-col items-center gap-2 rounded-l-2xl bg-gradient-to-b from-[#f7a14a] to-[#f28c28] px-2.5 py-4 text-white shadow-lg transition-all group-hover:pr-4">
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="text-sm sm:text-base font-extrabold tracking-wide [writing-mode:vertical-rl] rotate-180">Work With Us</span>
      </span>
    </Link>
  );
}
