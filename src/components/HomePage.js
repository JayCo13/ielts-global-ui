import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Navbar from './Navbar';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import {
  Headphones, BookOpenText, PenLine, Mic, ArrowRight, ArrowUpRight, Sparkles,
  GraduationCap, Presentation, PiggyBank, DoorOpen, Clock, Check, Play,
} from 'lucide-react';
import '../App.css';

import 'swiper/css';
import 'swiper/css/pagination';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import Seo from './Seo';
import AnnouncementsSection from './AnnouncementsSection';

// ─────────────────────────────────────────────────────────────────────────────
// EnglishOnComputer homepage (v2 layout).
// Palette follows the logo: deep navy, bright blue and orange.
// Copy for "What We Offer" / "Who Is It For?" is the brief's wording, verbatim.
// ─────────────────────────────────────────────────────────────────────────────

const NAVY = '#0b2447';
const BLUE = '#2f7fd1';
const ORANGE = '#f28c28';

const SKILLS = [
  { key: 'listening', label: 'Listening', icon: Headphones, to: '/listening_list', blurb: 'Train your ear with full tests and focused parts.' },
  { key: 'reading', label: 'Reading', icon: BookOpenText, to: '/reading_list', blurb: 'Read, highlight, take notes and review every answer.' },
  { key: 'writing', label: 'Writing', icon: PenLine, to: '/writing_list', blurb: 'Write on screen and get AI feedback on your essay.' },
  { key: 'speaking', label: 'Speaking', icon: Mic, to: '/speaking_list', blurb: 'Speak, record and practice with AI-powered tools.' },
];

const OFFERS = [
  {
    title: 'Learn English Anywhere',
    text: (<>We make English learning available to people around the world at a <strong>low and affordable cost</strong>. Learners can study anytime and anywhere.</>),
  },
  {
    title: 'AI-Powered Learning Tools',
    text: (<>Our AI tools help learners <strong>practice, get feedback, and learn at their own pace</strong>.</>),
  },
  {
    title: 'Improve All Four English Skills',
    text: (<>Our platform helps learners improve their <strong>listening, speaking, reading, and writing skills</strong> through practical lessons and AI-powered exercises.</>),
  },
];

const AUDIENCES = [
  { icon: GraduationCap, title: 'Students of All Levels', text: (<>Suitable for learners at <strong>all English levels</strong>, from beginners to advanced students.</>) },
  { icon: Presentation, title: 'English Teachers', text: (<>Provides useful tools and resources for <strong>teachers who teach English online</strong>.</>) },
  { icon: PiggyBank, title: 'Affordable English Learning', text: (<>A good option for people who want to <strong>learn English at a low cost</strong>.</>) },
  { icon: DoorOpen, title: 'Learners Without Access to Traditional Classes', text: (<>Helps people who <strong>cannot afford or do not have access to conventional English classes</strong>.</>) },
  { icon: Clock, title: 'Busy Learners', text: (<>Designed for people with busy schedules who want to <strong>learn English anytime and anywhere</strong>.</>) },
];

// ── Hero "practice room" preview: a small, purely decorative mock of each skill ──
const Bar = ({ w, className = '' }) => (
  <div className={`h-2 rounded-full bg-white/15 ${className}`} style={{ width: w }} />
);

