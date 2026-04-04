import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import EditProfile from './EditProfile';
import ExamHistory from './ExamHistory';
import Navbar from './Navbar';
import { User, Edit, History, ChevronLeft, ChevronRight, BarChart, Headphones, PenTool, ArrowLeft, ArrowRight, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import API_BASE from '../config/api';

const ChangePassword = ({ isGoogleAccount = false }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Calculate password strength
  useEffect(() => {
    const pwd = formData.new_password;
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  }, [formData.new_password]);

  const getStrengthLabel = () => {
    if (formData.new_password.length === 0) return '';
    if (passwordStrength <= 1) return 'Yếu';
    if (passwordStrength <= 2) return 'Average';
    if (passwordStrength <= 3) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-yellow-500';
    if (passwordStrength <= 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Client-side validation
    if (formData.new_password.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (!isGoogleAccount && formData.current_password && formData.current_password === formData.new_password) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(isGoogleAccount
          ? { new_password: formData.new_password, confirm_password: formData.confirm_password }
          : formData
        )
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Password changed successfully!' });
        setFormData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#0096b1]/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#0096b1]" />
          </div>
          <h2 className="text-2xl font-bold">{isGoogleAccount ? 'Set Password' : 'Change Password'}</h2>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {message.type === 'success'
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 flex-shrink-0" />
            }
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Google Account Notice */}
          {isGoogleAccount && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <p className="font-medium">Logged in with Google</p>
                <p className="text-xs mt-1 text-blue-600">You can set a password to log in without Google.</p>
              </div>
            </div>
          )}

          {/* Current Password - only show for non-Google accounts */}
          {!isGoogleAccount && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0096b1]/30 focus:border-[#0096b1] transition-all outline-none"
                  placeholder="Enter current password"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0096b1]/30 focus:border-[#0096b1] transition-all outline-none"
                placeholder="Enter new password (min 6 chars)"
                required
                minLength={6}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.new_password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength ? getStrengthColor() : 'bg-gray-200'
                        }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength <= 1 ? 'text-red-500' :
                  passwordStrength <= 2 ? 'text-yellow-600' :
                    passwordStrength <= 3 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                  Strength: {getStrengthLabel()}
                </p>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-[#0096b1]/30 focus:border-[#0096b1] transition-all outline-none ${formData.confirm_password && formData.new_password !== formData.confirm_password
                  ? 'border-red-300 bg-red-50/50'
                  : formData.confirm_password && formData.new_password === formData.confirm_password
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-gray-300'
                  }`}
                placeholder="Re-enter new password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirm_password && formData.new_password !== formData.confirm_password && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
              </p>
            )}
            {formData.confirm_password && formData.new_password === formData.confirm_password && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Passwords match
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-700 mb-2">💡 Tips for a strong password:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>At least 8 characters</li>
              <li>Mix upper and lower case letters</li>
              <li>Include numbers</li>
              <li>Include special characters (@, #, $, ...)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!isGoogleAccount && !formData.current_password) || !formData.new_password || !formData.confirm_password}
            className={`w-full py-2.5 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isSubmitting || (!isGoogleAccount && !formData.current_password) || !formData.new_password || !formData.confirm_password
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[#0096b1] hover:bg-[#007a93] active:scale-[0.98] shadow-sm hover:shadow-md'
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {isGoogleAccount ? 'Set Password' : 'Change Password'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  // Add accountStatus state
  const [profileData, setProfileData] = useState(null);
  const [testStats, setTestStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('profile'); // 'profile', 'edit', 'history', 'password'
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [statsSection, setStatsSection] = useState(0); // 0 for overview, 1 for detailed stats
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [accountStatus, setAccountStatus] = useState(null);
  const [vipInfo, setVipInfo] = useState(null);

  // Update fetchData to also get account status
  const fetchData = useCallback(async () => {
    try {
      // Fetch profile data
      const profileResponse = await fetch(`${API_BASE}/student/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch test statistics
      const statsResponse = await fetch(`${API_BASE}/student/my-test-statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch account status for students
      if (localStorage.getItem('role') === 'student') {
        const accountResponse = await fetch(`${API_BASE}/account-status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          setAccountStatus(accountData);
        }
      }

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfileData(data);
        // Update timestamp to force image refresh
        setImageTimestamp(Date.now());
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTestStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add an effect to refresh data when switching back to profile view
  useEffect(() => {
    if (activeView === 'profile') {
      fetchData();
    }
  }, [activeView, fetchData]);

  // Fetch VIP info for customers
  useEffect(() => {
    if (localStorage.getItem('role') === 'customer') {
      fetch(`${API_BASE}/customer/vip/remaining-days`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => setVipInfo(data));
    }
  }, []);

  const renderMainContent = () => {
    switch (activeView) {
      case 'edit':
        return <EditProfile onProfileUpdate={fetchData} />;
      case 'history':
        return <ExamHistory />;
      case 'password':
        return <ChangePassword isGoogleAccount={profileData?.is_google_account} />;
      default:
        return (
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-8">
              <img
                src={profileData?.image_url ? `${profileData.image_url}?t=${imageTimestamp}` : "/default-avatar.jpg"}
                alt={profileData?.username}
                className="w-20 h-20 rounded-2xl object-cover"
                key={imageTimestamp} // Force re-render when timestamp changes
              />
              <div>
                <h1 className="text-2xl font-semibold">{profileData?.username}</h1>
                <p className="text-gray-500 text-sm">{profileData?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </div>

                  {localStorage.getItem('role') === 'student' && accountStatus && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {accountStatus.is_active ? (
                        <span>Active time remaining: {accountStatus.remaining_days} days</span>
                      ) : accountStatus.activated_at === null ? (
                        <span>Not activated</span>
                      ) : (
                        <span>Expired</span>
                      )}
                    </div>
                  )}
                  {/* VIP badge for customer role */}
                  {localStorage.getItem('role') === 'customer' && vipInfo && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {vipInfo.has_active_subscription
                        ? <>VIP Plan: remaining {vipInfo.remaining_days} days ({vipInfo.package_name})</>
                        : <>No VIP Plan</>
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative min-h-[400px]">
              {/* Section navigation */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {statsSection === 0 ? "Statistics Overview" : "Detailed Statistics"}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatsSection(0)}
                    className={`px-3 py-1 rounded-lg text-sm ${statsSection === 0
                      ? 'bg-[#0096b1] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setStatsSection(1)}
                    className={`px-3 py-1 rounded-lg text-sm ${statsSection === 1
                      ? 'bg-[#0096b1] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Navigation arrows */}
              {statsSection === 0 && (
                <button
                  onClick={() => setStatsSection(1)}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 z-10"
                  aria-label="View detailed statistics"
                >
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {statsSection === 1 && (
                <button
                  onClick={() => setStatsSection(0)}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 z-10"
                  aria-label="Back to overview"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {/* Section 1: Overview Statistics */}
              <div className={`transition-all duration-300 w-full ${statsSection === 0 ? 'block' : 'hidden'
                }`}>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Total Tests</h3>
                    <p className="text-3xl font-bold text-gray-900">{testStats?.total_exams_completed || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Completed Listening</h3>
                    <p className="text-3xl font-bold text-gray-900">{testStats?.listening_statistics?.exams_completed || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Completed Writing</h3>
                    <p className="text-3xl font-bold text-gray-900">{testStats?.writing_statistics?.tasks_completed || 0}</p>
                  </div>
                </div>

                {testStats?.latest_test && (
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Latest Test</h2>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-lg line-clamp-1">Test Name: {testStats.latest_test.exam_title}</h4>
                          <p className="text-sm text-gray-500 mt-1">Completion Date: {new Date(testStats.latest_test.completion_date).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-[#0096b1]">{testStats.latest_test.total_score}</span>
                          <span className="text-sm text-gray-500 ml-1">Score</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Link
                        to={`/exam-result/${testStats.latest_test.result_id}`}
                        className="text-sm text-[#0096b1] hover:text-[#0096b1] font-medium inline-flex items-center"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Detailed Statistics */}
              <div className={`transition-all duration-300 w-full ${statsSection === 1 ? 'block' : 'hidden'
                }`}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Headphones className="w-5 h-5 text-[#0096b1]" />
                      <h2 className="text-xl font-semibold">Listening Statistics</h2>
                    </div>

                    {testStats?.listening_statistics?.exams_completed > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-gray-500 text-xs font-medium mb-1">Average Accuracy</h3>
                            <p className="text-xl font-bold text-gray-900">{testStats.listening_statistics.average_accuracy}%</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-gray-500 text-xs font-medium mb-1">Score trung bình</h3>
                            <p className="text-xl font-bold text-gray-900">{testStats.listening_statistics.average_score}</p>
                          </div>
                        </div>

                        {testStats.listening_statistics.exams.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Tests</h3>
                            {testStats.listening_statistics.exams.slice(0, 2).map((exam, index) => (
                              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                  <h4 className="font-medium text-sm">{exam.exam_title}</h4>
                                  <p className="text-xs text-gray-500">{new Date(exam.completion_date).toLocaleDateString('en-US')}</p>
                                </div>
                                <div className="text-right">
                                  <span className="font-medium text-[#0096b1]">{exam.accuracy.toFixed(1)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No completed listening tests</p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <PenTool className="w-5 h-5 text-[#0096b1]" />
                      <h2 className="text-xl font-semibold">Writing Statistics</h2>
                    </div>

                    {testStats?.writing_statistics?.tests_attempted > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-gray-500 text-xs font-medium mb-1">Bài thi đã thử</h3>
                            <p className="text-xl font-bold text-gray-900">{testStats.writing_statistics.tests_attempted}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-gray-500 text-xs font-medium mb-1">Phần đã hoàn thành</h3>
                            <p className="text-xl font-bold text-gray-900">{testStats.writing_statistics.tasks_completed}</p>
                          </div>
                        </div>

                        {testStats.writing_statistics.tests.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Tests</h3>
                            {testStats.writing_statistics.tests.slice(0, 2).map((test, index) => (
                              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                  <h4 className="font-medium text-sm">{test.title}</h4>
                                  <p className="text-xs text-gray-500">{new Date(test.latest_update).toLocaleDateString('en-US')}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs px-2 py-1 rounded-full ${test.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {test.is_completed ? 'Hoàn thành' : `${test.parts_completed}/${test.total_parts}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Chưa có bài viết nào được thử</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-lg p-6 mx-auto">
          <div className="flex gap-6">
            <div className={`${menuCollapsed ? 'w-16' : 'w-64'} border-r border-gray-100 pr-6 transition-all duration-300`}>
              <div className="flex items-center justify-center gap-2 mb-8 relative">
                {!menuCollapsed && <span className="font-medium font-bold">Profile</span>}
                <button
                  onClick={() => setMenuCollapsed(!menuCollapsed)}
                  className="absolute right-0 p-1 hover:bg-gray-100 rounded-full font-bold"
                  aria-label={menuCollapsed ? "Expand menu" : "Collapse menu"}
                >
                  {menuCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>
              <hr />
              <nav className="space-y-4 mt-3">
                <div
                  className={`flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 ${activeView === 'profile' ? 'text-[#0096b1] bg-[#0096b1]-50' : 'text-gray-600'
                    }`}
                  onClick={() => setActiveView('profile')}
                  title={menuCollapsed ? "Overview hồ sơ" : ""}
                >
                  <User className="w-5 h-5 min-w-5" />
                  {!menuCollapsed && <span>Overview</span>}
                </div>
                <div
                  className={`flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 ${activeView === 'edit' ? 'text-[#0096b1] bg-[#0096b1]-50' : 'text-gray-600'
                    }`}
                  onClick={() => setActiveView('edit')}
                  title={menuCollapsed ? "Edit Profile" : ""}
                >
                  <Edit className="w-5 h-5 min-w-5" />
                  {!menuCollapsed && <span>Edit Profile</span>}
                </div>
                <div
                  className={`flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 ${activeView === 'password' ? 'text-[#0096b1] bg-[#0096b1]-50' : 'text-gray-600'
                    }`}
                  onClick={() => setActiveView('password')}
                  title={menuCollapsed ? "Change Password" : ""}
                >
                  <Lock className="w-5 h-5 min-w-5" />
                  {!menuCollapsed && <span>Change Password</span>}
                </div>
              </nav>
            </div>

            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
