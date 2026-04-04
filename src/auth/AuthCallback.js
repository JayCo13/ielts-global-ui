import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { startStatusPing } from '../utils/statusManager';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [isAccountSharingError, setIsAccountSharingError] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const username = params.get('username');
        const email = params.get('email');
        const role = params.get('role');
        const user_id = params.get('user_id');
        const errorMsg = params.get('error');
        const device_id = params.get('device_id');
        const unique_session_id = params.get('unique_session_id');

        if (errorMsg) {
          // Handle specific device tracking errors
          if (errorMsg.startsWith('DEVICE_IN_COOLDOWN:')) {
            const remainingTime = errorMsg.split(':')[1];
            setError(`Account is in cooldown due to multiple device logins. Cooldown remaining: ${remainingTime} seconds\n\nPlease wait for the cooldown before trying again\nPlease use only one account per device/browser at the same time.\nSystem will automatically allow login after cooldown.`);
            setTimeout(() => navigate('/login'), 3000);
          } else if (errorMsg === 'ACCOUNT_SHARING_DETECTED') {
            setError(`Security Warning • Please use only one account per device/browser at the same time. Try logging in again after 10s.`);
            setIsAccountSharingError(true);
            setCountdown(10);
          } else {
            setError(`Authentication failed: ${errorMsg}`);
            setTimeout(() => navigate('/login'), 3000);
          }
          return;
        }

        if (!token) {
          setError('No authentication token received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Store user data in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        localStorage.setItem('email', email);
        localStorage.setItem('role', role);
        localStorage.setItem('user_id', user_id);
        
        // Store device tracking information if available
        if (device_id) {
          localStorage.setItem('device_id', device_id);
        }
        if (unique_session_id) {
          localStorage.setItem('unique_session_id', unique_session_id);
        }

        // Start status ping
        startStatusPing();

        // Redirect to home page
        navigate('/');
      } catch (err) {
        console.error('Error processing authentication callback:', err);
        setError('Failed to process authentication');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [location, navigate]);

  // Handle countdown timer for account sharing error
  useEffect(() => {
    if (isAccountSharingError && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isAccountSharingError && countdown === 0) {
      navigate('/login');
    }
  }, [countdown, isAccountSharingError, navigate]);

  return (
    <div className="min-h-screen bg-teal-50/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {error ? (
          <div className="text-center">
            <div className="text-red-500 text-xl font-semibold mb-4">Authentication Error</div>
            <p className="text-gray-600 mb-4 whitespace-pre-line">{error}</p>
            {isAccountSharingError && countdown !== null ? (
              <div className="mt-4">
                <div className="text-lg font-bold text-red-600 mb-2">
                  Redirecting in {countdown} seconds...
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Redirecting to login page...</p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-lime-500 text-xl font-semibold mb-4">Authentication Successful</div>
            <p className="text-gray-600 mb-4">You have successfully logged in.</p>
            <p className="text-gray-500">Redirecting to dashboard...</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
