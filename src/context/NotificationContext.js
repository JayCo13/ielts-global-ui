import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import FloatingNotification from '../components/FloatingNotification';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastClosedTime, setLastClosedTime] = useState(null);
  const location = useLocation();
 
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return; // Don't fetch if not logged in
      try {
        const response = await fetchWithTimeout(`${API_BASE}/student/action/user-notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Add a created_at field if it doesn't exist
          const processedData = data.map((notification, index) => ({
            ...notification,
            // If created_at doesn't exist, create a date with different days for demo purposes
            created_at: notification.created_at || new Date(Date.now() - index * 86400000).toISOString()
          }));
          setNotifications(processedData);
          
          // Only show notifications if they haven't been closed in the last 30 minutes
          const shouldShow = !lastClosedTime || (Date.now() - lastClosedTime) > 30 * 60 * 1000;
          setShowNotifications(shouldShow);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching notifications:', error);
        }
      }
    };

    fetchNotifications();
    
    // Set up interval to check if 30 minutes have passed since last close
    const checkInterval = setInterval(() => {
      if (lastClosedTime && (Date.now() - lastClosedTime) > 30 * 60 * 1000) {
        setShowNotifications(true);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [lastClosedTime]);


  const showNotification = useCallback((message, type = 'announcement', image_url = null) => {
    const newNotification = {
      content: message,
      type,
      image_url,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
    setShowNotifications(true);
  }, []);

  const hideNotification = useCallback(() => {
    setShowNotifications(false);
    setLastClosedTime(Date.now());
  }, []);

  // Check if we're on a page where notifications should be shown
  const shouldShowNotifications = [
    '/',
    '/listening_list',
    '/writing_list',
    '/reading_list',
    '/speaking_list'
  ].includes(location.pathname);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification, notifications }}>
      {children}
      {showNotifications && shouldShowNotifications && notifications.length > 0 && (
        <FloatingNotification
          notifications={notifications}
          onClose={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};
