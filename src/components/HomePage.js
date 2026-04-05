import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Navbar from './Navbar';
import Footer from './Footer';
import { Player } from '@lottiefiles/react-lottie-player';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Pagination } from 'swiper/modules';
import '../App.css';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import CircularGallery, { Card } from './CircularGallery';

const heroImages = [
  '/img/hp1.webp',
  '/img/hp2.webp',
  '/img/hp4.webp',
];
const FloatingMessengerIcon = () => {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 300;
      setShowScrollTop(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openMessenger = () => {
    window.open('https://wa.me/84964996195', '_blank');
  };

  const toggleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <motion.div
        className={`fb-messenger-icon ${isMinimized ? 'minimized' : ''} ${showScrollTop ? 'shifted' : ''}`}
        onClick={openMessenger}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 1.5
        }}
        whileHover={{ scale: isMinimized ? 1.05 : 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {!isMinimized && <div className="fb-messenger-tooltip">Contact Us</div>}

        <div
          className="messenger-toggle"
          onClick={toggleMinimize}
        >
          <span className="text-white text-xs font-bold">1</span>
        </div>

        <img
          src="/img/whatsapp-icon.webp"
          alt="WhatsApp"
          width="50"
          height="50"
          className="rounded-md"
          style={{ objectFit: 'contain' }}
        />
      </motion.div>

      <motion.div
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        initial={{ scale: 0 }}
        animate={{ scale: showScrollTop ? 1 : 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </motion.div>
    </>
  );
};

const HomePage = () => {

  // Keep your existing animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const slideRight = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
  };

  // New variants for second section
  const staggerFaster = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const slideInRight = {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const slideInBottom = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* HERO SECTION */}
        <section className="relative w-full max-w-6xl mx-auto px-3 md:py-7 overflow-hidden border-b-2">

          {/* Decorative large circles in background */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="absolute top-20 right-20 w-72 h-72 rounded-full bg-gradient-to-br from-green-200/20 to-blue-200/20 blur-xl"
          />
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.3 }}
            className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-gradient-to-tr from-purple-200/20 to-pink-200/20 blur-xl"
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Left: Marketing headline with visual highlights */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerChildren}
              className="flex-1 max-w-xl text-left md:pt-8"
            >
              {/* IELTS Badge */}
              <motion.div
                variants={slideRight}
                className="inline-block mt-3 mb-4 px-3 py-1 bg-gradient-to-r from-[#c98825] to-[#e4b231] text-white text-sm font-semibold rounded-full shadow-md"
              >
                IELTS Computer-Based Test
              </motion.div>

              <motion.h1
                variants={staggerChildren}
                className="font-extrabold tracking-tight mb-8 flex flex-col gap-1 md:gap-2"
              >
                <motion.span variants={slideUp} className="block text-3xl sm:text-4xl md:text-5xl lg:text-[45px] leading-tight text-[#0e233a]">
                  Take the IELTS
                </motion.span>
                <motion.span variants={slideUp} className="block text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-tight text-[#0e233a]">
                  computer-based test
                </motion.span>
                <motion.span variants={slideUp} className="block text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-tight text-[#d2922d]">
                  with authentic,
                </motion.span>
                <motion.span variants={slideUp} className="block text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-tight text-[#143c51] pb-1 md:pb-2">
                  official-standard questions.
                </motion.span>
              </motion.h1>

              <motion.p
                variants={slideUp}
                className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl"
              >
                Experience computer-based IELTS practice with authentic tests, standard interface, AI automated scoring, and detailed analytics to help you improve your band score effectively.
              </motion.p>

              {/* Trust indicators */}
              <motion.div
                variants={staggerChildren}
                className="flex flex-wrap gap-6 mb-6 text-gray-500"
              >
                <motion.div variants={fadeIn} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#b4904a]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  <span>International-standard test questions with detailed explanations</span>
                </motion.div>
                <motion.div variants={fadeIn} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#b4904a]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  <span>100% realistic test interface</span>
                </motion.div>
                <motion.div variants={fadeIn} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#b4904a]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  <span>Packed with useful learning support features</span>
                </motion.div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                variants={slideUp}
                transition={{ delay: 0.8 }}
                className="flex gap-4 mb-8"
              >
                <a href="/listening_list">

                  <button className="group relative px-8 py-4 bg-gradient-to-r from-[#c98825] to-[#e4b231] text-white font-bold text-lg rounded-xl shadow-lg overflow-hidden transform hover:translate-y-[-2px] transition-all duration-300">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Start Now
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </span>
                    <span className="absolute inset-0 shimmer"></span>
                  </button>
                </a>
                {/* Social proof */}
                <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex -space-x-3">
                    <img src="/img/per4.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                    <img src="/img/per3.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                    <img src="/img/per2.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold bg-gradient-to-r from-[#c98825] to-[#e4b231] bg-clip-text text-transparent">100K+</span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Trusted Users</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: floating images with enhanced water effect */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 1,
                type: "spring",
                stiffness: 50,
                damping: 20
              }}
              className="flex-1 min-w-[480px] max-w-2xl relative"
            >
              <Swiper
                modules={[Autoplay, EffectCoverflow]}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={"auto"}
                coverflowEffect={{
                  rotate: 30,
                  stretch: 0,
                  depth: 100,
                  modifier: 1,
                  slideShadows: false
                }}
                pagination={{ clickable: true }}
                autoplay={{
                  delay: 1800,
                  disableOnInteraction: false
                }}
                loop={true}
                speed={1000}
                observer={true}
                observeParents={true}
                className="rounded-2xl overflow-hidden h-full swiper-container-custom"
              >
                {heroImages.map((image, index) => (
                  <SwiperSlide key={index} className="w-[300px] h-[300px] swiper-slide-custom">
                    <div className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden transition-all duration-500 ease-in-out slide-inner">
                      <img
                        src={image}
                        alt={`IELTS Test ${index + 1}`}
                        className="object-contain w-full h-full transition-opacity duration-500 ease-in-out"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Decorative floating bubbles */}
              <motion.div
                variants={fadeIn}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-6 left-1/4 w-8 h-8 bg-[#c98825] rounded-full opacity-50 z-10 ripple"
              ></motion.div>
              <motion.div
                variants={fadeIn}
                transition={{ delay: 1.0 }}
                className="absolute -bottom-10 left-2/3 w-12 h-12 bg-[#b4904a] rounded-full opacity-40 z-10 ripple"
                style={{ animationDelay: '1s' }}
              ></motion.div>
              <motion.div
                variants={fadeIn}
                transition={{ delay: 1.2 }}
                className="absolute -bottom-8 left-1/2 w-10 h-10 bg-[#b4904a] rounded-full opacity-30 z-10 ripple"
                style={{ animationDelay: '2s' }}
              ></motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECOND SECTION - ASYMMETRIC BENEFITS */}
        <section className="relative w-full overflow-hidden pb-10">
          {/* Animated background */}
          <div className="absolute inset-0 bg-white z-0"></div>

          {/* SVG Blob Animation */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <svg className="absolute top-0 right-0 w-[600px] h-[600px] text-[#2b5356]/10 opacity-30 -translate-y-1/4 translate-x-1/4" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" className="animated-blob" d="M24.4,-30.7C31.2,-25.3,36.1,-17.1,39.2,-7.7C42.3,1.8,43.5,12.5,39.2,20.6C34.9,28.6,25.1,34,14.5,37.9C3.9,41.8,-7.5,44.1,-17.2,41C-26.9,37.9,-34.9,29.5,-38.6,19.7C-42.3,9.9,-41.8,-1.2,-38.8,-11.2C-35.8,-21.2,-30.4,-30,-22.8,-35.2C-15.1,-40.3,-5.3,-41.9,2.1,-44.6C9.6,-47.3,17.6,-36.1,24.4,-30.7Z" />
            </svg>
            <svg className="absolute bottom-0 left-0 w-[500px] h-[500px] text-[#0096b1]/10 opacity-30 translate-y-1/4 -translate-x-1/4" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" className="animated-blob" style={{ animationDelay: "-5s" }} d="M24.4,-30.7C31.2,-25.3,36.1,-17.1,39.2,-7.7C42.3,1.8,43.5,12.5,39.2,20.6C34.9,28.6,25.1,34,14.5,37.9C3.9,41.8,-7.5,44.1,-17.2,41C-26.9,37.9,-34.9,29.5,-38.6,19.7C-42.3,9.9,-41.8,-1.2,-38.8,-11.2C-35.8,-21.2,-30.4,-30,-22.8,-35.2C-15.1,-40.3,-5.3,-41.9,2.1,-44.6C9.6,-47.3,17.6,-36.1,24.4,-30.7Z" />
            </svg>
          </div>
          {/* Floating particles */}
          <div className="floating-particle w-4 h-4 bg-[#2b5356]/40 top-[15%] left-[10%]" style={{ animationDelay: "0s" }}></div>
          <div className="floating-particle w-6 h-6 bg-[#0096b1]/40 top-[25%] right-[15%]" style={{ animationDelay: "1s" }}></div>
          <div className="floating-particle w-3 h-3 bg-[#2b5356]/30 top-[60%] left-[20%]" style={{ animationDelay: "2s" }}></div>
          <div className="floating-particle w-5 h-5 bg-[#eb7e37]/40 bottom-[20%] right-[10%]" style={{ animationDelay: "3s" }}></div>
          <div className="floating-particle w-7 h-7 bg-[#0096b1]/30 bottom-[30%] left-[30%]" style={{ animationDelay: "4s" }}></div>

          {/* Rotating shapes */}
          <div className="rotating-shape top-[30%] right-[25%]" style={{ animationDirection: "reverse" }}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0L61.2245 38.8909L100 50L61.2245 61.1091L50 100L38.7755 61.1091L0 50L38.7755 38.8909L50 0Z" fill="url(#gradient1)" fillOpacity="0.3" />
              <defs>
                <linearGradient id="gradient1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2b5356" />
                  <stop offset="1" stopColor="#0096b1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="rotating-shape bottom-[15%] left-[15%]">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0L93.3013 25L93.3013 75L50 100L6.69873 75L6.69873 25L50 0Z" fill="url(#gradient2)" fillOpacity="0.3" />
              <defs>
                <linearGradient id="gradient2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0096b1" />
                  <stop offset="1" stopColor="#eb7e37" />
                </linearGradient>
              </defs>
            </svg>
          </div>



          <div className="max-w-6xl mx-auto px-4 relative z-10 py-10">

            {/* Main benefits - Staggered cards */}
            <motion.div
              className="text-center py-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-bold inline-flex items-center gap-3 bg-gradient-to-r from-[#0f263e] via-[#d1942d] to-[#d1942d] text-transparent bg-clip-text min-h-[3rem] leading-relaxed">
                <span className="animate-pulse text-[#2b5356]">✨</span>
                Suitable for
                <span className="animate-pulse text-[#eb7e37]">✨</span>
              </h2>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideInBottom}
              className="flex flex-col md:flex-row items-center gap-10 px-4 py-5 max-w-6xl mx-auto relative mb-10 mt-5 rounded-xl
                before:absolute before:inset-0 before:border-t-2 before:border-b-2 before:border-[#d1942d] before:scale-x-0 before:transition-transform before:duration-500 hover:before:scale-x-100 before:rounded-xl
                after:absolute after:inset-0 after:border-l-2 after:border-r-2 after:border-[#d1942d] after:scale-y-0 after:transition-transform after:duration-500 hover:after:scale-y-100 after:rounded-xl
                bg-gradient-to-r from-transparent via-[#d1942d]/5 to-transparent
                backdrop-blur-sm
                shadow-[0_0_15px_rgba(235,126,55,0.1)]
                hover:shadow-[0_0_25px_rgba(235,126,55,0.2)]
                transition-all duration-500"
            >

              {/* Left side - Student Image */}
              <div className="w-full md:w-1/2">
                <img
                  src="/img/hp3.webp"
                  alt="Student studying IELTS online"
                  className="rounded-lg shadow-lg w-full h-auto"
                />
              </div>

              {/* Right side - User Types */}
              <div className="w-full md:w-1/2 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      title: "Beginners preparing for IELTS.",
                      desc: "Get familiar with the test format, interface, and common question types.",
                      icon: "🎯"
                    },
                    {
                      title: "Candidates retaking a specific skill.",
                      desc: "Access separate tests for each skill and focus on the areas that need improvement.",
                      icon: "🔄"
                    },
                    {
                      title: "Learners aiming to boost their IELTS score quickly",
                      desc: "Receive detailed analysis of each answer, clear explanations, and helpful learning tools to make rapid progress.",
                      icon: "📈"
                    },
                    {
                      title: "Learners who want to “study smart”",
                      desc: "Practice high-probability question types, master frequently tested topics, and save time and effort in your preparation.",
                      icon: "🎯"
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      variants={{
                        visible: { opacity: 1, y: 0 },
                        hidden: { opacity: 0, y: 20 }
                      }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative overflow-hidden rounded-lg bg-white p-3 shadow-[0_0_10px_rgba(43,83,86,0.1)] hover:shadow-[0_0_15px_rgba(43,83,86,0.2)] transition-all duration-300"
                    >
                      {/* Decorative gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0f263e]/5 via-transparent to-[#0f263e]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Content */}
                      <div className="relative flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#0f263e] to-[#0f263e] text-white text-base transform group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-semibold text-[#0f263e] text-sm group-hover:text-[#0096b1] transition-colors duration-300 truncate">
                            {item.title}
                          </h4>
                          <p className="text-gray-600 text-sm line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>


            {/* Horizontal scrolling user types */}

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                scale: {
                  type: "spring",
                  damping: 25,
                  stiffness: 100
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 mt-20 pt-10 bg-gradient-to-r from-[#2b5356]/5 to-[#0096b1]/5 rounded-2xl p-8 border-l-4 border-[#eb7e37]">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={slideRight}
                  className="md:col-span-2"
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-10 text-[#0f263e]">
                    The computer-based IELTS testing system is developed by a team of highly <span className="text-[#d1942d]">qualified</span>, <span className="text-[#d1942d]">professional</span>, and <span className="text-[#d1942d]">experienced</span> teachers.
                  </h2>
                  <p className="text-lg text-gray-600 mb-4 max-w-2xl">
                    We provide a platform that allows you to practice on a computer with authentic test questions, accurately simulating the real test environment and helping you confidently achieve your target score.
                  </p>
                </motion.div>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={fadeIn}
                  className="flex justify-center md:justify-end items-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d1942d] to-[#0f263e] rounded-full blur-md transform rotate-12"></div>
                    <div className="relative z-10 py-3 px-6 bg-white rounded-full shadow-md text-lg font-semibold text-gray-700">
                      98% of students improve their band score after <span className="text-[#d1942d]">2 weeks</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerFaster}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16"
            >
              <motion.div
                variants={scaleIn}
                className="md:col-span-4 md:col-start-1 benefit-card bg-white rounded-2xl shadow-lg p-6 md:p-8"
                style={{ "--glow-color": "rgba(43, 83, 86, 0.3)" }}
              >
                <div className="card-decoration top-[-50px] right-[-50px] w-[150px] h-[150px]" style={{ "--start-color": "#2b5356", "--end-color": "#1e3c3e" }}></div>
                <div className="card-decoration bottom-[-70px] left-[-40px] w-[170px] h-[170px]" style={{ "--start-color": "#2b5356", "--end-color": "#1e3c3e" }}></div>
                <div className="card-glow"></div>

                <div className="card-icon-container rounded-full bg-[#2b5356]/10 w-16 h-16 flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-[#2b5356]/20 rounded-full opacity-50 floating-decoration" style={{ animationDelay: "0.2s" }}></div>
                  <svg className="w-8 h-8 text-[#2b5356] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 relative">
                  Take the real test at home, just like the official exam
                  <span className="absolute -left-2 top-1/2 w-1 h-6 bg-[#2b5356] -translate-y-1/2 rounded-full"></span>
                </h3>
                <p className="text-gray-600">Enjoy a fully authentic test experience with an accurately replicated interface, helping you get familiar with the real exam environment.</p>

                <div className="flex justify-end mt-4">
                  <span className="inline-flex items-center text-sm font-medium text-[#2b5356]">

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </span>
                </div>
              </motion.div>

              <motion.div
                variants={scaleIn}
                className="md:col-span-4 benefit-card bg-white rounded-2xl shadow-lg p-6 md:p-8"
                style={{ "--glow-color": "rgba(0, 150, 177, 0.3)" }}
              >
                <div className="card-decoration top-[-40px] left-[-50px] w-[150px] h-[150px]" style={{ "--start-color": "#0096b1", "--end-color": "#007a91" }}></div>
                <div className="card-decoration bottom-[-50px] right-[-70px] w-[170px] h-[170px]" style={{ "--start-color": "#0096b1", "--end-color": "#007a91" }}></div>
                <div className="card-glow"></div>

                <div className="card-icon-container rounded-full bg-[#0096b1]/10 w-16 h-16 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-[#0096b1]/20 rounded-full opacity-50 floating-decoration" style={{ animationDelay: "0.5s" }}></div>
                  <svg className="w-8 h-8 text-[#0096b1] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 relative">
                  Authentic-style questions based on official IELTS standards
                  <span className="absolute -left-2 top-1/2 w-1 h-6 bg-[#0096b1] -translate-y-1/2 rounded-full"></span>
                </h3>
                <p className="text-gray-600">Practice with real test formats developed by IELTS experts, delivering the most realistic exam experience possible.</p>

                <div className="flex justify-end mt-4">
                  <span className="inline-flex items-center text-sm font-medium text-[#0096b1]">

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </span>
                </div>
              </motion.div>

              <motion.div
                variants={scaleIn}
                className="md:col-span-4 benefit-card bg-white rounded-2xl shadow-lg p-6 md:p-8"
                style={{ "--glow-color": "rgba(235, 126, 55, 0.3)" }}
              >
                <div className="card-decoration top-[-60px] right-[-30px] w-[160px] h-[160px]" style={{ "--start-color": "#eb7e37", "--end-color": "#d86a25" }}></div>
                <div className="card-decoration bottom-[-40px] left-[-60px] w-[150px] h-[150px]" style={{ "--start-color": "#eb7e37", "--end-color": "#d86a25" }}></div>
                <div className="card-glow"></div>

                <div className="card-icon-container rounded-full bg-[#eb7e37]/10 w-16 h-16 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-[#eb7e37]/20 rounded-full opacity-50 floating-decoration" style={{ animationDelay: "0.7s" }}></div>
                  <svg className="w-8 h-8 text-[#eb7e37] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 relative">
                  Boost your chances and improve your band score effectively
                  <span className="absolute -left-2 top-1/2 w-1 h-6 bg-[#eb7e37] -translate-y-1/2 rounded-full"></span>
                </h3>
                <p className="text-gray-600">Get exposed to a wide range of common question types and topics, increasing your chances of success and helping you achieve a higher score.</p>

                <div className="flex justify-end mt-4">
                  <span className="inline-flex items-center text-sm font-medium text-[#eb7e37]">

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Final CTA Banner */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideInBottom}
              className="relative bg-gradient-to-br from-[#d1942d] to-[#0f263e] text-white rounded-lg mx-4 md:mx-auto max-w-5xl overflow-hidden shadow-xl"
            >
              <div className="absolute right-0 top-0 w-1/3 h-full opacity-30">
                <svg viewBox="0 0 200 450" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <path d="M190,20 L180,40 L160,35 L150,60 L120,70 L110,95 L80,90 L40,110 L20,140 L40,170 L30,220 L10,250 L30,280 L20,320 L50,350 L40,380 L70,410 L100,400 L140,430 L190,410 L170,380 L200,340 L190,300 L160,290 L180,250 L170,210 L190,190 L170,150 L150,130 L170,90 L190,70 L180,40 L190,20" fill="none" stroke="rgba(235,126,55,0.6)" strokeWidth="2" />
                </svg>
              </div>

              <div className="p-8 md:p-12 flex flex-col md:flex-row items-center">
                <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Take a free mock test today!</h3>
                  <p className="text-white/90 mb-6">Start your IELTS journey with a free mock test experience. No time limits, no credit card required.</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="/listening_list">
                      <button className="px-6 py-3 bg-[#eb7e37] text-white font-bold rounded-lg hover:bg-[#eb7e37]/90 transition-colors shadow-lg hover:shadow-xl">Start free test</button>
                    </a>
                  </div>
                </div>

                <div className="md:w-1/3 relative">
                  <div className="relative bg-white/15 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-lg">
                    <div className="relative bg-[#2b5356] rounded-t-lg p-2 flex justify-between items-center">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#eb7e37]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#0096b1]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#2b5356]"></div>
                      </div>
                      <span className="text-xs text-gray-200">IELTS Computer Test</span>
                    </div>
                    <div className="bg-white rounded-b-lg p-3">
                      <div className="text-gray-800 text-sm font-mono mb-2">
                        <span> </span>
                        <span className="text-[#2b5356]">Your IELTS test is ready...</span>
                      </div>
                      <div className="text-gray-800 text-sm font-mono mb-2">
                        <span> </span>
                        <span className="text-[#0096b1]">Starting test...</span>
                      </div>
                      <div className="text-gray-800 text-sm font-mono">
                        <span> </span>
                        <span className="text-[#2b5356]">Time remaining: 60:00</span>
                        <span className="type-cursor inline-block w-2 h-4 ml-1 bg-[#eb7e37]"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Add the floating messenger icon */}
      <FloatingMessengerIcon />

    </div>
  );
};

export default HomePage;
