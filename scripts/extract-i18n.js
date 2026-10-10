/* eslint-disable no-console */
/**
 * Extract every user-facing UI string from src/ into public/locales/en.json.
 *
 * The app's strings are written inline in JSX (no translation keys). Instead of
 * rewriting ~130 files, the UI is translated at runtime by src/i18n/ (it swaps
 * text nodes whose text exactly matches a dictionary entry). This script builds
 * that dictionary's source list:
 *
 *   node scripts/extract-i18n.js            # writes public/locales/en.json
 *
 * Output: { "strings": ["Start", ...], "patterns": ["Page {0} / {1}", ...] }
 *   - strings:  literal texts (whitespace-collapsed, trimmed)
 *   - patterns: template literals with expressions; {n} marks each expression
 *
 * Re-run after changing UI copy, then translate only the new entries (see
 * scripts/i18n-missing.js). Over-collection is harmless: an entry that never
 * appears on screen is simply never used.
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'public', 'locales', 'en.json');

// Backend error messages reach the UI through toasts / inline errors, so plain
// (non-f-string) `detail="..."` texts are collected too when the backend is present.
const BACKEND = path.join(__dirname, '..', '..', 'ielts-practice-backend', 'app');

const TRANSLATABLE_ATTRS = new Set([
  'placeholder', 'title', 'alt', 'aria-label', 'label', 'confirmLabel', 'secondaryLabel',
  'busyLabel', 'message', 'subtitle', 'intro', 'hours', 'text', 'emptyText', 'heading',
  'cancelText', 'confirmText', 'okText', 'tooltip', 'caption', 'note', 'hint',
]);
// Components whose string props never reach the visible DOM.
const SKIP_COMPONENTS = new Set(['Seo', 'Helmet', 'Route', 'Navigate', 'Link', 'NavLink']);
const SKIP_CALLEES = new Set([
  'require', 'navigate', 'fetch', 'fetchWithTimeout', 'authed', 'getJson', 'postJson',
  'getItem', 'setItem', 'removeItem', 'querySelector', 'querySelectorAll', 'getElementById',
  'addEventListener', 'removeEventListener', 'createElement', 'getAttribute', 'setAttribute',
  'includes', 'startsWith', 'endsWith', 'indexOf', 'split', 'join', 'replace', 'match', 'test',
  'log', 'warn', 'error', 'info', 'debug', 'append', 'get', 'has', 'set', 'delete',
  'toLocaleString', 'toLocaleDateString', 'toLocaleTimeString', 'localeCompare',
  'classList', 'add', 'remove', 'toggle', 'contains', 'encodeURIComponent', 'URLSearchParams',
  'RegExp', 'Error', 'dispatchEvent', 'CustomEvent', 'execCommand',
]);
// console.error('…') etc. are handled by the member-expression check below.
const DISPLAY_KEYS = new Set([
  'label', 'title', 'name', 'text', 'tag', 'note', 'cta', 'caption', 'blurb', 'hint', 'desc',
  'description', 'message', 'heading', 'subtitle', 'placeholder', 'tooltip', 't', 'd', 'q', 'a',
  'question', 'answer', 'content', 'short', 'long', 'empty', 'error', 'success', 'info', 'warn',
  'descPlaceholder', 'action', 'button', 'header', 'sub', 'unit', 'suffix', 'prefix',
]);
const CODE_WORDS = new Set([
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'Bearer', 'Authorization', 'Content-Type', 'Enter',
  'Escape', 'Tab', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift',
  'Control', 'Alt', 'Meta', 'English', 'Vietnamese', 'UTF-8', 'Range', 'Accept', 'Home',
]);
CODE_WORDS.delete('Home');
CODE_WORDS.delete('English');
CODE_WORDS.delete('Vietnamese');

// Props whose nested literals are styling / animation / routing config, not copy.
const NON_TEXT_ATTRS = /^(className|class|style|sx|to|href|src|key|id|type|variant|size|color|d|viewBox|points|transition|animate|initial|exit|variants|while[A-Z]\w*|sizes|gutterSize|direction|cursor|accept|data-.*|ref)$|ClassName$|Style$/;

const norm = (s) => s.replace(/\s+/g, ' ').trim();

function looksLikeClassList(s) {
  const toks = s.split(/\s+/).filter(Boolean);
  if (toks.length === 0) return true;
  const classy = toks.filter((t) => /^[a-z0-9!:[\]()/.#%&,_'*+-]+$/.test(t) && /[-:[\]]|^(flex|grid|block|hidden|relative|absolute|fixed|sticky|italic|underline|truncate|uppercase|capitalize|group|peer|inline|static|border|rounded|shadow|container|prose|sr-only|transition|transform|grow|shrink)$/.test(t));
  return classy.length / toks.length >= 0.6;
}

function isUiText(raw, { allowSingleWord }) {
  const s = norm(raw);
  if (s.length < 2 || s.length > 600) return false;
  if (!/[A-Za-z]{2}/.test(s)) return false;                 // needs real letters
  if (/^[a-z0-9_.\-/:#?=&%@]+$/i.test(s) && !/\s/.test(s)) {  // single token
    if (!allowSingleWord) return false;
    if (CODE_WORDS.has(s)) return false;
    if (!/^[A-Z][a-z]+([A-Z][a-z]+)?$|^[A-Z]{2,}$/.test(s)) return false;  // Start / NewWords-ish / FOCUS
    if (/^[A-Z]{2,}$/.test(s) && s.length > 12) return false;
    if (/^[A-Z][a-z]+[A-Z]/.test(s)) return false;           // camelCase identifiers
  }
  if (/^(https?:|\/|\.\/|\.\.\/|#|data:|mailto:|tel:)/.test(s)) return false;
  if (/^[[(.]?[a-z-]*[[.#][\w-]+[\])]?$/.test(s)) return false;                 // CSS selectors like [data-x], .cls
  if (/\.(docx?|pdf|png|jpe?g|mp3|json|csv|txt)$/i.test(s)) return false;        // file names
  if (/^[\w-]+\.(js|json|png|jpe?g|webp|svg|mp3|css|html|ico|gif|pdf)$/i.test(s)) return false;
  if (/^(rgba?|hsla?|calc|var|url|linear-gradient|cubic-bezier|translate|scale|rotate)\(/.test(s)) return false;
  if (/^M[\d\s.,-]+[a-zA-Z]/.test(s) && !/[g-ln-z]{3}/.test(s)) return false; // svg path data
  if (/^[\d\s.,%pxremvhw+*/()-]+$/.test(s)) return false;
  if (/[{}<>]|=>|&&|\|\||;$/.test(s) && !/[.!?]$/.test(s)) return false;       // code-ish
  if (/^[a-z]+([A-Z][a-z0-9]+)+$/.test(s)) return false;     // camelCase
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(s)) return false;      // snake_case
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(s)) return false;      // kebab-case
  if (/\s/.test(s) && looksLikeClassList(s)) return false;
  if (/^(application|text|image|audio|video|multipart)\/[\w.+-]+/.test(s)) return false;
  if (/^[A-Za-z]+ [\d.]+(px|rem|em|s|ms)/.test(s)) return false;
  if (/^\d+(px|rem|em|%)( |$)/.test(s)) return false;
  if (/^(ease|linear|solid|dashed|none|auto|inherit|center|left|right|top|bottom|smooth|spring|easeInOut|easeOut|easeIn)( |$)/.test(s) && s.split(' ').length <= 3) return false;
  // Sentences/labels in other scripts are content, not English UI.
  if (/[Ā-￿]/.test(s.replace(/[‐-‧‰-⁞←-⇿☀-➿ -ÿ⬀-⯿️]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, ''))) return false;
  return true;
}

