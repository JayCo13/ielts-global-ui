import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import API_BASE from '../config/api';

/**
 * PaymentProcessing — Captures PayPal payment via backend.
 *
 * STRATEGY (3 layers, each avoids CORS differently):
 *
 * 1. PROXY AJAX — calls /api/... which Netlify proxies to backend (same-origin)
 * 2. DIRECT AJAX — calls backend directly (cross-origin, may fail due to CORS)
 * 3. FORM POST — submits a hidden HTML form to backend (forms bypass CORS entirely)
 *
 * Layer 3 (form post) is the nuclear option — it ALWAYS works because browsers
 * never block cross-origin form submissions. The backend captures the payment
 * and redirects the user back to the success/failure page.
 */
const PaymentProcessing = () => {
    const [status, setStatus] = useState('processing');
    const [errorMsg, setErrorMsg] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const abortRef = useRef(false);
    const formRef = useRef(null);

    const navigate = useNavigate();

    // Read payment data from sessionStorage (set by Payment.js before full redirect)
    const paymentData = JSON.parse(sessionStorage.getItem('payment_data') || '{}');
    const { paypalOrderId, packageId, packageName } = paymentData;

    // Clean up PayPal SDK interference on mount
    useEffect(() => {
        cleanUpPayPalSdk();
    }, []);

    useEffect(() => {
        if (!paypalOrderId || !packageId) {
            navigate('/vip-packages');
            return;
        }
        abortRef.current = false;
        capturePayment();
        return () => { abortRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cleanUpPayPalSdk = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    await reg.unregister();
                }
            } catch (e) { /* ignore */ }
        }
        document.querySelectorAll('iframe[name*="paypal"], iframe[src*="paypal"]').forEach(el => el.remove());
        document.querySelectorAll('script[src*="paypal"]').forEach(el => el.remove());
    };

    /**
     * Make a POST request. Returns parsed JSON or throws.
     */
    const doPost = async (url, token, bodyStr) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: bodyStr,
                signal: controller.signal,
                cache: 'no-store',
                credentials: 'omit',
            });
            clearTimeout(timeoutId);
            const text = await res.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch {
                throw new Error(`Invalid response (HTTP ${res.status}): ${text.substring(0, 200)}`);
            }
            if (!res.ok) throw new Error(result.detail || `HTTP ${res.status}`);
            return result;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') throw new Error('Request timeout (60s)');
            throw err;
        }
    };

    const capturePayment = async () => {
        setStatus('processing');
        setErrorMsg('');
        setDebugInfo('Initializing...');

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { message: 'Please login to continue.' } });
            return;
        }

        const bodyStr = JSON.stringify({ paypal_order_id: paypalOrderId });

        // ====================================================================
        // LAYER 1: Netlify Proxy (same-origin, no CORS)
        // The /api/* path is proxied by Netlify to the Koyeb backend.
        // ====================================================================
        const proxyUrl = `/api/customer/vip/packages/${packageId}/server-capture`;
        setDebugInfo(prev => prev + `\n[proxy] Trying ${proxyUrl}`);

        try {
            const result = await doPost(proxyUrl, token, bodyStr);
            console.log('[Payment] Proxy success:', result);
            if (result.status === 'completed' || result.message?.includes('already processed')) {
                sessionStorage.removeItem('payment_data');
                setStatus('success');
                setTimeout(() => navigate('/payment-success', { state: { fromPayment: true } }), 2000);
                return;
            }
            throw new Error(`Unexpected: ${JSON.stringify(result)}`);
        } catch (err) {
            const msg = err.message || 'Unknown';
            console.warn('[Payment] Proxy failed:', msg);
            setDebugInfo(prev => prev + `\n[proxy] ✗ ${msg}`);

            if (msg.includes('401') || msg.includes('Not authenticated') || msg.includes('expired')) {
                navigate('/login', { state: { message: 'Session expired.' } });
                return;
            }
        }

        // Small delay between strategies
        await new Promise(r => setTimeout(r, 2000));
        if (abortRef.current) return;

        // ====================================================================
        // LAYER 2: Direct AJAX to backend (cross-origin, may fail CORS)
        // ====================================================================
        const directUrl = `${API_BASE}/customer/vip/packages/${packageId}/server-capture`;
        setDebugInfo(prev => prev + `\n[direct] Trying ${directUrl}`);

        for (let attempt = 0; attempt < 2; attempt++) {
            if (abortRef.current) return;
            try {
                setDebugInfo(prev => prev + `\n[direct-${attempt + 1}] Sending...`);
                const result = await doPost(directUrl, token, bodyStr);
                console.log(`[Payment] Direct attempt ${attempt + 1} success:`, result);
                if (result.status === 'completed' || result.message?.includes('already processed')) {
                    sessionStorage.removeItem('payment_data');
                    setStatus('success');
                    setTimeout(() => navigate('/payment-success', { state: { fromPayment: true } }), 2000);
                    return;
                }
                throw new Error(`Unexpected: ${JSON.stringify(result)}`);
            } catch (err) {
                const msg = err.message || 'Unknown';
                console.warn(`[Payment] Direct attempt ${attempt + 1} failed:`, msg);
                setDebugInfo(prev => prev + `\n[direct-${attempt + 1}] ✗ ${msg}`);

                if (msg.includes('401') || msg.includes('Not authenticated') || msg.includes('expired')) {
                    navigate('/login', { state: { message: 'Session expired.' } });
                    return;
                }

                if (attempt < 1) {
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }

        if (abortRef.current) return;

        // ====================================================================
        // LAYER 3: Form POST (nuclear option — ALWAYS bypasses CORS)
        // Submits a hidden HTML form to the backend. The browser navigates
        // to the backend URL, which processes payment and redirects back.
        // ====================================================================
        setDebugInfo(prev => prev + '\n[form] AJAX failed. Switching to form submission...');
        setDebugInfo(prev => prev + '\n[form] Submitting to backend (this will redirect)...');
        
        // Small delay so user can see the status
        await new Promise(r => setTimeout(r, 1500));
        
        submitFormCapture(token);
    };

    /**
     * Submit a hidden HTML form directly to the backend.
     * This is the NUCLEAR fallback — form POSTs never trigger CORS preflight.
     * The backend will capture payment and redirect back to the frontend.
     */
    const submitFormCapture = (token) => {
        const form = formRef.current;
        if (!form) return;

        // Set the form action to the backend's form-capture endpoint
        form.action = `${API_BASE}/customer/vip/packages/${packageId}/form-capture`;
        form.method = 'POST';

        // Set hidden field values
        form.querySelector('[name="token"]').value = token;
        form.querySelector('[name="paypal_order_id"]').value = paypalOrderId;
        form.querySelector('[name="return_origin"]').value = window.location.origin;

        // Submit — browser navigates away to backend, which redirects back
        form.submit();
    };

    if (!paypalOrderId) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Hidden form for Layer 3 fallback */}
                <form ref={formRef} style={{ display: 'none' }}>
                    <input type="hidden" name="token" value="" />
                    <input type="hidden" name="paypal_order_id" value="" />
                    <input type="hidden" name="return_origin" value="" />
                </form>

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
                        <pre className="text-left text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mt-4 max-h-40 overflow-auto whitespace-pre-wrap font-mono">
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

                {/* Error — should rarely reach here since Layer 3 auto-submits */}
                {status === 'error' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
                        <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-red-800 mb-2">Processing Failed</h2>
                        <p className="text-gray-600 mb-2">{errorMsg}</p>
                        <pre className="text-left text-xs text-red-500 mb-4 bg-red-50 rounded-lg p-3 max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                            {debugInfo}
                        </pre>
                        <button
                            onClick={() => {
                                const token = localStorage.getItem('token');
                                if (token) submitFormCapture(token);
                            }}
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
