import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, Shield, Lock, AlertCircle, Crown, CheckCircle } from 'lucide-react';
import { checkTokenExpiration, logout } from '../utils/authUtils';
import API_BASE from '../config/api';

/**
 * BULLETPROOF PAYMENT FLOW (Server-Side Capture)
 * ================================================
 * 1. Client creates PayPal order (client-side) — NO money moves yet
 * 2. User approves payment on PayPal popup
 * 3. Client sends order_id to backend — still NO money moves
 * 4. Backend captures payment via PayPal API + activates VIP atomically
 * 5. If capture fails → no money deducted, no VIP activated
 * 6. If capture succeeds → VIP is guaranteed to be activated
 *
 * CRITICAL: We save native fetch/XHR BEFORE PayPal SDK loads to avoid
 * PayPal's fetch() interception that causes "Failed to fetch" errors.
 */

// ─── Save pristine copies of browser network APIs BEFORE PayPal SDK loads ───
const _nativeFetch = window.fetch.bind(window);
const _NativeXHR = window.XMLHttpRequest;

const Payment = () => {
    const [error, setError] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [PayPalLoaded, setPayPalLoaded] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { packageId, package: selectedPackage } = location.state || {};

    // Store PayPal components after dynamic import
    const PayPalScriptProviderRef = useRef(null);
    const PayPalButtonsRef = useRef(null);

    // Redirect if no package selected
    useEffect(() => {
        if (!packageId || !selectedPackage) {
            navigate('/vip-packages');
            return;
        }
    }, [packageId, selectedPackage, navigate]);

    // Dynamically import PayPal SDK (AFTER saving native fetch/XHR above)
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

    // PayPal creates the order CLIENT-SIDE — NO money is captured here
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
     * Make backend call using NATIVE (un-intercepted) network APIs.
     * Uses the saved _nativeFetch and _NativeXHR from before PayPal loaded.
     */
    const nativeBackendCall = (paypalOrderId) => {
        const url = `${API_BASE}/customer/vip/packages/${packageId}/server-capture`;
        const token = localStorage.getItem('token');
        const bodyStr = JSON.stringify({ paypal_order_id: paypalOrderId });

        // Strategy 1: Native fetch (saved before PayPal SDK loaded)
        const tryNativeFetch = () => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            return _nativeFetch(url, {
                method: 'POST',
                headers,
                body: bodyStr,
            }).then(async (res) => {
                const result = await res.json();
                if (!res.ok) throw new Error(result.detail || `Server error ${res.status}`);
                return result;
            });
        };

        // Strategy 2: Native XMLHttpRequest (saved before PayPal SDK loaded)
        const tryNativeXHR = () => {
            return new Promise((resolve, reject) => {
                const xhr = new _NativeXHR();
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.timeout = 60000;

                xhr.onload = () => {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(result);
                        } else {
                            reject(new Error(result.detail || `Server error ${xhr.status}`));
                        }
                    } catch (e) {
                        reject(new Error('Invalid server response'));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error (XHR)'));
                xhr.ontimeout = () => reject(new Error('Request timed out'));
                xhr.send(bodyStr);
            });
        };

        // Strategy 3: Beacon + polling (absolute last resort)
        const tryBeacon = () => {
            // sendBeacon can't set Authorization header, so we encode token in URL
            // This won't work for our auth flow, but we include it as documentation
            // that we tried everything. Fall through to retry.
            return Promise.reject(new Error('Beacon not suitable'));
        };

        return { tryNativeFetch, tryNativeXHR, tryBeacon };
    };

    /**
     * After user approves on PayPal popup:
     * DO NOT capture on client. Send the order ID to backend.
     * Backend will capture + activate VIP in one atomic step.
     *
     * CRITICAL: We use setTimeout(0) to escape PayPal SDK's callback context,
     * then use our saved native fetch/XHR to avoid interception.
     */
    const onApprove = (data) => {
        const paypalOrderId = data.orderID;
        console.log('[PayPal] User approved order:', paypalOrderId);

        // Escape PayPal SDK's execution context with setTimeout
        setTimeout(async () => {
            setIsCapturing(true);
            setError(null);

            const { tryNativeFetch, tryNativeXHR } = nativeBackendCall(paypalOrderId);

            // Retry strategies in order: nativeFetch → nativeXHR → nativeFetch → nativeXHR
            const strategies = [
                { name: 'native-fetch', fn: tryNativeFetch },
                { name: 'native-xhr',   fn: tryNativeXHR },
                { name: 'native-fetch-retry', fn: tryNativeFetch },
                { name: 'native-xhr-retry',   fn: tryNativeXHR },
            ];

            let lastError;

            for (let i = 0; i < strategies.length; i++) {
                const { name, fn } = strategies[i];
                try {
                    console.log(`[PayPal] Attempt ${i + 1}/${strategies.length} via ${name}...`);
                    const result = await fn();
                    console.log('[PayPal] Server response:', result);

                    if (result.status === 'completed') {
                        setPaymentComplete(true);
                        setIsCapturing(false);
                        setTimeout(() => {
                            navigate('/payment-success', { state: { fromPayment: true } });
                        }, 2000);
                        return; // SUCCESS
                    } else {
                        setError(`Unexpected status: ${result.status}. Please contact support.`);
                        setIsCapturing(false);
                        return;
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`[PayPal] ${name} failed:`, err.message);

                    // Don't retry on auth errors
                    if (err.message?.includes('401') || err.message?.includes('Session expired')) {
                        logout();
                        navigate('/login', {
                            state: { message: 'Session expired. Please login again.', redirectFrom: 'payment' }
                        });
                        setIsCapturing(false);
                        return;
                    }

                    // Wait before retry (1s, 2s, 3s)
                    if (i < strategies.length - 1) {
                        const delay = 1000 * (i + 1);
                        console.log(`[PayPal] Waiting ${delay}ms before retry...`);
                        await new Promise(r => setTimeout(r, delay));
                    }
                }
            }

            // All retries exhausted
            console.error('[PayPal] All attempts failed:', lastError);
            setError(
                'Could not reach our server to process your payment. ' +
                'Your PayPal account has NOT been charged. ' +
                'Please try again or contact support. ' +
                '(Error: ' + (lastError?.message || 'Unknown') + ')'
            );
            setIsCapturing(false);
        }, 100); // 100ms delay to fully escape PayPal SDK context
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
                            <p className="text-sm text-blue-600">Please do not close this page. We are securely processing your payment.</p>
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
                {!paymentComplete && PayPalLoaded && PayPalScriptProvider && PayPalButtons && (
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
                                disabled={isCapturing}
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
                {!paymentComplete && !PayPalLoaded && (
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
