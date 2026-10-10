import React, { useEffect, useRef, useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES, getLanguage, setLanguage, onLanguageChange } from './index';

// Interface-language picker (navbar). Language names are shown in their own
// language and are never translated themselves.
export default function LanguageSwitcher({ variant = 'navbar', onPicked }) {
  const [lang, setLang] = useState(getLanguage());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const ref = useRef(null);

  useEffect(() => onLanguageChange(setLang), []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = async (code) => {
    setBusy(code);
    await setLanguage(code);
    setBusy(null);
    setOpen(false);
    if (onPicked) onPicked(code);
  };

  const active = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  if (variant === 'list') {
    // Mobile menu: a plain wrapped list of languages.
    return (
      <div className="px-4 py-3" data-no-translate>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          <Globe className="w-4 h-4" /> Language
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => pick(l.code)}
              disabled={busy !== null}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${l.code === lang
                ? 'bg-[#07223d] text-white border-[#07223d]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#07223d]'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref} data-no-translate>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#aea091] hover:text-white hover:bg-white/10 transition-colors"
      >
        <Globe className="w-5 h-5" />
        <span className="hidden lg:inline">{active.short}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-[60]"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => pick(l.code)}
                disabled={busy !== null}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors ${l.code === lang
                  ? 'text-[#07223d] font-bold bg-[#07223d]/5'
                  : 'text-gray-700 hover:bg-gray-50'} ${busy === l.code ? 'opacity-60' : ''}`}
              >
                <span>{l.label}</span>
                {l.code === lang && <Check className="w-4 h-4 text-[#0096b1]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
