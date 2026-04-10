import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import API_BASE from './config/api';
import fetchWithTimeout from './utils/fetchWithTimeout';

const StudentGuard = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const studentId = localStorage.getItem('user_id');
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      // If no token or role, just render children (public access)
      if (!token || !role) {
    
        setLoading(false);
        return;
      }

      try {
        let endpoint = '';
        if (role === 'student') {
          // Only proceed if we have a valid studentId
          if (!studentId) {
           
            setLoading(false);
            return;
          }
          endpoint = `${API_BASE}/students/student-side/${studentId}`;
        } else if (role === 'customer') {
          endpoint = `${API_BASE}/customer/vip/subscription/status`;
        }

        if (!endpoint) {
        
          setLoading(false);
          return;
        }

        
        const response = await fetchWithTimeout(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!isMounted) return;

        if (response.status === 403) {
         
          setStatus({ is_active: false });
        } else {
          const data = await response.json();
         
          
          // For student role, check is_active
          if (role === 'student') {
        
            setStatus(data);
          } 
          // For customer role, check is_active
          else if (role === 'customer') {
          
            setStatus(data);
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('StudentGuard: fetch failed (network issue), allowing access:', error.message);
        }
        // On network failure, don't block the user — allow access gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAccess();
    // Poll every 30 seconds (was 10s — too aggressive for remote backend)
    const interval = setInterval(checkAccess, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [studentId, token, role]);


  // Persist countdown across reloads
  useEffect(() => {
    if (
      ((role === 'student' || role === 'customer') && status) &&
      (status.is_active === false || status.is_active === 'false')
    ) {
      let endTime = localStorage.getItem('revoked_end_time');
      if (!endTime) {
        endTime = Date.now() + 30000;
        localStorage.setItem('revoked_end_time', endTime);
      } else {
        endTime = Number(endTime);
      }
      const updateCountdown = () => {
        const remaining = Math.ceil((endTime - Date.now()) / 1000);
        setCountdown(remaining > 0 ? remaining : 0);
        if (remaining <= 0) {
          localStorage.clear();
          localStorage.removeItem('revoked_end_time');
          navigate('/login', { replace: true });
        }
      };
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    } else {
      // If not revoked, clean up
      localStorage.removeItem('revoked_end_time');
    }
  }, [status, role, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  // If no token or role, allow access (public routes)
  if (!token || !role) {
    return <Outlet />;
  }

  
  
  // Show revoked access dialog for students
  if (
    role === 'student' &&
    status &&
    (status.is_active === false || status.is_active === 'false')
  ) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">Access Revoked</h2>
          <p className="mb-4">
            Your access has been revoked by the administrator.<br />
            You will be logged out in <span className="font-bold text-red-600">{countdown}</span> seconds.
          </p>
        </div>
      </div>
    );
  }
  
  // Show inactive subscription dialog for customers
  if (
    role === 'customer' &&
    status &&
    (status.is_active === false || status.is_active === 'false')
  ) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <h2 className="text-xl font-bold mb-4 text-red-600">Account has been disabled</h2>
          <p className="mb-4">
           Your account has been disabled by the moderation team for violating the rules of ieltscomputertest.com
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-lime-600 transition-colors"
              onClick={() => navigate('/vip-packages')}
            >
              Contact Support
            </button>
            <button
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={() => navigate('/')}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show activation dialog only for students who haven't activated their account
  if (role === 'student' && status && (status.is_active_student === false || status.is_active_student === 'false')) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4">Verify Account</h2>
          <p className="mb-4">You need to verify your account to continue using the system.</p>
          <button
            className="px-6 py-2 bg-lime-500 text-white rounded-lg"
            onClick={async () => {
              await fetchWithTimeout(`${API_BASE}/activate-account`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              window.location.reload();
            }}
          >
            Verify Account
          </button>
        </div>
      </div>
    );
  }
  
  // Show payment status dialog for customers with pending payments
  if (role === 'customer' && status && status.payment_status === 'pending') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <h2 className="text-xl font-bold mb-4 text-yellow-600">Payment Pending Verification</h2>
          <p className="mb-4">
            VIP Package <span className="font-semibold">{status.package_name}</span> your is pending payment verification.
            Please wait while the admin verifies your payment.
          </p>
          <button
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            onClick={() => navigate('/transaction-status', { 
              state: { 
                transactionId: status.transaction_id || 'unknown',
                status: 'pending'
              }
            })}
          >
            Check Status
          </button>
        </div>
      </div>
    );
  }

  // If passed all checks, render nested routes!
  return <Outlet />;
};

export default StudentGuard; 
