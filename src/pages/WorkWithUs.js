import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, ChevronLeft, ChevronDown, Gift, Heart, Eye, Play, X, AlertTriangle, ShieldCheck,
  Wallet, Percent, Award, Users, Lightbulb, TrendingUp,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import API_BASE from '../config/api';
import secureStorage from '../utils/secureStorage';
import { countryName, dialCode, ALL_COUNTRY_CODES } from '../data/countries';
import WORLD_LANGUAGES from '../data/languages';

// "Work With Us" — UGC creator program landing page + multi-step sign-up.
// Copy follows the 2026-11 brief. Video cards, creator cards, the countries offered
// in the form and the headline figure all come from the admin (/creator-program).

const NAVY = '#0b2447';
const BLUE = '#2f7fd1';
const ORANGE = '#f28c28';
const GREEN = '#16a34a';

const PLATFORMS = [
  { label: 'YouTube Shorts', logo: '/img/platforms/youtube.webp' },
  { label: 'Instagram Reels', logo: '/img/platforms/instagram.webp' },
  { label: 'TikTok Videos', logo: '/img/platforms/tiktok.webp' },
  { label: 'Facebook Reels', logo: '/img/platforms/facebook.webp' },
  { label: 'X (Twitter) Videos', logo: '/img/platforms/x.svg' },
  { label: 'Threads Posts', logo: '/img/platforms/threads.svg' },
];

const STEPS = [
  ['01', 'Sign Up', 'Create an account and get a FREE premium content guide from our marketing team.'],
  ['02', 'Start Posting', 'Choose a ready-made content format and start creating and posting videos.'],
  ['03', 'Earn Money', 'Earn $0.30 per 1,000 views + $0.10 per 1,000 views from cross-platform reposts + 5%-10% commission on every purchase through your link.'],
  ['04', 'Grow With Us', 'Stay active, grow your audience, and become part of our creator team.'],
];

const BENEFITS = [
  { icon: Wallet, title: 'Stable Earnings', text: 'Earn money by creating and posting content consistently.' },
  { icon: Percent, title: '5%-10% Affiliate Commission', text: 'In addition to earning from views, you’ll also receive a 5% affiliate commission on every purchase made through your referral link.' },
  { icon: Award, title: 'Certificates & Recommendations', text: 'Top creators receive certificates and recommendation letters.' },
  { icon: Users, title: 'A Supportive Community', text: 'Join hundreds of creators who support each other and grow together.' },
  { icon: Lightbulb, title: 'Fresh Content Ideas Every Day', text: 'Choose a format, make it your own, and publish.' },
  { icon: TrendingUp, title: 'Career Growth Opportunities', text: 'Top performers can advance to curator and manager roles.' },
];

function faqs(totalEarned) {
  return [
    ['Do I need followers?', 'No! You can start with a brand-new account. We\'ll show you how to grow your reach from zero.'],
    ['What does it cost?', 'Nothing! Signing up is completely free, with no upfront fees or hidden charges.'],
    ['How much can I earn?', 'Earn $0.30 per 1,000 views + $0.10 per 1,000 views from cross-platform reposts + 5%-10% commission on every purchase through your link. One viral video could earn you $1,000+. Your earnings depend on views and performance.'],
    ['I\'m 16 — can I join?', 'Yes! Young creators are welcome.'],
    ['Is this legit?', totalEarned
      ? `Absolutely! We're an international creator community. Our creators have already earned ${totalEarned} by creating and sharing content.`
      : 'Absolutely! We\'re an international creator community, and every payout is tracked in your creator account.'],
  ];
}

const getToken = () => {
  try { return secureStorage.getItem('token') || localStorage.getItem('token'); } catch (e) { return null; }
};

