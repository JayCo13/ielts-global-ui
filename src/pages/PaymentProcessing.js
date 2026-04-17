import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, RefreshCw, Lock } from 'lucide-react';
import API_BASE from '../config/api';

/**
 * PaymentProcessing — Clean page, NO PayPal SDK.
 * Calls backend /server-capture to capture payment + activate VIP.
 */
const PaymentProcessing = () => {
    const [status, setStatus] = useState('processing');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const paymentData = JSON.parse(sessionStorage.getItem('payment_data') || '{}');
    const { paypalOrderId, packageId, packageName } = paymentData;

    useEffect(() => {
        if (!paypalOrderId || !packageId) {
            navigate('/vip-packages');
            return;
        }
        capturePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const capturePayment = async () => {
        setStatus('processing');
        setErrorMsg('');

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { message: 'Please login to continue.' } });
            return;
        }

        // Use Netlify proxy (same-origin, no CORS) → falls back to direct
        const proxyUrl = `/api/customer/vip/packages/${packageId}/server-capture`;
        const directUrl = `${API_BASE}/customer/vip/packages/${packageId}/server-capture`;
        const body = JSON.stringify({ paypal_order_id: paypalOrderId });

        // Try proxy first (attempt 1-2), then direct (attempt 3)
        const urls = [proxyUrl, proxyUrl, directUrl];

        // Retry up to 3 times with increasing delay
        for (let i = 0; i < 3; i++) {
            try {
                console.log(`[Payment] Attempt ${i + 1}/3: ${urls[i]}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const res = await fetch(urls[i], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                const result = await res.json();

                if (res.status === 401) {
                    navigate('/login', { state: { message: 'Session expired.' } });
                    return;
                }

                if (res.ok && (result.status === 'completed' || result.message?.includes('already'))) {
                    sessionStorage.removeItem('payment_data');
                    setStatus('success');
                    setTimeout(() => navigate('/payment-success', { state: { fromPayment: true } }), 2000);
                    return;
                }

                throw new Error(result.detail || `Server returned ${res.status}`);
            } catch (err) {
                console.warn(`[Payment] Attempt ${i + 1} failed:`, err.message);

                if (err.name === 'AbortError') {
                    setErrorMsg('Request timed out. Please try again.');
                } else {
                    setErrorMsg(err.message || 'Unknown error');
                }

                if (i < 2) {
                    await new Promise(r => setTimeout(r, 3000 * (i + 1)));
                }
            }
        }

        setStatus('error');
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
                            Please do not close this page. We are securely processing your payment.
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
                            We couldn't process your payment. Please try again.
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
