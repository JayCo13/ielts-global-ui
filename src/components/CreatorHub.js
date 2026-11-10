import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Send, Clock, XCircle, CheckCircle2, AlertTriangle, Plus, ExternalLink, Video, Eye, DollarSign,
  ChevronDown, ChevronUp, Star, Wallet, Gift,
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

const LOGOS = {
  youtube: '/img/platforms/youtube.webp', tiktok: '/img/platforms/tiktok.webp',
  instagram: '/img/platforms/instagram.webp', facebook: '/img/platforms/facebook.webp',
  x: '/img/platforms/x.svg', threads: '/img/platforms/threads.svg',
};
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
function RegisterChannel({ platforms, onDone }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ platform: '', channel_name: '', channel_url: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/creator-hub/channels', { method: 'POST', body: JSON.stringify(f) });
      setF({ platform: '', channel_name: '', channel_url: '' }); setOpen(false); onDone();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${btn} bg-[#0096b1] text-white hover:bg-[#007d93]`}>
        <Plus className="w-4 h-4" /> Register a channel
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-xl border border-[#0096b1]/30 bg-[#0096b1]/5 p-4 space-y-3">
      <div className="font-semibold text-gray-800 text-sm">Register a social media channel</div>
      <div className="grid sm:grid-cols-3 gap-3">
        <select className={input} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })} required>
          <option value="">Platform…</option>
          {platforms.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <input className={input} placeholder="Channel name" value={f.channel_name} onChange={(e) => setF({ ...f, channel_name: e.target.value })} maxLength={255} required />
        <input className={input} placeholder="Channel URL" value={f.channel_url} onChange={(e) => setF({ ...f, channel_url: e.target.value })} maxLength={500} required />
      </div>
      <p className="text-xs text-gray-500">Each channel is reviewed separately. Only approved channels can submit views and earn rewards.</p>
      {err && <p className="text-sm text-red-500">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className={`${btn} bg-[#0096b1] text-white hover:bg-[#007d93]`}>{busy ? 'Sending…' : 'Submit for approval'}</button>
        <button type="button" onClick={() => setOpen(false)} className={`${btn} text-gray-600 hover:bg-gray-100`}>Cancel</button>
      </div>
    </form>
  );
}

function SubmitViews({ channels, rates, openRecon, onDone }) {
  const approved = channels.filter((c) => c.status === 'approved');
  const [primary, setPrimary] = useState(() => (approved.find((c) => c.is_primary) || approved[0] || {}).id);
  const [vals, setVals] = useState({});
  const [dates, setDates] = useState({});
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

  const submit = async () => {
    setErr('');
    if (!filled.length) { setErr('Enter the current total views of at least one channel.'); return; }
    if (bad) { setErr(`Total views for “${bad.c.channel_name}” can't be lower than the last approved total (${num(bad.c.approved_total_views)}).`); return; }
    setBusy(true);
    try {
      await api('/creator-hub/reconciliations', {
        method: 'POST',
        body: JSON.stringify({
          primary_channel_id: approved.length > 1 ? primary : undefined,
          items: filled.map((l) => ({ channel_id: l.c.id, total_views: l.total, views_date: dates[l.c.id] || today() })),
        }),
      });
      setVals({}); setDates({}); onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
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
                  <td className="py-2 pr-2"><input type="radio" name="primary" checked={primary === l.c.id} onChange={() => setPrimary(l.c.id)} aria-label={`Make ${l.c.channel_name} primary`} /></td>
                )}
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <img src={LOGOS[l.c.platform]} alt="" className="w-5 h-5 rounded" />
                    <span className="font-medium text-gray-800" data-no-translate>{l.c.channel_name}</span>
                    <span className={`whitespace-nowrap text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${l.type === 'primary' ? 'bg-[#eb7e37]/10 text-[#eb7e37]' : 'bg-gray-100 text-gray-500'}`}>
                      {l.type === 'primary' ? `Primary · ${usd(rates.primary_per_k)}/1K` : `Secondary · ${usd(rates.secondary_per_k)}/1K`}
                    </span>
                  </div>
                </td>
                <td className="text-right tabular-nums text-gray-500">{num(l.c.approved_total_views)}</td>
                <td className="text-right py-1">
                  <input inputMode="numeric" className={`${input} w-32 text-right tabular-nums`} placeholder={num(l.c.approved_total_views)}
                    value={vals[l.c.id] ?? ''} onChange={(e) => setVals({ ...vals, [l.c.id]: e.target.value.replace(/[^\d]/g, '') })} />
                </td>
                <td className="pl-3"><input type="date" max={today()} className={`${input} w-36`} value={dates[l.c.id] || today()} onChange={(e) => setDates({ ...dates, [l.c.id]: e.target.value })} /></td>
                <td className={`text-right tabular-nums ${l.period < 0 ? 'text-red-500' : 'text-gray-700'}`}>{l.period == null ? '—' : num(l.period)}</td>
                <td className="text-right tabular-nums font-medium text-emerald-600">{l.period > 0 ? usd(l.reward) : '—'}</td>
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
      {approved.length > 1 && <p className="text-xs text-gray-500">Pick one primary channel per period ({usd(rates.primary_per_k)}/1,000 views); the others count as secondary ({usd(rates.secondary_per_k)}/1,000 views). You can switch each period.</p>}
    </div>
  );
}

