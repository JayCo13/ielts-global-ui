import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Navbar from './Navbar';
import Footer from './Footer';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Globe2, Sparkles, Layers, GraduationCap, Presentation, PiggyBank, DoorOpen, Clock } from 'lucide-react';
import '../App.css';

import 'swiper/css';
import 'swiper/css/pagination';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import Seo from './Seo';
import AnnouncementsSection from './AnnouncementsSection';

// Homepage content for EnglishOnComputer ("What We Offer" / "Who Is It For?").
const OFFERS = [
  {
    icon: Globe2,
    title: 'Learn English Anywhere',
    text: (
      <>We make English learning available to people around the world at a <strong>low and affordable cost</strong>. Learners can study anytime and anywhere.</>
    ),
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Learning Tools',
    text: (
      <>Our AI tools help learners <strong>practice, get feedback, and learn at their own pace</strong>.</>
    ),
  },
  {
    icon: Layers,
    title: 'Improve All Four English Skills',
    text: (
      <>Our platform helps learners improve their <strong>listening, speaking, reading, and writing skills</strong> through practical lessons and AI-powered exercises.</>
    ),
  },
];

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: 'Students of All Levels',
    text: (<>Suitable for learners at <strong>all English levels</strong>, from beginners to advanced students.</>),
  },
  {
    icon: Presentation,
    title: 'English Teachers',
    text: (<>Provides useful tools and resources for <strong>teachers who teach English online</strong>.</>),
  },
  {
    icon: PiggyBank,
    title: 'Affordable English Learning',
    text: (<>A good option for people who want to <strong>learn English at a low cost</strong>.</>),
  },
  {
    icon: DoorOpen,
    title: 'Learners Without Access to Traditional Classes',
    text: (<>Helps people who <strong>cannot afford or do not have access to conventional English classes</strong>.</>),
  },
  {
    icon: Clock,
    title: 'Busy Learners',
    text: (<>Designed for people with busy schedules who want to <strong>learn English anytime and anywhere</strong>.</>),
  },
];

// Scroll-to-top button (the "Instructions for use" mascot was removed per the
// EnglishOnComputer content brief).
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

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
      <main className="flex-1 flex flex-col items-center">
        {/* HERO */}
        <section className="relative w-full overflow-hidden border-b border-gray-100 bg-gradient-to-b from-[#f4f8fb] to-white">
          <div className="pointer-events-none absolute -top-24 -right-20 w-80 h-80 rounded-full bg-[#0096b1]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-[#eb7e37]/10 blur-3xl" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 max-w-xl text-center md:text-left"
            >
              <span className="inline-block mb-4 px-3 py-1 bg-gradient-to-r from-[#0096b1] to-[#2b5356] text-white text-sm font-semibold rounded-full shadow-md">
                AI-Powered English Learning
              </span>
              <h1 className="font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl leading-tight text-[#0e233a] mb-5">
                Learn English online,
                <span className="block text-[#0096b1]">anytime and anywhere</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8">
                We provide an <strong>online English learning platform</strong> with practical lessons and{' '}
                <strong>AI-powered tools</strong> to help learners improve their English without relying on traditional
                teacher-led learning.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link to="/listening_list">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-[#eb7e37] to-[#f0a04b] text-white font-bold text-lg rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-0.5 transition-all duration-300">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Start Now
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </span>
                    <span className="absolute inset-0 shimmer"></span>
                  </button>
                </Link>
                <Link to="/about">
                  <button className="px-8 py-4 border-2 border-[#0096b1] text-[#0096b1] font-bold text-lg rounded-xl hover:bg-[#0096b1] hover:text-white transition-colors duration-300">
                    About Us
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="flex-1 flex justify-center"
            >
              <div className="bg-white rounded-3xl shadow-[0_24px_70px_-24px_rgba(0,150,177,0.35)] border border-gray-100 p-8 md:p-10">
                <img
                  src="/img/logo-eoc.png"
                  alt="EnglishOnComputer.com"
                  className="w-64 sm:w-80 md:w-96 h-auto"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* WHAT WE OFFER */}
        <section className="w-full max-w-6xl mx-auto px-4 py-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={cardVariants}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#2b5356] mb-4">What We Offer</h2>
            <p className="text-lg text-gray-600">
              We provide an <strong>online English learning platform</strong> with practical lessons and{' '}
              <strong>AI-powered tools</strong> to help learners improve their English without relying on traditional
              teacher-led learning.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {OFFERS.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={cardVariants}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 p-7"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0096b1]/15 to-[#2b5356]/15 grid place-items-center mb-5 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="w-7 h-7 text-[#0096b1]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* WHO IS IT FOR? */}
        <section className="w-full bg-[#f4f8fb] border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={cardVariants}
              className="text-center max-w-3xl mx-auto mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#2b5356] mb-4">Who Is It For?</h2>
              <p className="text-lg text-gray-600">
                Our platform is designed for anyone who wants to learn or teach English online.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {AUDIENCES.map(({ icon: Icon, title, text }, i) => (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  variants={cardVariants}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 flex gap-4"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#eb7e37]/10 grid place-items-center">
                    <Icon className="w-6 h-6 text-[#eb7e37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-gray-600 leading-relaxed">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
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
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#2b5356] via-[#0096b1] to-[#eb7e37] bg-clip-text text-transparent">
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

        {/* FINAL CTA */}
        <section className="w-full max-w-6xl mx-auto px-4 py-14">
          <div className="rounded-3xl bg-gradient-to-r from-[#0096b1] via-[#0d8ba3] to-[#2b5356] text-white px-6 md:px-12 py-10 text-center shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Start learning today</h2>
            <p className="text-white/90 mb-6 italic">
              "Learn smarter with AI, improve your English, and take your skills to the next level."
            </p>
            <Link to="/listening_list">
              <button className="px-8 py-3.5 bg-white text-[#0096b1] font-bold text-lg rounded-xl shadow hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                Try a free exercise
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />

      <ScrollToTopButton />
    </div>
  );
};

export default HomePage;
