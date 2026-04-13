import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Home, RefreshCw, MessageCircle } from 'lucide-react';

const PaymentFailure = () => {
    const [searchParams] = useSearchParams();
    const error = searchParams.get('error') || 'unknown';
    const orderId = searchParams.get('order_id');

    const errorMessages = {
        invalid_token: 'Your session has expired. Please login and try again.',
        expired_token: 'Your session has expired. Please login and try again.',
        user_not_found: 'User account not found. Please contact support.',
        package_not_found: 'The selected package is no longer available.',
        paypal_unreachable: 'Could not connect to PayPal. Please try again later.',
        capture_failed: 'Payment capture was not completed. Your account was NOT charged.',
        capture_exception: 'An error occurred during payment processing. Please try again.',
        invalid_status: 'The payment order is in an unexpected state. Please create a new payment.',
        amount_mismatch: 'Payment amount does not match the package price. Please contact support.',
        activation_failed: 'Payment was successful but VIP activation failed. Please contact support immediately.',
        unknown: 'An unexpected error occurred. Please try again or contact support.',
    };

    const message = errorMessages[error] || errorMessages.unknown;
    const isCharged = error === 'activation_failed';

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className={`rounded-full p-4 ${isCharged ? 'bg-orange-100' : 'bg-red-100'}`}>
                                <AlertCircle className={`w-16 h-16 ${isCharged ? 'text-orange-500' : 'text-red-500'}`} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {isCharged ? 'Payment Needs Attention' : 'Payment Failed'}
                        </h1>
                        <p className="text-gray-500 mb-4">{message}</p>

                        {orderId && (
                            <div className="bg-gray-50 rounded-xl p-3 mb-6 text-left">
                                <p className="text-xs text-gray-400 mb-1">PayPal Order ID (for support):</p>
                                <code className="text-sm text-gray-700 break-all">{orderId}</code>
                            </div>
                        )}

                        {isCharged && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left">
                                <p className="text-sm text-orange-800 font-medium">
                                    ⚠️ Your payment was captured but VIP activation failed.
                                    Please contact support with your order ID above — we will activate
                                    your VIP manually as soon as possible.
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Link
                                to="/vip-packages"
                                className="w-full py-3 px-6 bg-gradient-to-r from-lime-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </Link>
                            <Link
                                to="/"
                                className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Go to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailure;
