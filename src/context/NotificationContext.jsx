import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const pollTimerRef = useRef(null);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [inboxRes, reqRes, notifRes] = await Promise.all([
        api.get('/direct/inbox').catch(() => ({ data: { conversations: [] } })),
        api.get('/direct/requests').catch(() => ({ data: { requests: [] } })),
        api.get('/notifications').catch(() => ({ data: { notifications: [] } })),
      ]);

      const conversations = inboxRes.data.conversations || [];
      const requests = reqRes.data.requests || [];
      const notifications = notifRes.data.notifications || [];

      // Calculate unread DMs (unread count in inbox + count of pending requests)
      const dmsUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) + requests.length;
      setUnreadMessages(dmsUnread);

      // Calculate unread notifications
      const notifsUnread = notifications.filter(n => n.unread ?? !n.is_read).length;
      setUnreadNotifications(notifsUnread);
    } catch (err) {
      console.error("Error fetching notification counts:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCounts();

      // Set up periodic polling every 30 seconds
      pollTimerRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchCounts();
        }
      }, 30000);

      // Also fetch when tab becomes visible again
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchCounts();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      setUnreadNotifications(0);
      setUnreadMessages(0);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }
  }, [user, fetchCounts]);

  return (
    <NotificationContext.Provider value={{ unreadNotifications, unreadMessages, refresh: fetchCounts }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