function History({ items }) {
  const [openId, setOpenId] = useState(null);
  if (!items.length) return <p className="text-sm text-gray-400">No submissions yet.</p>;
  return (
    <div className="divide-y divide-gray-50">
      {items.map((r) => (
        <div key={r.id} className="py-2">
          <button className="w-full flex items-center justify-between gap-2 text-sm text-left" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
            <span className="text-gray-600">#{r.id} · {fmtDate(r.submitted_at)} · est. {usd(r.estimated_usd)}</span>
            <span className="flex items-center gap-2"><Badge map={REC_STATUS} value={r.status} />{openId === r.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</span>
          </button>
          {r.status === 'rejected' && r.reject_reason && <p className="mt-1 text-xs text-red-500">⚠️ Reason: <span data-no-translate>{r.reject_reason}</span> — please correct and submit again.</p>}
          {openId === r.id && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead className="text-gray-400"><tr><th className="text-left py-1">Channel</th><th className="text-left">Type</th><th className="text-right">Previous</th><th className="text-right">Submitted</th><th className="text-right">Period views</th><th className="text-right">Reward</th></tr></thead>
                <tbody>
                  {r.items.map((it) => (
                    <tr key={it.channel_id} className="text-gray-600">
                      <td className="py-1" data-no-translate>{it.channel_name}</td>
                      <td className="capitalize">{it.channel_type}</td>
                      <td className="text-right tabular-nums">{num(it.previous_total)}</td>
                      <td className="text-right tabular-nums">{num(it.submitted_total)}</td>
                      <td className="text-right tabular-nums">{num(it.period_views)}</td>
                      <td className="text-right tabular-nums">{usd(it.estimated_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
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

  const { channels, rates, platforms, open_reconciliation: openRecon } = data;
  const stats = [
    { icon: DollarSign, label: 'Approved creator rewards', value: money(earn?.approved_rewards), tone: 'text-emerald-600' },
    { icon: Clock, label: 'Pending rewards (estimated)', value: usd(earn?.pending_rewards_usd), tone: 'text-amber-500' },
    { icon: Eye, label: 'Approved views', value: num(earn?.approved_views), tone: 'text-sky-500' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-[#2b5356] flex items-center gap-2"><Video className="w-5 h-5 text-[#eb7e37]" /> Creator Program</h3>
        <p className="text-sm text-gray-500 mt-1">
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
          <div className="space-y-2 mb-4">
            {channels.map((c) => (
              <div key={c.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <a href={c.channel_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 hover:underline">
                    <img src={LOGOS[c.platform]} alt="" className="w-6 h-6 rounded" />
                    <span className="font-semibold text-gray-800 truncate" data-no-translate>{c.channel_name}</span>
                    <span className="text-xs text-gray-400">{c.platform_label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                  <div className="flex items-center gap-2">
                    {c.status === 'approved' && c.is_primary && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#eb7e37]"><Star className="w-3.5 h-3.5" /> Primary</span>}
                    <Badge map={CH_STATUS} value={c.status} />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                  <div>Registered<br /><b className="text-gray-700">{fmtDate(c.registered_at)}</b></div>
                  <div>Last approved total<br /><b className="text-gray-700 tabular-nums">{num(c.approved_total_views)}</b></div>
                  <div>Last declared total<br /><b className="text-gray-700 tabular-nums">{c.last_submitted_total == null ? '—' : num(c.last_submitted_total)}</b>{c.last_submitted_at && <span> · {fmtDate(c.last_submitted_at)}</span>}</div>
                  <div>This period<br /><b className="text-gray-700 tabular-nums">{c.open_item ? `${num(c.open_item.period_views)} (in review)` : '—'}</b></div>
                </div>
                {(c.status === 'rejected' || c.status === 'suspended') && c.status_reason && (
                  <p className="mt-2 text-xs text-red-500">⚠️ Reason: <span data-no-translate>{c.status_reason}</span></p>
                )}
              </div>
            ))}
          </div>
        )}
        <RegisterChannel platforms={platforms} onDone={load} />
      </Card>

      <Card>
        <h4 className="font-bold text-gray-800 mb-3">Submit views</h4>
        <SubmitViews channels={channels} rates={rates} openRecon={openRecon} onDone={load} />
      </Card>

      <Card>
        <h4 className="font-bold text-gray-800 mb-2">Views submissions</h4>
        <History items={recs} />
      </Card>
    </div>
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

      <CreatorProgram />

      <section className="pt-2 border-t border-gray-100">
        <AffiliatePanel part="affiliate" onGoPayment={onGoPayment} />
      </section>

      <section className="pt-2 border-t border-gray-100 space-y-3">
        <h3 className="text-lg font-bold text-[#2b5356] flex items-center gap-2"><Wallet className="w-5 h-5 text-[#0096b1]" /> Wallet</h3>
        <p className="text-sm text-gray-500 -mt-1 flex items-center gap-1"><Gift className="w-4 h-4 text-gray-400" /> Creator rewards and affiliate commission are added to the same wallet.</p>
        <AffiliatePanel part="wallet" onGoPayment={onGoPayment} />
      </section>
    </div>
  );
}