function SkillPreview({ skill }) {
  if (skill === 'listening') {
    const bars = [30, 55, 80, 45, 95, 60, 35, 75, 50, 90, 40, 65, 85, 55, 30, 70, 45, 88, 52, 36];
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="grid place-items-center w-11 h-11 rounded-full" style={{ background: ORANGE }}>
            <Play className="w-5 h-5 text-white fill-white" />
          </span>
          <div className="flex-1 flex items-end gap-[3px] h-12">
            {bars.map((h, i) => (
              <motion.span
                key={i}
                className="flex-1 rounded-full"
                style={{ background: i < 9 ? ORANGE : 'rgba(255,255,255,0.25)' }}
                animate={{ height: [`${h * 0.5}%`, `${h}%`, `${h * 0.6}%`] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.05, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-md bg-white/10 text-[11px] font-bold text-white/80 grid place-items-center">{n}</span>
              <Bar w={`${40 + n * 9}%`} />
              <span className="ml-auto w-24 h-7 rounded-md border border-dashed border-white/30" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (skill === 'reading') {
    return (
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-2.5">
          <Bar w="70%" className="!h-2.5 !bg-white/30" />
          <Bar w="100%" /><Bar w="94%" />
          <div className="flex gap-1.5 items-center"><Bar w="30%" /><span className="h-3.5 rounded px-6" style={{ background: '#76323F' }} /><Bar w="24%" /></div>
          <Bar w="98%" /><Bar w="88%" />
          <div className="flex gap-1.5 items-center"><span className="h-3.5 rounded px-8" style={{ background: '#EC4899' }} /><Bar w="50%" /></div>
          <Bar w="76%" />
        </div>
        <div className="col-span-2 space-y-3">
          {['A', 'B', 'C'].map((o, i) => (
            <div key={o} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${i === 1 ? 'bg-white/15 ring-1 ring-white/30' : 'bg-white/5'}`}>
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold grid place-items-center ${i === 1 ? 'text-white' : 'text-white/70 bg-white/10'}`} style={i === 1 ? { background: BLUE } : undefined}>{o}</span>
              <Bar w="70%" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (skill === 'writing') {
    return (
      <div>
        <div className="rounded-xl bg-white/5 p-4 space-y-2.5 mb-4">
          <Bar w="96%" /><Bar w="90%" /><Bar w="99%" /><Bar w="62%" />
          <motion.span className="inline-block w-0.5 h-4 align-middle" style={{ background: ORANGE }} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-full px-3 py-1.5" style={{ background: BLUE }}>
            <Sparkles className="w-3.5 h-3.5" /> AI feedback
          </span>
          {['Task', 'Coherence', 'Vocabulary', 'Grammar'].map((c) => (
            <span key={c} className="text-[11px] font-medium text-white/80 bg-white/10 rounded-full px-2.5 py-1">{c}</span>
          ))}
        </div>
      </div>
    );
  }
  // speaking
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <motion.span className="absolute inset-0 rounded-full" style={{ background: ORANGE }} animate={{ scale: [1, 1.5], opacity: [0.45, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
        <span className="relative grid place-items-center w-16 h-16 rounded-full" style={{ background: ORANGE }}>
          <Mic className="w-7 h-7 text-white" />
        </span>
      </div>
      <div className="flex-1 space-y-3">
        {[['Fluency', '78%'], ['Vocabulary', '64%'], ['Grammar', '70%'], ['Pronunciation', '82%']].map(([label, w], i) => (
          <div key={label}>
            <div className="text-[11px] font-medium text-white/70 mb-1">{label}</div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: i % 2 ? BLUE : ORANGE }} initial={{ width: 0 }} animate={{ width: w }} transition={{ duration: 0.8, delay: i * 0.1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticeRoomPreview() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setActive((a) => (a + 1) % SKILLS.length), 3800);
    return () => clearInterval(t);
  }, [paused]);

  const skill = SKILLS[active];

  return (
    <div
      className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-white/30 via-white/10 to-transparent shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="rounded-[27px] bg-[#0e2d59]/90 backdrop-blur p-4 sm:p-5">
        {/* window chrome */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="ml-3 text-[11px] font-medium tracking-wide text-white/50">englishoncomputer.com</span>
        </div>

        {/* skill tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-black/20 mb-5" role="tablist" aria-label="Skill preview">
          {SKILLS.map((s, i) => {
            const Icon = s.icon;
            const on = i === active;
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(i)}
                className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs sm:text-sm font-semibold transition-colors ${on ? 'text-white' : 'text-white/55 hover:text-white/80'}`}
              >
                {on && <motion.span layoutId="hero-tab" className="absolute inset-0 rounded-xl" style={{ background: BLUE }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <Icon className="relative w-4 h-4" />
                <span className="relative hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* preview body */}
        <div className="min-h-[190px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={skill.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SkillPreview skill={skill.key} />
            </motion.div>
          </AnimatePresence>
        </div>

        <Link
          to={skill.to}
          className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 hover:bg-white/15 transition-colors px-4 py-3"
        >
          <span className="text-sm text-white/85">{skill.blurb}</span>
          <ArrowUpRight className="w-5 h-5 text-white shrink-0 ml-3" />
        </Link>
      </div>
    </div>
  );
}

// Scroll-to-top button (kept from the previous homepage).
const ScrollToTopButton = () => {
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      initial={{ scale: 0 }}
      animate={{ scale: showScrollTop ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </motion.div>
  );
};

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const HomePage = () => {
  // Real feedback images uploaded by the admin. No sample fallback: when there
  // is none, the section is simply not rendered.
  const [feedbackImages, setFeedbackImages] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/student/action/feedbacks?limit=15`);
        if (res.ok) {
          const data = await res.json();
          setFeedbackImages(data.filter(fb => fb.image_url).slice(0, 15));
        }
      } catch (e) {
        // optional section, stay quiet
      }
    };
    fetchFeedbacks();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Seo
        path="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: 'EnglishOnComputer – Online English Learning',
            description:
              'An online English learning platform with practical lessons and AI-powered tools to improve listening, speaking, reading and writing skills.',
            provider: {
              '@type': 'EducationalOrganization',
              name: 'EnglishOnComputer',
              sameAs: 'https://englishoncomputer.com',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What does EnglishOnComputer offer?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    'We provide an online English learning platform with practical lessons and AI-powered tools to help learners improve their English without relying on traditional teacher-led learning.',
                },
              },
              {
                '@type': 'Question',
                name: 'Who is EnglishOnComputer for?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    'Our platform is designed for anyone who wants to learn or teach English online: students of all levels, English teachers, learners looking for an affordable option, people without access to traditional classes, and busy learners.',
                },
              },
              {
                '@type': 'Question',
                name: 'Which English skills can I practice?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    'Our platform helps learners improve their listening, speaking, reading, and writing skills through practical lessons and AI-powered exercises.',
                },
              },
            ],
          },
        ]}
      />

      <Navbar />
      <main className="flex-1">
        {/* ── HERO: dark navy band, headline left, live practice-room preview right ── */}
        <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, #07223d 0%, ${NAVY} 45%, #123a73 100%)` }}>
          {/* soft grid + glows */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }}
          />
          <div className="pointer-events-none absolute -top-40 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-30" style={{ background: BLUE }} />
          <div className="pointer-events-none absolute -bottom-48 right-0 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-20" style={{ background: ORANGE }} />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            <motion.div
              className="lg:col-span-6"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-2 pr-3.5 py-1 text-xs sm:text-sm font-medium text-white/85">
                <span className="grid place-items-center w-5 h-5 rounded-full" style={{ background: ORANGE }}>
                  <Sparkles className="w-3 h-3 text-white" />
                </span>
                AI-powered online English learning
              </span>

              <h1 className="mt-6 font-extrabold tracking-tight leading-[1.05] text-4xl sm:text-5xl xl:text-6xl">
                Learn English
                <span className="block">
                  <span className="relative inline-block">
                    <span className="relative z-10" style={{ color: ORANGE }}>anytime</span>
                    <span className="absolute left-0 right-0 bottom-1 h-3 rounded-full opacity-25" style={{ background: ORANGE }} />
                  </span>{' '}
                  and anywhere.
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-white/75 max-w-xl leading-relaxed">
                We provide an <strong className="text-white">online English learning platform</strong> with practical lessons and{' '}
                <strong className="text-white">AI-powered tools</strong> to help learners improve their English without relying on
                traditional teacher-led learning.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/listening_list"
                  className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ background: ORANGE }}
                >
                  Start practicing
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors"
                >
                  Who we are
                </Link>
              </div>

              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
                {['Listening', 'Speaking', 'Reading', 'Writing'].map((s) => (
                  <li key={s} className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4" style={{ color: ORANGE }} /> {s}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="lg:col-span-6 lg:pl-6"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <PracticeRoomPreview />
            </motion.div>
          </div>

          {/* curved edge into the page */}
          <svg className="block w-full h-10 sm:h-14 text-white" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
            <path fill="currentColor" d="M0,80 L0,40 C240,0 480,0 720,28 C960,56 1200,56 1440,24 L1440,80 Z" />
          </svg>
        </section>

        {/* ── SKILLS: asymmetric bento grid ── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={reveal} className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: BLUE }}>Practice</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>Four skills, one place</h2>
            </div>
            <Link to="/vip-packages" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: BLUE }}>
              See VIP packages <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5">
            {SKILLS.map((s, i) => {
              const Icon = s.icon;
              const big = i === 0 || i === 3;
              const dark = i === 0;
              const accent = i === 3;
              return (
                <motion.div
                  key={s.key}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  variants={reveal}
                  transition={{ delay: i * 0.07 }}
                  className={big ? 'lg:col-span-7' : 'lg:col-span-5'}
                >
                  <Link
                    to={s.to}
                    className={`group relative flex h-full min-h-[190px] flex-col justify-between overflow-hidden rounded-[26px] p-6 sm:p-7 transition-transform duration-300 hover:-translate-y-1 ${dark ? 'text-white' : accent ? 'text-white' : 'bg-[#f3f7fc] text-[#0b2447] border border-[#e3ecf7]'}`}
                    style={dark ? { background: NAVY } : accent ? { background: `linear-gradient(135deg, ${ORANGE}, #f6a94a)` } : undefined}
                  >
                    <Icon className={`absolute -right-5 -bottom-6 w-40 h-40 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${dark || accent ? 'text-white/10' : 'text-[#2f7fd1]/10'}`} strokeWidth={1.25} />
                    <div className="relative flex items-start justify-between">
                      <span className={`grid place-items-center w-12 h-12 rounded-2xl ${dark || accent ? 'bg-white/15' : 'bg-white shadow-sm'}`}>
                        <Icon className="w-6 h-6" style={dark || accent ? undefined : { color: BLUE }} />
                      </span>
                      <span className={`grid place-items-center w-10 h-10 rounded-full transition-colors ${dark || accent ? 'bg-white/15 group-hover:bg-white group-hover:text-[#0b2447]' : 'bg-white group-hover:bg-[#0b2447] group-hover:text-white'}`}>
                        <ArrowUpRight className="w-5 h-5" />
                      </span>
                    </div>
                    <div className="relative mt-8">
                      <h3 className="text-2xl font-extrabold tracking-tight">{s.label}</h3>
                      <p className={`mt-1.5 text-sm sm:text-base max-w-sm ${dark || accent ? 'text-white/80' : 'text-[#0b2447]/70'}`}>{s.blurb}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── WHAT WE OFFER: editorial, numbered rows ── */}
        <section className="border-y border-[#e3ecf7] bg-[#f8fbff]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-20 grid lg:grid-cols-12 gap-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={reveal} className="lg:col-span-4">
              <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: ORANGE }}>What We Offer</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: NAVY }}>
                Practical lessons, powered by AI
              </h2>
              <p className="mt-4 text-[#0b2447]/70 leading-relaxed">
                We provide an <strong>online English learning platform</strong> with practical lessons and{' '}
                <strong>AI-powered tools</strong> to help learners improve their English without relying on traditional
                teacher-led learning.
              </p>
            </motion.div>

            <div className="lg:col-span-8 divide-y divide-[#dbe6f4]">
              {OFFERS.map((o, i) => (
                <motion.div
                  key={o.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  variants={reveal}
                  transition={{ delay: i * 0.08 }}
                  className="group grid grid-cols-[auto,1fr] gap-5 sm:gap-8 py-7 first:pt-0 last:pb-0"
                >
                  <span
                    className="font-extrabold leading-none text-5xl sm:text-6xl tabular-nums transition-colors duration-300 text-[#c9d9ee] group-hover:text-[#2f7fd1]"
                    aria-hidden="true"
                  >
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold" style={{ color: NAVY }}>{o.title}</h3>
                    <p className="mt-2 text-[#0b2447]/70 leading-relaxed text-base sm:text-lg">{o.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO IS IT FOR?: sticky heading left, list right ── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-20 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={reveal} className="lg:sticky lg:top-28">
              <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: BLUE }}>Who Is It For?</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: NAVY }}>
                For anyone who wants to learn or teach English online
              </h2>
              <p className="mt-4 text-[#0b2447]/70 leading-relaxed">
                Our platform is designed for anyone who wants to learn or teach English online.
              </p>
              <div className="mt-8 hidden lg:block rounded-[26px] border border-[#e3ecf7] bg-white p-7 shadow-[0_24px_60px_-30px_rgba(11,36,71,0.35)]">
                <img src="/img/logo-eoc.png" alt="EnglishOnComputer.com" className="w-56 h-auto mx-auto" />
              </div>
            </motion.div>
          </div>

          <ul className="lg:col-span-7 space-y-3">
            {AUDIENCES.map(({ icon: Icon, title, text }, i) => (
              <motion.li
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={reveal}
                transition={{ delay: i * 0.06 }}
                className="group flex gap-4 sm:gap-5 rounded-[22px] border border-[#e3ecf7] bg-white p-5 sm:p-6 transition-all duration-300 hover:border-transparent hover:shadow-[0_20px_50px_-24px_rgba(11,36,71,0.4)]"
              >
                <span
                  className="shrink-0 grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-colors duration-300 bg-[#eef4fc] text-[#2f7fd1] group-hover:bg-[#0b2447] group-hover:text-white"
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold" style={{ color: NAVY }}>{title}</h3>
                  <p className="mt-1 text-[#0b2447]/70 leading-relaxed">{text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        <section className="relative w-full">
          {/* Latest News (managed from admin /announcements) */}
          <AnnouncementsSection />

          {/* VIP Members Feedback Slider */}
          {feedbackImages.length > 0 && (
            <div className="max-w-6xl mx-auto px-4 relative z-10 py-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-[#0b2447]">
                  Learner Feedback
                </h2>
                <p className="text-gray-500 mt-2">What our learners say</p>
              </motion.div>

              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                loop={feedbackImages.length > 3}
                speed={800}
                className="feedback-swiper rounded-2xl pb-12"
              >
                {(() => {
                  const slides = [];
                  for (let i = 0; i < feedbackImages.length; i += 3) {
                    slides.push(feedbackImages.slice(i, i + 3));
                  }
                  return slides.map((group, slideIdx) => (
                    <SwiperSlide key={slideIdx}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-2">
                        {group.map((fb) => (
                          <motion.div
                            key={fb.feedback_id}
                            whileHover={{ scale: 1.03 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="rounded-xl overflow-hidden shadow-lg border border-gray-100 bg-white"
                          >
                            {fb.image_url && (
                              <img
                                src={
                                  fb.image_url.startsWith('data:') ? fb.image_url :
                                    fb.image_url.startsWith('/static/') ? `${API_BASE}${fb.image_url}` :
                                      fb.image_url
                                }
                                alt={fb.content || 'Feedback'}
                                className="w-full h-[280px] object-contain bg-gray-50"
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </SwiperSlide>
                  ));
                })()}
              </Swiper>
            </div>
          )}
        </section>

        {/* ── CLOSING CTA ── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-16 pt-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={reveal}
            className="relative overflow-hidden rounded-[32px] px-6 sm:px-12 py-12 sm:py-14 text-white"
            style={{ background: `linear-gradient(120deg, ${NAVY} 0%, #123a73 60%, ${BLUE} 100%)` }}
          >
            <div className="pointer-events-none absolute -right-16 -top-24 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: ORANGE }} />
            <div className="relative grid md:grid-cols-[1fr,auto] items-center gap-8">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold leading-snug max-w-2xl">
                  “Learn smarter with AI, improve your English, and take your skills to the next level.”
                </p>
                <p className="mt-3 text-white/70 font-medium">— EnglishOnComputer Team</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ background: ORANGE }}
                >
                  Create a free account <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/reading_list"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
                >
                  Try a free exercise
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />

      <ScrollToTopButton />
    </div>
  );
};

export default HomePage;
