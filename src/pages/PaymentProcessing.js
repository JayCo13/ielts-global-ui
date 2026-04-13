import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import API_BASE from '../config/api';

/**
 * PaymentProcessing — A CLEAN page with NO PayPal SDK loaded.
 * This page receives the PayPal order ID and calls the backend
 * to capture + activate VIP. Since PayPal SDK is NOT present,
 * fetch/XHR work normally without any interception.
 */
const PaymentProcessing = () => {
    const [status, setStatus] = useState('processing'); // processing | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const [attempt, setAttempt] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();
    const { paypalOrderId, packageId, packageName } = location.state || {};

    useEffect(() => {
        if (!paypalOrderId || !packageId) {
            navigate('/vip-packages');
            return;
        }
        capturePayment();
    }, []);

    const capturePayment = async () => {
        setStatus('processing');
        setErrorMsg('');
        setAttempt(prev => prev + 1);

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { message: 'Please login to continue.' } });
            return;
        }

        const url = `${API_BASE}/customer/vip/packages/${packageId}/server-capture`;

        // Try up to 3 times with increasing delays
        for (let i = 0; i < 3; i++) {
            try {
                console.log(`[Payment] Attempt ${i + 1}/3 to capture order ${paypalOrderId}`);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ paypal_order_id: paypalOrderId }),
                });

                const result = await response.json();

                if (response.ok && result.status === 'completed') {
                    console.log('[Payment] VIP activated successfully!');
                    setStatus('success');
                    setTimeout(() => {
                        navigate('/payment-success', { state: { fromPayment: true } });
                    }, 2500);
                    return;
                } else if (response.status === 401) {
                    navigate('/login', { state: { message: 'Session expired. Please login again.' } });
                    return;
                } else {
                    throw new Error(result.detail || `Server returned status ${response.status}`);
                }
            } catch (err) {
                console.warn(`[Payment] Attempt ${i + 1} failed:`, err.message);
                
                if (i < 2) {
                    // Wait before retry (2s, 4s)
                    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
                } else {
                    // All retries failed
                    setStatus('error');
                    setErrorMsg(err.message || 'Unknown error');
                }
            }
        }
    };

    if (!paypalOrderId) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Processing */}
                {status === 'processing' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                        <div className="relative mx-auto w-16 h-16 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-lime-200"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-lime-500 border-t-transparent animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
                        <p className="text-gray-500 mb-4">
                            Please do not close this page. We are securely capturing your payment and activating your VIP access.
                        </p>
                        {packageName && (
                            <div className="bg-lime-50 rounded-lg px-4 py-2 inline-block">
                                <span className="text-sm font-medium text-lime-700">{packageName}</span>
                            </div>
                        )}
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Lock className="w-3 h-3" />
                            <span>Secured by PayPal • SSL Encrypted</span>
                        </div>
                    </div>
                )}

                {/* Success */}
                {status === 'success' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 text-center">
                        <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h2>
                        <p className="text-green-600 mb-4">
                            Your VIP plan has been activated. Redirecting you now...
                        </p>
                        <div className="w-full bg-green-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {status === 'error' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
                        <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-red-800 mb-2">Processing Failed</h2>
                        <p className="text-gray-600 mb-2">
                            We couldn't process your payment. Your PayPal account has NOT been charged.
                        </p>
                        <p className="text-sm text-red-500 mb-6 bg-red-50 rounded-lg px-3 py-2">
                            {errorMsg}
                        </p>
                        <button
                            onClick={capturePayment}
                            className="w-full px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/vip-packages')}
                            className="w-full mt-3 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Back to VIP Plans
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentProcessing;
