import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Gift, Copy, Share2, UserPlus, CreditCard, CheckCircle2, XCircle, Wallet,
  Clock, HelpCircle, ArrowRight, Sparkles, Info,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

// Public guide to the affiliate program (ported from the Vietnam tree). Amounts are
// kept currency-neutral: the exact minimum withdrawal and wallet currency are shown
// in Profile → Affiliate, which reads them from the server.

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function Section({ icon: Icon, title, children }) {
  return (
    <motion.section
      variants={fade}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className="bg-white rounded-3xl border border-gray-100 shadow-[0_16px_50px_-24px_rgba(0,150,177,0.25)] p-6 md:p-8"
    >
      <h2 className="flex items-center gap-3 text-xl md:text-2xl font-bold text-[#2b5356] mb-4">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0096b1]/10 to-[#2b5356]/10 text-[#0096b1]">
          <Icon className="w-6 h-6" />
        </span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

const STEPS = [
  { icon: Copy, t: 'Copy your affiliate link', d: 'Go to Profile → Affiliate and click Copy link.' },
  { icon: Share2, t: 'Share it', d: 'Send it to friends or students by social media, messaging apps, email, your website, blog or video channel.' },
  { icon: UserPlus, t: 'They open your link', d: 'They visit the website through your link and register a new account.' },
  { icon: CreditCard, t: 'They buy VIP', d: 'When their VIP payment succeeds, 10% commission is added to your wallet automatically.' },
];

const TIERS = [
  ['20', '2'],
  ['30', '3'],
  ['50', '5'],
  ['100', '10'],
];

const FAQ = [
  ['Do I need to sign up to join the affiliate program?', 'No. Every customer account automatically has its own affiliate link.'],
  ['How many people can I refer?', 'There is no limit.'],
  ['When do I receive my commission?', 'After the referred account\'s order is paid successfully. It can take a few minutes to appear in your wallet.'],
  ['Can I use my wallet balance to buy VIP?', 'No. The affiliate wallet is only for collecting and withdrawing commission.'],
  ['When can I withdraw?', 'When your wallet balance reaches the minimum shown in Profile → Affiliate.'],
  ['How will I be paid?', 'After you send a request and it is approved, we transfer the money to the payout details you provided (bank account, PayPal or QR code).'],
  ['Where can I see my commission history?', 'In Profile → Affiliate → Wallet history.'],
];

export default function AffiliateGuide() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Seo
        title="Affiliate Program Guide | EnglishOnComputer"
        description="Share your EnglishOnComputer affiliate link and earn 10% commission on every VIP purchase made by the accounts you refer."
        path="/affiliate-guide"
      />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0096b1] via-[#0d8ba3] to-[#2b5356] text-white">
          <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#eb7e37]/20 blur-3xl" />
          <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
              className="inline-grid place-items-center w-16 h-16 rounded-3xl bg-white/15 backdrop-blur ring-1 ring-white/20 mb-4">
              <Gift className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Affiliate Program Guide</h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">Share your link. When the people you refer buy VIP, you earn <b>10% commission</b> on what they pay.</p>
            <Link to="/profile?tab=affiliate" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-white text-[#0096b1] font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              Go to my Affiliate page <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
          <Section icon={Sparkles} title="What is the affiliate program?">
            <p className="text-gray-600 leading-relaxed">It is our referral program. When you share your <b>affiliate link</b> and someone registers and then buys a VIP package through it, you earn <b>10% commission</b> on the amount they actually pay.</p>
            <div className="mt-4 rounded-2xl bg-[#0096b1]/5 border border-[#0096b1]/15 p-4 text-sm text-gray-700">
              <div className="font-semibold text-[#2b5356] mb-1">Example</div>
              A friend registers through your link → buys a VIP package for <b>25</b> → you earn <b>2.5</b> in the same currency.
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-gray-700">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p><b className="text-amber-700">Note:</b> once an account has registered through your link, you earn commission on <b>every successful VIP purchase or renewal</b> that account makes, including future ones.</p>
            </div>
          </Section>

          <Section icon={Copy} title="How to join">
            <p className="text-gray-600 mb-3">Every customer account has <b>one unique affiliate link</b>. In <b>Profile → Affiliate</b> you will find:</p>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
              {['Your affiliate link and a Copy button', 'How many accounts registered through your link', 'Your total commission', 'Your wallet balance', 'Your wallet history'].map(x => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {x}</li>
              ))}
            </ul>
          </Section>

          <Section icon={Share2} title="How it works">
            <div className="grid sm:grid-cols-2 gap-3">
              {STEPS.map((s, i) => (
                <div key={i} className="relative rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="grid place-items-center w-7 h-7 rounded-full bg-[#0096b1] text-white text-sm font-bold">{i + 1}</span>
                    <s.icon className="w-5 h-5 text-[#0096b1]" />
                    <span className="font-semibold text-gray-800">{s.t}</span>
                  </div>
                  <p className="text-sm text-gray-500">{s.d}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={CheckCircle2} title="When commission is earned">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="font-semibold text-emerald-700 mb-2">Counts when</div>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {['The buyer registered a new account through your affiliate link', 'Their VIP payment is completed successfully', 'The order is not cancelled', 'The order is not refunded'].map(x => (
                    <li key={x} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {x}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
                <div className="font-semibold text-red-600 mb-2">Does not count when</div>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {['The payment fails', 'The order is cancelled', 'The order is refunded', 'The buyer already had an account before using your link', 'You use your own link'].map(x => (
                    <li key={x} className="flex items-start gap-2"><XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> {x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section icon={Wallet} title="Commission and wallet">
            <p className="text-gray-600 mb-3">Commission = <b>10%</b> of the amount the customer actually pays, added to your <b>affiliate wallet</b> (for collecting and withdrawing only — it <b>cannot</b> be used to buy VIP).</p>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr><th className="text-left px-4 py-2.5">VIP package price</th><th className="text-right px-4 py-2.5">Your commission</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {TIERS.map(([a, b]) => (
                    <tr key={a}><td className="px-4 py-2.5 text-gray-700">{a}</td><td className="px-4 py-2.5 text-right font-semibold text-[#0096b1]">{b}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Amounts are in the currency the package is sold in. Every change to your wallet is recorded in Wallet history.</p>
          </Section>

          <Section icon={Clock} title="Withdrawals and processing time">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 text-[#0096b1] shrink-0 mt-0.5" /> <span>Request a withdrawal once your balance reaches the <b>minimum shown in Profile → Affiliate</b>, after adding your payout details (QR code, bank account or PayPal).</span></li>
              <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 text-[#0096b1] shrink-0 mt-0.5" /> <span>When you send the request, the amount is deducted from your wallet and the request becomes <b>Pending</b>.</span></li>
              <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 text-[#0096b1] shrink-0 mt-0.5" /> <span>We review it and transfer the money within <b>30 days</b>. The request then shows as Paid.</span></li>
              <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 text-[#0096b1] shrink-0 mt-0.5" /> <span>If a request is rejected, the amount is <b>returned</b> to your wallet and the reason is shown.</span></li>
            </ul>
          </Section>

          <Section icon={Info} title="Good to know">
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
              {[
                'Each account has exactly one affiliate link.',
                'The link is created automatically; there is nothing to sign up for.',
                'Only successfully paid orders are counted.',
                'Commission is calculated automatically.',
                'There is no limit on how many people you can refer.',
                'A referral is recorded when a new account is created through your link.',
              ].map(x => (
                <li key={x} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#0096b1] shrink-0 mt-0.5" /> {x}</li>
              ))}
            </ul>
          </Section>

          <Section icon={HelpCircle} title="Frequently asked questions">
            <div className="space-y-3">
              {FAQ.map(([q, a]) => (
                <div key={q} className="rounded-2xl border border-gray-100 p-4">
                  <div className="font-semibold text-gray-800">{q}</div>
                  <div className="text-sm text-gray-500 mt-1">{a}</div>
                </div>
              ))}
            </div>
          </Section>

          <div className="text-center pt-2">
            <Link to="/profile?tab=affiliate" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0096b1] to-[#2b5356] text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              Start earning commission <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
