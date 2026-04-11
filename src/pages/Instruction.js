import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Headphones, BookOpen, PenTool, Mic, BookA, Info, CheckCircle2, ChevronRight, Home, ShieldAlert, Sparkles, BookMarked, BrainCircuit, HeadphonesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Instruction = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const containerVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Breadcrumb & Navigation */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-indigo-600 flex items-center transition-colors duration-300">
              <Home size={16} className="mr-1" />
              Home
            </Link>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-gray-900 font-medium">Instructions for use</span>
          </nav>
        </div>
      </div>

      <main className="flex-grow pb-24">
        {/* Header Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white py-20 px-6">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-0 -right-40 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Platform Features Overview
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-indigo-100 max-w-2xl mx-auto"
            >
              Discover all the features designed to help you conquer the IELTS exam with our comprehensive learning platform.
            </motion.p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 -mt-10">
          <motion.div
            variants={containerVariant}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Listening Section */}
            <motion.div variants={fadeUpVariant} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-md">
                    <HeadphonesIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Listening</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      Full Tests
                    </h3>
                    <p className="text-gray-600 leading-relaxed ml-7">
                      These are full-length tests that closely simulate the real IELTS exam. They include detailed explanations and various learning features to help users improve their listening skills. Users can also become familiar with the computer-based test interface and experience real exam pressure. These tests are ideal for long-term preparation and can effectively replace traditional paper-based materials.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      Forecast
                    </h3>
                    <p className="text-gray-600 leading-relaxed ml-7">
                      These tests are carefully selected from Full Tests and regularly updated based on the latest exam trends. They focus on question types that are likely to appear or repeat in upcoming exams. Forecast tests are especially suitable for candidates planning to take the exam within the next month.
                    </p>
                    <div className="ml-7 mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <p><strong>Note:</strong> These forecasts are based on probability only. There is no guarantee that these topics will appear in your actual exam.</p>
                    </div>
                  </div>

                  <div className="mt-8 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Access Levels</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                        <div>
                          <span className="font-medium text-gray-900">No-VIP Account:</span>
                          <p className="text-gray-600">Access to only 6 Listening tests</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                        <div>
                          <span className="font-medium text-emerald-700">VIP Account:</span>
                          <p className="text-gray-600">Access to all Listening tests on the website</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reading Section */}
            <motion.div variants={fadeUpVariant} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-md">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Reading</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Full Tests
                    </h3>
                    <p className="text-gray-600 leading-relaxed ml-7">
                      These full-length tests simulate the real IELTS exam and include detailed explanations along with helpful learning features. They help users improve reading skills, become familiar with the computer-based interface, and experience real exam conditions. These tests are ideal for long-term preparation and can replace traditional paper-based materials.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                      Forecast
                    </h3>
                    <p className="text-gray-600 leading-relaxed ml-7">
                      These tests are selected from Full Tests and updated regularly based on the latest exam trends. They focus on questions that are likely to appear or repeat in upcoming exams. Forecast tests are recommended for candidates preparing for the exam within one month.
                    </p>
                    <div className="ml-7 mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <p><strong>Note:</strong> These forecasts are based on probability only. There is no guarantee that these topics will appear in your actual exam.</p>
                    </div>
                  </div>

                  <div className="mt-8 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Access Levels</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                        <div>
                          <span className="font-medium text-gray-900">No-VIP Account:</span>
                          <p className="text-gray-600">Access to only 6 Reading tests</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                        <div>
                          <span className="font-medium text-emerald-700">VIP Account:</span>
                          <p className="text-gray-600">Access to all Reading tests on the website</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Writing Section */}
            <motion.div variants={fadeUpVariant} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-md">
                    <PenTool className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Writing</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-amber-500" />
                      Full Tests
                    </h3>
                    <p className="text-gray-600 leading-relaxed ml-7">
                      These tests simulate the real IELTS Writing exam and include detailed explanations and learning features. After completing a test, users can use AI evaluation to receive instant feedback and improve their writing based on official scoring criteria.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Forecast
                    </h3>
                    <p className="text-gray-600 leading-relaxed ml-7">
                      These tests are selected from Full Tests and updated regularly according to the latest exam trends. They are ideal for candidates preparing for the exam within one month. Users can also receive AI evaluation and feedback after completing each test.
                    </p>
                    <div className="ml-7 mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <p><strong>Note:</strong> These forecasts are based on probability only. There is no guarantee that these topics will appear in your actual exam.</p>
                    </div>
                  </div>

                  <div className="mt-8 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Access Levels</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                        <div>
                          <span className="font-medium text-gray-900">No-VIP Account:</span>
                          <p className="text-gray-600">Access to all Writing tests (Writing is free)<br />• 1 AI Writing evaluation per day</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                        <div>
                          <span className="font-medium text-emerald-700">VIP Account (Listening & Reading Packages):</span>
                          <p className="text-gray-600">• 6 additional AI Writing evaluations per day</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Speaking & Vocabulary Combined Column */}
            <div className="space-y-8 flex flex-col">
              {/* Speaking Section */}
              <motion.div variants={fadeUpVariant} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group flex-grow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl shadow-md">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Speaking</h2>
                  </div>

                  <div className="space-y-5">
                    <p className="text-gray-600 leading-relaxed">
                      Users can access <strong className="text-purple-700">free Speaking Forecast PDFs</strong> covering all months:
                    </p>
                    <ul className="space-y-2 ml-4">
                      {['January – April', 'May – August', 'September – December'].map((month, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-purple-500" />
                          {month}
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-gray-600 mb-3">Speaking topics are updated three times per year:</p>
                      <div className="flex flex-wrap gap-2">
                        {['January', 'May', 'September'].map((month, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100">
                            {month}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl">
                      <strong className="text-emerald-700">Completely Free:</strong> This section is completely free, so users always have full access to Speaking materials at any time.
                    </div>

                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <p><strong>Note:</strong> These forecasts are based on probability only. There is no guarantee that these topics will appear in your actual exam.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Vocabulary Section */}
              <motion.div variants={fadeUpVariant} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl shadow-md">
                      <BookMarked className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Vocabulary</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-50">
                      <BookA className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Personal Vocabulary List</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          After completing tests, users can add new vocabulary from Listening and Reading sections to their personal vocabulary list. This helps learners systematically review and expand vocabulary while practicing.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-50">
                      <BrainCircuit className="w-6 h-6 text-purple-500 mt-1 shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Dictation Feature</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Users can also use the dictation feature to practice spelling and reinforce memory for added words. This feature helps learners remember vocabulary longer and improve spelling accuracy.
                        </p>
                      </div>
                    </div>

                    <p className="text-indigo-800 font-medium text-center bg-indigo-50 py-3 px-4 rounded-xl">
                      Designed to help users build vocabulary naturally while practicing tests.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Instruction;
