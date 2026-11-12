import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Send, Clock, XCircle, CheckCircle2, AlertTriangle, Plus, ExternalLink, Video, Eye, DollarSign,
  ChevronDown, ChevronUp, Star, Wallet, Gift, Paperclip, X, Image as ImageIcon, Film, Trophy, ArrowUpDown,
  Globe, RotateCcw, Trash2,
} from 'lucide-react';
import API_BASE from '../config/api';
import AffiliatePanel from './AffiliatePanel';

// Profile → Creator Hub (2026-11). Hidden content until an admin approves the
// Creator Application (or grants access directly); then Creator Program + Affiliate
// Program + one shared wallet. Backend: app/routes/customer/creator_hub.py.

const token = () => localStorage.getItem('token');
async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
  });
  const t = await res.text();
  const data = t ? JSON.parse(t) : null;
  if (!res.ok) throw new Error((data && data.detail) || 'Something went wrong');
  return data;
}

async function uploadProof(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/creator-hub/proofs`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd });
  const t = await res.text();
  let data = null;
  try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
  if (!res.ok) throw new Error((data && data.detail) || (res.status === 413 ? 'This file is too large.' : 'Upload failed. Please try again.'));
  return data;
}
const isVideo = (u) => /\.(mp4|mov|webm)$/i.test(u || '');

const LOGOS = {
  youtube: '/img/platforms/youtube.webp', tiktok: '/img/platforms/tiktok.webp',
  instagram: '/img/platforms/instagram.webp', facebook: '/img/platforms/facebook.webp',
  x: '/img/platforms/x.svg', threads: '/img/platforms/threads.svg',
};
// 'other' (creator-typed platform) has no logo → generic globe.
const PlatformIcon = ({ p, className = 'w-5 h-5' }) => (LOGOS[p]
  ? <img src={LOGOS[p]} alt="" className={`${className} rounded shrink-0`} />
  : <Globe className={`${className} text-gray-400 shrink-0`} />);
const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '');
const today = () => new Date().toISOString().slice(0, 10);

const CH_STATUS = {
  pending: { label: 'Pending approval', cls: 'text-amber-700 bg-amber-50' },
  approved: { label: 'Approved', cls: 'text-emerald-700 bg-emerald-50' },
  rejected: { label: 'Rejected', cls: 'text-red-600 bg-red-50' },
  suspended: { label: 'Suspended', cls: 'text-gray-700 bg-gray-100' },
};
const REC_STATUS = {
  submitted: { label: 'Submitted', cls: 'text-sky-700 bg-sky-50' },
  under_review: { label: 'Under review', cls: 'text-amber-700 bg-amber-50' },
  approved: { label: 'Approved', cls: 'text-emerald-700 bg-emerald-50' },
  rejected: { label: 'Rejected', cls: 'text-red-600 bg-red-50' },
};
const Badge = ({ map, value }) => {
  const m = map[value] || { label: value, cls: 'text-gray-600 bg-gray-100' };
  return <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
};
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>{children}</div>
);
const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0096b1]/30';
const btn = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50';

// ── Not enabled yet: application form / status ──────────────────────────────
function ApplyView({ status, onDone }) {
  const app = status.application;
  const [f, setF] = useState({
    full_name: app?.full_name || '', email: app?.email || status.defaults?.email || '', phone: app?.phone || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try { await api('/creator-hub/apply', { method: 'POST', body: JSON.stringify(f) }); onDone(); }
    catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-[#2b5356] flex items-center gap-2"><Sparkles className="w-6 h-6 text-[#eb7e37]" /> Creator Hub</h2>
        <p className="text-sm text-gray-500 mt-1">
          Creator Hub brings together the <b>Creator Program</b> (get paid for views) and the <b>Affiliate Program</b> (earn commission on purchases through your link).
          It opens once your creator application is approved.
        </p>
        <Link to="/work-with-us" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-[#0096b1] hover:underline">
          How the program works <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {app?.status === 'pending' && (
        <Card className="border-amber-200 bg-amber-50/40">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="text-sm text-gray-700">
              <div className="font-bold text-gray-800">Your application is pending approval</div>
              <p className="mt-1">Sent on {fmtDate(app.submitted_at)}. We'll review it and contact you on WhatsApp or email. Creator Hub opens here as soon as it's approved.</p>
              <p className="mt-2 text-xs text-gray-500" data-no-translate>{app.full_name} · {app.email} · {app.phone}</p>
            </div>
          </div>
        </Card>
      )}

      {app?.status === 'rejected' && (
        <Card className="border-red-200 bg-red-50/40">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div className="text-sm text-gray-700">
              <div className="font-bold text-gray-800">Your application was not approved</div>
              {app.reject_reason && <p className="mt-1">Reason: <span data-no-translate>{app.reject_reason}</span></p>}
              <p className="mt-1">You can update your details below and apply again.</p>
            </div>
          </div>
        </Card>
      )}

      {status.can_apply && (
        <Card>
          <h3 className="font-bold text-gray-800 mb-3">Apply for the Creator Program</h3>
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm"><span className="text-gray-600">Full name</span>
              <input className={input} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} maxLength={120} required />
            </label>
            <label className="block text-sm"><span className="text-gray-600">Email</span>
              <input type="email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={255} required />
            </label>
            <label className="block text-sm"><span className="text-gray-600">WhatsApp number</span>
              <input type="tel" className={input} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[-\u2010-\u2015]/g, '') })} placeholder="+1 555 123 4567" maxLength={40} required />
            </label>
            {err && <p className="text-sm text-red-500">⚠️ {err}</p>}
            <button disabled={busy} className={`${btn} bg-[#eb7e37] text-white hover:bg-[#d96e28]`}>
              <Send className="w-4 h-4" /> {busy ? 'Sending…' : 'Submit application'}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}

// ── Enabled: profile completion ─────────────────────────────────────────────
function ProfileCompletion({ profile, onDone }) {
  const [f, setF] = useState({ full_name: profile?.full_name || '', email: profile?.email || '', phone: profile?.phone || '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/creator-hub/profile', { method: 'PUT', body: JSON.stringify(f) }); onDone(); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <div className="font-bold text-gray-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Complete your creator profile</div>
      <form onSubmit={save} className="mt-3 grid sm:grid-cols-3 gap-3">
        <input className={input} placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required />
        <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <input className={input} type="tel" placeholder="WhatsApp number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[-\u2010-\u2015]/g, '') })} required />
        {err && <p className="sm:col-span-3 text-sm text-red-500">⚠️ {err}</p>}
        <div className="sm:col-span-3"><button disabled={busy} className={`${btn} bg-[#0096b1] text-white hover:bg-[#007d93]`}>Save</button></div>
      </form>
    </Card>
  );
}

// ── Enabled: Creator Program ────────────────────────────────────────────────
const emptyChannel = { platform: '', platform_name: '', channel_name: '', channel_url: '', initial_views: '0' };

// Register a channel, or correct and resubmit a rejected one (`channel` given).
function ChannelForm({ platforms, channel, onDone, onCancel }) {
  const [f, setF] = useState(() => (channel ? {
    platform: channel.platform, platform_name: channel.platform_name || '', channel_name: channel.channel_name,
    channel_url: channel.channel_url, initial_views: String(channel.initial_views ?? 0),
  } : emptyChannel));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const body = {
      ...f,
      platform_name: f.platform === 'other' ? f.platform_name.trim() : null,
      initial_views: f.initial_views === '' ? 0 : Number(f.initial_views),
    };
    try {
      if (channel) await api(`/creator-hub/channels/${channel.id}/resubmit`, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/creator-hub/channels', { method: 'POST', body: JSON.stringify(body) });
      setF(emptyChannel); onDone();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="rounded-xl border border-[#0096b1]/30 bg-[#0096b1]/5 p-4 space-y-3">
      <div className="font-semibold text-gray-800 text-sm">{channel ? 'Correct and resubmit this channel' : 'Register a social media channel'}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-xs text-gray-600">Platform
          <select className={`${input} mt-1`} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })} required>
            <option value="">Platform…</option>
            {platforms.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        {f.platform === 'other' ? (
          <label className="block text-xs text-gray-600">Platform name
            <input className={`${input} mt-1`} placeholder="e.g. Snapchat" value={f.platform_name} onChange={(e) => setF({ ...f, platform_name: e.target.value })} maxLength={100} required />
          </label>
        ) : <div className="hidden sm:block" />}
        <label className="block text-xs text-gray-600">Channel name
          <input className={`${input} mt-1`} placeholder="Channel name" value={f.channel_name} onChange={(e) => setF({ ...f, channel_name: e.target.value })} maxLength={255} required />
        </label>
        <label className="block text-xs text-gray-600">Channel URL
          <input className={`${input} mt-1`} placeholder="https://…" value={f.channel_url} onChange={(e) => setF({ ...f, channel_url: e.target.value })} maxLength={500} required />
        </label>
        <label className="block text-xs text-gray-600">Initial views
          <input inputMode="numeric" className={`${input} mt-1 tabular-nums`} placeholder="0" value={f.initial_views}
            onChange={(e) => setF({ ...f, initial_views: e.target.value.replace(/[^\d]/g, '') })} />
          <span className="mt-1 block text-[11px] text-gray-400">The channel's total views today (leave 0 if unsure). Your first views submission counts the views above this number.</span>
        </label>
      </div>
      <p className="text-xs text-gray-500">Each channel is reviewed separately. Only approved channels can submit views and earn rewards.</p>
      {err && <p className="text-sm text-red-500">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className={`${btn} bg-[#0096b1] text-white hover:bg-[#007d93]`}>{busy ? 'Sending…' : channel ? 'Resubmit for approval' : 'Submit for approval'}</button>
        <button type="button" onClick={onCancel} className={`${btn} text-gray-600 hover:bg-gray-100`}>Cancel</button>
      </div>
    </form>
  );
}

function RegisterChannel({ platforms, onDone }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${btn} bg-[#0096b1] text-white hover:bg-[#007d93]`}>
        <Plus className="w-4 h-4" /> Register a channel
      </button>
    );
  }
  return <ChannelForm platforms={platforms} onDone={() => { setOpen(false); onDone(); }} onCancel={() => setOpen(false)} />;
}