const strings = new Map();   // text -> Set(files)
const patterns = new Map();  // pattern -> Set(files)
const add = (map, s, file) => {
  const k = norm(s);
  if (!map.has(k)) map.set(k, new Set());
  map.get(k).add(file);
};

function nearestJsxAttr(p) {
  let cur = p.parentPath;
  while (cur) {
    if (cur.isJSXAttribute()) return cur;
    if (cur.isJSXElement() || cur.isJSXFragment()) return null;  // a child, not an attribute value
    if (cur.isFunction() && !cur.parentPath?.isJSXExpressionContainer()) {
      // keep climbing: handlers/maps inside attributes still belong to that attribute
    }
    cur = cur.parentPath;
  }
  return null;
}

function elementName(attrPath) {
  const open = attrPath.parentPath;
  if (!open || !open.isJSXOpeningElement()) return '';
  const n = open.node.name;
  return n.type === 'JSXIdentifier' ? n.name : (n.property ? n.property.name : '');
}

function insideJsxChild(p) {
  let cur = p.parentPath;
  while (cur) {
    if (cur.isJSXExpressionContainer()) return !cur.parentPath.isJSXAttribute();
    if (cur.isJSXAttribute()) return false;
    cur = cur.parentPath;
  }
  return false;
}

function inSkippedCall(p) {
  let cur = p.parentPath;
  let depth = 0;
  while (cur && depth < 4) {
    if (cur.isCallExpression() || cur.isNewExpression()) {
      const c = cur.node.callee;
      const name = c.type === 'Identifier' ? c.name
        : c.type === 'MemberExpression' && c.property ? (c.property.name || c.property.value) : '';
      const obj = c.type === 'MemberExpression' && c.object.type === 'Identifier' ? c.object.name : '';
      if (obj === 'console' || obj === 'localStorage' || obj === 'sessionStorage' || obj === 'document' || obj === 'window' || obj === 'JSON' || obj === 'Object') return true;
      if (SKIP_CALLEES.has(name)) return true;
      return false;
    }
    cur = cur.parentPath;
    depth += 1;
  }
  return false;
}

