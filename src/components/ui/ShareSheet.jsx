'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  Link as LinkIcon, 
  Check, 
  Mail,
  ChevronRight,
  Send,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

let toast = { success: () => {}, error: () => {} };
try {
  toast = require('react-hot-toast').default;
} catch {}

/* ─────────────────────────────────────────────────────────────────────────────
   Brand Vector Icons (Facebook, Messenger, WhatsApp, Threads, X)
───────────────────────────────────────────────────────────────────────────── */
const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const MessengerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.45 5.508 3.714 7.185v3.557l3.414-1.873c.915.253 1.88.389 2.872.389 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.037 12.443l-2.613-2.787-5.097 2.787 5.606-5.952 2.678 2.787 5.032-2.787-5.606 5.952z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95a.75.75 0 0 0 .937.937l4.782-1.388A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm-3.5 6a1 1 0 0 0-1 1v.25c0 1.25.5 2.5 1.5 3.5s2.25 1.5 3.5 1.5H13a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-.5a.5.5 0 0 1-.5-.5v-.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8.5Z" />
    <path d="M19.05 4.95A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.84.5 3.57 1.36 5.06L2 22l5.09-1.34A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.05ZM12 20.15c-1.57 0-3.08-.43-4.4-1.24l-.32-.19-3.26.86.87-3.18-.21-.33A8.12 8.12 0 0 1 3.85 12c0-4.5 3.65-8.15 8.15-8.15s8.15 3.65 8.15 8.15c0 4.5-3.65 8.15-8.15 8.15Zm4.5-6.09c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.96-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.36-.77-1.86c-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.42 1.02 2.59.12.17 1.76 2.69 4.26 3.77.6.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.18-.47-.3Z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24C5.466 24 0 18.534 0 11.814 0 5.094 5.466 0 12.186 0c6.685 0 11.814 5.094 11.814 11.814 0 .705-.06 1.409-.179 2.089h-4.079c.119-.68.179-1.384.179-2.089 0-4.498-3.418-7.735-7.735-7.735-4.318 0-7.735 3.417-7.735 7.735s3.417 7.735 7.735 7.735c2.429 0 4.618-1.109 6.058-2.879l2.909 2.909C19.165 22.106 15.866 24 12.186 24z"/>
    <path d="M12.186 16.735c-2.729 0-4.921-2.192-4.921-4.921s2.192-4.921 4.921-4.921 4.921 2.192 4.921 4.921c0 .765-.179 1.499-.492 2.152l2.909 1.682c.985-1.169 1.663-2.613 1.663-4.195 0-4.921-3.993-8.914-8.914-8.914s-8.914 3.993-8.914 8.914 3.993 8.914 8.914 8.914c2.259 0 4.318-.849 5.899-2.259l-2.673-2.673c-.925.806-2.122 1.317-3.396 1.317z"/>
  </svg>
);

const XTwitterIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

