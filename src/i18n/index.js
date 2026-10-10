// Runtime UI translation for EnglishOnComputer.
//
// The app's copy is written inline in JSX (English). Rather than converting ~130
// files to translation keys, the interface is translated in the browser:
//
//   1. scripts/extract-i18n.js collects every UI string into public/locales/en.json.
//   2. public/locales/<lang>.json maps those English strings to a translation.
//   3. This module walks the DOM and swaps a text node (or a placeholder / title /
//      aria-label / alt attribute) when its text EXACTLY matches a dictionary entry.
//      A MutationObserver keeps doing that as React renders.
//
// Only `nodeValue` and attribute values are changed — nodes are never added, removed
// or replaced — so React's own bookkeeping is untouched. Text that is not in the
// dictionary (test passages, questions, answers, AI feedback, user content) is left
// alone, and anything inside `[data-no-translate]` is never looked at.

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'zh', label: '中文', short: '中文' },
  { code: 'hi', label: 'हिन्दी', short: 'हिं' },
  { code: 'id', label: 'Bahasa Indonesia', short: 'ID' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'ar', label: 'العربية', short: 'ع' },
];

const STORAGE_KEY = 'ui_lang';
const SKIP_SELECTOR = '[data-no-translate],.notranslate,script,style,noscript,textarea,code,pre,svg,[contenteditable="true"],[contenteditable=""]';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const MAX_LEN = 600;          // nothing longer is a UI string
const PATTERN_MAX_LEN = 200;

let current = 'en';
let strings = new Map();      // normalised English -> translation
let patterns = [];            // [{ re, tpl }]
let missCache = new Set();    // texts known to have no translation (per language)
let observer = null;
let started = false;
const dictCache = new Map();  // lang -> Promise<{strings, patterns}>
const listeners = new Set();

// What we last wrote, so a node can be recognised as "ours", re-translated when
// the language changes, and restored to English.
const textState = new WeakMap();   // Text -> { src, out }
const attrState = new WeakMap();   // Element -> { [attr]: { src, out } }

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function safeGet() {
  try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
}
function safeSet(v) {
  try { localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* private mode */ }
}

function compilePatterns(obj) {
  return Object.keys(obj || {}).map((en) => {
    const parts = norm(en).split(/(\{\d+\})/);
    let src = '^';
    const order = [];
    parts.forEach((p) => {
      const m = /^\{(\d+)\}$/.exec(p);
      if (m) { order.push(Number(m[1])); src += '(.+?)'; } else { src += escapeRe(p); }
    });
    src += '$';
    try { return { re: new RegExp(src), order, tpl: obj[en] }; } catch (e) { return null; }
  }).filter(Boolean);
}

function lookup(key) {
  if (!key || key.length > MAX_LEN) return null;
  const hit = strings.get(key);
  if (hit !== undefined) return hit;
  if (missCache.has(key)) return null;
  if (key.length <= PATTERN_MAX_LEN) {
    for (let i = 0; i < patterns.length; i += 1) {
      const p = patterns[i];
      const m = p.re.exec(key);
      if (m) {
        const vals = {};
        p.order.forEach((idx, n) => {
          const raw = m[n + 1];
          // A captured value may itself be a UI word (e.g. "No {0} words found.").
          vals[idx] = strings.get(norm(raw)) || raw;
        });
        return p.tpl.replace(/\{(\d+)\}/g, (_, d) => (vals[d] !== undefined ? vals[d] : ''));
      }
    }
  }
  if (missCache.size > 8000) missCache = new Set();
  missCache.add(key);
  return null;
}

/** Translate one string with the active dictionary (returns the input when unknown). */
export function translate(text) {
  if (current === 'en' || typeof text !== 'string') return text;
  const t = lookup(norm(text));
  return t || text;
}

function skipped(el) {
  return !el || (el.closest && el.closest(SKIP_SELECTOR) !== null);
}

function handleText(node) {
  const raw = node.nodeValue;
  if (!raw) return;
  const st = textState.get(node);
  const ours = st && raw === st.out;
  const src = ours ? st.src : raw;          // React changed it -> it is fresh English
  let out = src;
  if (current !== 'en' && /[A-Za-z]/.test(src)) {
    const t = lookup(norm(src));
    if (t) {
      const lead = /^\s*/.exec(src)[0];
      const trail = /\s*$/.exec(src)[0];
      out = lead + t + trail;
    }
  }
  if (out !== raw) node.nodeValue = out;
  if (out !== src) textState.set(node, { src, out });
  else if (st) textState.delete(node);
}

