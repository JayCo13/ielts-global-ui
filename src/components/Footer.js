import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
const Footer = () => {
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <footer className="py-12 px-6 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden border-t-2">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-64 h-64 bg-green-100 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100 rounded-full opacity-30 translate-x-1/2 translate-y-1/2 blur-xl"></div>
                <svg className="absolute bottom-0 right-0 w-full h-32 text-gray-50 opacity-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="currentColor" fillOpacity="1" d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,186.7C672,192,768,192,864,176C960,160,1056,128,1152,122.7C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-3 flex flex-col items-center">
                        <div className='flex items-center justify-center gap-6'>
                            <img
                                src="/img/logo-eoc.png"
                                alt="EnglishOnComputer logo"
                                className="h-28 w-auto mb-4"
                            />
                        </div>
                        <p className="text-gray-600 mb-4 text-center">An online English learning platform with practical lessons and AI-powered tools.</p>

                        {/* Social Icons with hover effects */}
                    </div>

                    {/* Footer nav columns with animations */}
                    <div className="md:col-span-9">
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 xl:gap-6 2xl:gap-8 3xl:gap-10 4xl:gap-12">
                            {/* Column 1 - Test Practice */}
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeInUp}
                            >
                                <h3 className="text-gray-900 uppercase text-md font-medium mb-4 relative inline-block">
                                    Full Test
                                    <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-[#2b5356]/10 to-[#2b5356]"></span>
                                </h3>
                                <ul className="space-y-3">
                                    <li><a href="/listening_list" className="text-gray-600 hover:text-[#2b5356] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Listening
                                    </a></li>
                                    <li><a href="/reading_list" className="text-gray-600 hover:text-[#2b5356] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Reading
                                    </a></li>
                                    <li><a href="/writing_list" className="text-gray-600 hover:text-[#2b5356] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Writing
                                    </a></li>
                                    <li><a href="/speaking_list" className="text-gray-600 hover:text-[#2b5356] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Speaking
                                    </a></li>
                                </ul>
                            </motion.div>

                            {/* Column 2 - VIP Plans */}
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeInUp}
                                transition={{ delay: 0.1 }}
                            >
                                <h3 className="text-gray-900 uppercase text-md font-medium mb-4 relative inline-block">
                                    Upgrade to VIP
                                    <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-[#eb7e37]/10 to-[#eb7e37]"></span>
                                </h3>
                                <ul className="space-y-3">
                                    <li><Link to="/vip-packages?type=listening" className="text-gray-600 hover:text-[#eb7e37] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        VIP Listening
                                    </Link></li>
                                    <li><Link to="/vip-packages?type=reading" className="text-gray-600 hover:text-[#eb7e37] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        VIP Reading
                                    </Link></li>
                                    <li><Link to="/vip-packages?type=writing" className="text-gray-600 hover:text-[#eb7e37] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        VIP Writing
                                    </Link></li>
                                    <li><Link to="/vip-packages?type=all" className="text-gray-600 hover:text-[#eb7e37] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        VIP 4 Skills
                                    </Link></li>
                                </ul>
                            </motion.div>

                            {/* Column 3 - About Us */}
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeInUp}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="text-gray-900 uppercase text-md font-medium mb-4 relative inline-block">
                                    About Us
                                    <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-[#0096b1]/10 to-[#0096b1]"></span>
                                </h3>
                                <ul className="space-y-3 xl:space-y-4 2xl:space-y-5 3xl:space-y-6 4xl:space-y-7">
                                    <li><Link to="/about" className="text-gray-600 text-md hover:text-[#0096b1] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Introduction
                                    </Link></li>
                                    <li><Link to="/permission" className="text-gray-600 text-md hover:text-[#0096b1] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Business Owner Details
                                    </Link></li>
                                    <li><Link to="/comp-policy" className="text-gray-600 text-md hover:text-[#0096b1] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Terms of service
                                    </Link></li>
                                </ul>
                            </motion.div>

                            {/* Column 4 - Policies */}
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeInUp}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="text-gray-900 uppercase text-md font-medium mb-4 relative inline-block">
                                    Policies
                                    <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-[#8b5cf6]/10 to-[#8b5cf6]"></span>
                                </h3>
                                <ul className="space-y-3 xl:space-y-4 2xl:space-y-5 3xl:space-y-6 4xl:space-y-7">
                                    <li><Link to="/privacy-policy" className="text-gray-600 text-md hover:text-[#8b5cf6] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Privacy Policy
                                    </Link></li>
                                    <li><Link to="/payment-policy" className="text-gray-600 text-md hover:text-[#8b5cf6] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Payment Policy
                                    </Link></li>
                                    <li><Link to="/deli-policy" className="text-gray-600 text-md hover:text-[#8b5cf6] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Delivery Policy
                                    </Link></li>
                                    <li><Link to="/refund-policy" className="text-gray-600 text-md hover:text-[#8b5cf6] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Refund Policy
                                    </Link></li>
                                </ul>
                            </motion.div>

                            {/* Column 5 - Contact Info */}
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeInUp}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="text-gray-900 uppercase text-md font-medium mb-4 relative inline-block">
                                    Contact us
                                    <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-blue-100 to-blue-500"></span>
                                </h3>
                                <ul className="space-y-3 xl:space-y-4 2xl:space-y-5 3xl:space-y-6 4xl:space-y-7">
                                    <li><a href="mailto:EnglishOnComputer.global@gmail.com" title="EnglishOnComputer.global@gmail.com" className="text-gray-600 text-md hover:text-blue-500 transition-colors duration-300 flex items-center gap-2">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                                        </svg>
                                        Email us
                                    </a></li>
                                    <li><a href="https://wa.me/84964996195" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-gray-600 text-md hover:text-green-600 transition-colors duration-300 flex items-center gap-2 whitespace-nowrap">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                        +84 964 996 195
                                    </a></li>
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Divider with gradient */}
                <div className="h-px my-8 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

                {/* Bottom Copyright and legal links */}
                <div className="justify-center items-center text-gray-500 text-md">
                    <div className="order-2 md:order-1 text-center mb-4 md:mb-0">
                        <p>© 2026 EnglishOnComputer. All rights reserved</p>
                    </div>
                </div>

                {/* Trademark Disclaimer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-center text-xs text-gray-400 leading-relaxed max-w-3xl mx-auto">
                        <strong>Disclaimer:</strong> This website is independently developed and is <strong>not affiliated with, endorsed by, or officially connected to</strong> any educational organization.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