function getUserAvatar(u) {
  if (!u) return null;
  const raw = u.avatar_url || u.other_avatar_url || u.other_avatar || u.avatar || u.profile_picture || u.picture || u.image;
  if (raw && typeof raw === 'string' && raw.trim().length > 0 && !raw.includes('undefined') && !raw.includes('null')) {
    return raw.trim();
  }
  const seed = encodeURIComponent(u.username || u.name || 'User');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=6e00ff,00dbe9,3b82f6`;
}

export default function ShareSheet({
  isOpen,
  onClose,
  contentType = 'post',
  contentId,
  contentUrl,
  url,
  contentTitle = '',
  title = '',
  contentThumbnail = null,
  thumbnail_url = null,
  thumbnail = null,
  contentAuthor = '',
  author = '',
  creator_name = '',
}) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [mounted, setMounted] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingToUser, setSendingToUser] = useState(null);
  const [sentUsers, setSentUsers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const sheetRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const scrollRowRef = useRef(null);

  const finalTitle = contentTitle || title || '';
  const finalThumbnail = contentThumbnail || thumbnail_url || thumbnail || null;
  const finalAuthor = contentAuthor || author || creator_name || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUser(null);
      setCaption('');
      setSearchQuery('');
    }
  }, [isOpen]);

  const getPathForType = (type) => {
    if (type === 'note' || type === 'notes') return 'notes';
    if (type === 'article' || type === 'articles') return 'articles';
    if (type === 'short' || type === 'shorts') return 'shorts';
    if (type === 'video' || type === 'videos' || type === 'long_video') return 'videos';
    return 'posts';
  };

  const normalizedUrl = contentUrl || url || (typeof window !== 'undefined'
    ? `${window.location.origin}/${getPathForType(contentType)}/${contentId}`
    : '');

  const normalizedContentType = (contentType === 'note' || contentType === 'notes') 
    ? 'notes' 
    : (contentType === 'short' ? 'short' : (contentType === 'article' ? 'article' : (contentType === 'long_video' || contentType === 'video' ? 'long_video' : 'post')));

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Fetch initial contacts & recent direct messaging conversations
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchInitialPeople = async () => {
      setLoadingContacts(true);
      try {
        const myId = user?.id || user?.user_id;
        const [inboxRes, usersRes] = await Promise.allSettled([
          user ? api.get('/direct/inbox') : Promise.reject(),
          api.get('/users?limit=30')
        ]);

        if (!isMounted) return;

        const peopleMap = new Map();

        // 1. Direct inbox conversations
        if (inboxRes.status === 'fulfilled' && Array.isArray(inboxRes.value.data?.conversations)) {
          inboxRes.value.data.conversations.forEach((c, idx) => {
            const uid = c.other_user_id || c.id;
            if (uid && String(uid) !== String(myId)) {
              const rawTime = c.last_message_at || c.updated_at || c.created_at;
              const lastInteracted = rawTime ? new Date(rawTime).getTime() : (Date.now() - idx * 60000);
              
              peopleMap.set(String(uid), {
                id: uid,
                conversation_id: c.id,
                name: c.other_name || c.name || c.other_username || c.username,
                username: c.other_username || c.username,
                avatar_url: c.other_avatar_url || c.other_avatar || c.avatar_url || null,
                is_online: Boolean(c.is_online || c.online || c.other_is_online),
                last_interacted_at: lastInteracted,
              });
            }
          });
        }

        // 2. Add community users/developers
        if (usersRes.status === 'fulfilled') {
          const uList = usersRes.value.data?.users || usersRes.value.data?.items || [];
          uList.forEach(u => {
            const uid = u.id || u.user_id;
            if (uid && String(uid) !== String(myId) && !peopleMap.has(String(uid))) {
              peopleMap.set(String(uid), {
                id: uid,
                name: u.name || u.username,
                username: u.username,
                avatar_url: u.avatar_url || u.avatar || null,
                is_online: Boolean(u.is_online || u.online),
                last_interacted_at: u.last_active_at ? new Date(u.last_active_at).getTime() : 0,
              });
            }
          });
        }

        const sorted = Array.from(peopleMap.values()).sort((a, b) => {
          if (b.last_interacted_at !== a.last_interacted_at) {
            return b.last_interacted_at - a.last_interacted_at;
          }
          return (b.is_online ? 1 : 0) - (a.is_online ? 1 : 0);
        });

        setContacts(sorted);
      } catch (err) {
        console.error('Failed to load contacts for share sheet:', err);
      } finally {
        if (isMounted) setLoadingContacts(false);
      }
    };

    fetchInitialPeople();
    return () => { isMounted = false; };
  }, [isOpen, user]);

  // Live Elasticsearch & DB user search with debouncing
  useEffect(() => {
    if (!isOpen) return;
    const q = searchQuery.trim();

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const myId = user?.id || user?.user_id;
        let results = [];
        try {
          const esRes = await api.get('/search/section', {
            params: { type: 'people', q, limit: 20 }
          });
          results = esRes.data?.items || [];
        } catch {}

        if (!results.length) {
          try {
            const sqlRes = await api.get('/users/search', {
              params: { q, limit: 20 }
            });
            results = sqlRes.data?.users || sqlRes.data?.items || [];
          } catch {
            const fbRes = await api.get('/users', {
              params: { q, limit: 20 }
            });
            results = fbRes.data?.users || [];
          }
        }

        const mapped = results
          .filter(u => String(u.id || u.user_id) !== String(myId))
          .map(u => ({
            id: u.id || u.user_id,
            name: u.name || u.username,
            username: u.username,
            avatar_url: u.avatar_url || u.avatar || u.profile_picture || null,
            is_online: Boolean(u.is_online || u.online),
          }));

        setSearchResults(mapped);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, isOpen, user]);

  const activeList = searchQuery.trim() ? searchResults : contacts;
  const isListLoading = searchQuery.trim() ? isSearching : loadingContacts;

  // Direct Message Sending
  const handleSendDM = async (targetUser = null) => {
    const contact = targetUser || selectedUser;
    if (!contact) return;

    if (!user) {
      toast.error('Please sign in to send messages');
      return;
    }

    setIsSending(true);
    setSendingToUser(contact.id);
    try {
      const shareText = caption.trim();
      const shareMessage = shareText
        ? `${shareText}\n${finalTitle ? `"${finalTitle}"\n` : ''}${normalizedUrl}`
        : `${finalTitle ? `"${finalTitle}"\n` : ''}${normalizedUrl}`;

      const payload = {
        receiver_id: contact.id,
        to_username: contact.username,
        text: shareText,
        message: shareMessage,
        body: shareMessage,
        type: contentType === 'video' || contentType === 'long_video'
          ? 'shared_video'
          : (contentType === 'short' ? 'shared_short' : 'shared_post'),
        content_attachment: {
          content_type: normalizedContentType,
          content_id: contentId,
          post_id: contentId,
          title: finalTitle || 'Shared Content',
          url: normalizedUrl,
          media_snapshot_url: finalThumbnail || null,
          author: finalAuthor || null,
          author_id: contentAuthor || null
        }
      };

      if (contact.conversation_id) {
        await api.post(`/direct/${contact.conversation_id}`, payload);
      } else {
        await api.post('/direct/new', {
          to_username: contact.username,
          ...payload
        });
      }

      setSentUsers(prev => new Set(prev).add(contact.id));
      toast.success('Sent! ✈️');
      setSelectedUser(null);
      setCaption('');
      onClose();
    } catch (err) {
      console.error('Failed to send DM:', err);
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
      setSendingToUser(null);
    }
  };

  // Copy Link
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(normalizedUrl)
        .then(() => {
          setCopied(true);
          toast.success('Link copied to clipboard! 📋');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  // External Share Handlers
  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(normalizedUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const handleMessenger = () => {
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(normalizedUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(normalizedUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsApp = () => {
    const text = `${finalTitle ? `${finalTitle}\n` : ''}${normalizedUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(finalTitle || 'Code Plus Academy');
    const body = encodeURIComponent(`Check this out on Code Plus Academy:\n\n${normalizedUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const handleThreads = () => {
    const text = `${finalTitle ? `${finalTitle}\n` : ''}${normalizedUrl}`;
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleXTwitter = () => {
    const text = finalTitle ? `${finalTitle} via @codeplusacademy` : 'Check this out on Code Plus Academy!';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(normalizedUrl)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleScrollRight = () => {
    if (scrollRowRef.current) {
      scrollRowRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      style={{
        zIndex: 9999999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-sheet-title"
    >
      <div 
        ref={sheetRef}
        className="w-full sm:max-w-[480px] rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all transform animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        style={{
          backgroundColor: isDark ? '#111722' : '#ffffff',
          color: isDark ? '#f8fafc' : '#111827',
          border: isDark ? '1px solid rgba(110, 0, 255, 0.25)' : '1px solid rgba(110, 0, 255, 0.15)',
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(110, 0, 255, 0.12)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.2), 0 0 25px rgba(110, 0, 255, 0.08)',
          fontFamily: 'inherit',
        }}
      >
        {/* Decorative Brand Accent Top Line */}
        <div
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #6e00ff 0%, #00dbe9 50%, #6e00ff 100%)',
          }}
        />

        {/* ── 1. Header (Left X, Centered "Share" Title) ───────────────────── */}
        <div className="relative flex items-center justify-center px-4 pt-3.5 pb-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute left-4 top-3.5 p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-colors cursor-pointer"
            style={{ color: isDark ? '#e2e8f0' : '#1f2937' }}
          >
            <X size={22} strokeWidth={2.2} />
          </button>
          <h2
            id="share-sheet-title"
            className="text-base font-bold tracking-tight"
            style={{ color: isDark ? '#f8fafc' : '#111827' }}
          >
            Share
          </h2>
        </div>

        {/* ── 2. Capsule Search Bar ────────────────────────────────────────── */}
        <div className="px-4 py-2">
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
              border: isDark ? '1px solid rgba(110, 0, 255, 0.2)' : '1px solid rgba(110, 0, 255, 0.15)',
            }}
          >
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent border-none outline-none text-sm font-normal leading-none"
              style={{ color: isDark ? '#f8fafc' : '#111827' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── 3. Direct Contact Targets Grid (Main 4-Column Layout) ─────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[220px] max-h-[340px] edm-scroll">
          {isListLoading ? (
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                  <div
                    className="w-14 h-14 rounded-full"
                    style={{ backgroundColor: isDark ? '#202b38' : '#e2e8f0' }}
                  />
                  <div
                    className="w-12 h-2.5 rounded"
                    style={{ backgroundColor: isDark ? '#202b38' : '#e2e8f0' }}
                  />
                </div>
              ))}
            </div>
          ) : activeList.length > 0 ? (
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {activeList.map((contact) => {
                const isSelected = selectedUser?.id === contact.id;
                const isSent = sentUsers.has(contact.id);
                const isItemSending = sendingToUser === contact.id;
                const displayName = contact.name || contact.username || 'User';

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser((prev) => (prev?.id === contact.id ? null : contact));
                    }}
                    disabled={isItemSending}
                    className="flex flex-col items-center gap-1.5 p-1 rounded-2xl group focus:outline-none cursor-pointer transition-transform active:scale-95 text-center"
                  >
                    <div className="relative">
                      <img
                        src={getUserAvatar(contact)}
                        alt={displayName}
                        className={`w-14 h-14 rounded-full object-cover shadow-sm transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#6e00ff] scale-105'
                            : isSent
                              ? 'ring-2 ring-emerald-500 opacity-90'
                              : 'group-hover:scale-105'
                        }`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          const seed = encodeURIComponent(contact.username || contact.name || 'User');
                          e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=6e00ff,00dbe9,3b82f6`;
                        }}
                      />

                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-[#6e00ff] text-white shadow-md">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}

                      {/* Sent Confirmation Badge */}
                      {!isSelected && isSent && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-md">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}

                      {/* Loading Spinner */}
                      {isItemSending && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    <span
                      className="text-[11.5px] font-medium line-clamp-2 leading-tight px-1 max-w-[80px] break-words"
                      style={{
                        color: isSelected
                          ? '#6e00ff'
                          : (isSent ? '#10b981' : (isDark ? '#e2e8f0' : '#1f2937')),
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    >
                      {isSent ? 'Sent' : displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-xs gap-2">
              <Users size={24} className="opacity-40" />
              <p>{searchQuery ? `No users found matching "${searchQuery}"` : 'No contacts available'}</p>
            </div>
          )}
        </div>

        {/* ── 4. Conditional Message / Send Bar when a user is selected ────── */}
        {selectedUser && (
          <div
            className="px-4 py-2.5 border-t animate-in fade-in slide-in-from-bottom-2 duration-150"
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendDM();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Send to ${selectedUser.name || selectedUser.username}...`}
                autoFocus
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? '#111827' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDark ? '#f8fafc' : '#111827',
                }}
              />
              <button
                type="submit"
                disabled={isSending}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer flex-shrink-0"
                style={{
                  background: '#6e00ff',
                  boxShadow: '0 4px 14px rgba(110, 0, 255, 0.4)',
                }}
              >
                {isSending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── 5. Bottom Horizontal Platform Sharing Bar ────────────────────── */}
        <div
          className="relative px-3 pt-3 pb-4 border-t"
          style={{
            backgroundColor: isDark ? '#111827' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            ref={scrollRowRef}
            className="flex items-center gap-4 overflow-x-auto no-scrollbar px-1 py-1"
          >
            {/* 1. Copy link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 active:scale-95 text-white"
                style={{
                  background: copied
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #6e00ff, #8a2be2)',
                  boxShadow: copied
                    ? '0 4px 14px rgba(16, 185, 129, 0.45)'
                    : '0 4px 14px rgba(110, 0, 255, 0.45)',
                }}
              >
                {copied ? <Check size={20} strokeWidth={2.5} /> : <LinkIcon size={20} />}
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isDark ? '#cbd5e1' : '#334155' }}
              >
                {copied ? 'Copied!' : 'Copy link'}
              </span>
            </button>

            {/* 2. Facebook */}
            <button
              type="button"
              onClick={handleFacebook}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 active:scale-95 text-white"
                style={{
                  backgroundColor: '#1877F2',
                  boxShadow: '0 4px 14px rgba(24, 119, 242, 0.4)',
                }}
              >
                <FacebookIcon />
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isDark ? '#cbd5e1' : '#334155' }}
              >
                Facebook
              </span>
            </button>

            {/* 3. Messenger */}
            <button
              type="button"
              onClick={handleMessenger}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 active:scale-95 text-white"
                style={{
                  background: 'linear-gradient(135deg, #00B2FF 0%, #006AFF 50%, #9900FF 100%)',
                  boxShadow: '0 4px 14px rgba(0, 106, 255, 0.4)',
                }}
              >
                <MessengerIcon />
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isDark ? '#cbd5e1' : '#334155' }}
              >
                Messenger
              </span>
            </button>

            {/* 4. WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 active:scale-95 text-white"
                style={{
                  backgroundColor: '#25D366',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                }}
              >
                <WhatsAppIcon />
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isDark ? '#cbd5e1' : '#334155' }}
              >
                WhatsApp
              </span>
            </button>

            {/* 5. Email */}
            <button
              type="button"
              onClick={handleEmail}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 active:scale-95 text-white"
                style={{
                  background: 'linear-gradient(135deg, #EA4335, #D93025)',
                  boxShadow: '0 4px 14px rgba(234, 67, 53, 0.4)',
                }}
              >
                <Mail size={20} />
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isDark ? '#cbd5e1' : '#334155' }}
              >
                Email
              </span>
            </button>

            {/* 6. Threads */}
            <button
              type="button"
              onClick={handleThreads}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 active:scale-95 text-white"
                style={{
                  background: 'linear-gradient(135deg, #101010, #262626)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
                }}
              >
                <ThreadsIcon />
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isDark ? '#cbd5e1' : '#334155' }}
              >
                Threads
              </span>
            </button>

            {/* 7. X (Twitter) */}
            <button
              type="button"
              onClick={handleXTwitter}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 active:scale-95 text-white"
                style={{
                  background: 'linear-gradient(135deg, #0f1419, #1d9bf0)',
                  boxShadow: '0 4px 14px rgba(29, 155, 240, 0.4)',
                }}
              >
                <XTwitterIcon />
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isDark ? '#cbd5e1' : '#334155' }}
              >
                X
              </span>
            </button>
          </div>

          {/* Right Scroll Arrow Indicator Button */}
          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Scroll options"
            className="absolute right-2 top-6 -translate-y-1/2 w-8 h-8 rounded-full bg-[#6e00ff] hover:bg-[#8a2be2] text-white shadow-lg flex items-center justify-center transition-all cursor-pointer"
            style={{
              boxShadow: '0 4px 12px rgba(110, 0, 255, 0.5)',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
