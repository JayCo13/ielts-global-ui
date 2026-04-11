import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { ChevronRight, Home, Shield, Lock, AlertCircle, Crown, CheckCircle } from 'lucide-react';
import { checkTokenExpiration, logout } from '../utils/authUtils';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';

const Payment = () => {
    const [error, setError] = useState(null);
    const [paypalOrderId, setPaypalOrderId] = useState(null);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
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
        // Pre-warm PayPal token on backend so createOrder is instant
        fetch(`${API_BASE}/warmup-paypal`, { method: 'GET', mode: 'cors' }).catch(() => {});
    }, []);

    // Create PayPal order via backend
    const createOrder = async () => {
        if (!validateTokenAndRedirect()) return;
        setIsCreatingOrder(true);
        setError(null);

        const url = `${API_BASE}/customer/vip/packages/${packageId}/purchase`;
        console.log('[PayPal] createOrder called, URL:', url);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Session expired. Please login again.');

            console.log('[PayPal] Sending purchase request...');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('[PayPal] Response status:', response.status);
            const data = await response.json();
            console.log('[PayPal] Response data:', data);

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    navigate('/login', {
                        state: { message: 'Session expired. Please login again.', redirectFrom: 'payment' }
                    });
                    return;
                }
                throw new Error(data.detail || 'Failed to create payment. Please try again.');
            }

            setPaypalOrderId(data.paypal_order_id);
            console.log('[PayPal] Order created:', data.paypal_order_id);
            return data.paypal_order_id;

        } catch (err) {
            console.error('[PayPal] createOrder FAILED:', err.name, err.message);
            console.error('[PayPal] Full error:', err);
            setError(err.message || 'Unable to connect to server. Please try again.');
            throw err;
        } finally {
            setIsCreatingOrder(false);
        }
    };

    // Capture payment after PayPal approval
    const onApprove = async (data) => {
        setIsCapturing(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetchWithTimeout(`${API_BASE}/customer/vip/packages/${packageId}/capture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paypal_order_id: data.orderID
                })
            }, 45000);

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Payment capture failed.');
            }

            if (result.status === 'completed') {
                setPaymentComplete(true);
                // Redirect to success page after short delay
                setTimeout(() => {
                    navigate('/payment-success', { state: { fromPayment: true } });
                }, 2000);
            } else {
                setError(`Payment status: ${result.status}. Please contact support.`);
            }
        } catch (err) {
            console.error('Capture error:', err);
            setError(err.message);
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
                            <p className="text-sm text-blue-600">Please wait while we confirm your payment.</p>
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

                {/* PayPal Buttons */}
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
                                disabled={isCreatingOrder || isCapturing}
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
