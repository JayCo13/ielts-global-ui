import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';

// In EditProfile.js, modify the component definition:
const EditProfile = ({ onProfileUpdate }) => {
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Email verification (6-digit code), ported from VN
  const [verifyStep, setVerifyStep] = useState(0); // 0: idle | 1: entering code
  const [code, setCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  const postEmail = async (path, body) => {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.detail || 'Something went wrong. Please try again.');
    return d;
  };
  const sendVerifyCode = async () => {
    if (!formData.email?.trim()) { setVerifyMsg('Please enter your email first.'); return; }
    setVerifyLoading(true); setVerifyMsg('');
    try {
      await postEmail('/student/email/send-code', { email: formData.email.trim() });
      setVerifyStep(1);
      setVerifyMsg('We sent a 6-digit code to your email. Check your spam folder if you cannot find it.');
    } catch (e) { setVerifyMsg(e.message); } finally { setVerifyLoading(false); }
  };
  const confirmVerify = async () => {
    if (code.trim().length < 6) { setVerifyMsg('Enter the 6-digit code from the email.'); return; }
    setVerifyLoading(true); setVerifyMsg('');
    try {
      const d = await postEmail('/student/email/verify', { email: formData.email.trim(), code: code.trim() });
      setProfileData((p) => ({ ...(p || {}), email_verified: true, email: d.email }));
      setFormData((f) => ({ ...f, email: d.email }));
      setVerifyStep(0); setCode(''); setVerifyMsg('');
    } catch (e) { setVerifyMsg(e.message); } finally { setVerifyLoading(false); }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE}/student/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setFormData({
            username: data.username,
            email: data.email,
            image: null
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (saveMessage.type === 'success') {
      const timer = setTimeout(() => {
        setSaveMessage({ type: '', text: '' });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });

      // Create preview URL for immediate display
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage({ type: '', text: '' });

    const formDataToSend = new FormData();
    formDataToSend.append('username', formData.username);
    formDataToSend.append('email', formData.email);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const response = await fetchWithTimeout(`${API_BASE}/student/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        setSaveMessage({
          type: 'success',
          text: 'Profile updated successfully!'
        });

        // Get updated data from response
        const updatedData = await response.json();

        // If we uploaded a new image, use the preview image until page reload
        // This ensures we see the new image immediately
        if (formData.image && previewImage) {
          updatedData.image_url = previewImage;
        }
        // Otherwise, force a cache refresh on the existing image
        else if (updatedData.image_url) {
          const timestamp = new Date().getTime();
          updatedData.image_url = `${updatedData.image_url.split('?')[0]}?t=${timestamp}`;
        }

        // Update the profile data with the modified image URL
        setProfileData((p) => ({ ...(p || {}), ...updatedData }));

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Reset image state but keep the updated data
        setFormData({
          username: updatedData.username,
          email: updatedData.email,
          image: null
        });

        // Only clear preview if we're not using it as the current display image
        if (!formData.image) {
          setPreviewImage(null);
        }

        // Call the onProfileUpdate callback to refresh the parent component
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        setSaveMessage({
          type: 'error',
          text: 'Failed to update profile. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage({
        type: 'error',
        text: 'An error occurred. Please try again later.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Determine which image to display with a timestamp to prevent caching
  const displayImage = previewImage ||
    (profileData?.image_url ?
      (profileData.image_url.includes('?') ?
        profileData.image_url :
        `${profileData.image_url}?t=${new Date().getTime()}`) :
      "/default-avatar.jpg");

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl text-center font-bold mb-6">Edit Profile</h2>

        {saveMessage.text && (
          <div className={`mb-6 p-4 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
            {saveMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Avatar</label>
            <div className="flex items-center space-x-4">
              <img
                key={displayImage} // Add key to force re-render
                src={displayImage}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-2 border-gray-200"
              />
              <input
                ref={fileInputRef}
                type="file"
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0096b1]/50 file:text-gray-900 hover:file:bg-[#0096b1]/100"
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={formData.username}
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              disabled
              readOnly
            />
            <p className="text-xs text-gray-400">Username cannot be changed</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
              disabled={isSaving}
            />

            {/* Email verification */}
            {profileData?.email_verified && formData.email?.trim().toLowerCase() === (profileData.email || '').toLowerCase() ? (
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Email verified
              </div>
            ) : profileData && !profileData.is_google_account ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-gray-700">
                  <b className="text-amber-700">Email not verified.</b> Verify it to keep your account secure and to be able to reset your password if you forget it.
                </p>
                {verifyStep === 0 ? (
                  <button type="button" onClick={sendVerifyCode} disabled={verifyLoading}
                    className="mt-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#0096b1] hover:bg-[#007d93] disabled:opacity-60">
                    {verifyLoading ? 'Sending...' : 'Send verification code'}
                  </button>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input value={code} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code"
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm tracking-[0.2em] font-semibold w-36 focus:ring-2 focus:ring-[#0096b1] outline-none" />
                    <button type="button" onClick={confirmVerify} disabled={verifyLoading}
                      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#0096b1] hover:bg-[#007d93] disabled:opacity-60">
                      {verifyLoading ? '...' : 'Verify'}
                    </button>
                    <button type="button" onClick={sendVerifyCode} disabled={verifyLoading}
                      className="text-xs font-medium text-[#0096b1] hover:underline">Resend code</button>
                  </div>
                )}
                {verifyMsg && <p className="text-xs text-gray-500 mt-1.5">{verifyMsg}</p>}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors
              ${isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#0096b1]/80 hover:bg-[#0096b1]/100'}`} >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
