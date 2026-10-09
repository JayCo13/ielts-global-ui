import React, { useEffect, useState, useRef } from 'react';
import { QrCode, Building2, Upload, Trash2, Check, CreditCard } from 'lucide-react';
import API_BASE from '../config/api';

// Payout details tab of the Profile page (ported from the Vietnam tree): where
// affiliate commission is sent when the user requests a withdrawal.

const token = () => localStorage.getItem('token');

// The QR image is stored in R2 (absolute URL); older/fallback values may be relative.
const resolveUrl = (url) => (/^https?:\/\//.test(url || '') ? url : `${API_BASE}${url}`);

export default function PaymentPanel() {
  const [data, setData] = useState(null);
  const [bank, setBank] = useState('');
  const [accNo, setAccNo] = useState('');
  const [accHolder, setAccHolder] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer/affiliate/payment`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setData(d);
      setBank(d.bank || ''); setAccNo(d.account_number || ''); setAccHolder(d.account_holder || '');
    } catch (e) { setMsg({ type: 'err', text: 'Could not load your payout details. Please refresh the page.' }); }
  };
  useEffect(() => { load(); }, []);

  const saveBank = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/customer/affiliate/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ bank, account_number: accNo, account_holder: accHolder }),
      });
      if (!res.ok) throw new Error();
      setMsg({ type: 'ok', text: 'Payout account saved' });
      load();
    } catch (e) { setMsg({ type: 'err', text: 'Could not save. Please try again.' }); }
    finally { setSaving(false); }
  };

  const uploadQr = async (file) => {
    if (!file) return;
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/customer/affiliate/payment/qr`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Could not upload the image');
      }
      setMsg({ type: 'ok', text: 'QR image uploaded' });
      load();
    } catch (e) { setMsg({ type: 'err', text: e.message || 'Could not upload the image' }); }
  };

  const deleteQr = async () => {
    try {
      await fetch(`${API_BASE}/customer/affiliate/payment/qr`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      load();
    } catch (e) { /* ignore */ }
  };

  if (!data) {
    return <div className="p-6 text-gray-400">{msg ? <span className="text-red-500">{msg.text}</span> : 'Loading…'}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#2b5356] flex items-center gap-2"><CreditCard className="w-6 h-6 text-[#0096b1]" /> Payout details</h2>
        <p className="text-sm text-gray-500 mt-1">Add a <b>payment QR code</b> or a <b>bank / PayPal account</b> to receive your affiliate commission. When you request a withdrawal, we pay to these details.</p>
        {data.is_set
          ? <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1"><Check className="w-3.5 h-3.5" /> Payout method saved</span>
          : <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">Not set up yet — add a QR code or an account</span>}
      </div>

      {/* QR */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><QrCode className="w-5 h-5 text-[#0096b1]" /> Payment QR code</h3>
        {data.qr_url ? (
          <div className="flex items-start gap-4">
            <img src={resolveUrl(data.qr_url)} alt="Payment QR code" className="w-40 h-40 object-contain rounded-lg border border-gray-200 bg-white" />
            <div className="space-y-2">
              <button onClick={() => fileRef.current && fileRef.current.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"><Upload className="w-4 h-4" /> Replace</button>
              <button onClick={deleteQr} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-500 text-sm hover:bg-red-50"><Trash2 className="w-4 h-4" /> Remove</button>
            </div>
          </div>
        ) : (
          <button onClick={() => fileRef.current && fileRef.current.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#0096b1] hover:text-[#0096b1]">
            <Upload className="w-5 h-5" /> Upload a QR image
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { uploadQr(e.target.files && e.target.files[0]); e.target.value = ''; }} />
      </div>

      {/* Bank / PayPal */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Building2 className="w-5 h-5 text-[#0096b1]" /> Bank or PayPal account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input placeholder="Bank name or PayPal" value={bank} onChange={e => setBank(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          <input placeholder="Account number / PayPal email" value={accNo} onChange={e => setAccNo(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          <input placeholder="Account holder name" value={accHolder} onChange={e => setAccHolder(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <button onClick={saveBank} disabled={saving} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0096b1] text-white text-sm font-medium hover:bg-[#007d93] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save account'}
        </button>
      </div>

      {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</p>}
    </div>
  );
}
