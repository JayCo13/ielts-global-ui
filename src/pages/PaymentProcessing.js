import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import API_BASE from '../config/api';

/**
 * PaymentProcessing — A CLEAN page with NO PayPal SDK loaded.
 * This page receives the PayPal order ID and calls the backend
 * to capture + activate VIP.
 */
const PaymentProcessing = () => {
    const [status, setStatus] = useState('processing');
    const [errorMsg, setErrorMsg] = useState('');
    const [debugInfo, setDebugInfo] = useState('');

    const navigate = useNavigate();

    // Read payment data from sessionStorage (set by Payment.js before full redirect)
    const paymentData = JSON.parse(sessionStorage.getItem('payment_data') || '{}');
    const { paypalOrderId, packageId, packageName } = paymentData;

    useEffect(() => {
        if (!paypalOrderId || !packageId) {
            navigate('/vip-packages');
            return;
        }
        capturePayment();
    }, []);

    // XHR-based call (most reliable, no SDK interference possible)
    const xhrCall = (url, token, body) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.timeout = 90000; // 90 seconds

            xhr.onload = () => {
                try {
                    const result = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(result);
                    } else {
                        reject(new Error(result.detail || `HTTP ${xhr.status}`));
                    }
                } catch (e) {
                    reject(new Error(`Parse error: ${xhr.responseText?.substring(0, 100)}`));
                }
            };
            xhr.onerror = () => reject(new Error(`XHR network error (readyState=${xhr.readyState})`));
            xhr.ontimeout = () => reject(new Error('XHR timeout after 90s'));
            xhr.send(body);
        });
    };

    // Fetch-based call
    const fetchCall = (url, token, body) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        return Promise.race([
            fetch(url, { method: 'POST', headers, body })
                .then(async (res) => {
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.detail || `HTTP ${res.status}`);
                    return result;
                }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout 90s')), 90000))
        ]);
    };

    const capturePayment = async () => {
        setStatus('processing');
        setErrorMsg('');
        setDebugInfo('Starting...');

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { message: 'Please login to continue.' } });
            return;
        }

        const url = `${API_BASE}/customer/vip/packages/${packageId}/server-capture`;
        const body = JSON.stringify({ paypal_order_id: paypalOrderId });

        setDebugInfo(`URL: ${url}\nToken: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);

        // Strategy: XHR → fetch → XHR → fetch (4 attempts)
        const strategies = [
            { name: 'XHR-1', fn: () => xhrCall(url, token, body) },
            { name: 'fetch-1', fn: () => fetchCall(url, token, body) },
            { name: 'XHR-2', fn: () => xhrCall(url, token, body) },
            { name: 'fetch-2', fn: () => fetchCall(url, token, body) },
        ];

        let lastError;

        for (let i = 0; i < strategies.length; i++) {
            const { name, fn } = strategies[i];
            try {
                setDebugInfo(prev => prev + `\n[${name}] Sending...`);
                console.log(`[Payment] ${name}: calling ${url}`);

                const result = await fn();
                console.log(`[Payment] ${name}: success`, result);

                if (result.status === 'completed') {
                    sessionStorage.removeItem('payment_data');
                    setStatus('success');
                    setTimeout(() => {
                        navigate('/payment-success', { state: { fromPayment: true } });
                    }, 2500);
                    return;
                } else if (result.status === 'completed' || result.message?.includes('already processed')) {
                    setStatus('success');
                    setTimeout(() => {
                        navigate('/payment-success', { state: { fromPayment: true } });
                    }, 2500);
                    return;
                } else {
                    throw new Error(`Unexpected: ${JSON.stringify(result)}`);
                }
            } catch (err) {
                lastError = err;
                const msg = err.message || 'Unknown';
                console.warn(`[Payment] ${name} failed:`, msg);
                setDebugInfo(prev => prev + `\n[${name}] FAIL: ${msg}`);

                // Auth error → go to login
                if (msg.includes('401') || msg.includes('credentials') || msg.includes('expired')) {
                    navigate('/login', { state: { message: 'Session expired.' } });
                    return;
                }

                // Wait before retry
                if (i < strategies.length - 1) {
                    const delay = 3000 * (i + 1);
                    setDebugInfo(prev => prev + `\n  Waiting ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        // All failed
        setStatus('error');
        setErrorMsg(lastError?.message || 'Unknown error');
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
                            <div className="bg-lime-50 rounded-lg px-4 py-2 inline-block mb-4">
                                <span className="text-sm font-medium text-lime-700">{packageName}</span>
                            </div>
                        )}
                        {/* Debug info - visible during processing */}
                        <pre className="text-left text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mt-4 max-h-32 overflow-auto whitespace-pre-wrap">
                            {debugInfo}
                        </pre>
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
                            We couldn't reach our server. Your PayPal has NOT been charged.
                        </p>
                        <pre className="text-left text-xs text-red-500 mb-4 bg-red-50 rounded-lg p-3 max-h-40 overflow-auto whitespace-pre-wrap">
                            {debugInfo}
                        </pre>
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