// ── Auto-scrolling strip (pauses on hover, duplicated track for a seamless loop) ──
function Marquee({ children, speed = 40 }) {
  const items = React.Children.toArray(children);
  if (!items.length) return null;
  const loop = items.length >= 3;
  return (
    <div className="relative overflow-hidden group [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div
        className={`flex gap-4 w-max ${loop ? 'animate-[eoc-marquee_linear_infinite] group-hover:[animation-play-state:paused]' : 'mx-auto'}`}
        style={loop ? { animationDuration: `${Math.max(items.length * 4, 18) * (40 / speed)}s` } : undefined}
      >
        {items}
        {loop && items.map((c, i) => React.cloneElement(c, { key: `dup-${i}`, 'aria-hidden': true, tabIndex: -1 }))}
      </div>
      <style>{'@keyframes eoc-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}'}</style>
    </div>
  );
}

function VideoCard({ v, ...rest }) {
  return (
    <a
      {...rest}
      href={v.video_url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative shrink-0 w-[150px] sm:w-[170px] aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 shadow-lg ring-1 ring-black/5 hover:-translate-y-1 transition-transform"
    >
      {v.thumbnail_url
        ? <img src={v.thumbnail_url} alt={v.handle ? `Video by ${v.handle}` : 'Creator video'} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0 grid place-items-center text-white/50"><Play className="w-10 h-10" /></div>}
      <span className="absolute top-2 left-2 grid place-items-center w-7 h-7 rounded-full bg-black/40 backdrop-blur"><Play className="w-3.5 h-3.5 text-white fill-white" /></span>
      {v.likes && (
        <span className="absolute right-2 bottom-[74px] flex flex-col items-center text-white text-[11px] font-semibold drop-shadow">
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />{v.likes}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-white px-2 pt-2 pb-2 text-center">
        {v.earned && <div className="text-lg font-extrabold leading-none" style={{ color: GREEN }}>+ {v.earned}</div>}
        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-gray-500 truncate">
          {v.views && <><Eye className="w-3 h-3 shrink-0" />{v.views}</>}
          {v.views && v.handle && <span className="text-gray-300">|</span>}
          {v.handle && <span className="truncate">{v.handle}</span>}
        </div>
      </div>
    </a>
  );
}

function CreatorCard({ c, ...rest }) {
  const Wrap = c.profile_url ? 'a' : 'div';
  const linkProps = c.profile_url ? { href: c.profile_url, target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <Wrap {...rest} {...linkProps} className="shrink-0 w-[220px] rounded-2xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {c.avatar_url
        ? <img src={c.avatar_url} alt={c.name} loading="lazy" className="w-14 h-14 rounded-full object-cover" />
        : <div className="w-14 h-14 rounded-full grid place-items-center text-white text-xl font-bold" style={{ background: BLUE }}>{(c.name || '?')[0]}</div>}
      {c.earned && <div className="mt-3 text-2xl font-extrabold" style={{ color: BLUE }}>{c.earned}</div>}
      <div className="font-semibold text-gray-900">{c.name}</div>
      {c.subtitle && <div className="text-xs text-gray-500 mt-0.5">{c.subtitle}</div>}
      {c.note && <div className="text-xs text-gray-400 italic mt-2">{c.note}</div>}
    </Wrap>
  );
}

// "Other country": search every country in the world, or type one that isn't listed.
function OtherCountryPicker({ exclude, value, onPick }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const matches = useMemo(() => ALL_COUNTRY_CODES
    .filter((c) => !exclude.includes(c))
    .filter((c) => !query || countryName(c).toLowerCase().includes(query) || c.toLowerCase() === query), [exclude, query]);
  const exact = matches.some((c) => countryName(c).toLowerCase() === query);
  const pickTyped = () => { const t = q.trim().replace(/\s+/g, ' '); if (t) onPick(t, null); };
  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="other-country-search">Find your country</label>
      <input id="other-country-search" value={q} maxLength={100} autoComplete="off" autoFocus
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (matches.length === 1 || (matches.length && exact)) {
            const c = exact ? matches.find((x) => countryName(x).toLowerCase() === query) : matches[0];
            onPick(countryName(c), c);
          } else if (!matches.length) pickTyped();
        }}
        placeholder="Type to search, e.g. Brazil"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
      <div className="mt-2 max-h-56 sm:max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {matches.map((c) => {
          const on = value === countryName(c);
          return (
            <button type="button" key={c} onClick={() => onPick(countryName(c), c)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm ${on ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
              <span className="w-7 shrink-0 text-xs font-semibold text-gray-500">{c}</span>
              <span className="flex-1 min-w-0 truncate text-gray-900">{countryName(c)}</span>
              {on && <Check className="w-4 h-4 shrink-0 text-blue-600" />}
            </button>
          );
        })}
        {query && !exact && (
          <button type="button" onClick={pickTyped}
            className={`w-full px-3 py-2.5 text-left text-sm ${value && value.toLowerCase() === query ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            <span className="text-gray-500">{matches.length ? 'Not listed? Use ' : 'No match. Use '}</span>
            <span className="font-semibold text-gray-900 break-words">&ldquo;{q.trim()}&rdquo;</span>
          </button>
        )}
      </div>
      {value && <p className="mt-2 text-sm text-gray-700">Selected: <span className="font-semibold">{value}</span></p>}
    </div>
  );
}

// "Other" language: search world languages (multi-select) or type one that isn't listed.
function OtherLanguagePicker({ exclude, value, onChange }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const lower = (x) => x.toLowerCase();
  const skip = exclude.map(lower);
  const matches = useMemo(() => WORLD_LANGUAGES
    .filter((l) => !skip.includes(lower(l)))
    .filter((l) => !query || lower(l).includes(query)), [skip.join('|'), query]); // eslint-disable-line react-hooks/exhaustive-deps
  const has = (l) => value.some((v) => lower(v) === lower(l));
  const toggle = (l) => onChange(has(l) ? value.filter((v) => lower(v) !== lower(l)) : [...value, l].slice(0, 8));
  const exact = matches.some((l) => lower(l) === query) || skip.includes(query);
  const addTyped = () => { const t = q.trim().replace(/\s+/g, ' ').slice(0, 30); if (t && !has(t)) toggle(t); setQ(''); };
  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="other-language-search">Which other languages?</label>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((l) => (
            <button type="button" key={l} onClick={() => toggle(l)}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
              <span className="truncate">{l}</span><X className="w-3.5 h-3.5 shrink-0" aria-label={`Remove ${l}`} />
            </button>
          ))}
        </div>
      )}
      <input id="other-language-search" value={q} maxLength={30} autoComplete="off" autoFocus
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const hit = matches.find((l) => lower(l) === query) || (matches.length === 1 ? matches[0] : null);
          if (hit) { if (!has(hit)) toggle(hit); setQ(''); } else if (!matches.length) addTyped();
        }}
        placeholder="Type to search, e.g. Spanish"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
      <div className="mt-2 max-h-48 sm:max-h-56 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {matches.map((l) => (
          <button type="button" key={l} onClick={() => toggle(l)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm ${has(l) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            <span className="flex-1 min-w-0 truncate text-gray-900">{l}</span>
            {has(l) && <Check className="w-4 h-4 shrink-0 text-blue-600" />}
          </button>
        ))}
        {query && !exact && (
          <button type="button" onClick={addTyped} className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50">
            <span className="text-gray-500">{matches.length ? 'Not listed? Add ' : 'No match. Add '}</span>
            <span className="font-semibold text-gray-900 break-words">&ldquo;{q.trim()}&rdquo;</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Remembered per browser so a returning visitor sees "already applied" instead of the form
// (the backend enforces one open application per account / email / phone anyway).
const APPLIED_KEY = 'eoc_creator_applied';
const readApplied = () => {
  try {
    const v = JSON.parse(localStorage.getItem(APPLIED_KEY) || 'null');
    // A pending flag lapses after 30 days (a rejected applicant may apply again).
    if (!v || (v.status !== 'approved' && Date.now() - (v.at || 0) > 30 * 86400000)) return null;
    return v;
  } catch (e) { return null; }
};
const saveApplied = (status) => {
  try { localStorage.setItem(APPLIED_KEY, JSON.stringify({ status, at: Date.now() })); } catch (e) { /* ignore */ }
};

// Cloudflare Turnstile (only when the backend sends a site key).
let turnstileLoader = null;
const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileLoader) {
    turnstileLoader = new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      sc.async = true;
      sc.onload = () => resolve(window.turnstile);
      sc.onerror = () => { turnstileLoader = null; reject(new Error('turnstile')); };
      document.head.appendChild(sc);
    });
  }
  return turnstileLoader;
};

function Captcha({ siteKey, onToken }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let id = null;
    let alive = true;
    loadTurnstile().then((ts) => {
      if (!alive || !ref.current) return;
      id = ts.render(ref.current, {
        sitekey: siteKey,
        callback: (t) => onToken(t),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    }).catch(() => setFailed(true));
    return () => { alive = false; if (id !== null && window.turnstile) { try { window.turnstile.remove(id); } catch (e) { /* ignore */ } } };
  }, [siteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="mt-5">
      <div ref={ref} className="min-h-[65px] flex justify-center" />
      {failed && <p className="text-sm text-red-600 text-center">Couldn&apos;t load the security check. Please check your connection and reload the page.</p>}
    </div>
  );
}

// ── Multi-step sign-up ──
function ApplyModal({ open, onClose, countries, languages, captchaSiteKey }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ full_name: '', country_code: '', country_other: '', languages: [], languages_other: [], phone: '', email: '', website: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [formToken, setFormToken] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [applied, setApplied] = useState(null);   // {status: 'pending'|'approved', message?}

  useEffect(() => {
    if (!open) return;
    setError(''); setCaptchaToken('');
    const prev = readApplied();
    if (prev) { setApplied(prev); setStep(5); return; }
    setStep(0);
    // Fresh signed form token each time the form opens (the backend rejects instant / stale posts).
    fetch(`${API_BASE}/creator-program`).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && d.form_token) setFormToken(d.form_token); }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const pickCountry = (code) => {
    const prefix = code === 'OTHER' ? '+' : dialCode(code);
    set({ country_code: code, country_other: '', phone: form.phone && form.phone.replace(/[^0-9]/g, '').length > 4 ? form.phone : `${prefix} ` });
  };
  // Under "Other country": name is what we store; iso (if known) pre-fills the dialling code.
  const pickOther = (name, iso) => {
    const supported = countries.find((c) => countryName(c).toLowerCase() === name.toLowerCase());
    if (supported) { pickCountry(supported); return; }
    const typed = form.phone.replace(/[^0-9]/g, '').length > 4;
    set({ country_code: 'OTHER', country_other: name, phone: typed ? form.phone : `${iso ? dialCode(iso) : '+'} ` });
  };
  const toggleLang = (l) => set({ languages: form.languages.includes(l) ? form.languages.filter((x) => x !== l) : [...form.languages, l] });

  const canNext = [
    form.full_name.trim().length > 0,
    !!form.country_code && (form.country_code !== 'OTHER' || form.country_other.trim().length > 0),
    form.languages.length > 0 && (!form.languages.includes('Other') || form.languages_other.length > 0),
    form.phone.replace(/\D/g, '').length >= 6 && (!captchaSiteKey || !!captchaToken),
  ][step];

  const submit = async () => {
    setSending(true); setError('');
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/creator-program/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          ...form,
          // "Other" is replaced by the languages actually picked/typed under it.
          languages: [...form.languages.filter((l) => l !== 'Other'), ...(form.languages.includes('Other') ? form.languages_other : [])],
          languages_other: undefined,
          email: form.email.trim() || null, country_other: form.country_code === 'OTHER' ? (form.country_other.trim() || null) : null,
          form_token: formToken || null, captcha_token: captchaToken || null }),
      });
      const data = await res.json().catch(() => ({}));
      const detail = data && data.detail;
      if (res.status === 409 && detail && detail.code === 'already_applied') {
        saveApplied(detail.status);
        setApplied({ status: detail.status, message: detail.message });
        setStep(5);
      } else if (!res.ok) {
        setError(typeof detail === 'string' ? detail : (detail && detail.message) || 'Something went wrong. Please try again.');
        setCaptchaToken('');
        if (captchaSiteKey && window.turnstile) { try { window.turnstile.reset(); } catch (e) { /* ignore */ } }
      } else {
        saveApplied('pending');
        setStep(4);
      }
    } catch (e) {
      setError('Network error. Please try again.');
    }
    setSending(false);
  };

  const next = () => { if (!canNext) return; if (step === 3) submit(); else setStep(step + 1); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog" aria-modal="true" aria-label="Creator sign-up"
            className="relative w-full sm:max-w-md h-[92vh] sm:h-[640px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button type="button" onClick={() => (step > 0 && step < 4 ? setStep(step - 1) : onClose())} className="p-2 -ml-2 rounded-full hover:bg-gray-100" aria-label="Back">
                {step > 0 && step < 4 ? <ChevronLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
              <span className="font-extrabold tracking-tight" style={{ color: NAVY }}>EnglishOnComputer Creators</span>
              <span className="w-9" />
            </div>
            {step < 4 && (
              <div className="h-1 bg-gray-100"><div className="h-full transition-all" style={{ width: `${((step + 1) / 4) * 100}%`, background: BLUE }} /></div>
            )}

            <form className="flex-1 overflow-y-auto px-5 py-6" onSubmit={(e) => { e.preventDefault(); next(); }}>
              {/* honeypot */}
              <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set({ website: e.target.value })} className="hidden" aria-hidden="true" />

              {step === 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">What&apos;s your name?</h2>
                  <input autoFocus value={form.full_name} maxLength={120} onChange={(e) => set({ full_name: e.target.value })}
                    className="mt-5 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Your full name" />
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">Which country are you in?</h2>
                  {form.country_code === 'OTHER' && (
                    <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-sm"><div className="font-semibold text-gray-900">We don&apos;t support your country yet</div>
                        <div className="text-gray-600">If you&apos;re from another country, we can&apos;t pay you out yet.</div></div>
                    </div>
                  )}
                  <div className="mt-4 space-y-2.5">
                    {[...countries, 'OTHER'].map((code) => {
                      const on = form.country_code === code;
                      return (
                        <button type="button" key={code} onClick={() => pickCountry(code)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${on ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <span className="w-7 text-sm font-semibold text-gray-700">{code === 'OTHER' ? '🌍' : code}</span>
                          <span className="flex-1 text-gray-900">{code === 'OTHER' ? 'Other country' : countryName(code)}</span>
                          {on && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                  {form.country_code === 'OTHER' && (
                    <OtherCountryPicker exclude={countries} value={form.country_other} onPick={pickOther} />
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">What languages can you make videos in?</h2>
                  <p className="text-gray-500 mt-1">You can pick more than one</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {languages.map((l) => {
                      const on = form.languages.includes(l);
                      return (
                        <button type="button" key={l} onClick={() => toggleLang(l)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3.5 transition-colors ${on ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <span>{l}</span>{on && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                  {form.languages.includes('Other') && (
                    <OtherLanguagePicker exclude={languages.filter((l) => l !== 'Other')} value={form.languages_other}
                      onChange={(v) => set({ languages_other: v })} />
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">Your WhatsApp number</h2>
                  <p className="text-gray-500 mt-1">Please enter a phone number that uses WhatsApp. Our manager will contact you there.</p>
                  <input autoFocus type="tel" inputMode="tel" value={form.phone} maxLength={40} onChange={(e) => set({ phone: e.target.value.replace(/[-\u2010-\u2015]/g, '') })}
                    className="mt-5 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="+1 555 123 4567" />
                  <label className="block mt-5 text-sm font-medium text-gray-700">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="email" value={form.email} maxLength={255} onChange={(e) => set({ email: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="you@example.com" />
                  <div className="mt-5 flex gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    We value your privacy and take every measure to protect your personal data. We don&apos;t share it with third parties.
                  </div>
                  {captchaSiteKey && <Captcha siteKey={captchaSiteKey} onToken={setCaptchaToken} />}
                  {error && <div className="mt-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}
                </>
              )}

              {step === 4 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <span className="grid place-items-center w-16 h-16 rounded-full bg-emerald-100"><Check className="w-8 h-8 text-emerald-600" /></span>
                  <h2 className="mt-5 text-2xl font-bold text-gray-900">Thanks, {form.full_name.split(' ')[0] || 'creator'}!</h2>
                  <p className="mt-2 text-gray-600 max-w-xs">We&apos;ve received your application. Our manager will contact you soon with your free content guide.</p>
                  <button type="button" onClick={onClose} className="mt-8 rounded-full px-6 py-3 font-semibold text-white" style={{ background: BLUE }}>Done</button>
                </div>
              )}

              {step === 5 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <span className="grid place-items-center w-16 h-16 rounded-full bg-blue-100"><Check className="w-8 h-8 text-blue-600" /></span>
                  <h2 className="mt-5 text-2xl font-bold text-gray-900">
                    {applied && applied.status === 'approved' ? 'You\u2019re already a creator!' : 'You\u2019ve already applied'}
                  </h2>
                  <p className="mt-2 text-gray-600 max-w-xs">
                    {applied && applied.status === 'approved'
                      ? 'Your application was approved. Open Creator Hub from your account to get started.'
                      : 'We\u2019ve got your application. Our manager will contact you soon on WhatsApp. No need to submit it again.'}
                  </p>
                  {applied && applied.status === 'approved' ? (
                    <Link to="/profile?tab=creator-hub" onClick={onClose} className="mt-8 rounded-full px-6 py-3 font-semibold text-white" style={{ background: BLUE }}>Open Creator Hub</Link>
                  ) : (
                    <button type="button" onClick={onClose} className="mt-8 rounded-full px-6 py-3 font-semibold text-white" style={{ background: BLUE }}>OK</button>
                  )}
                </div>
              )}
            </form>

            {step < 4 && (
              <div className="px-5 pb-5 pt-2">
                {step === 3 && <p className="text-center text-xs text-gray-400 mb-3">By tapping Continue, I agree to the <Link to="/privacy-policy" className="underline" onClick={onClose}>privacy policy</Link></p>}
                <button type="button" onClick={next} disabled={!canNext || sending}
                  className="w-full rounded-2xl py-4 font-semibold text-white shadow-lg transition-opacity disabled:opacity-40 disabled:shadow-none"
                  style={{ background: `linear-gradient(180deg, #4b8ff0, ${BLUE})` }}>
                  {sending ? 'Sending…' : 'Continue'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SectionTitle = ({ children, sub }) => (
  <div className="text-center max-w-2xl mx-auto">
    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>{children}</h2>
    {sub && <p className="mt-3 text-gray-600">{sub}</p>}
  </div>
);

export default function WorkWithUs() {
  const [data, setData] = useState({ countries: [], languages: [], videos: [], creators: [], total_earned: '' });
  const [open, setOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const loggedIn = !!getToken();

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/creator-program`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const languages = data.languages.length ? data.languages : ['English', 'Other'];
  const faqList = useMemo(() => faqs(data.total_earned), [data.total_earned]);

  const Cta = ({ children, className = '' }) => (
    <button type="button" onClick={() => setOpen(true)}
      className={`group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 ${className}`}
      style={{ background: ORANGE }}>
      {children}<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Seo
        title="Work With Us – Become a UGC Creator | EnglishOnComputer"
        description="Create short videos for EnglishOnComputer and earn from views plus a commission on every purchase through your link. No experience needed, no upfront costs."
        path="/work-with-us"
      />
      <Navbar />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, #07223d 0%, ${NAVY} 45%, #123a73 100%)` }}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
          <div className="pointer-events-none absolute -bottom-40 right-0 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-20" style={{ background: ORANGE }} />
          <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-14 pb-12 lg:pt-20 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-sm font-medium text-white/85">Work With Us</span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">Become a <span style={{ color: ORANGE }}>UGC Creator</span></h1>
            <p className="mt-4 text-lg sm:text-xl text-white/80">Create content. Earn money. Work anywhere.</p>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/85">
              {['No experience needed.', 'No upfront costs.'].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" style={{ color: ORANGE }} />{t}</li>
              ))}
            </ul>
            {data.total_earned && <p className="mt-6 text-xl font-bold">Our creators have already earned {data.total_earned}!</p>}
            <p className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm sm:text-base text-left">
              <Gift className="w-5 h-5 shrink-0 mt-0.5" style={{ color: ORANGE }} />
              <span><strong>FREE BONUS:</strong> Get a step-by-step content strategy to help you reach your first 1 million views!</span>
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Cta>Sign Up – It&apos;s Free</Cta>
              {!loggedIn && <p className="text-sm text-white/70">Already have an account? <Link to="/login" className="font-semibold text-white underline underline-offset-2">Sign In</Link></p>}
            </div>
          </div>
          {data.videos.length > 0 && (
            <div className="relative pb-14">
              <Marquee speed={35}>{data.videos.map((v) => <VideoCard key={v.id} v={v} />)}</Marquee>
            </div>
          )}
        </section>

        {/* WHAT YOU CAN CREATE */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
          <SectionTitle>What You Can Create</SectionTitle>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PLATFORMS.map(({ label, logo }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4">
                <img src={logo} alt="" width="44" height="44" loading="lazy" className="w-11 h-11 rounded-xl object-contain shrink-0" />
                <span className="font-semibold text-gray-900">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-6 text-white" style={{ background: NAVY }}>
              <div className="text-3xl font-extrabold" style={{ color: ORANGE }}>~$0.30 <span className="text-xl">+ $0.10</span></div>
              <div className="mt-1 font-semibold">Earn ~$0.30 for Every 1,000 Views + $0.10 per 1,000 views from cross-platform reposts</div>
            </div>
            <div className="rounded-2xl p-6 text-white" style={{ background: BLUE }}>
              <div className="text-3xl font-extrabold">5%-10%</div>
              <div className="mt-1 font-semibold">Earn 5%-10% from Every Purchase Through Your Link</div>
            </div>
          </div>
        </section>

        {/* CREATORS */}
        {data.creators.length > 0 && (
          <section className="bg-[#f8fbff] border-y border-[#e3ecf7] py-16">
            <SectionTitle sub="They Started with Zero Experience.">Now It&apos;s Your Turn!</SectionTitle>
            <div className="mt-8"><Marquee speed={30}>{data.creators.map((c) => <CreatorCard key={c.id} c={c} />)}</Marquee></div>
          </section>
        )}

        {/* STEPS */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
          <SectionTitle>4 Steps to Your First Earnings</SectionTitle>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="rounded-2xl border border-gray-200 p-6">
                <div className="text-4xl font-extrabold" style={{ color: ORANGE }}>{n}</div>
                <div className="mt-3 text-lg font-bold text-gray-900">{t}</div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center"><Cta>Start Earning</Cta></div>
        </section>

        {/* WHAT YOU GET */}
        <section className="bg-[#f8fbff] border-y border-[#e3ecf7] py-16">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionTitle>What You Get</SectionTitle>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white border border-gray-200 p-6">
                  <span className="grid place-items-center w-11 h-11 rounded-xl" style={{ background: '#fff1e3', color: ORANGE }}><Icon className="w-5 h-5" /></span>
                  <div className="mt-4 text-lg font-bold text-gray-900">{title}</div>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center"><Cta>I Want All of This</Cta></div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
          <SectionTitle>FAQ</SectionTitle>
          <div className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200">
            {faqList.map(([q, a], i) => (
              <div key={q}>
                <button type="button" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-gray-900" aria-expanded={faqOpen === i}>
                  {q}<ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === i && <p className="px-5 pb-5 -mt-1 text-gray-600">{a}</p>}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center"><Cta>Try for Free</Cta></div>
        </section>
      </main>
      <Footer />
      <ApplyModal open={open} onClose={() => setOpen(false)} countries={data.countries} languages={languages} captchaSiteKey={data.captcha_site_key} />
    </div>
  );
}
