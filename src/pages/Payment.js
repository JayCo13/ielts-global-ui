import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, Shield, Lock, AlertCircle, Crown } from 'lucide-react';
import { checkTokenExpiration, logout } from '../utils/authUtils';

/**
 * BULLETPROOF PAYMENT FLOW
 * ========================
 * 1. This page: User sees package info + PayPal buttons
 * 2. User clicks Pay → PayPal creates order (NO money moves)
 * 3. User approves on PayPal popup (still NO money moves)
 * 4. onApprove → NAVIGATE to /payment-processing (a CLEAN page with NO PayPal SDK)
 * 5. PaymentProcessing page calls backend /server-capture
 * 6. Backend captures + activates VIP atomically
 *
 * This 2-page approach guarantees PayPal SDK cannot interfere with backend calls.
 */

const Payment = () => {
    const [error, setError] = useState(null);
    const [PayPalLoaded, setPayPalLoaded] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { packageId, package: selectedPackage } = location.state || {};

    const PayPalScriptProviderRef = useRef(null);
    const PayPalButtonsRef = useRef(null);

    // Redirect if no package selected
    useEffect(() => {
        if (!packageId || !selectedPackage) {
            navigate('/vip-packages');
            return;
        }
    }, [packageId, selectedPackage, navigate]);

    // Dynamically import PayPal SDK
    useEffect(() => {
        import('@paypal/react-paypal-js').then((mod) => {
            PayPalScriptProviderRef.current = mod.PayPalScriptProvider;
            PayPalButtonsRef.current = mod.PayPalButtons;
            setPayPalLoaded(true);
        });
    }, []);

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

    // PayPal creates the order — NO money captured
    const createOrder = (data, actions) => {
        if (!validateTokenAndRedirect()) return;
        setError(null);

        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: Number(selectedPackage.price).toFixed(2),
                    currency_code: "USD"
                },
                description: `VIP Package: ${selectedPackage.name}`
            }]
        });
    };

    /**
     * After user approves: DO NOT call backend here.
     * Instead, navigate to a CLEAN page that has no PayPal SDK loaded.
     * That page will handle the backend call without any interference.
     */
    const onApprove = (data) => {
        const paypalOrderId = data.orderID;
        console.log('[PayPal] User approved order:', paypalOrderId, '→ navigating to processing page');

        // Navigate to processing page with order details
        navigate('/payment-processing', {
            state: {
                paypalOrderId,
                packageId,
                packageName: selectedPackage.name,
            }
        });
    };

    const onError = (err) => {
        console.error('PayPal error:', err);
        setError('Payment failed. Please try again or contact support.');
    };

    const onCancel = () => {
        setError('Payment cancelled. You can try again whenever you\'re ready.');
    };

    if (!selectedPackage) return null;

    const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

    if (!paypalClientId) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-200 max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-800 mb-2">Payment Not Configured</h2>
                    <p className="text-red-600">PayPal is not configured yet. Please contact support.</p>
                </div>
            </div>
        );
    }

    const PayPalScriptProvider = PayPalScriptProviderRef.current;
    const PayPalButtons = PayPalButtonsRef.current;

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
                                <h2 className="text-xl font-bold text-white">Confirm Payment</h2>
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
                                    ${Number(selectedPackage.price).toFixed(2)}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">USD</p>
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

                {/* PayPal Buttons */}
                {PayPalLoaded && PayPalScriptProvider && PayPalButtons && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-lime-600" />
                            Choose Payment Method
                        </h3>

                        <PayPalScriptProvider options={{
                            "client-id": paypalClientId,
                            currency: "USD",
                            intent: "capture",
                            "enable-funding": "venmo",
                        }}>
                            <PayPalButtons
                                style={{
                                    layout: "vertical",
                                    color: "gold",
                                    shape: "rect",
                                    label: "pay",
                                    height: 50,
                                }}
                                createOrder={createOrder}
                                onApprove={onApprove}
                                onError={onError}
                                onCancel={onCancel}
                            />
                        </PayPalScriptProvider>

                        <p className="text-xs text-gray-400 text-center mt-4">
                            Pay securely with PayPal, Credit/Debit Card, Venmo, or Apple Pay
                        </p>
                    </div>
                )}

                {/* Loading PayPal */}
                {!PayPalLoaded && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6 text-center">
                        <svg className="animate-spin h-8 w-8 text-lime-600 mx-auto mb-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-gray-500">Loading payment options...</p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Lock className="w-4 h-4 text-lime-600" />
                        <span>Secured by PayPal • SSL Encrypted • Server-side processing</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
