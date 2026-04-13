import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import API_BASE from '../config/api';

/**
 * PaymentProcessing — A CLEAN page with NO PayPal SDK loaded.
 * This page receives the PayPal order ID and calls the backend
 * to capture + activate VIP.
 *
 * CRITICAL FIX: PayPal SDK installs fetch/XHR interceptors that survive
 * SPA navigation. We must:
 * 1. Unregister any service workers PayPal may have installed
 * 2. Use a pristine XMLHttpRequest to avoid monkey-patched fetch
 * 3. Pre-check connectivity before attempting capture
 */
const PaymentProcessing = () => {
    const [status, setStatus] = useState('processing');
    const [errorMsg, setErrorMsg] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const [retryCount, setRetryCount] = useState(0);
    const abortRef = useRef(false);

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
    }, []);

    /**
     * Remove PayPal SDK artifacts that may be intercepting network requests:
     * - Unregister all service workers (PayPal registers one)
     * - Restore native fetch if it was monkey-patched
     */
    const cleanUpPayPalSdk = async () => {
        // 1. Unregister all service workers
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    await reg.unregister();
                    console.log('[PaymentProcessing] Unregistered service worker:', reg.scope);
                }
            } catch (e) {
                console.warn('[PaymentProcessing] Service worker cleanup error:', e);
            }
        }

        // 2. Remove any PayPal iframes that might still be in the DOM
        const paypalFrames = document.querySelectorAll('iframe[name*="paypal"], iframe[src*="paypal"]');
        paypalFrames.forEach(frame => {
            frame.remove();
            console.log('[PaymentProcessing] Removed PayPal iframe');
        });

        // 3. Remove PayPal script tags
        const paypalScripts = document.querySelectorAll('script[src*="paypal"]');
        paypalScripts.forEach(script => {
            script.remove();
            console.log('[PaymentProcessing] Removed PayPal script tag');
        });

        console.log('[PaymentProcessing] PayPal SDK cleanup complete');
    };

    /**
     * Ultra-reliable XHR call using a fresh XMLHttpRequest.
     * Avoids any monkey-patched fetch/XHR from PayPal SDK.
     */
    const rawXhrCall = (url, token, bodyStr) => {
        return new Promise((resolve, reject) => {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json');
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.timeout = 120000; // 120 seconds — generous for cold start

                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 0) {
                            // Status 0 = network error (CORS, DNS, connection refused, etc.)
                            reject(new Error(`Network error (status=0). Possibly CORS or server unreachable.`));
                            return;
                        }
                        try {
                            const result = JSON.parse(xhr.responseText);
                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve(result);
                            } else {
                                reject(new Error(result.detail || `HTTP ${xhr.status}: ${xhr.responseText?.substring(0, 200)}`));
                            }
                        } catch (e) {
                            reject(new Error(`Parse error (HTTP ${xhr.status}): ${xhr.responseText?.substring(0, 200)}`));
                        }
                    }
                };

                xhr.ontimeout = () => reject(new Error('XHR timeout (120s)'));
                xhr.send(bodyStr);
            } catch (e) {
                reject(new Error(`XHR creation error: ${e.message}`));
            }
        });
    };

    /**
     * Native fetch call with AbortController for proper timeout handling.
     */
    const nativeFetchCall = (url, token, bodyStr) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        return fetch(url, {
            method: 'POST',
            headers,
            body: bodyStr,
            signal: controller.signal,
            // Bypass any service worker cache
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit',
        })
            .then(async (res) => {
                clearTimeout(timeoutId);
                const text = await res.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch {
                    throw new Error(`Parse error (HTTP ${res.status}): ${text.substring(0, 200)}`);
                }
                if (!res.ok) throw new Error(result.detail || `HTTP ${res.status}`);
                return result;
            })
            .catch((err) => {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') {
                    throw new Error('Fetch timeout (120s)');
                }
                throw err;
            });
    };

    /**
     * Pre-check: can we even reach the backend?
     * This catches CORS / DNS / firewall issues before attempting the real call.
     */
    const checkConnectivity = async () => {
        try {
            const healthUrl = `${API_BASE}/health`;
            const resp = await fetch(healthUrl, {
                method: 'GET',
                cache: 'no-store',
                mode: 'cors',
                credentials: 'omit',
            });
            return resp.ok;
        } catch {
            return false;
        }
    };

    /**
     * Warm up the backend to avoid cold-start timeouts.
     */
    const warmUpBackend = async () => {
        try {
            await Promise.all([
                fetch(`${API_BASE}/health`, { cache: 'no-store', mode: 'cors', credentials: 'omit' }),
                fetch(`${API_BASE}/warmup`, { cache: 'no-store', mode: 'cors', credentials: 'omit' }),
                fetch(`${API_BASE}/warmup-paypal`, { cache: 'no-store', mode: 'cors', credentials: 'omit' }),
            ]);
        } catch {
            // Ignore — best effort warm-up
        }
    };

    const capturePayment = async () => {
        setStatus('processing');
        setErrorMsg('');
        setDebugInfo('Starting payment capture...');

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { message: 'Please login to continue.' } });
            return;
        }

        const url = `${API_BASE}/customer/vip/packages/${packageId}/server-capture`;
        const bodyStr = JSON.stringify({ paypal_order_id: paypalOrderId });

        setDebugInfo(prev => prev + `\nTarget: ${url}\nOrder: ${paypalOrderId}`);

        // Step 0: Warm up backend
        setDebugInfo(prev => prev + '\n[warmup] Warming up backend...');
        await warmUpBackend();

        // Step 1: Verify connectivity
        setDebugInfo(prev => prev + '\n[check] Testing connectivity...');
        const canReach = await checkConnectivity();
        if (!canReach) {
            setDebugInfo(prev => prev + '\n[check] ⚠ Cannot reach backend /health endpoint');
            setDebugInfo(prev => prev + '\n[check] Will still attempt capture...');
        } else {
            setDebugInfo(prev => prev + '\n[check] ✓ Backend reachable');
        }

        // Step 2: Try capture with alternating strategies and exponential backoff
        const maxAttempts = 6;
        let lastError;

        for (let i = 0; i < maxAttempts; i++) {
            if (abortRef.current) return;

            const useXhr = i % 2 === 0;
            const strategyName = useXhr ? `XHR-${Math.floor(i / 2) + 1}` : `fetch-${Math.floor(i / 2) + 1}`;

            try {
                setDebugInfo(prev => prev + `\n[${strategyName}] Sending...`);
                console.log(`[Payment] ${strategyName}: calling ${url}`);

                let result;
                if (useXhr) {
                    result = await rawXhrCall(url, token, bodyStr);
                } else {
                    result = await nativeFetchCall(url, token, bodyStr);
                }
                
                console.log(`[Payment] ${strategyName}: response`, result);
                setDebugInfo(prev => prev + `\n[${strategyName}] ✓ Response: ${result.status}`);

                if (result.status === 'completed' || result.message?.includes('already processed')) {
                    // SUCCESS!
                    sessionStorage.removeItem('payment_data');
                    setStatus('success');
                    setTimeout(() => {
                        navigate('/payment-success', { state: { fromPayment: true } });
                    }, 2500);
                    return;
                } else {
                    throw new Error(`Unexpected response: ${JSON.stringify(result)}`);
                }
            } catch (err) {
                lastError = err;
                const msg = err.message || 'Unknown error';
                console.warn(`[Payment] ${strategyName} failed:`, msg);
                setDebugInfo(prev => prev + `\n[${strategyName}] ✗ ${msg}`);

                // Auth error → go to login
                if (msg.includes('401') || msg.includes('credentials') || msg.includes('expired') || msg.includes('Not authenticated')) {
                    navigate('/login', { state: { message: 'Session expired. Please login again.' } });
                    return;
                }

                // Wait before retry (exponential backoff: 2s, 4s, 6s, 8s, 10s)
                if (i < maxAttempts - 1) {
                    const delay = Math.min(2000 * (i + 1), 10000);
                    setDebugInfo(prev => prev + `\n  ⏳ Retrying in ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));

                    // Re-check connectivity on failure
                    if (i >= 2) {
                        const stillAlive = await checkConnectivity();
                        setDebugInfo(prev => prev + `\n  Backend reachable: ${stillAlive ? '✓' : '✗'}`);
                    }
                }
            }
        }

        // All attempts failed
        setStatus('error');
        setRetryCount(prev => prev + 1);
        setErrorMsg(lastError?.message || 'All capture attempts failed');
    };

    /**
     * Last resort: open the capture URL in a new tab.
     * This helps diagnose if the issue is CORS-related (direct browser access works, AJAX doesn't).
     */
    const openDiagnostic = () => {
        const diagnosticUrl = `${API_BASE}/health`;
        window.open(diagnosticUrl, '_blank');
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
                        {/* Debug info */}
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

                {/* Error */}
                {status === 'error' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
                        <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-red-800 mb-2">Processing Failed</h2>
                        <p className="text-gray-600 mb-2">
                            We couldn't reach our server to complete your payment.
                            {retryCount < 3
                                ? ' Please try again.'
                                : ' If this keeps happening, please contact support with your PayPal order ID.'
                            }
                        </p>

                        {retryCount >= 2 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                                <p className="text-sm text-yellow-800 font-medium mb-1">
                                    💡 Your PayPal order ID (for support):
                                </p>
                                <code className="text-xs text-yellow-900 bg-yellow-100 px-2 py-1 rounded break-all">
                                    {paypalOrderId}
                                </code>
                            </div>
                        )}

                        <pre className="text-left text-xs text-red-500 mb-4 bg-red-50 rounded-lg p-3 max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                            {debugInfo}
                        </pre>

                        <button
                            onClick={capturePayment}
                            className="w-full px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                        
                        {retryCount >= 2 && (
                            <button
                                onClick={openDiagnostic}
                                className="w-full mt-3 px-6 py-3 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Test Server Connection
                            </button>
                        )}

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