function collectLiteral(p, value, file) {
  const parent = p.parentPath;
  if (parent.isImportDeclaration() || parent.isExportNamedDeclaration() || parent.isExportAllDeclaration()) return;
  if (parent.isObjectProperty({ key: p.node }) && !parent.node.computed) return;       // object key
  if (parent.isMemberExpression()) return;                                             // obj['key']
  if (parent.isBinaryExpression() && /^(===?|!==?|in|instanceof)$/.test(parent.node.operator)) return; // comparisons
  if (parent.isSwitchCase()) return;
  if (parent.isTSLiteralType && parent.isTSLiteralType()) return;

  const attr = nearestJsxAttr(p);
  if (attr) {
    const an = attr.node.name.name || (attr.node.name.namespace && `${attr.node.name.namespace.name}:${attr.node.name.name.name}`);
    if (SKIP_COMPONENTS.has(elementName(attr))) return;
    if (TRANSLATABLE_ATTRS.has(an)) {
      if (isUiText(value, { allowSingleWord: true })) add(strings, value, file);
      return;
    }
    // Other props: a direct string value (className="…", variant="x") is never UI
    // text, but literals nested deeper (items={['…']}, steps={[{ title: '…' }]},
    // onClick={() => toast('…')}) follow the plain-JS rules below.
    if (parent.isJSXAttribute() || parent.isJSXExpressionContainer()) return;
    if (NON_TEXT_ATTRS.test(String(an))) return;
  }
  if (inSkippedCall(p)) return;

  if (insideJsxChild(p)) {
    if (isUiText(value, { allowSingleWord: true })) add(strings, value, file);
    return;
  }
  // Plain JS: sentences always; single words only in display positions.
  const multi = /\s/.test(norm(value));
  let allowSingle = false;
  if (parent.isObjectProperty() && parent.node.value === p.node) {
    const k = parent.node.key;
    const kn = k.type === 'Identifier' ? k.name : k.value;
    allowSingle = DISPLAY_KEYS.has(String(kn));
  } else if (parent.isArrayExpression() || parent.isConditionalExpression() || parent.isReturnStatement() || parent.isLogicalExpression()) {
    allowSingle = true;
  } else if (parent.isCallExpression() && parent.node.arguments.includes(p.node)) {
    allowSingle = true;   // toast('Saved'), setMsg('Done'), alert('…')
  } else if (parent.isVariableDeclarator() || parent.isAssignmentExpression()) {
    allowSingle = false;
  }
  if (isUiText(value, { allowSingleWord: allowSingle && !multi ? true : multi })) add(strings, value, file);
}

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f) && !full.includes(`${path.sep}i18n${path.sep}`)) acc.push(full);
  }
  return acc;
}

