// frontend/src/components/videos/VideoCard.jsx
// Redesigned Explorer Video Card with Explorer subtitle, Creator header, 16:9 canvas with badges and play overlay, and expandable details.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Tv, 
  Clock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ContentActionMenu from '../ui/ContentActionMenu';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

function fmtCount(n) {
  if (!n) return '0';
  const num = Number(n);
  if (isNaN(num)) return String(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export default function VideoCard({ video, horizontal = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(video?.is_following || false);

  if (!video) return null;

  const isCreatorVerified = video.creator_verified || video.creator_username === 'cpaadmin' || video.verified;
  const rawTitle = video.title || 'System Design Primer: Building Scalable Microservices & Event-Driven Architecture';
  const creatorName = video.creator_name || video.creator_username || 'Tech With Tim';
  const creatorUsername = video.creator_username || video.creator_handle || 'techwithtim';
  const creatorAvatar = video.creator_avatar || video.creator_avatar_url;
  
  // Initials for avatar
  const initials = (creatorName.split(' ').map(w => w[0]).join('').slice(0, 2) || 'TT').toUpperCase();
  
  const subscribersOrViews = video.subscribers_formatted || 
    (video.subscribers_count ? `${fmtCount(video.subscribers_count)} subscribers` : 
    (video.views_formatted || `${fmtCount(video.views || video.views_count)} views`));

  const duration = video.duration_formatted || (video.duration ? (typeof video.duration === 'number' ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : video.duration) : '18:42');
  const time = timeAgo(video.created_at || video.published_at);
  const isYouTube = video.video_type === 'youtube' || video.is_youtube || (video.video_url && video.video_url.includes('youtube'));
  const sourceLabel = isYouTube ? 'YouTube HD' : (video.source_label || 'YouTube HD');
  const categoryLabel = video.category || (Array.isArray(video.tags) && video.tags.length > 0 ? video.tags[0] : null) || video.subject || 'GATE CS';

  const description = video.description || 
    'A complete walkthrough of building resilient distributed microservices, message queues with Kafka, and database sharding patterns. Perfect for system design interview prep and scalable architectures.';

  const topicsLine = video.topics || (Array.isArray(video.tags) && video.tags.length > 0 ? video.tags.join(' • ') : 'Microservices • Message Queues • Caching Strategies');

  const handleToggleFollow = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to follow creators');
      return;
    }
    const targetUserId = video.user_id || video.creator_id;
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      if (targetUserId) {
        await api.post(`/users/${targetUserId}/follow`);
      }
      toast.success(!prev ? `Followed @${creatorUsername}` : `Unfollowed @${creatorUsername}`);
    } catch (err) {
      setIsFollowing(prev);
    }
  };

  // ── Horizontal layout (for search lists / sidebars) ───────────────────────
  if (horizontal) {
    return (
      <div
        onClick={() => navigate(`/videos/${video.id}`)}
        className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0">
          {video.thumbnail_url ? (
            <img 
              src={video.thumbnail_url} 
              alt={rawTitle} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-2 text-center">
              <span className="text-[10px] text-white font-bold uppercase line-clamp-2">{rawTitle}</span>
            </div>
          )}
          {duration && (
            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded">
              {duration}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
              <span>{creatorName}</span>
              {isCreatorVerified && <Check className="w-3 h-3 text-blue-500 stroke-[3]" />}
            </div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mt-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {rawTitle}
            </h4>
          </div>
          <span suppressHydrationWarning className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {subscribersOrViews} {time ? `• ${time}` : ''}
          </span>
        </div>

        <div onClick={e => e.stopPropagation()} className="shrink-0">
          <ContentActionMenu
            contentId={video.id}
            contentType={video.content_type === 'short' || video.is_short ? 'short' : 'video'}
            contentAuthorId={video.user_id || video.creator_id}
            creatorUsername={video.creator_username}
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/videos/${video.id}` : undefined}
            triggerSize={16}
            sourceSurface="video_feed"
          />
        </div>
      </div>
    );
  }

  // ── Redesigned Vertical Video Card (Matching User Spec) ───────────────────
  return (
    <section 
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col w-full text-left"
      data-purpose="feed-card-preview"
    >
      {/* Creator Profile Header */}
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div 
          className="flex items-center space-x-2.5 cursor-pointer group/creator"
          onClick={(e) => {
            e.stopPropagation();
            if (creatorUsername) navigate(`/profile/${creatorUsername}`);
          }}
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {creatorAvatar ? (
                  <img 
                    src={creatorAvatar} 
                    alt={creatorName} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>
            {isCreatorVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-0.5 text-[10px] leading-none flex items-center justify-center shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover/creator:text-indigo-600 dark:group-hover/creator:text-indigo-400 transition-colors truncate">
                {creatorName}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
              @{creatorUsername} • {subscribersOrViews}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button 
            onClick={handleToggleFollow}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition cursor-pointer ${
              isFollowing 
                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <ContentActionMenu
            contentId={video.id}
            contentType={video.content_type === 'short' || video.is_short ? 'short' : 'video'}
            contentAuthorId={video.user_id || video.creator_id}
            creatorUsername={video.creator_username}
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/videos/${video.id}` : undefined}
            triggerSize={16}
            sourceSurface="video_feed"
          />
        </div>
      </div>

      {/* 16:9 Video Canvas Container */}
      <div 
        className="relative w-full aspect-video bg-slate-950 overflow-hidden flex items-center justify-center group cursor-pointer" 
        data-purpose="video-thumbnail-container"
        onClick={() => navigate(`/videos/${video.id}`)}
      >
        {/* Real Thumbnail or Graphic Representation */}
        {video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={rawTitle} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-between p-4">
            {/* Background Diagram Graphics */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:12px_12px]" />
            
            {/* Graphic Diagram Mock in Thumbnail */}
            <div className="relative z-10 text-center my-auto px-2">
              <span className="text-[9px] font-mono tracking-widest text-indigo-300 uppercase block mb-0.5">
                {video.category ? `${video.category} Architecture` : 'High-Level Scalable Systems'}
              </span>
              <p className="text-sm font-black text-white tracking-tight uppercase leading-snug drop-shadow-md line-clamp-2">
                {rawTitle}
              </p>
              <p className="text-[9px] text-slate-300 line-clamp-1 max-w-[240px] mx-auto mt-0.5">
                {topicsLine}
              </p>
            </div>
          </div>
        )}

        {/* Top Badges (Source Badge & Duration Pill) */}
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start pointer-events-none">
          {/* Source Badge */}
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-red-600/95 backdrop-blur-sm text-white text-[10px] font-bold shadow-sm">
            <Tv className="w-3 h-3" />
            <span>{sourceLabel}</span>
          </span>
          {/* Content Format & Duration Pill */}
          {duration && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{duration}</span>
            </span>
          )}
        </div>
      </div>

      {/* Video Card Body Text & Details */}
      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h2 
            onClick={() => navigate(`/videos/${video.id}`)}
            className="text-sm font-bold text-slate-900 dark:text-white leading-snug tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 cursor-pointer"
          >
            {rawTitle}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {description}
          </p>

          {/* Video Category Pill placed right after description */}
          {categoryLabel && (
            <div className="pt-0.5">
              <span className="inline-flex items-center text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/40 dark:border-indigo-800/40">
                {categoryLabel}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 font-medium">
          <span suppressHydrationWarning>{time ? `${time} • ` : ''}{subscribersOrViews}</span>
          <span>CC • English (Auto)</span>
        </div>
      </div>
    </section>
  );
}

