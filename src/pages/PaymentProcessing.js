import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, RefreshCw, Lock } from 'lucide-react';
import API_BASE from '../config/api';

/**
 * PaymentProcessing — Polls for VIP activation after a PayOS payment.
 * This is the PayOS return_url target: the user lands here after paying and we
 * poll /subscription/status until the webhook has activated their VIP.
 */
const PaymentProcessing = () => {
    const [status, setStatus] = useState('processing');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { packageName } = location.state || {};

    useEffect(() => {
        pollForActivation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pollForActivation = async () => {
        setStatus('processing');
        setErrorMsg('');

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { message: 'Please login to continue.' } });
            return;
        }

        const maxAttempts = 20;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                console.log(`[Payment] Polling attempt ${i + 1}/${maxAttempts}`);

                const res = await fetch(`${API_BASE}/customer/vip/subscription/status`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (res.status === 401) {
                    navigate('/login', { state: { message: 'Session expired.' } });
                    return;
                }

                if (res.ok) {
                    const data = await res.json();
                    if (data.is_subscribed) {
                        setStatus('success');
                        setTimeout(() => navigate('/payment-success', { state: { fromPayment: true } }), 2000);
                        return;
                    }
                }
            } catch (err) {
                console.warn(`[Payment] Poll attempt ${i + 1} failed:`, err.message);
            }

            // Wait before next poll
            await new Promise(r => setTimeout(r, 3000));
        }

        // After all attempts, show error
        setErrorMsg('Payment verification is taking longer than expected. If you completed payment, your VIP will be activated shortly. Please check your VIP dashboard.');
        setStatus('error');
    };

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
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Activating Your VIP</h2>
                        <p className="text-gray-500 mb-4">
                            Please do not close this page. We are verifying your payment and activating VIP access.
                        </p>
                        {packageName && (
                            <div className="bg-lime-50 rounded-lg px-4 py-2 inline-block">
                                <span className="text-sm font-medium text-lime-700">{packageName}</span>
                            </div>
                        )}
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Lock className="w-3 h-3" />
                            <span>Secured by PayOS • SSL Encrypted</span>
                        </div>
                    </div>
                )}

                {/* Success */}
                {status === 'success' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 text-center">
                        <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-green-800 mb-2">Subscription Activated!</h2>
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
                        <h2 className="text-xl font-bold text-red-800 mb-2">Verification Pending</h2>
                        <p className="text-gray-600 mb-2">
                            {errorMsg}
                        </p>
                        <button
                            onClick={pollForActivation}
                            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Check Again
                        </button>
                        <button
                            onClick={() => navigate('/my-vip-package')}
                            className="w-full mt-3 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Go to My VIP Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentProcessing;
