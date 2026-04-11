import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { ChevronRight, Home, Shield, Lock, AlertCircle, Crown, CheckCircle } from 'lucide-react';
import { checkTokenExpiration, logout } from '../utils/authUtils';
import API_BASE from '../config/api';

/**
 * XMLHttpRequest-based API call — avoids PayPal SDK's fetch() interception.
 * Returns a Promise so it can be used with async/await.
 */
const apiCall = (method, url, body = null) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        const token = localStorage.getItem('token');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.timeout = 45000;
        
        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data);
                } else {
                    reject(new Error(data.detail || `Request failed with status ${xhr.status}`));
                }
            } catch (e) {
                reject(new Error('Invalid response from server'));
            }
        };
        
        xhr.onerror = () => reject(new Error('Network error. Please check your connection.'));
        xhr.ontimeout = () => reject(new Error('Request timed out. Please try again.'));
        
        xhr.send(body ? JSON.stringify(body) : null);
    });
};

const Payment = () => {
    const [error, setError] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);

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

    // PayPal creates the order CLIENT-SIDE (no backend call needed)
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

    // After user approves: capture client-side, then verify+activate on backend
    const onApprove = async (data, actions) => {
        setIsCapturing(true);
        setError(null);

        try {
            // Step 1: Capture the payment via PayPal SDK (client-side)
            const details = await actions.order.capture();
            console.log('[PayPal] Captured:', details.id, details.status);

            if (details.status !== 'COMPLETED') {
                throw new Error(`Payment not completed. Status: ${details.status}`);
            }

            // Step 2: Verify + activate VIP on backend (uses XMLHttpRequest, not fetch)
            const result = await apiCall(
                'POST',
                `${API_BASE}/customer/vip/packages/${packageId}/verify-and-activate`,
                { paypal_order_id: details.id }
            );

            console.log('[PayPal] VIP activated:', result);

            if (result.status === 'completed') {
                setPaymentComplete(true);
                setTimeout(() => {
                    navigate('/payment-success', { state: { fromPayment: true } });
                }, 2000);
            } else {
                setError(`Unexpected status: ${result.status}. Please contact support.`);
            }
        } catch (err) {
            console.error('[PayPal] Error:', err);
            
            if (err.message?.includes('Session expired') || err.message?.includes('401')) {
                logout();
                navigate('/login', {
                    state: { message: 'Session expired. Please login again.', redirectFrom: 'payment' }
                });
                return;
            }
            
            setError(err.message || 'Payment processing failed. Please contact support.');
        } finally {
            setIsCapturing(false);
        }
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

                {/* Payment Success Banner */}
                {paymentComplete && (
                    <div className="mb-6 p-5 rounded-2xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-4">
                        <div className="bg-green-100 rounded-full p-2">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Payment Successful!</p>
                            <p className="text-sm text-green-600">Your VIP plan has been activated. Redirecting...</p>
                        </div>
                    </div>
                )}

                {/* Capture Loading */}
                {isCapturing && (
                    <div className="mb-6 p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-4">
                        <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <div>
                            <p className="font-bold">Processing payment...</p>
                            <p className="text-sm text-blue-600">Please wait while we verify and activate your VIP.</p>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* PayPal Buttons — order is created client-side, no backend fetch needed */}
                {!paymentComplete && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-lime-600" />
                            Choose Payment Method
                        </h3>

                        <PayPalScriptProvider options={{
                            "client-id": paypalClientId,
                            currency: "USD",
                            intent: "capture",
                        }}>
                            <PayPalButtons
                                style={{
                                    layout: "vertical",
                                    color: "gold",
                                    shape: "rect",
                                    label: "pay",
                                    height: 50,
                                }}
                                disabled={isCapturing}
                                createOrder={createOrder}
                                onApprove={onApprove}
                                onError={onError}
                                onCancel={onCancel}
                            />
                        </PayPalScriptProvider>

                        <p className="text-xs text-gray-400 text-center mt-4">
                            Pay securely with PayPal or Credit/Debit Card
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Lock className="w-4 h-4 text-lime-600" />
                        <span>Secured by PayPal • SSL Encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
