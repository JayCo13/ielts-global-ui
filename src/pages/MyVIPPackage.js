import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Calendar, Clock, CreditCard, Star, Layers, TrendingUp, Info } from 'lucide-react';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';

const MyVIPPackage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const response = await fetchWithTimeout(`${API_BASE}/customer/vip/subscription/history`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Cannot load VIP package info');
            }

            setSubscriptions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateLong = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate total VIP days from all active subscriptions
    const calculateTotalDays = () => {
        const activeSubscriptions = subscriptions.filter(sub => sub.is_active && sub.payment_status === 'completed');
        if (activeSubscriptions.length === 0) return { totalDays: 0, usedDays: 0 };

        const now = new Date();
        const firstStart = new Date(Math.min(...activeSubscriptions.map(s => new Date(s.start_date))));
        const lastEnd = new Date(Math.max(...activeSubscriptions.map(s => new Date(s.end_date))));

        const totalDays = Math.ceil((lastEnd - firstStart) / (1000 * 60 * 60 * 24));
        const usedDays = Math.max(0, Math.ceil((now - firstStart) / (1000 * 60 * 60 * 24)));
        const remainingDays = Math.max(0, Math.ceil((lastEnd - now) / (1000 * 60 * 60 * 24)));

        return { totalDays, usedDays, remainingDays, firstStart, lastEnd };
    };

    const vipStats = calculateTotalDays();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const statusConfig = {
        active: {
            color: 'text-emerald-700',
            bgColor: 'bg-emerald-50 border border-emerald-200',
            label: 'Active',
            icon: <Star className="w-4 h-4" fill="currentColor" />
        },
        completed: {
            color: 'text-emerald-700',
            bgColor: 'bg-emerald-50 border border-emerald-200',
            label: 'Paid',
            icon: <CreditCard className="w-4 h-4" />
        },
        expired: {
            color: 'text-gray-500',
            bgColor: 'bg-gray-50 border border-gray-200',
            label: 'Expired',
            icon: <Clock className="w-4 h-4" />
        },
        pending: {
            color: 'text-amber-700',
            bgColor: 'bg-amber-50 border border-amber-200',
            label: 'Processing',
            icon: <Clock className="w-4 h-4" />
        },
        reject: {
            color: 'text-rose-700',
            bgColor: 'bg-rose-50 border border-rose-200',
            label: 'Canceled',
            icon: <CreditCard className="w-4 h-4" />
        }
    };

    const getDisplayStatus = (subscription) => {
        if (subscription.is_active && subscription.payment_status === 'completed') {
            return 'active';
        }
        if (subscription.payment_status === 'completed' && !subscription.is_active) {
            return 'expired';
        }
        return subscription.payment_status || 'pending';
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        const s = getDisplayStatus(sub);
        return s === 'active' || s === 'expired' || s === 'completed';
    });
    const activeCount = subscriptions.filter(sub => sub.is_active).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Breadcrumb */}
            <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Link to="/" className="text-gray-500 hover:text-indigo-600 flex items-center transition-colors">
                            <Home size={16} className="mr-1" />
                            Home
                        </Link>
                        <ChevronRight size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-medium">My VIP Packages</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                        <Star className="w-8 h-8 text-white" fill="white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">My VIP Packages</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Manage and track your purchased VIP packages
                    </p>
                </div>

                {/* Stats Cards - Enhanced */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-100 rounded-xl">
                                <Layers className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total packages</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredSubscriptions.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 rounded-xl">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Remaining</p>
                                <p className="text-2xl font-bold text-blue-600">{vipStats.remainingDays || 0} Days</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-100 rounded-xl">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Expired</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {vipStats.lastEnd ? formatDate(vipStats.lastEnd) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VIP Timeline Progress - Only show if there are active subscriptions */}
                {activeCount > 0 && vipStats.totalDays > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                Your VIP Timeline
                            </h3>
                            <span className="text-sm text-gray-500">
                                {vipStats.usedDays} / {vipStats.totalDays} ngày
                            </span>
                        </div>
                        <div className="relative">
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (vipStats.usedDays / vipStats.totalDays) * 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>{formatDate(vipStats.firstStart)}</span>
                                <span className="text-indigo-600 font-medium">Today</span>
                                <span>{formatDate(vipStats.lastEnd)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* No VIP Benefits Info (only shown if activeCount === 0) */}
                {activeCount === 0 && (
                    <div className="mb-8 bg-white border border-emerald-100 rounded-2xl shadow-sm p-5 text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-emerald-100 p-2 rounded-xl">
                                <Info className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg m-0">No VIP Account - Benefits</h4>
                        </div>
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 text-sm">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-emerald-50 flex-1 justify-center whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-gray-700">Access free <strong className="text-gray-900">Speaking</strong></span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-emerald-50 flex-1 justify-center whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-gray-700">Access free <strong className="text-gray-900">Writing</strong> (1 AI/day)</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-amber-50 flex-1 justify-center whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                <span className="text-gray-700"><strong className="text-amber-600">6 free Listening tests</strong> only</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-amber-50 flex-1 justify-center whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                <span className="text-gray-700"><strong className="text-amber-600">6 free Reading tests</strong> only</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Action Buttons */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-white text-center sm:text-left">
                            <h3 className="font-semibold text-lg">Want to renew or upgrade?</h3>
                            <p className="text-indigo-200 text-sm">Add VIP time now - Automatically accumulates with current package</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Link to="/vip-packages?type=all" className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-sm">
                                All skills
                            </Link>
                            <Link to="/vip-packages?type=listening" className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors text-sm">
                                Listening
                            </Link>
                            <Link to="/vip-packages?type=reading" className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors text-sm">
                                Reading
                            </Link>
                            <Link to="/vip-packages?type=writing" className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors text-sm">
                                Writing
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-8 text-center text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {/* Subscription List - Timeline Style */}
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        VIP Packages History ({filteredSubscriptions.length} packages)
                    </h3>

                    {filteredSubscriptions.length > 0 ? (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-gray-200 hidden md:block"></div>

                            {filteredSubscriptions.map((subscription, index) => {
                                const displayStatus = getDisplayStatus(subscription);
                                const status = statusConfig[displayStatus] || statusConfig.pending;
                                const isActive = displayStatus === 'active';

                                return (
                                    <div key={subscription.subscription_id} className="relative mb-4 md:ml-12">
                                        {/* Timeline dot */}
                                        <div className={`absolute -left-12 top-6 w-4 h-4 rounded-full border-4 border-white shadow hidden md:block ${isActive ? 'bg-emerald-500' : 'bg-gray-300'
                                            }`}></div>

                                        {/* Card */}
                                        <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${isActive ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'
                                            }`}>
                                            {/* Header strip */}
                                            <div className={`h-1.5 ${isActive
                                                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                                : 'bg-gray-200'
                                                }`}></div>

                                            <div className="p-5">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    {/* Left: Package info */}
                                                    <div className="flex items-start gap-4">
                                                        {/* Package number badge */}
                                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isActive
                                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200'
                                                            : 'bg-gray-100 text-gray-400'
                                                            }`}>
                                                            #{subscriptions.length - index}
                                                        </div>

                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                                                {subscription.package_name}
                                                                {isActive && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>{formatDateLong(subscription.start_date)}</span>
                                                                <span>→</span>
                                                                <span className={isActive ? 'text-emerald-600 font-medium' : ''}>
                                                                    {formatDateLong(subscription.end_date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Status */}
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${status.bgColor} ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No VIP Packages</h3>
                            <p className="text-gray-500 mb-6">Register for a VIP package to access full learning content</p>
                            <Link
                                to="/vip-packages"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200"
                            >
                                <Star className="w-5 h-5 mr-2" />
                                View VIP Packages
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyVIPPackage;
