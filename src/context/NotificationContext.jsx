import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { getGraphQLDirectInbox, getGraphQLDirectRequests, getGraphQLUnreadBadgeCounts } from '../api/graphql';
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
      // 1. Primary: GraphQL unreadBadgeCounts query (direct header auth, ~1ms)
      let counts = null;
      try {
        counts = await getGraphQLUnreadBadgeCounts();
      } catch {
        // Fallback to REST /activity/badge-counts if GraphQL is temporarily unreachable
        const res = await api.get('/activity/badge-counts').catch(() => null);
        if (res?.data) {
          counts = res.data;
        }
      }

      if (counts) {
        setUnreadNotifications(counts.unread_notifications ?? counts.unreadNotifications ?? 0);
        setUnreadMessages(counts.unread_messages ?? counts.unreadMessages ?? 0);
        setPendingFollowRequests(counts.pending_follow_requests ?? counts.pendingFollowRequests ?? 0);
        setPendingMessageRequests(counts.pending_message_requests ?? counts.pendingMessageRequests ?? 0);
        return;
      }

      // Fallback in case /activity/badge-counts is unavailable
      let conversations = [];
      let requests = [];
      try {
        const [inboxRes, reqRes] = await Promise.all([
          getGraphQLDirectInbox(),
          getGraphQLDirectRequests(),
        ]);
        conversations = inboxRes.conversations || [];
        requests = reqRes.requests || [];
      } catch {
        const [inboxRes, reqRes] = await Promise.all([
          api.get('/direct/inbox').catch(() => ({ data: { conversations: [] } })),
          api.get('/direct/requests').catch(() => ({ data: { requests: [] } })),
        ]);
        conversations = inboxRes.data.conversations || [];
        requests = reqRes.data.requests || [];
      }

      const notifRes = await api.get('/notifications').catch(() => ({ data: { notifications: [] } }));
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
