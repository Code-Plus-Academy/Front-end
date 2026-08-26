import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingFollowRequests, setPendingFollowRequests] = useState(0);
  const [pendingMessageRequests, setPendingMessageRequests] = useState(0);
  const pollTimerRef = useRef(null);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Consolidated primary endpoint (1 round-trip instead of 3)
      const res = await api.get('/activity/badge-counts').catch(() => null);
      if (res?.data) {
        setUnreadNotifications(res.data.unread_notifications ?? 0);
        setUnreadMessages(res.data.unread_messages ?? 0);
        setPendingFollowRequests(res.data.pending_follow_requests ?? 0);
        setPendingMessageRequests(res.data.pending_message_requests ?? 0);
        return;
      }

      // Fallback in case /activity/badge-counts is unavailable
      const [inboxRes, reqRes, notifRes] = await Promise.all([
        api.get('/direct/inbox').catch(() => ({ data: { conversations: [] } })),
        api.get('/direct/requests').catch(() => ({ data: { requests: [] } })),
        api.get('/notifications').catch(() => ({ data: { notifications: [] } })),
      ]);

      const conversations = inboxRes.data.conversations || [];
      const requests = reqRes.data.requests || [];
      const notifications = notifRes.data.notifications || [];

      const dmsUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) + requests.length;
      setUnreadMessages(dmsUnread);
      setPendingMessageRequests(requests.length);

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
    <NotificationContext.Provider value={{ unreadNotifications, unreadMessages, pendingFollowRequests, pendingMessageRequests, refresh: fetchCounts }}>
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
