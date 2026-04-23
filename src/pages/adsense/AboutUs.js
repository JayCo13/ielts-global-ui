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
                  <span className="font-bold text-[#e67e22]">ieltscomputertest.com</span> is developed by a team of highly qualified and experienced educators to deliver a professional computer-based test preparation experience with high-quality exercises and an intuitive interface. We are dedicated to providing a highly effective learning experience that allows learners to conveniently access mock tests and targeted practice exercises to improve their band scores.
                </p>

                <p className="text-gray-700">
                  With the motto "Right trust – Breakthrough future", we continuously refine and develop our platform by integrating smart tools and analytics into the learning process. Our team of expert teachers is committed to offering rigorously designed exercises and proven study methods, empowering learners to prepare for the test with completely confidence.
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
                "Master the computer-based IELTS, where every practice sharpens your skill and brings your dream score within reach."
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
              ieltscomputertest.com is powered by a team of highly qualified professionals in teaching and technology development. We continuously research and enhance our platform to deliver the most effective test preparation solutions for our users.
            </p>
            <p className="text-gray-700 mb-4">Our team includes:</p>

            <ul className="list-disc list-inside space-y-3 text-gray-700">
              <li>Experienced instructors with a deep understanding of test formats and scoring criteria</li>
              <li>Leading engineers in test platform and educational technology development</li>
              <li>Dedicated content development specialists</li>
              <li>24/7 technical support and customer service team</li>
            </ul>
          </div>

        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
