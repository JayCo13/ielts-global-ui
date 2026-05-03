import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Crown, Star, Sparkles, Zap, BookOpen, Mic, Lightbulb, Globe, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';

const VIPPackages = () => {
    const [packages, setPackages] = useState([]);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [activeFilter, setActiveFilter] = useState(searchParams.get('type') || 'all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const packagesPerPage = 6;
    const navigate = useNavigate();

    const skillNames = {
        listening: 'Listening',
        reading: 'Reading',
        writing: 'Writing',
        speaking: 'Speaking'
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetchWithTimeout(`${API_BASE}/customer/vip/packages/available`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setPackages(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (packageId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        navigate('/payment', {
            state: {
                packageId: packageId,
                package: packages.find(p => p.package_id === packageId)
            }
        });
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        const newSearchParams = new URLSearchParams(location.search);
        if (filter === 'all') {
            newSearchParams.delete('type');
        } else {
            newSearchParams.set('type', filter);
        }
        navigate({ search: newSearchParams.toString() });
    };

    // Modern filter component
    const FilterSection = () => (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="flex justify-center items-center mb-12"
        >
            <motion.div variants={item} className="flex flex-wrap gap-2 justify-center items-center p-2 bg-white rounded-2xl shadow-lg border border-gray-100">
                <button
                    onClick={() => handleFilterChange('all')}
                    className={`relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 overflow-hidden group
                        ${activeFilter === 'all'
                            ? 'text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                    {activeFilter === 'all' && (
                        <motion.div layoutId="filter-bg" className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 z-0 rounded-xl" />
                    )}
                    <span className="relative z-10 flex items-center gap-2 font-semibold">
                        <Globe className="w-5 h-5" />
                        All Skills
                    </span>
                </button>
                {['listening', 'reading', 'writing', 'speaking'].map(skill => (
                    <button
                        key={skill}
                        onClick={() => handleFilterChange(skill)}
                        className={`relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 overflow-hidden group
                            ${activeFilter === skill
                                ? 'text-white shadow-lg shadow-emerald-500/25'
                                : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        {activeFilter === skill && (
                            <motion.div layoutId="filter-bg" className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 z-0 rounded-xl" />
                        )}
                        <span className="relative z-10 flex items-center gap-2 font-semibold">
                            {skill === 'listening' && <Mic className="w-5 h-5" />}
                            {skill === 'reading' && <BookOpen className="w-5 h-5" />}
                            {skill === 'writing' && <Lightbulb className="w-5 h-5" />}
                            {skill === 'speaking' && <Star className="w-5 h-5" />}
                            {skillNames[skill]}
                        </span>
                    </button>
                ))}
            </motion.div>
        </motion.div>
    );

    // Modern package card
    const PackageCard = ({ pkg, index }) => {
        const getPackageStyle = () => {
            if (pkg.package_type === 'all_skills') {
                return {
                    gradient: 'from-emerald-500 to-teal-500',
                    cardBg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50',
                    border: 'border-emerald-200/60',
                    icon: Globe,
                    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-500/20',
                    shadow: 'shadow-emerald-500/30',
                    hoverShadow: 'hover:shadow-emerald-500/40',
                    glowColor: 'bg-emerald-300',
                    priceColor: 'text-emerald-700',
                    divider: 'border-emerald-100',
                    checkBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
                };
            }
            switch (pkg.skill_type) {
                case 'listening':
                    return {
                        gradient: 'from-blue-500 to-cyan-500',
                        cardBg: 'bg-gradient-to-br from-blue-50 via-white to-cyan-50',
                        border: 'border-blue-200/60',
                        icon: Mic,
                        badge: 'bg-blue-100 text-blue-700 ring-blue-500/20',
                        shadow: 'shadow-blue-500/30',
                        hoverShadow: 'hover:shadow-blue-500/40',
                        glowColor: 'bg-blue-300',
                        priceColor: 'text-blue-700',
                        divider: 'border-blue-100',
                        checkBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
                    };
                case 'reading':
                    return {
                        gradient: 'from-violet-500 to-purple-500',
                        cardBg: 'bg-gradient-to-br from-violet-50 via-white to-purple-50',
                        border: 'border-violet-200/60',
                        icon: BookOpen,
                        badge: 'bg-violet-100 text-violet-700 ring-violet-500/20',
                        shadow: 'shadow-violet-500/30',
                        hoverShadow: 'hover:shadow-violet-500/40',
                        glowColor: 'bg-violet-300',
                        priceColor: 'text-violet-700',
                        divider: 'border-violet-100',
                        checkBg: 'bg-gradient-to-br from-violet-500 to-purple-500',
                    };
                case 'writing':
                    return {
                        gradient: 'from-amber-500 to-orange-500',
                        cardBg: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
                        border: 'border-amber-200/60',
                        icon: Lightbulb,
                        badge: 'bg-amber-100 text-amber-700 ring-amber-500/20',
                        shadow: 'shadow-amber-500/30',
                        hoverShadow: 'hover:shadow-amber-500/40',
                        glowColor: 'bg-amber-300',
                        priceColor: 'text-amber-700',
                        divider: 'border-amber-100',
                        checkBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
                    };
                case 'speaking':
                    return {
                        gradient: 'from-rose-500 to-pink-500',
                        cardBg: 'bg-gradient-to-br from-rose-50 via-white to-pink-50',
                        border: 'border-rose-200/60',
                        icon: Star,
                        badge: 'bg-rose-100 text-rose-700 ring-rose-500/20',
                        shadow: 'shadow-rose-500/30',
                        hoverShadow: 'hover:shadow-rose-500/40',
                        glowColor: 'bg-rose-300',
                        priceColor: 'text-rose-700',
                        divider: 'border-rose-100',
                        checkBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
                    };
                default:
                    return {
                        gradient: 'from-slate-500 to-gray-500',
                        cardBg: 'bg-gradient-to-br from-slate-50 via-white to-gray-50',
                        border: 'border-gray-200/60',
                        icon: Crown,
                        badge: 'bg-gray-100 text-gray-700 ring-gray-500/20',
                        shadow: 'shadow-gray-500/30',
                        hoverShadow: 'hover:shadow-gray-500/40',
                        glowColor: 'bg-gray-300',
                        priceColor: 'text-gray-700',
                        divider: 'border-gray-100',
                        checkBg: 'bg-gradient-to-br from-slate-500 to-gray-500',
                    };
            }
        };

        const style = getPackageStyle();
        const Icon = style.icon;

        return (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group relative overflow-hidden rounded-[2rem] ${style.cardBg} border ${style.border} shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] transition-all duration-500 flex flex-col h-full`}
            >
                {/* Colored top accent bar */}
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${style.gradient}`} />

                {/* Decorative background glow */}
                <div className={`absolute top-0 right-0 w-72 h-72 ${style.glowColor} opacity-[0.07] blur-3xl rounded-full pointer-events-none group-hover:opacity-[0.15] transition-opacity duration-500`} />
                <div className={`absolute bottom-0 left-0 w-48 h-48 ${style.glowColor} opacity-[0.05] blur-3xl rounded-full pointer-events-none group-hover:opacity-[0.10] transition-opacity duration-500`} />
                
                <div className="relative p-8 flex-grow flex flex-col">
                    {/* Header with Icon and Badge */}
                    <div className="flex justify-between items-start mb-6">
                        <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} shadow-lg ${style.shadow} transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}>
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${style.badge} ring-1 ring-inset`}>
                            {pkg.duration_months} Months
                        </div>
                    </div>

                    {/* Package Name */}
                    <h3 className={`text-2xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${style.gradient} transition-all duration-300`}>
                        {pkg.name}
                    </h3>

                    {/* Description */}
                    <div className="space-y-4 mb-8 flex-grow">
                        {pkg.description.split('\n').map((line, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-gray-600">
                                <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${style.checkBg} shrink-0`}>
                                    <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium leading-relaxed">{line}</span>
                            </div>
                        ))}
                    </div>

                    {/* Price and Action */}
                    <div className={`mt-auto pt-6 border-t ${style.divider}`}>
                        <div className="flex items-baseline justify-center gap-1 mb-6">
                            <span className={`text-3xl font-extrabold ${style.priceColor}`}>
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0
                                }).format(pkg.price)}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">/ package</span>
                        </div>
                        <button
                            onClick={() => handlePurchase(pkg.package_id)}
                            className={`w-full py-4 px-6 rounded-xl text-white font-bold tracking-wide bg-gradient-to-r ${style.gradient} shadow-lg ${style.shadow} ${style.hoverShadow} transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group/btn`}
                        >
                            <span className="relative z-10">Get Started</span>
                            <div className="absolute inset-0 h-full w-full bg-white/20 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] skew-x-12" />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    // Filter packages based on type
    const filteredPackages = activeFilter === 'all'
        ? packages
        : packages.filter(pkg =>
            pkg.package_type === 'single_skill' && pkg.skill_type === activeFilter
        );

    // Calculate pagination
    const indexOfLastPackage = currentPage * packagesPerPage;
    const indexOfFirstPackage = indexOfLastPackage - packagesPerPage;
    const currentPackages = filteredPackages.slice(indexOfFirstPackage, indexOfLastPackage);
    const totalPages = Math.ceil(filteredPackages.length / packagesPerPage);

    const Pagination = () => (
        <div className="flex justify-center mt-8 gap-2 items-center">
            <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg border font-bold transition-all duration-300 ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
            >
                Go Back
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`px-4 py-2 rounded-lg border font-bold transition-all duration-300 ${currentPage === number
                        ? 'bg-gradient-to-r from-[#34d399] to-[#10b981] text-white shadow-lg shadow-indigo-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    {number}
                </button>
            ))}

            <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg border font-bold transition-all duration-300 ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
            >
                Next
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 relative overflow-hidden"
        >
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-gray-100 to-transparent pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none" />
            <div className="absolute top-20 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100 shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Link to="/" className="text-gray-500 hover:text-emerald-600 flex items-center transition-colors duration-300">
                            <Home size={16} className="mr-1" />
                            Home
                        </Link>
                        <ChevronRight size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-semibold">VIP Packages</span>
                    </nav>
                </div>
            </motion.div>

            <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={container}
                    className="text-center mb-16 relative"
                >
                    <motion.div
                        variants={item}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-[#34d399] to-[#10b981] rounded-2xl shadow-xl shadow-emerald-500/30 mb-8"
                    >
                        <Crown className="w-10 h-10 text-white" />
                    </motion.div>
                    <motion.h1
                        variants={item}
                        className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-emerald-800 to-gray-900 tracking-tight"
                    >
                        Unlock Your Potential
                    </motion.h1>
                    <motion.p
                        variants={item}
                        className="text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed"
                    >
                        Choose the right premium package for your IELTS journey and reach your target band faster.
                    </motion.p>
                </motion.div>

                {/* No VIP Account - Benefits Info */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-12 bg-white/60 backdrop-blur-md border border-emerald-100 rounded-[2rem] shadow-lg shadow-emerald-500/5 p-6 md:p-8 text-left"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-emerald-100/50 p-3 rounded-2xl border border-emerald-200/50">
                            <Sparkles className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-xl m-0 tracking-tight">Free Tier Benefits</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-100 hover:shadow-md transition-all duration-300 group">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Star className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-gray-700 font-medium">Free <strong className="text-gray-900">Speaking</strong></span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-100 hover:shadow-md transition-all duration-300 group">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Lightbulb className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-gray-700 font-medium">Free <strong className="text-gray-900">Writing</strong> <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-1">1 AI/day</span></span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-amber-50 hover:border-amber-100 hover:shadow-md transition-all duration-300 group">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Mic className="w-5 h-5 text-amber-500" />
                            </div>
                            <span className="text-gray-700 font-medium"><strong className="text-amber-600">6</strong> Listening tests</span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-amber-50 hover:border-amber-100 hover:shadow-md transition-all duration-300 group">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <BookOpen className="w-5 h-5 text-amber-500" />
                            </div>
                            <span className="text-gray-700 font-medium"><strong className="text-amber-600">6</strong> Reading tests</span>
                        </div>
                    </div>
                </motion.div>

                <FilterSection />

                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={container}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {currentPackages.map((pkg, index) => (
                        <PackageCard key={pkg.package_id} pkg={pkg} index={index} />
                    ))}
                </motion.div>

                {totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Pagination />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default VIPPackages;