// Proof of views for one channel: screenshots or a short screen recording of the total views.
function ProofPicker({ urls, onChange, max = 5 }) {
  const ref = React.useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, Math.max(0, max - urls.length));
    e.target.value = '';
    if (!files.length) return;
    setErr(''); setBusy(true);
    const added = [];
    try {
      for (const f of files) { const r = await uploadProof(f); added.push(r.url); }
    } catch (e2) { setErr(e2.message); }
    finally { setBusy(false); if (added.length) onChange([...urls, ...added]); }
  };
  return (
    <div className="text-right">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {urls.map((u, i) => (
          <span key={u} className="inline-flex items-center gap-1 rounded-md bg-gray-100 pl-1.5 pr-1 py-0.5 text-[11px] text-gray-600">
            <a href={u} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
              {isVideo(u) ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}{i + 1}
            </a>
            <button type="button" onClick={() => onChange(urls.filter((x) => x !== u))} aria-label="Remove proof" className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {urls.length < max && (
          <button type="button" disabled={busy} onClick={() => ref.current && ref.current.click()}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#0096b1]/50 px-2 py-1 text-[11px] font-semibold text-[#0096b1] hover:bg-[#0096b1]/5 disabled:opacity-50 whitespace-nowrap">
            <Paperclip className="w-3 h-3" /> {busy ? 'Uploading…' : urls.length ? 'Add more' : 'Send proof (image / video)'}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple className="hidden" onChange={pick} />
      {err && <p className="mt-1 text-[11px] text-red-500">⚠️ {err}</p>}
    </div>
  );
}

// Warning shown before submitting when another channel as primary would pay more.
function PrimaryWarning({ info, onSwitch, onSubmitAnyway, onCancel }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />
          <div>
            <h4 className="text-lg font-bold text-gray-800">Your primary channel isn't the best choice</h4>
            <p className="mt-2 text-sm text-gray-600">
              You haven't chosen the primary channel that maximizes your reward. With <b data-no-translate>{info.best.channel_name}</b> as your primary channel,
              this period would pay <b className="text-emerald-600">{usd(info.bestTotal)}</b> instead of <b>{usd(info.currentTotal)}</b>.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col sm:flex-row-reverse gap-2">
          <button type="button" onClick={onSwitch} className={`${btn} bg-[#eb7e37] text-white hover:bg-[#d96e28]`}>Switch and submit</button>
          <button type="button" onClick={onSubmitAnyway} className={`${btn} border border-gray-200 text-gray-700 hover:bg-gray-50`}>Submit anyway</button>
          <button type="button" onClick={onCancel} className={`${btn} text-gray-500 hover:bg-gray-100 sm:mr-auto`}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function SubmitViews({ channels, rates, openRecon, nextSubmitAt, minDays, onDone }) {
  const approved = channels.filter((c) => c.status === 'approved');
  const [primary, setPrimary] = useState(() => (approved.find((c) => c.is_primary) || approved[0] || {}).id);
  const [vals, setVals] = useState({});
  const [dates, setDates] = useState({});
  const [proofs, setProofs] = useState({});
  const [warn, setWarn] = useState(null);
  const [locked, setLocked] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!approved.some((c) => c.id === primary)) setPrimary((approved.find((c) => c.is_primary) || approved[0] || {}).id);
  }, [approved, primary]);

  const lines = approved.map((c) => {
    const raw = vals[c.id];
    const total = raw === undefined || raw === '' ? null : Math.floor(Number(String(raw).replace(/[^\d]/g, '')));
    const type = approved.length === 1 || c.id === primary ? 'primary' : 'secondary';
    const rate = type === 'primary' ? rates.primary_per_k : rates.secondary_per_k;
    const period = total == null ? null : total - c.approved_total_views;
    return { c, total, type, rate, period, reward: period > 0 ? (period * rate) / 1000 : 0 };
  });
  const filled = lines.filter((l) => l.total != null);
  const bad = filled.find((l) => l.period < 0);
  const totalReward = filled.reduce((s, l) => s + (l.period > 0 ? l.reward : 0), 0);

  // Reward of this period if `pid` were the primary channel (primary rate > secondary rate,
  // so the best primary is the channel with the most new views).
  const totalWith = (pid) => filled.reduce((s, l) => {
    if (!(l.period > 0)) return s;
    const rate = approved.length === 1 || l.c.id === pid ? rates.primary_per_k : rates.secondary_per_k;
    return s + (l.period * rate) / 1000;
  }, 0);

  const send = async (pid) => {
    setWarn(null); setBusy(true);
    try {
      await api('/creator-hub/reconciliations', {
        method: 'POST',
        body: JSON.stringify({
          primary_channel_id: approved.length > 1 ? pid : undefined,
          items: filled.map((l) => ({ channel_id: l.c.id, total_views: l.total, views_date: dates[l.c.id] || today(), proof_urls: proofs[l.c.id] || [] })),
        }),
      });
      setVals({}); setDates({}); setProofs({}); onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const submit = () => {
    setErr('');
    if (nextSubmitAt) { setLocked(true); return; }
    if (!filled.length) { setErr('Enter the current total views of at least one channel.'); return; }
    if (bad) { setErr(`Total views for “${bad.c.channel_name}” can't be lower than the last approved total (${num(bad.c.approved_total_views)}).`); return; }
    if (approved.length > 1) {
      const best = filled.filter((l) => l.period > 0).sort((a, b) => b.period - a.period)[0];
      const currentTotal = totalWith(primary);
      if (best && best.c.id !== primary) {
        const bestTotal = totalWith(best.c.id);
        if (bestTotal - currentTotal >= 0.005) { setWarn({ best: best.c, bestTotal, currentTotal }); return; }
      }
    }
    send(primary);
  };

  if (!approved.length) {
    return <p className="text-sm text-gray-500">Once a channel is approved, you can submit its views here.</p>;
  }
  if (openRecon) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-100 p-4 text-sm text-gray-700">
        <Clock className="w-5 h-5 text-sky-500 shrink-0" />
        <div>
          Your views submission of {fmtDate(openRecon.submitted_at)} is <b>{REC_STATUS[openRecon.status]?.label.toLowerCase()}</b> (estimated reward {usd(openRecon.estimated_usd)}).
          It's added to your wallet once approved. You can submit the next period after that.
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-xs text-gray-400 border-b border-gray-100">
            <tr>
              {approved.length > 1 && <th className="text-left py-2 pr-2">Primary</th>}
              <th className="text-left">Channel</th>
              <th className="text-right">Last approved total</th>
              <th className="text-right">Current total views</th>
              <th className="text-left pl-3">As of</th>
              <th className="text-right">This period</th>
              <th className="text-right">Est. reward</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map((l) => (
              <tr key={l.c.id}>
                {approved.length > 1 && (
                  <td className="py-2 pr-2 align-top pt-4"><input type="radio" name="primary" checked={primary === l.c.id} onChange={() => setPrimary(l.c.id)} aria-label={`Make ${l.c.channel_name} primary`} /></td>
                )}
                <td className="py-2 align-top pt-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlatformIcon p={l.c.platform} />
                    <span className="font-medium text-gray-800 whitespace-nowrap" data-no-translate>{l.c.channel_name}</span>
                    <span className={`whitespace-nowrap text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${l.type === 'primary' ? 'bg-[#eb7e37]/10 text-[#eb7e37]' : 'bg-gray-100 text-gray-500'}`}>
                      {l.type === 'primary' ? `Primary · ${usd(rates.primary_per_k)}/1K` : `Secondary · ${usd(rates.secondary_per_k)}/1K`}
                    </span>
                  </div>
                </td>
                <td className="text-right tabular-nums text-gray-500 align-top pt-4">{num(l.c.approved_total_views)}</td>
                <td className="text-right py-1.5 align-top">
                  <input inputMode="numeric" className={`${input} w-32 text-right tabular-nums`} placeholder={num(l.c.approved_total_views)}
                    value={vals[l.c.id] ?? ''} onChange={(e) => setVals({ ...vals, [l.c.id]: e.target.value.replace(/[^\d]/g, '') })} />
                  <div className="mt-1 flex justify-end"><ProofPicker urls={proofs[l.c.id] || []} onChange={(u) => setProofs({ ...proofs, [l.c.id]: u })} /></div>
                </td>
                <td className="pl-3 py-1.5 align-top"><input type="date" max={today()} className={`${input} w-36`} value={dates[l.c.id] || today()} onChange={(e) => setDates({ ...dates, [l.c.id]: e.target.value })} /></td>
                <td className={`text-right tabular-nums align-top pt-4 ${l.period < 0 ? 'text-red-500' : 'text-gray-700'}`}>{l.period == null ? '—' : num(l.period)}</td>
                <td className="text-right tabular-nums font-medium text-emerald-600 align-top pt-4">{l.period > 0 ? usd(l.reward) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-600">Estimated reward: <b className="text-emerald-600">{usd(totalReward)}</b> <span className="text-xs text-gray-400">· added to your wallet after review</span></div>
        <button onClick={submit} disabled={busy} className={`${btn} bg-[#eb7e37] text-white hover:bg-[#d96e28]`}><Send className="w-4 h-4" /> {busy ? 'Sending…' : 'Submit views for review'}</button>
      </div>
      {err && <p className="text-sm text-red-500">⚠️ {err}</p>}
      {locked && nextSubmitAt && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-gray-700" role="alert">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            Views can be submitted once every <b>{minDays} days</b>. Your next submission opens on <b>{fmtDate(nextSubmitAt)}</b>.
          </div>
          <button type="button" onClick={() => setLocked(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      {approved.length > 1 && <p className="text-xs text-gray-500">Pick one primary channel per period ({usd(rates.primary_per_k)}/1,000 views); the others count as secondary ({usd(rates.secondary_per_k)}/1,000 views). You can switch each period.</p>}
      <p className="text-xs text-gray-500">Proof: attach a screenshot or a short screen recording showing each channel's total views — it speeds up the review. Submissions must be at least {minDays} days apart.</p>
      {warn && (
        <PrimaryWarning info={warn} onCancel={() => setWarn(null)}
          onSubmitAnyway={() => send(primary)}
          onSwitch={() => { setPrimary(warn.best.id); send(warn.best.id); }} />
      )}
    </div>
  );
}

const PREVIEW = 3;
const ShowMore = ({ total, open, onToggle }) => (total > PREVIEW ? (
  <button type="button" onClick={onToggle} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#0096b1] hover:underline">
    {open ? <>Show less <ChevronUp className="w-4 h-4" /></> : <>Show all ({total}) <ChevronDown className="w-4 h-4" /></>}
  </button>
) : null);

function History({ items }) {
  const [openId, setOpenId] = useState(null);
  const [all, setAll] = useState(false);
  if (!items.length) return <p className="text-sm text-gray-400">No submissions yet.</p>;
  return (
    <div>
    <div className="divide-y divide-gray-50">
      {(all ? items : items.slice(0, PREVIEW)).map((r) => (
        <div key={r.id} className="py-2">
          <button className="w-full flex items-center justify-between gap-2 text-sm text-left" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
            <span className="text-gray-600">#{r.id} · {fmtDate(r.submitted_at)} · est. {usd(r.estimated_usd)}</span>
            <span className="flex items-center gap-2"><Badge map={REC_STATUS} value={r.status} />{openId === r.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</span>
          </button>
          {r.status === 'rejected' && r.reject_reason && <p className="mt-1 text-xs text-red-500">⚠️ Reason: <span data-no-translate>{r.reject_reason}</span> — please correct and submit again.</p>}
          {openId === r.id && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead className="text-gray-400"><tr><th className="text-left py-1">Channel</th><th className="text-left">Type</th><th className="text-right">Previous</th><th className="text-right">Submitted</th><th className="text-right">Period views</th><th className="text-right">Reward</th><th className="text-left pl-3">Proof</th></tr></thead>
                <tbody>
                  {r.items.map((it) => (
                    <tr key={it.channel_id} className="text-gray-600">
                      <td className="py-1" data-no-translate>{it.channel_name}</td>
                      <td className="capitalize">{it.channel_type}</td>
                      <td className="text-right tabular-nums">{num(it.previous_total)}</td>
                      <td className="text-right tabular-nums">{num(it.submitted_total)}</td>
                      <td className="text-right tabular-nums">{num(it.period_views)}</td>
                      <td className="text-right tabular-nums">{usd(it.estimated_usd)}</td>
                      <td className="pl-3">{(it.proof_urls || []).length ? it.proof_urls.map((u, i) => (
                        <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="mr-1.5 inline-flex items-center gap-0.5 text-[#0096b1] hover:underline">{isVideo(u) ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}{i + 1}</a>
                      )) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
    <ShowMore total={items.length} open={all} onToggle={() => setAll(!all)} />
    </div>
  );
}

// One registered channel: compact row, details on click (feedback 2026-11-10).
function ChannelRow({ c, platforms, onChanged }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const remove = async () => {
    setErr(''); setBusy(true);
    try { await api(`/creator-hub/channels/${c.id}`, { method: 'DELETE' }); onChanged(); }
    catch (e) { setErr(e.message); setBusy(false); setConfirmDel(false); }
  };
  const flagged = (c.status === 'rejected' || c.status === 'suspended') && c.status_reason;
  return (
    <div className="rounded-lg border border-gray-100">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-gray-50/70 rounded-lg">
        <span className="flex items-center gap-2 min-w-0">
          <PlatformIcon p={c.platform} className="w-6 h-6" />
          <span className="font-semibold text-gray-800 truncate" data-no-translate>{c.channel_name}</span>
          <span className="text-xs text-gray-400 shrink-0">{c.platform_label}</span>
          {flagged && !open && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {c.status === 'approved' && c.is_primary && <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#eb7e37]"><Star className="w-3.5 h-3.5" /> Primary</span>}
          <Badge map={CH_STATUS} value={c.status} />
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-gray-500">
            <div>Registered<br /><b className="text-gray-700">{fmtDate(c.registered_at)}</b></div>
            <div>Initial views<br /><b className="text-gray-700 tabular-nums">{num(c.initial_views)}</b></div>
            <div>Last approved total<br /><b className="text-gray-700 tabular-nums">{num(c.approved_total_views)}</b></div>
            <div>Last declared total<br /><b className="text-gray-700 tabular-nums">{c.last_submitted_total == null ? '—' : num(c.last_submitted_total)}</b>{c.last_submitted_at && <span> · {fmtDate(c.last_submitted_at)}</span>}</div>
            <div>This period<br /><b className="text-gray-700 tabular-nums">{c.open_item ? `${num(c.open_item.period_views)} (in review)` : '—'}</b></div>
          </div>
          {flagged && <p className="mt-2 text-xs text-red-500">⚠️ Reason: <span data-no-translate>{c.status_reason}</span></p>}
          <a href={c.channel_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0096b1] hover:underline">
            Open channel <ExternalLink className="w-3 h-3" />
          </a>
          {c.status === 'rejected' && !editing && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setEditing(true)} className={`${btn} py-1.5 bg-[#0096b1] text-white hover:bg-[#007d93]`}>
                <RotateCcw className="w-4 h-4" /> Resubmit
              </button>
              {confirmDel ? (
                <span className="inline-flex items-center gap-2 text-xs text-gray-600">
                  Delete this channel?
                  <button type="button" disabled={busy} onClick={remove} className={`${btn} py-1.5 bg-red-500 text-white hover:bg-red-600`}>{busy ? 'Deleting…' : 'Yes, delete'}</button>
                  <button type="button" onClick={() => setConfirmDel(false)} className={`${btn} py-1.5 text-gray-600 hover:bg-gray-100`}>Cancel</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDel(true)} className={`${btn} py-1.5 border border-red-200 text-red-600 hover:bg-red-50`}>
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
          )}
          {err && <p className="mt-2 text-xs text-red-500">⚠️ {err}</p>}
          {editing && (
            <div className="mt-3">
              <ChannelForm platforms={platforms} channel={c} onDone={() => { setEditing(false); onChanged(); }} onCancel={() => setEditing(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChannelList({ channels, platforms, onChanged }) {
  const [all, setAll] = useState(false);
  return (
    <div className="mb-4">
      <div className="space-y-2">
        {(all ? channels : channels.slice(0, PREVIEW)).map((c) => <ChannelRow key={c.id} c={c} platforms={platforms} onChanged={onChanged} />)}
      </div>
      <ShowMore total={channels.length} open={all} onToggle={() => setAll(!all)} />
    </div>
  );
}

function CreatorProgram() {
  const [data, setData] = useState(null);
  const [recs, setRecs] = useState([]);
  const [earn, setEarn] = useState(null);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, r, e] = await Promise.all([api('/creator-hub/channels'), api('/creator-hub/reconciliations'), api('/creator-hub/earnings')]);
      setData(c); setRecs(r || []); setEarn(e); setErr(false);
    } catch (e) { setErr(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const money = useMemo(() => (units) => {
    if (!earn) return '';
    const v = Number(units || 0) / (earn.unit_divisor || 1);
    const s = v.toLocaleString('en-US', earn.unit_divisor === 1 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return earn.currency === 'USD' ? `$${s}` : `${s} ${earn.currency}`;
  }, [earn]);

  if (err && !data) return <Card><p className="text-sm text-gray-500">Could not load the Creator Program. <button onClick={load} className="text-[#0096b1] font-semibold hover:underline">Try again</button></p></Card>;
  if (!data) return <Card><p className="text-sm text-gray-400">Loading…</p></Card>;

  const { channels, rates, platforms, open_reconciliation: openRecon, next_submit_at: nextSubmitAt, min_days_between: minDays = 20 } = data;
  const stats = [
    { icon: DollarSign, label: 'Approved creator rewards', value: money(earn?.approved_rewards), tone: 'text-emerald-600' },
    { icon: Clock, label: 'Pending rewards (estimated)', value: usd(earn?.pending_rewards_usd), tone: 'text-amber-500' },
    { icon: Eye, label: 'Approved views', value: num(earn?.approved_views), tone: 'text-sky-500' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500">
          Earn <b>{usd(rates.primary_per_k)}</b> per 1,000 views on your primary channel and <b>{usd(rates.secondary_per_k)}</b> per 1,000 views on cross-platform reposts (secondary channels).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 shrink-0 ${s.tone}`} />
            <div className="min-w-0"><div className="text-lg font-bold text-gray-800">{s.value}</div><div className="text-xs text-gray-500 leading-tight">{s.label}</div></div>
          </div>
        ))}
      </div>

      <Card>
        <h4 className="font-bold text-gray-800 mb-3">My channels</h4>
        {channels.length === 0 ? (
          <p className="text-sm text-gray-500 mb-3">You haven't registered any channel yet.</p>
        ) : (
          <ChannelList channels={channels} platforms={platforms} onChanged={load} />
        )}
        <RegisterChannel platforms={platforms} onDone={load} />
      </Card>

      <Card>
        <h4 className="font-bold text-gray-800 mb-3">Submit views</h4>
        <SubmitViews channels={channels} rates={rates} openRecon={openRecon} nextSubmitAt={nextSubmitAt} minDays={minDays} onDone={load} />
      </Card>

      <Card>
        <h4 className="font-bold text-gray-800 mb-2">Views submissions</h4>
        <History items={recs} />
      </Card>
    </div>
  );
}

// ── Creator Leaderboard (feedback 2026-11-10) ──────────────────────────────
// Default order = official rank (VIP/views → sign-ups/views → total views). Clicking a column:
// 1st descending (name A→Z), 2nd ascending (name Z→A), 3rd back to the official order.
// Sorting only changes the display order; # is renumbered, the official rank never changes.
const LB_COLS = [
  { key: 'name', label: 'Creator', align: 'left' },
  { key: 'channel_count', label: 'Channels' },
  { key: 'total_views', label: 'Total views' },
  { key: 'views_reward', label: 'Views reward' },
  { key: 'affiliate_commission', label: 'Affiliate commission' },
  { key: 'total_reward', label: 'Total reward' },
  { key: 'signup_rate', label: 'Sign-ups / views' },
  { key: 'vip_rate', label: 'VIP / views' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthLabel = (m) => { const [y, mo] = (m || '').split('-'); return y ? `${MONTHS[Number(mo) - 1]} ${y}` : ''; };
const pct = (v) => `${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}%`;

// Channels of one creator, opened from the leaderboard's "Channels" column.
function CreatorChannelsModal({ row, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h4 className="font-bold text-gray-800">Channels of <span data-no-translate>{row.name}</span></h4>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="max-h-[60vh] overflow-auto p-5">
          {row.channels.length ? (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400"><tr>
                <th className="text-left pb-2">Channel name</th><th className="text-left pb-2">Platform</th>
                <th className="text-right pb-2">Total views</th><th className="text-right pb-2">Channel link</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {row.channels.map((c) => (
                  <tr key={c.channel_url}>
                    <td className="py-2 pr-2 font-medium text-gray-800" data-no-translate>{c.channel_name}</td>
                    <td className="py-2 pr-2 whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><PlatformIcon p={c.platform} className="w-4 h-4" /><span data-no-translate>{c.platform_label}</span></span></td>
                    <td className="py-2 text-right tabular-nums">{num(c.total_views)}</td>
                    <td className="py-2 pl-2 text-right">
                      <a href={c.channel_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0096b1] font-medium hover:underline whitespace-nowrap">Open <ExternalLink className="w-3.5 h-3.5" /></a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-gray-400">No approved channels yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const [period, setPeriod] = useState('lifetime');
  const [month, setMonth] = useState('');
  const [sorts, setSorts] = useState({ lifetime: null, monthly: null });   // independent per tab
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [chRow, setChRow] = useState(null);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams({ period });
      if (period === 'monthly' && month) p.set('month', month);
      const d = await api(`/creator-hub/leaderboard?${p}`);
      setData(d); setErr(false);
      if (period === 'monthly' && !month && d.month) setMonth(d.month);
    } catch (e) { setErr(true); }
  }, [period, month]);
  useEffect(() => { load(); }, [load]);

  const sort = sorts[period];
  const clickHead = (key) => setSorts((s) => {
    const cur = s[period];
    const next = !cur || cur.key !== key ? { key, dir: 1 } : cur.dir === 1 ? { key, dir: 2 } : null;
    return { ...s, [period]: next };
  });
  const rows = [...(data?.items || [])];
  if (sort) {
    rows.sort((a, b) => {
      if (sort.key === 'name') { const c = a.name.localeCompare(b.name); return sort.dir === 1 ? c : -c; }
      const c = (b[sort.key] || 0) - (a[sort.key] || 0);
      return (sort.dir === 1 ? c : -c) || a.rank - b.rank;
    });
  }
  const money = (units) => {
    const div = data?.unit_divisor || 1;
    const v = Number(units || 0) / div;
    const s = v.toLocaleString('en-US', div === 1 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return data?.currency === 'USD' ? `$${s}` : `${s} ${data?.currency || ''}`;
  };
  const arrow = (key) => {
    if (sort?.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    if (key === 'name') return <span className="text-[10px]">{sort.dir === 1 ? 'A→Z' : 'Z→A'}</span>;
    return sort.dir === 1 ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />;
  };
  const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {[['lifetime', 'Lifetime'], ['monthly', 'Monthly']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setPeriod(k)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold ${period === k ? 'bg-white text-[#2b5356] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
          ))}
        </div>
        {period === 'monthly' && (
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={`${input} w-auto`} aria-label="Month">
            {(data?.months || []).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        )}
      </div>
      {err && !data ? (
        <p className="text-sm text-gray-500">Could not load the leaderboard. <button onClick={load} className="text-[#0096b1] font-semibold hover:underline">Try again</button></p>
      ) : !data ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm min-w-[780px]">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left py-2.5 px-2">#</th>
                {LB_COLS.map((c) => (
                  <th key={c.key} className={`py-2.5 px-2 ${c.align === 'left' ? 'text-left' : 'text-right'}`}>
                    <button type="button" onClick={() => clickHead(c.key)}
                      className={`inline-flex items-center gap-1 font-semibold leading-tight hover:text-[#0096b1] ${c.align === 'left' ? '' : 'text-right'} ${sort?.key === c.key ? 'text-[#0096b1]' : ''}`}>
                      {c.label} {arrow(c.key)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, i) => (
                <tr key={`${r.rank}-${r.name}`} className={r.is_me ? 'bg-[#0096b1]/5' : ''}>
                  <td className="py-2.5 px-2 tabular-nums text-gray-500">{i + 1}</td>
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <span className="font-semibold text-gray-800" data-no-translate>{r.name}</span>
                    {r.is_me && <span className="ml-1.5 text-[10px] font-bold uppercase text-[#0096b1]">You</span>}
                    <span className="ml-1.5 text-xs text-gray-400">{medal(r.rank) || `Rank ${r.rank}`}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <button type="button" onClick={() => setChRow(r)} disabled={!r.channel_count}
                      className="tabular-nums font-semibold text-[#0096b1] hover:underline disabled:text-gray-400 disabled:no-underline">{num(r.channel_count)}</button>
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">{num(r.total_views)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">{money(r.views_reward)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">{money(r.affiliate_commission)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap font-bold text-emerald-600">{money(r.total_reward)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">{pct(r.signup_rate)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">{pct(r.vip_rate)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={9} className="py-6 text-center text-gray-400">{period === 'monthly' ? 'No creator activity in this month yet.' : 'No creators yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500">
        Total reward = views reward + affiliate commission. Official rank: VIP sign-ups / views, then account sign-ups / views, then total views.
        Click a column title to sort; click a third time to go back to the official rank. Click a channel count to see that creator's channels.
      </p>
      {chRow && <CreatorChannelsModal row={chRow} onClose={() => setChRow(null)} />}
    </div>
  );
}

// One of the main Creator Hub sections, clearly set apart (feedback 2026-11-10).
function HubSection({ n, icon: Icon, title, subtitle, tone, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <header className={`flex items-center gap-3 px-5 py-4 border-b border-gray-100 ${tone}`}>
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/80 shadow-sm shrink-0"><Icon className="w-5 h-5" /></span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">Part {n}</div>
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
          {subtitle && <p className="text-xs opacity-80 mt-0.5">{subtitle}</p>}
        </div>
      </header>
      <div className="p-4 sm:p-6 bg-gray-50/40">{children}</div>
    </section>
  );
}

export default function CreatorHub({ onGoPayment, onStatus }) {
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    try { const s = await api('/creator-hub/status'); setStatus(s); setErr(false); if (onStatus) onStatus(s); }
    catch (e) { setErr(true); }
  }, [onStatus]);
  useEffect(() => { load(); }, [load]);

  if (err && !status) return <div className="p-6 text-gray-500">Could not load Creator Hub. <button onClick={load} className="text-[#0096b1] font-semibold hover:underline">Try again</button></div>;
  if (!status) return <div className="p-6 text-gray-400">Loading…</div>;
  if (!status.hub_access) return <ApplyView status={status} onDone={load} />;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#2b5356] flex items-center gap-2"><Sparkles className="w-6 h-6 text-[#eb7e37]" /> Creator &amp; Affiliate Program</h2>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Your Creator Hub is active. Both programs pay into one wallet.</p>
      </div>
      {status.profile && !status.profile.complete && <ProfileCompletion profile={status.profile} onDone={load} />}

      <HubSection n={1} icon={Video} title="Creator Program" subtitle="Get paid for the views of your videos." tone="bg-[#eb7e37]/10 text-[#b45a1c]">
        <CreatorProgram />
      </HubSection>

      <HubSection n={2} icon={Gift} title="Affiliate Program" subtitle="Earn commission on purchases through your link." tone="bg-[#0096b1]/10 text-[#00687b]">
        <AffiliatePanel part="affiliate" onGoPayment={onGoPayment} />
      </HubSection>

      <HubSection n={3} icon={Wallet} title="Wallet" subtitle="Creator rewards and affiliate commission are added to the same wallet." tone="bg-emerald-50 text-emerald-800">
        <AffiliatePanel part="wallet" onGoPayment={onGoPayment} />
      </HubSection>

      <HubSection n={4} icon={Trophy} title="Creator Leaderboard" subtitle="See how you rank among all creators in the program." tone="bg-violet-50 text-violet-800">
        <Leaderboard />
      </HubSection>
    </div>
  );
}
