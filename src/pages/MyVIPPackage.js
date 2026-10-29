import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Calendar, Clock, CreditCard, Star, Layers, RefreshCw, XCircle, ExternalLink, CheckCircle, AlertTriangle, X, Crown, Headphones, BookOpen, PenTool, Mic, Plus, ShieldCheck, Lock } from 'lucide-react';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';

const MyVIPPackage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [resuming, setResuming] = useState(false);
    const [managingBilling, setManagingBilling] = useState(false);
    const [activeDetails, setActiveDetails] = useState([]);

    // Modal state
    const [modal, setModal] = useState({ open: false, type: 'alert', title: '', message: '', onConfirm: null });

    const showAlert = useCallback((title, message, type = 'success') => {
        setModal({ open: true, type: 'alert', variant: type, title, message, onConfirm: null });
    }, []);

    const showConfirm = useCallback((title, message, onConfirm) => {
        setModal({ open: true, type: 'confirm', variant: 'warning', title, message, onConfirm });
    }, []);

    const closeModal = useCallback(() => {
        setModal(prev => ({ ...prev, open: false }));
    }, []);

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

            // Per-skill access (active subscriptions with package type) — best effort
            try {
                const statusRes = await fetchWithTimeout(`${API_BASE}/customer/vip/subscription/status`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setActiveDetails(statusData.subscriptions || []);
                }
            } catch (statusErr) {
                setActiveDetails([]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const doCancelSubscription = async () => {
        setCancellingId(true);
        try {
            const response = await fetchWithTimeout(`${API_BASE}/customer/vip/subscription/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to cancel subscription');
            }

            showAlert('Subscription Cancelled', 'Your VIP access will remain active until the end of the billing period.', 'success');
            fetchSubscriptions();
        } catch (err) {
            showAlert('Error', err.message, 'error');
        } finally {
            setCancellingId(null);
        }
    };

    const handleCancelSubscription = () => {
        showConfirm(
            'Cancel Subscription?',
            'Your VIP access will remain active until the end of the current billing period. You will not be charged again after cancellation.',
            doCancelSubscription
        );
    };

    const doResumeSubscription = async () => {
        setResuming(true);
        try {
            const response = await fetchWithTimeout(`${API_BASE}/customer/vip/subscription/resume`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to resume subscription');
            }

            showAlert('Subscription Resumed', 'Auto-renewal is now active. You will be charged at the end of the current billing period.', 'success');
            fetchSubscriptions();
        } catch (err) {
            showAlert('Error', err.message, 'error');
        } finally {
            setResuming(false);
        }
    };

    const handleResumeSubscription = () => {
        showConfirm(
            'Resume Subscription?',
            'Auto-renewal will be re-activated and you will be charged at the end of the current billing period.',
            doResumeSubscription
        );
    };

    const handleManageBilling = async () => {
        setManagingBilling(true);
        try {
            const response = await fetchWithTimeout(`${API_BASE}/customer/vip/subscription/manage`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to get billing portal');
            }

            if (data.customer_portal_url) {
                window.open(data.customer_portal_url, '_blank');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setManagingBilling(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateLong = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
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

        const totalDays = Math.round((lastEnd - firstStart) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(0, Math.ceil((lastEnd - now) / (1000 * 60 * 60 * 24)));
        const usedDays = Math.max(0, totalDays - remainingDays);

        return { totalDays, usedDays, remainingDays, firstStart, lastEnd };
    };

    const vipStats = calculateTotalDays();

    // Check if any active subscription has auto-renew
    const hasAutoRenewSub = subscriptions.some(sub => sub.is_active && sub.is_auto_renew && sub.ls_subscription_id);
    const hasCancelledSub = subscriptions.some(sub => sub.is_active && !sub.is_auto_renew && sub.cancelled_at);
    const hasLSSub = subscriptions.some(sub => sub.ls_subscription_id);
    // LS store suspended (2026-07): its API rejects cancel/resume, so hide those buttons
    const lsSelfServiceDisabled = true;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const statusConfig = {
        active: {
            color: 'text-emerald-700',
            bgColor: 'bg-emerald-50 border border-emerald-200',
            label: 'Active',
            icon: <Star className="w-3.5 h-3.5" fill="currentColor" />
        },
        scheduled: {
            color: 'text-indigo-700',
            bgColor: 'bg-indigo-50 border border-indigo-200',
            label: 'Upcoming',
            icon: <Calendar className="w-3.5 h-3.5" />
        },
        completed: {
            color: 'text-emerald-700',
            bgColor: 'bg-emerald-50 border border-emerald-200',
            label: 'Paid',
            icon: <CreditCard className="w-3.5 h-3.5" />
        },
        expired: {
            color: 'text-gray-500',
            bgColor: 'bg-gray-50 border border-gray-200',
            label: 'Expired',
            icon: <Clock className="w-3.5 h-3.5" />
        },
        pending: {
            color: 'text-amber-700',
            bgColor: 'bg-amber-50 border border-amber-200',
            label: 'Processing',
            icon: <Clock className="w-3.5 h-3.5" />
        },
        reject: {
            color: 'text-rose-700',
            bgColor: 'bg-rose-50 border border-rose-200',
            label: 'Canceled',
            icon: <CreditCard className="w-3.5 h-3.5" />
        }
    };

    const getDisplayStatus = (subscription) => {
        if (subscription.is_active && subscription.payment_status === 'completed') {
            // Stacked purchase whose period has not started yet
            if (new Date(subscription.start_date) > new Date()) return 'scheduled';
            return 'active';
        }
        if (subscription.payment_status === 'completed' && !subscription.is_active) {
            return 'expired';
        }
        return subscription.payment_status || 'pending';
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        const s = getDisplayStatus(sub);
        return s === 'active' || s === 'scheduled' || s === 'expired' || s === 'completed';
    });
    const activeCount = subscriptions.filter(sub => sub.is_active).length;
    const lastExpiredEnd = !activeCount && filteredSubscriptions.length > 0
        ? new Date(Math.max(...filteredSubscriptions.map(s => new Date(s.end_date))))
        : null;

    // Latest end date per skill. 'all_skills' is the Listening + Reading bundle
    // (backend app/utils/vip_access.py ALL_SKILLS_COVERS).
    const skillEnds = {};
    activeDetails.forEach(sub => {
        const covers = sub.package_type === 'all_skills' ? ['listening', 'reading'] : [sub.skill_type];
        covers.forEach(skill => {
            if (!skill) return;
            const end = new Date(sub.end_date);
            if (!skillEnds[skill] || end > skillEnds[skill]) skillEnds[skill] = end;
        });
    });

    const skills = [
        { key: 'listening', label: 'Listening', icon: Headphones, tint: 'bg-sky-100 text-sky-600' },
        { key: 'reading', label: 'Reading', icon: BookOpen, tint: 'bg-emerald-100 text-emerald-600' },
        { key: 'writing', label: 'Writing', icon: PenTool, tint: 'bg-violet-100 text-violet-600' },
        { key: 'speaking', label: 'Speaking', icon: Mic, tint: 'bg-amber-100 text-amber-600' },
    ];

    const progressPct = vipStats.totalDays > 0
        ? Math.min(100, (vipStats.usedDays / vipStats.totalDays) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb */}
            <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My VIP Packages</h1>
                        <p className="text-gray-500 mt-1">Your VIP access, skills and purchase history</p>
                    </div>
                    <Link
                        to="/vip-packages"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add VIP time
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="text-center text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {/* Status hero */}
                {activeCount > 0 ? (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-700 text-white p-6 sm:p-8 shadow-lg">
                        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5"></div>
                        <div className="absolute right-10 bottom-[-80px] w-48 h-48 rounded-full bg-white/5"></div>
                        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-sm font-medium">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                    VIP active
                                </div>
                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">{vipStats.remainingDays || 0}</span>
                                    <span className="text-xl text-indigo-200">days left</span>
                                </div>
                                <p className="text-indigo-200 mt-1">{`Access until ${formatDateLong(vipStats.lastEnd)}`}</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 md:max-w-xs">
                                <Crown className="w-8 h-8 text-amber-300 flex-shrink-0" />
                                <p className="text-sm text-indigo-100">
                                    One-time purchase. Nothing renews automatically, so you are never charged again unless you buy more time.
                                </p>
                            </div>
                        </div>

                        {vipStats.totalDays > 0 && (
                            <div className="relative mt-8">
                                <div className="flex justify-between text-xs text-indigo-200 mb-2">
                                    <span>{formatDate(vipStats.firstStart)}</span>
                                    <span>{`${vipStats.usedDays} / ${vipStats.totalDays} days used`}</span>
                                    <span>{formatDate(vipStats.lastEnd)}</span>
                                </div>
                                <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-300 to-sky-300 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPct}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Crown className="w-7 h-7 text-gray-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {lastExpiredEnd ? 'Your VIP has ended' : 'You are on the Free plan'}
                                </h2>
                                <p className="text-gray-500 mt-1">
                                    {lastExpiredEnd
                                        ? `Your last VIP period ended on ${formatDateLong(lastExpiredEnd)}. Buy a package to unlock full content again.`
                                        : 'Get a VIP package to unlock every test, full explanations and more AI feedback.'}
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/vip-packages"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md whitespace-nowrap"
                        >
                            <Star className="w-5 h-5" />
                            View VIP Packages
                        </Link>
                    </div>
                )}

                {/* Skill access */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Skill access</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {skills.map(({ key, label, icon: Icon, tint }) => {
                            const end = skillEnds[key];
                            return (
                                <div
                                    key={key}
                                    className={`bg-white rounded-2xl p-4 border shadow-sm flex flex-col ${end ? 'border-emerald-200' : 'border-gray-100'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        {end
                                            ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            : <Lock className="w-4 h-4 text-gray-300" />}
                                    </div>
                                    <p className="mt-3 font-semibold text-gray-900">{label}</p>
                                    {end ? (
                                        <p className="text-sm text-emerald-600">{`VIP until ${formatDate(end)}`}</p>
                                    ) : (
                                        <Link
                                            to={`/vip-packages?type=${key}`}
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            Get VIP →
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* How one-time packages work */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid sm:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900 text-sm">Pay once</p>
                            <p className="text-sm text-gray-500">Each package is a single payment with no subscription.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Layers className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900 text-sm">Time adds up</p>
                            <p className="text-sm text-gray-500">A new package for the same skill starts when your current one ends.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900 text-sm">No auto-renewal</p>
                            <p className="text-sm text-gray-500">When your time runs out, buy again only if you want to.</p>
                        </div>
                    </div>
                </div>

                {/* Legacy Lemon Squeezy subscription (bought before one-time packages) */}
                {activeCount > 0 && hasLSSub && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-indigo-600" />
                                    Billing
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Receipts and payment details for your earlier subscription.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleManageBilling}
                                    disabled={managingBilling}
                                    className="px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {managingBilling ? 'Opening...' : 'Manage Billing'}
                                </button>
                                {!lsSelfServiceDisabled && hasAutoRenewSub && (
                                    <button
                                        onClick={handleCancelSubscription}
                                        disabled={cancellingId}
                                        className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        {cancellingId ? 'Cancelling...' : 'Cancel Subscription'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {!lsSelfServiceDisabled && hasCancelledSub && (
                            <div className="mt-3 bg-amber-50 rounded-lg px-4 py-3 border border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-sm text-amber-700">
                                    ⚠️ Your subscription has been cancelled. VIP access remains active until the end of the billing period.
                                </p>
                                <button
                                    onClick={handleResumeSubscription}
                                    disabled={resuming}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                                >
                                    <RefreshCw className={`w-4 h-4 ${resuming ? 'animate-spin' : ''}`} />
                                    {resuming ? 'Resuming...' : 'Resume Subscription'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Purchase history */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Purchase history</h3>
                        <span className="min-w-[28px] text-center text-sm font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{filteredSubscriptions.length}</span>
                    </div>

                    {filteredSubscriptions.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                            {filteredSubscriptions.map((subscription) => {
                                const displayStatus = getDisplayStatus(subscription);
                                const status = statusConfig[displayStatus] || statusConfig.pending;
                                const isCurrent = displayStatus === 'active' || displayStatus === 'scheduled';

                                return (
                                    <li key={subscription.subscription_id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCurrent ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <Crown className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`font-medium truncate ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {subscription.package_name}
                                                </p>
                                                <p className="text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{formatDate(subscription.start_date)}</span>
                                                    <span>→</span>
                                                    <span>{formatDate(subscription.end_date)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`self-start sm:self-auto ml-[52px] sm:ml-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bgColor} ${status.color}`}>
                                            {status.icon}
                                            {status.label}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="text-center p-10">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Star className="w-7 h-7 text-gray-400" />
                            </div>
                            <p className="font-medium text-gray-900">No VIP Packages</p>
                            <p className="text-sm text-gray-500 mt-1">Packages you buy will appear here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Modal */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-[modalIn_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                                modal.variant === 'success' ? 'bg-emerald-100' :
                                modal.variant === 'error' ? 'bg-red-100' :
                                'bg-amber-100'
                            }`}>
                                {modal.variant === 'success' ? (
                                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                                ) : modal.variant === 'error' ? (
                                    <XCircle className="w-7 h-7 text-red-600" />
                                ) : (
                                    <AlertTriangle className="w-7 h-7 text-amber-600" />
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            {modal.title}
                        </h3>

                        {/* Message */}
                        <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                            {modal.message}
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            {modal.type === 'confirm' ? (
                                <>
                                    <button
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => { closeModal(); modal.onConfirm?.(); }}
                                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors text-white ${
                                            modal.title.includes('Cancel')
                                                ? 'bg-red-500 hover:bg-red-600'
                                                : 'bg-emerald-500 hover:bg-emerald-600'
                                        }`}
                                    >
                                        {modal.title.includes('Cancel') ? 'Yes, Cancel' : 'Yes, Resume'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyVIPPackage;
