import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const AboutUs = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* Header Section */}
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-16">About Us.</h1>

          {/* About Section with Sidebar */}
          <div className="flex flex-col md:flex-row gap-8 mb-24">
            {/* Sidebar Navigation - Static now */}
            <div className="w-full md:w-1/4">
              <ul className="space-y-4 sticky top-24">
                <li className="font-semibold text-black">Who We Are.</li>
                <li className="text-gray-500">Our Team</li>
              </ul>
            </div>

            {/* Main Content */}
            <div className="w-full md:w-3/4">
              <div className="space-y-8">
                <p className="text-gray-700">
                  <span className="font-bold text-[#e67e22]">ieltscomputertest.com</span> is designed to deliver a professional computer-based test preparation experience with high-quality materials and an intuitive interface. Our platform enables learners to practice efficiently, track their progress, and continuously improve their performance.
                </p>

                <p className="text-gray-700">
                  Powered by advanced learning tools, we provide smart insights and personalized support. Backed by a team of experienced educators, our system offers carefully designed materials and effective study methods to help learners prepare with confidence and achieve their goals.
                </p>
              </div>
            </div>
          </div>

          {/* Full Width Image Section */}
          <div className="w-full mb-24">
            <img
              src="/img/ab-bg.png"
              alt="Our team working together"
              className="w-full h-auto object-cover"
              style={{ maxHeight: '270px' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/1200x250?text=Team+Collaboration';
              }}
            />
          </div>

          {/* Quote Section */}
          <div className="flex flex-col md:flex-row gap-8 mb-24 justify-center items-center mx-auto max-w-5xl">
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <blockquote className="italic text-2xl md:text-3xl text-gray-700 mb-4">
                "Master computer-based practice, where every session sharpens your skills and brings your goals within reach."
              </blockquote>
              <p className="text-gray-500">- ieltscomputertest.com team</p>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              <img
                src="/img/hp1.webp"
                alt="Creative work"
                className="w-[450px] h-[300px] rounded-md shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/600x400?text=Creative+Work';
                }}
              />
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-24">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Team</h2>
            <p className="text-gray-700 mb-6">
              Ieltscomputertest.com brings together a team of experienced professionals in education and technology. We continuously research and improve our platform to deliver effective and up-to-date learning solutions for our users.
            </p>
            <p className="text-gray-700 mb-4">Our team includes:</p>

            <ul className="list-disc list-inside space-y-3 text-gray-700">
              <li>Experienced instructors with years of teaching expertise </li>
              <li>Experts in AI and educational technology</li>
              <li>Dedicated content development specialists</li>
              <li>24/7 technical support and customer service team </li>
            </ul>
          </div>

        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