for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file);
  let ast;
  try {
    ast = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'] });
  } catch (e) {
    console.warn('parse failed:', rel, e.message);
    continue;
  }
  traverse(ast, {
    JSXText(p) {
      if (isUiText(p.node.value, { allowSingleWord: true })) { add(strings, p.node.value, rel); return; }
      // "{count} words", "{n} minutes": React renders the value and the word as two
      // text nodes, so the lone lowercase word next to an expression is UI text too.
      const word = norm(p.node.value);
      if (!/^[a-z]{3,}[.,:!?]?$/.test(word)) return;
      const sib = [p.getSibling(p.key - 1), p.getSibling(p.key + 1)];
      if (sib.some((x) => x.node && x.isJSXExpressionContainer() && !x.get('expression').isJSXEmptyExpression())) add(strings, word, rel);
    },
    // 'A long sentence ' + 'split across lines' reaches the DOM joined.
    BinaryExpression(p) {
      if (p.node.operator !== '+' || p.parentPath.isBinaryExpression({ operator: '+' })) return;
      const parts = [];
      const flat = (n) => {
        if (n.type === 'BinaryExpression' && n.operator === '+') return flat(n.left) && flat(n.right);
        if (n.type === 'StringLiteral') { parts.push(n.value); return true; }
        return false;
      };
      if (flat(p.node) && parts.length > 1) collectLiteral(p, parts.join(''), rel);
    },
    StringLiteral(p) { collectLiteral(p, p.node.value, rel); },
    TemplateLiteral(p) {
      const { quasis, expressions } = p.node;
      if (p.parentPath.isTaggedTemplateExpression()) return;
      if (expressions.length === 0) { collectLiteral(p, quasis[0].value.cooked || '', rel); return; }
      const attr = nearestJsxAttr(p);
      if (attr) {
        const an = attr.node.name.name;
        if (SKIP_COMPONENTS.has(elementName(attr)) || !TRANSLATABLE_ATTRS.has(an)) return;
      } else if (inSkippedCall(p)) return;
      const literal = quasis.map((q) => q.value.cooked || '').join(' ');
      if (!isUiText(literal, { allowSingleWord: true })) return;
      if (/^\s*$/.test(quasis[0].value.cooked) && /^[/?&=:.#-]/.test((quasis[1] && quasis[1].value.cooked) || '')) return; // `${API}/path`
      if (quasis.some((q) => /(^|\s)(https?:\/\/|\/[a-z_-]+\/)/.test(q.value.cooked || ''))) return;
      if (looksLikeClassList(literal)) return;
      let pat = '';
      quasis.forEach((q, i) => { pat += q.value.cooked || ''; if (i < expressions.length) pat += `{${i}}`; });
      // A pattern needs fixed text to anchor on, not just "{0} {1}".
      if (norm(pat.replace(/\{\d+\}/g, '')).replace(/[^A-Za-z]/g, '').length < 3) return;
      if (!/\s/.test(norm(pat)) && /[_]|\.\w{2,4}$/.test(pat)) return;   // keys / file names like part{0}_description
      if (/^[\w.{}-]+\.(docx?|pdf|png|mp3|json)$/i.test(norm(pat))) return;
      if (/correct=|student=|=>|\bhttp/.test(pat)) return;              // debug strings
      add(patterns, pat, rel);
    },
  });
}

// Backend error details (plain strings only).
let backendCount = 0;
if (fs.existsSync(BACKEND)) {
  const pyWalk = (dir) => fs.readdirSync(dir).flatMap((f) => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) return f === '__pycache__' ? [] : pyWalk(full);
    return f.endsWith('.py') ? [full] : [];
  });
  for (const file of pyWalk(path.join(BACKEND, 'routes')).concat(pyWalk(path.join(BACKEND, 'utils')))) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /detail\s*=\s*(?<!f)(["'])((?:\\.|(?!\1).)*)\1/g;
    let m;
    while ((m = re.exec(src))) {
      const before = src.slice(Math.max(0, m.index - 1), m.index + m[0].indexOf(m[1]));
      if (/f$/.test(before.trim())) continue;
      const v = m[2].replace(/\\(["'])/g, '$1');
      if (isUiText(v, { allowSingleWord: false })) { add(strings, v, `backend:${path.relative(BACKEND, file)}`); backendCount += 1; }
    }
  }
}

// Last-pass denylist for technical strings the heuristics above let through.
const JUNK = /^\[|\[#|^&\w+=|\+=\{|#[0-9a-f]{6}\b|\.out\(|^text-\[/i;
const sorted = (m) => [...m.keys()].filter((k) => !JUNK.test(k)).sort((a, b) => a.localeCompare(b));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify({ strings: sorted(strings), patterns: sorted(patterns) }, null, 1)}\n`);
const chars = sorted(strings).concat(sorted(patterns)).reduce((n, s) => n + s.length, 0);
console.log(`strings: ${sorted(strings).length}, patterns: ${sorted(patterns).length}, backend details: ${backendCount}, total chars: ${chars}`);
console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