function handleAttrs(el) {
  let st = attrState.get(el);
  for (let i = 0; i < ATTRS.length; i += 1) {
    const a = ATTRS[i];
    const raw = el.getAttribute(a);
    if (raw === null || raw === '') continue;
    const rec = st && st[a];
    const ours = rec && raw === rec.out;
    const src = ours ? rec.src : raw;
    let out = src;
    if (current !== 'en' && /[A-Za-z]/.test(src)) {
      const t = lookup(norm(src));
      if (t) out = t;
    }
    if (out !== raw) el.setAttribute(a, out);
    if (out !== src) {
      if (!st) { st = {}; attrState.set(el, st); }
      st[a] = { src, out };
    } else if (rec) {
      delete st[a];
    }
  }
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === 3) {
    if (!skipped(root.parentElement)) handleText(root);
    return;
  }
  if (root.nodeType !== 1 || skipped(root)) return;
  handleAttrs(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === 1) return n.matches(SKIP_SELECTOR) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === 3) handleText(n); else handleAttrs(n);
    n = walker.nextNode();
  }
}

function onMutations(muts) {
  for (let i = 0; i < muts.length; i += 1) {
    const m = muts[i];
    if (m.type === 'characterData') {
      if (!skipped(m.target.parentElement)) handleText(m.target);
    } else if (m.type === 'attributes') {
      if (!skipped(m.target)) handleAttrs(m.target);
    } else {
      for (let j = 0; j < m.addedNodes.length; j += 1) walk(m.addedNodes[j]);
    }
  }
}

function startObserver() {
  if (observer || typeof MutationObserver === 'undefined' || !document.body) return;
  observer = new MutationObserver(onMutations);
  observer.observe(document.body, {
    childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS,
  });
}

function loadDictionary(lang) {
  if (lang === 'en') return Promise.resolve({ strings: {}, patterns: {} });
  if (!dictCache.has(lang)) {
    const p = fetch(`${process.env.PUBLIC_URL || ''}/locales/${lang}.json`, { cache: 'force-cache' })
      .then((r) => { if (!r.ok) throw new Error(`locale ${lang}: ${r.status}`); return r.json(); })
      .catch((e) => { dictCache.delete(lang); throw e; });
    dictCache.set(lang, p);
  }
  return dictCache.get(lang);
}

// Arabic: the page layout stays left-to-right, but each piece of text takes its
// direction from its own first letter, so Arabic sentences read (and punctuate)
// right-to-left while English test content stays left-to-right.
function ensureBidiStyle() {
  if (document.getElementById('ui-lang-bidi')) return;
  const el = document.createElement('style');
  el.id = 'ui-lang-bidi';
  el.textContent = 'html.ui-lang-ar body *:not(svg):not(svg *){unicode-bidi:plaintext}';
  document.head.appendChild(el);
}

export function getLanguage() { return current; }

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Switch the interface language. Resolves to the language actually applied. */
export async function setLanguage(lang) {
  const target = LANGUAGES.some((l) => l.code === lang) ? lang : 'en';
  let dict;
  try {
    dict = await loadDictionary(target);
  } catch (e) {
    // Dictionary unavailable (offline, not deployed yet): stay on the current language.
    return current;
  }
  current = target;
  strings = new Map(Object.entries(dict.strings || {}).map(([k, v]) => [norm(k), v]));
  patterns = compilePatterns(dict.patterns);
  missCache = new Set();
  safeSet(target);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', target);
    // Layout stays left-to-right for every language; the marker class switches
    // on per-paragraph text direction for Arabic (see ensureBidiStyle).
    document.documentElement.classList.toggle('ui-lang-ar', target === 'ar');
    ensureBidiStyle();
    walk(document.body);
    startObserver();
  }
  listeners.forEach((fn) => { try { fn(target); } catch (e) { /* ignore */ } });
  return current;
}

/** Call once at app start: applies the saved language (English needs no work). */
export function initI18n() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // Native dialogs are not DOM nodes, so translate their message on the way in.
  ['alert', 'confirm'].forEach((name) => {
    const native = window[name];
    if (typeof native !== 'function') return;
    window[name] = function translated(message, ...rest) {
      return native.call(window, typeof message === 'string' ? translate(message) : message, ...rest);
    };
  });
  const saved = safeGet();
  // Prerender (react-snap) and first-time visitors stay on English.
  if (saved && saved !== 'en' && !/ReactSnap/i.test(navigator.userAgent || '')) {
    setLanguage(saved);
  }
}
