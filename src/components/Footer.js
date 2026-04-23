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
                                src="/img/logo-ielts.png?v=2"
                                alt="IELTS Prep Logo"
                                className="h-28 w-28 mb-4"
                            />
                        </div>
                        <p className="text-gray-600 mb-4 text-center">A professional platform for computer-based test preparation.</p>

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
                                    Mock Test
                                    <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-[#2b5356]/10 to-[#2b5356]"></span>
                                </h3>
                                <ul className="space-y-3">
                                    <li><a href="listening_list" className="text-gray-600 hover:text-[#2b5356] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Listening
                                    </a></li>
                                    <li><a href="#" className="text-gray-600 hover:text-[#2b5356] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Reading
                                    </a></li>
                                    <li><a href="writing_list" className="text-gray-600 hover:text-[#2b5356] transition-colors duration-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                        Writing
                                    </a></li>
                                    <li><a href="speaking_list" className="text-gray-600 hover:text-[#2b5356] transition-colors duration-300 flex items-center gap-1.5">
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
                                <ul className="space-y-3">
                                    <li><a href="mailto:ieltscomputertestglobal@gmail.com" className="text-gray-600 hover:text-blue-500 transition-colors duration-300 flex items-center lg:items-start xl:items-center gap-2">
                                        <div className="rounded-full text-gray-500 hover:text-blue-500 transition-colors duration-300 flex-shrink-0">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                                            </svg>
                                        </div>
                                        <span className="text-sm 2xl:text-base">ieltscomputertestglobal<wbr />@gmail.com</span>
                                    </a></li>
                                    <li className="flex items-center gap-3 mt-4">
                                        {/* Facebook */}
                                        <a href="https://www.facebook.com/share/1813nyxV27/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 bg-gray-100 hover:bg-blue-50 p-2.5 rounded-full" aria-label="Facebook">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                        </a>
                                        {/* Instagram */}
                                        <a href="https://www.instagram.com/ieltscomputertest?igsh=MWI1Z2RrMnh3M3FjZw==" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600 transition-colors duration-300 bg-gray-100 hover:bg-pink-50 p-2.5 rounded-full" aria-label="Instagram">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                        </a>
                                        {/* TikTok */}
                                        <a href="https://www.tiktok.com/@ieltscomputertest.com?_r=1&_t=ZS-95daFi6ORNq" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition-colors duration-300 bg-gray-100 hover:bg-gray-200 p-2.5 rounded-full" aria-label="TikTok">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.014 3.91-.014.16 1.447.886 2.766 2.052 3.601 1.053.754 2.33 1.155 3.633 1.155v3.834c-1.398-.01-2.775-.386-3.992-1.077-.456-.258-.881-.564-1.267-.912v8.583c-.006 1.704-.632 3.355-1.782 4.62-1.353 1.492-3.324 2.348-5.362 2.316-2.029-.023-3.97-.881-5.342-2.355-1.258-1.348-1.921-3.151-1.859-5.006.05-1.865.811-3.63 2.138-4.921 1.328-1.298 3.125-2.046 4.996-2.083.414-.008.828.024 1.238.093v3.882a4.417 4.417 0 00-1.121-.082c-.896.035-1.768.397-2.428 1.013-.655.61-.99 1.474-1.012 2.383a3.3 3.3 0 00.998 2.502c.677.632 1.597.971 2.531.954 1.831-.033 3.256-1.579 3.238-3.415l-.014-11.832c-.003-1.055-.008-2.11-.013-3.165z" /></svg>
                                        </a>
                                        {/* WhatsApp */}
                                        <a href="https://wa.me/84964996195" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-500 transition-colors duration-300 bg-gray-100 hover:bg-green-50 p-2.5 rounded-full" aria-label="WhatsApp">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                        </a>
                                    </li>
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
                        <p>Copyright © 2025 ieltscomputertest.com. All rights reserved</p>
                    </div>
                </div>

                {/* Trademark Disclaimer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-center text-xs text-gray-400 leading-relaxed max-w-3xl mx-auto">
                        <strong>Disclaimer:</strong> IELTS is a registered trademark jointly owned by the University of Cambridge ESOL Examinations (Cambridge Assessment English), the British Council, and IDP Education Australia. This website is independently operated and is <strong>not affiliated with, approved, or endorsed by</strong> any of these organizations. All test preparation materials on this platform are created independently for educational purposes only.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
