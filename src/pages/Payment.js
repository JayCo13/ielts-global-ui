import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, Shield, Lock, AlertCircle, Crown, QrCode, Clock } from 'lucide-react';
import { checkTokenExpiration, logout } from '../utils/authUtils';
import API_BASE from '../config/api';

/**
 * PAYOS PAYMENT FLOW
 * ==================
 * 1. This page: User sees package info + "Pay Now" button
 * 2. User clicks → Frontend calls backend /packages/{id}/purchase
 * 3. Backend creates a PayOS payment link → returns { checkoutUrl }
 * 4. Frontend redirects (full navigation) to the PayOS hosted checkout
 * 5. User pays by scanning the VietQR / bank transfer on PayOS
 * 6. PayOS sends a webhook → Backend activates VIP
 * 7. PayOS redirects the user back to /payment-processing (polls for activation)
 *
 * This is a one-time purchase: VIP time is added to the account.
 * There is no automatic card renewal — the user buys again to extend.
 */

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

const Payment = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const inProgressRef = useRef(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { packageId, package: selectedPackage } = location.state || {};

    // Redirect if no package selected
    useEffect(() => {
        if (!packageId || !selectedPackage) {
            navigate('/vip-packages');
            return;
        }
    }, [packageId, selectedPackage, navigate]);

    // Token validation
    const validateTokenAndRedirect = () => {
        const tokenCheck = checkTokenExpiration();
        if (!tokenCheck.isValid) {
            logout();
            navigate('/login', {
                state: {
                    message: 'Session expired. Please login again.',
                    redirectFrom: 'payment'
                }
            });
            return false;
        }
        return true;
    };

    useEffect(() => {
        validateTokenAndRedirect();
    }, []);

    // Create PayOS payment link and redirect to the hosted checkout
    const handlePay = async () => {
        if (inProgressRef.current) return; // guard against double-clicks
        if (!validateTokenAndRedirect()) return;
        inProgressRef.current = true;
        setError(null);
        setLoading(true);

        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE}/customer/vip/packages/${packageId}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.status === 401) {
                navigate('/login', { state: { message: 'Session expired.' } });
                return;
            }

            if (res.status === 429) {
                throw new Error('Too many payment requests. Please try again in a few minutes.');
            }

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to create payment link');
            }

            const data = await res.json();
            const checkoutUrl = data.checkoutUrl;

            if (!checkoutUrl) {
                throw new Error('No checkout URL received');
            }

            // Full redirect to the PayOS hosted checkout page
            window.location.href = checkoutUrl;
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message || 'Failed to start payment. Please try again.');
            inProgressRef.current = false;
            setLoading(false);
        }
    };

    if (!selectedPackage) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Breadcrumb */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Link to="/" className="text-gray-500 hover:text-lime-600 transition-colors">
                            <Home size={16} className="inline mr-1" />
                            Home
                        </Link>
                        <ChevronRight size={16} className="text-gray-400" />
                        <Link to="/my-vip-package" className="text-gray-500 hover:text-lime-600 transition-colors">
                            VIP Plans
                        </Link>
                        <ChevronRight size={16} className="text-gray-400" />
                        <span className="text-lime-600 font-medium">Payment</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Package Info Card */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-lime-500 to-emerald-500 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 rounded-full p-2">
                                <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Confirm Purchase</h2>
                                <p className="text-white/80 text-sm">You are purchasing a VIP plan</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedPackage.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Duration: {selectedPackage.duration_months} month{selectedPackage.duration_months > 1 ? 's' : ''}
                                </p>
                                {selectedPackage.description && (
                                    <p className="text-sm text-gray-600 mt-2">{selectedPackage.description}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-extrabold text-lime-600">
                                    {formatVnd(selectedPackage.price)}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">VND / {selectedPackage.duration_months} month{selectedPackage.duration_months > 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        {/* One-time purchase info */}
                        <div className="mt-4 bg-lime-50 rounded-xl p-4 border border-lime-100">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-lime-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-lime-800">One-time payment — {selectedPackage.duration_months} month{selectedPackage.duration_months > 1 ? 's' : ''} of VIP access</p>
                                    <p className="text-xs text-lime-600 mt-1">
                                        This is a one-time purchase. Your VIP time is added to your account and there is no automatic renewal.
                                        When it runs out, simply purchase again to extend.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Pay Button */}
                {(
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-lime-600" />
                            Secure Payment
                        </h3>

                        <button
                            onClick={handlePay}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold text-lg rounded-xl hover:from-lime-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Redirecting to payment...
                                </>
                            ) : (
                                <>
                                    <QrCode className="w-5 h-5" />
                                    Pay Now — {formatVnd(selectedPackage.price)}
                                </>
                            )}
                        </button>

                        <p className="text-xs text-gray-400 text-center mt-4">
                            You will be redirected to scan a VietQR code or transfer via your bank
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Lock className="w-4 h-4 text-lime-600" />
                        <span>Secured by PayOS • SSL Encrypted • One-time payment</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
