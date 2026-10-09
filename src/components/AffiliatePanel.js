import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Gift, Copy, Check, Wallet, Send, Clock, BookOpen, MousePointerClick, UserPlus, Crown } from 'lucide-react';
import API_BASE from '../config/api';

// Affiliate tab of the Profile page (ported from the Vietnam tree).
// Wallet amounts come from the API as integers in the currency's minor unit;
// `unit_divisor` (1 for VND, 100 for USD) turns them into display amounts.

const count = (n) => (n == null ? '0' : Number(n).toLocaleString('en-US'));
const token = () => localStorage.getItem('token');

async function authed(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
  });
  const t = await res.text();
  const data = t ? JSON.parse(t) : null;
  if (!res.ok) throw new Error((data && data.detail) || 'Something went wrong');
  return data;
}

function TxType({ t }) {
  const map = {
    commission: { label: 'Commission', cls: 'text-emerald-600' },
    withdraw: { label: 'Withdrawal', cls: 'text-red-500' },
    withdraw_refund: { label: 'Refund', cls: 'text-amber-600' },
  };
  const m = map[t] || { label: t, cls: 'text-gray-500' };
  return <span className={`text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

export default function AffiliatePanel({ onGoPayment }) {
  const [info, setInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [payment, setPayment] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [i, h, w, p] = await Promise.all([
        authed('/customer/affiliate'),
        authed('/customer/affiliate/history'),
        authed('/customer/affiliate/withdrawals'),
        authed('/customer/affiliate/payment'),
      ]);
      setInfo(i); setHistory(h || []); setWithdrawals(w || []); setPayment(p); setLoadError(false);
    } catch (e) { setLoadError(true); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyLink = () => {
    if (!info) return;
    navigator.clipboard.writeText(info.referral_link).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const submitWithdraw = async () => {
    setMsg(null);
    // Warn + require payout details before withdrawing.
    if (payment && !payment.is_set) {
      setMsg({ type: 'warn', text: 'You have not added your payout details yet. Please add a QR code or bank / PayPal account before withdrawing.', action: true });
      return;
    }
    setSubmitting(true);
    try {
      await authed('/customer/affiliate/withdraw', { method: 'POST', body: JSON.stringify({}) });
      setMsg({ type: 'ok', text: 'Withdrawal request sent. We will process it within 30 days.' });
      load();
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    finally { setSubmitting(false); }
  };

  if (loadError && !info) {
    return (
      <div className="p-6 text-gray-500">
        Could not load your affiliate details.{' '}
        <button onClick={load} className="text-[#0096b1] font-semibold hover:underline">Try again</button>
      </div>
    );
  }
  if (!info) return <div className="p-6 text-gray-400">Loading…</div>;

  const divisor = info.unit_divisor || 1;
  const currency = info.currency || '';
  const money = (units) => {
    const v = Number(units || 0) / divisor;
    const s = v.toLocaleString('en-US', divisor === 1
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${s} ${currency}`;
  };
  const ratePct = Math.round((info.commission_rate || 0.1) * 100);

  const stat = [
    { icon: MousePointerClick, label: 'Link clicks', value: count(info.click_count), tone: 'text-sky-500' },
    { icon: UserPlus, label: 'Accounts registered via your link', value: count(info.signup_count), tone: 'text-[#0096b1]' },
    { icon: Crown, label: 'Referrals who bought VIP', value: count(info.vip_signup_count), tone: 'text-amber-500' },
    { icon: Gift, label: 'Total commission', value: money(info.total_commission), tone: 'text-emerald-600' },
    { icon: Coins, label: 'Wallet balance', value: money(info.balance), tone: 'text-[#eb7e37]' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#2b5356] flex items-center gap-2"><Gift className="w-6 h-6 text-[#0096b1]" /> Affiliate — refer friends, earn commission</h2>
        <p className="text-sm text-gray-500 mt-1">Share your affiliate link. When someone registers a new account through your link and buys a VIP package, you earn <b>{ratePct}% commission</b> on the amount they actually pay.</p>
        <Link to="/affiliate-guide" className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-[#0096b1] hover:underline">
          <BookOpen className="w-4 h-4" /> Read the full guide
        </Link>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-gray-700">
          <span className="shrink-0">💡</span>
          <p><b className="text-amber-700">Note:</b> once an account has registered through your link, you earn commission on <b>every successful VIP purchase or renewal</b> that account makes, including future ones. Commission can take a few minutes to appear after a purchase.</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-gradient-to-r from-[#0096b1]/10 to-[#2b5356]/5 rounded-xl p-4 border border-[#0096b1]/20">
        <div className="text-sm font-semibold text-[#2b5356] mb-2">Your affiliate link</div>
        <div className="flex gap-2">
          <input readOnly value={info.referral_link} className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600" />
          <button onClick={copyLink} className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-medium hover:bg-[#007d93]">
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy link</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stat.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 shrink-0 ${s.tone}`} />
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-800 break-words">{s.value}</div>
              <div className="text-xs text-gray-500 leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Withdraw */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-[#0096b1]" /><h3 className="font-bold text-gray-800">Withdraw commission</h3></div>
        {!info.can_withdraw ? (
          <p className="text-sm text-gray-500">You need at least <b>{money(info.withdraw_min)}</b> to withdraw. Current balance: <b>{money(info.balance)}</b>.</p>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-gray-500">
              Withdraw your full balance: <b className="text-gray-800">{money(info.balance)}</b>
              {payment && payment.is_set && <span className="block text-xs text-gray-400 mt-0.5">Paid to: {payment.qr_url ? 'saved QR code' : ''}{payment.qr_url && payment.bank ? ' · ' : ''}{payment.bank ? `${payment.bank} ${payment.account_number || ''}` : ''}</span>}
            </div>
            <button onClick={submitWithdraw} disabled={submitting} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#eb7e37] text-white text-sm font-semibold hover:bg-[#d96e28] disabled:opacity-50">
              <Send className="w-4 h-4" /> Request withdrawal
            </button>
          </div>
        )}
        {msg && (
          <p className={`mt-2 text-sm ${msg.type === 'ok' ? 'text-emerald-600' : msg.type === 'warn' ? 'text-amber-600' : 'text-red-500'}`}>
            {msg.type !== 'ok' && '⚠️ '}{msg.text}
            {msg.action && onGoPayment && <button onClick={onGoPayment} className="ml-2 text-[#0096b1] font-semibold hover:underline">Set it up now →</button>}
          </p>
        )}
      </div>

      {/* Withdrawal requests */}
      {withdrawals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Withdrawal requests</h3>
          <div className="space-y-2">
            {withdrawals.map(w => (
              <div key={w.withdrawal_id} className="border-b border-gray-50 pb-2">
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-600 min-w-0 break-words">{money(w.amount)} · {w.bank || 'QR'}{w.account_number ? ` · ${w.account_number}` : ''}</span>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${w.status === 'paid' ? 'text-emerald-700 bg-emerald-50' : w.status === 'rejected' ? 'text-red-600 bg-red-50' : 'text-amber-700 bg-amber-50'}`}>
                    {w.status === 'paid' ? 'Paid' : w.status === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
                {w.status === 'rejected' && w.reject_reason && (
                  <p className="mt-1 text-xs text-red-500">
                    ⚠️ Reason: {w.reject_reason}. Please update your payout details and send a new request.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet history */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3">Wallet history</h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 border-b border-gray-100">
                <tr><th className="text-left py-2">Date</th><th className="text-left">Details</th><th className="text-right">Amount</th><th className="text-right">Balance</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="py-2 text-gray-500 whitespace-nowrap">{h.created_at ? new Date(h.created_at).toLocaleDateString('en-GB') : ''}</td>
                    <td className="text-gray-700"><TxType t={h.type} /> {h.description}{h.source && <span className="text-gray-400"> · account {h.source}</span>}</td>
                    <td className={`text-right tabular-nums font-medium whitespace-nowrap ${h.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{h.amount >= 0 ? '+' : '−'}{money(Math.abs(h.amount))}</td>
                    <td className="text-right tabular-nums text-gray-600 whitespace-nowrap">{money(h.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
