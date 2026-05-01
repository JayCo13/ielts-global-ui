import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, Shield, Lock, AlertCircle, Crown, CreditCard, RefreshCw } from 'lucide-react';
import { checkTokenExpiration, logout } from '../utils/authUtils';
import API_BASE from '../config/api';

/**
 * LEMON SQUEEZY PAYMENT FLOW
 * ==========================
 * 1. This page: User sees package info + "Subscribe Now" button
 * 2. User clicks → Frontend calls backend /create-checkout
 * 3. Backend returns checkout URL → Frontend opens LS Checkout Overlay
 * 4. User completes payment inside overlay (never leaves the page)
 * 5. LS sends webhook → Backend activates VIP
 * 6. Frontend polls for completion → Redirects to success page
 */

const Payment = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [polling, setPolling] = useState(false);

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

    // Initialize Lemon Squeezy when the script loads
    useEffect(() => {
        if (window.createLemonSqueezy) {
            window.createLemonSqueezy();
        }

        // Listen for Lemon Squeezy events
        const handleLSEvent = (event) => {
            if (event.detail?.event === 'Checkout.Success') {
                // Payment completed — start polling for webhook activation
                setPolling(true);
                pollForActivation();
            }
        };

        window.addEventListener('lemon-squeezy:event', handleLSEvent);
        return () => window.removeEventListener('lemon-squeezy:event', handleLSEvent);
    }, []);

    // Poll for VIP activation (webhook may take a few seconds)
    const pollForActivation = async () => {
        const token = localStorage.getItem('token');
        const maxAttempts = 15;
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const res = await fetch(`${API_BASE}/customer/vip/subscription/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.is_subscribed) {
                        // VIP activated! Navigate to success
                        navigate('/payment-success', { state: { fromPayment: true } });
                        return;
                    }
                }
            } catch (err) {
                console.warn(`Poll attempt ${i + 1} failed:`, err.message);
            }
            
            // Wait before next poll (increasing delay)
            await new Promise(r => setTimeout(r, 2000 + (i * 500)));
        }
        
        // After all polls, still redirect to processing page
        navigate('/payment-processing', { 
            state: { packageId, packageName: selectedPackage?.name } 
        });
    };

    // Create checkout and open overlay
    const handleSubscribe = async () => {
        if (!validateTokenAndRedirect()) return;
        setError(null);
        setLoading(true);

        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE}/customer/vip/packages/${packageId}/create-checkout`, {
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

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to create checkout');
            }

            const data = await res.json();
            const checkoutUrl = data.checkout_url;

            if (!checkoutUrl) {
                throw new Error('No checkout URL received');
            }

            // Open Lemon Squeezy Checkout Overlay
            if (window.LemonSqueezy) {
                window.LemonSqueezy.Url.Open(checkoutUrl);
            } else {
                // Fallback: redirect to checkout URL
                window.location.href = checkoutUrl;
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.message || 'Failed to start payment. Please try again.');
        } finally {
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
                                <h2 className="text-xl font-bold text-white">Confirm Subscription</h2>
                                <p className="text-white/80 text-sm">You are subscribing to a VIP plan</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedPackage.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Duration: {selectedPackage.duration_months} month{selectedPackage.duration_months > 1 ? 's' : ''} / billing cycle
                                </p>
                                {selectedPackage.description && (
                                    <p className="text-sm text-gray-600 mt-2">{selectedPackage.description}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-extrabold text-lime-600">
                                    ${Number(selectedPackage.price).toFixed(2)}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">USD / month</p>
                            </div>
                        </div>

                        {/* Subscription Info */}
                        <div className="mt-4 bg-lime-50 rounded-xl p-4 border border-lime-100">
                            <div className="flex items-start gap-3">
                                <RefreshCw className="w-5 h-5 text-lime-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-lime-800">Monthly Auto-Renewal</p>
                                    <p className="text-xs text-lime-600 mt-1">
                                        Your subscription will automatically renew each month. 
                                        You can cancel anytime from your VIP dashboard — your access continues until the end of the billing period.
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

                {/* Polling indicator */}
                {polling && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6 text-center">
                        <svg className="animate-spin h-8 w-8 text-lime-600 mx-auto mb-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-gray-600 font-medium">Payment completed! Activating your VIP...</p>
                        <p className="text-sm text-gray-400 mt-1">This usually takes a few seconds</p>
                    </div>
                )}

                {/* Subscribe Button */}
                {!polling && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-lime-600" />
                            Secure Payment
                        </h3>

                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold text-lg rounded-xl hover:from-lime-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating checkout...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Subscribe Now — ${Number(selectedPackage.price).toFixed(2)}/mo
                                </>
                            )}
                        </button>

                        <p className="text-xs text-gray-400 text-center mt-4">
                            Pay securely with Credit/Debit Card • Cancel anytime
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Lock className="w-4 h-4 text-lime-600" />
                        <span>Secured by Lemon Squeezy • SSL Encrypted • Auto-renewable subscription</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
