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
      // 1. Primary: GraphQL unreadBadgeCounts query (or fallback to /activity/badge-counts)
      let counts = null;
      try {
        counts = await getGraphQLUnreadBadgeCounts();
      } catch {
        const res = await api.get('/activity/badge-counts').catch(() => null);
        if (res?.data) {
          counts = res.data?.data || res.data;
        }
      }

      if (counts) {
        setUnreadNotifications(counts.unread_notifications ?? counts.unreadNotifications ?? 0);
        setUnreadMessages(counts.unread_messages ?? counts.unreadMessages ?? 0);
        setPendingFollowRequests(counts.pending_follow_requests ?? counts.pendingFollowRequests ?? 0);
        setPendingMessageRequests(counts.pending_message_requests ?? counts.pendingMessageRequests ?? 0);
      }
    } catch (err) {
      console.warn("[NotificationContext] Error fetching notification counts:", err?.message);
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
