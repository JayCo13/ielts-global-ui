import React, { useEffect, useState } from 'react';
import { Mail, Check, CreditCard } from 'lucide-react';
import API_BASE from '../config/api';

// Payout details tab of the Profile page: the PayPal account affiliate commission
// is sent to when the user requests a withdrawal. Payouts are PayPal-only; the API
// keeps the VN field names (bank / account_number / account_holder).

const token = () => localStorage.getItem('token');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());

export default function PaymentPanel() {
  const [data, setData] = useState(null);
  const [accNo, setAccNo] = useState('');
  const [accHolder, setAccHolder] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer/affiliate/payment`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setData(d);
      // Details saved before payouts became PayPal-only (a bank account) are not reused.
      const paypal = (d.bank || '').trim().toLowerCase() === 'paypal';
      setAccNo(paypal ? d.account_number || '' : ''); setAccHolder(d.account_holder || '');
    } catch (e) { setMsg({ type: 'err', text: 'Could not load your payout details. Please refresh the page.' }); }
  };
  useEffect(() => { load(); }, []);

  const saveBank = async () => {
    if (!isEmail(accNo)) { setMsg({ type: 'err', text: 'Please enter the email address of your PayPal account.' }); return; }
    if (!accHolder.trim()) { setMsg({ type: 'err', text: 'Please enter the name on your PayPal account.' }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/customer/affiliate/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ bank: 'PayPal', account_number: accNo.trim(), account_holder: accHolder.trim() }),
      });
      if (!res.ok) throw new Error();
      setMsg({ type: 'ok', text: 'PayPal account saved' });
      load();
    } catch (e) { setMsg({ type: 'err', text: 'Could not save. Please try again.' }); }
    finally { setSaving(false); }
  };

  if (!data) {
    return <div className="p-6 text-gray-400">{msg ? <span className="text-red-500">{msg.text}</span> : 'Loading…'}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#2b5356] flex items-center gap-2"><CreditCard className="w-6 h-6 text-[#0096b1]" /> Payout details</h2>
        <p className="text-sm text-gray-500 mt-1">Affiliate commission is paid in US dollars through PayPal. Add your PayPal account here; when you request a withdrawal, we send the money to it.</p>
        {data.is_set
          ? <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1"><Check className="w-3.5 h-3.5" /> PayPal account saved</span>
          : <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">Not set up yet — add your PayPal account</span>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Mail className="w-5 h-5 text-[#0096b1]" /> PayPal account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="email" placeholder="PayPal email address" value={accNo} onChange={e => setAccNo(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          <input placeholder="Name on the PayPal account" value={accHolder} onChange={e => setAccHolder(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <button onClick={saveBank} disabled={saving} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-medium hover:bg-[#007d93] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save account'}
        </button>
        <p className="text-xs text-gray-400 mt-3">Use the email of a PayPal account that can receive payments.</p>
      </div>

      {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</p>}
    </div>
  );
}
