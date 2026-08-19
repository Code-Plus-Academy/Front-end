import React from 'react';
import { Link } from 'react-router-dom';
import { Play, FileText, Video, Film, Code, Sparkles, ArrowUpRight } from 'lucide-react';

export default function SharedContentCard({ attachment }) {
  if (!attachment || typeof attachment !== 'object') return null;

  const {
    content_type,
    type,
    content_id,
    post_id,
    id,
    title,
    url,
    media_snapshot_url,
    thumbnail_url,
    thumbnail,
    author,
    author_name,
    creator_name,
  } = attachment;

  const targetId = content_id || post_id || id;
  const rawType = (content_type || type || '').toLowerCase();
  const isVideo = rawType.includes('video') || rawType === 'shared_video';
  const isShort = rawType.includes('short') || rawType === 'shared_short';
  const isArticle = rawType.includes('article') || rawType === 'shared_article';
  const isNote = rawType.includes('note') || rawType === 'shared_note';

  // Compute destination href
  let destination = url;
  if (!destination && targetId) {
    if (isVideo) destination = `/videos/${targetId}`;
    else if (isShort) destination = `/shorts/${targetId}`;
    else if (isArticle) destination = `/articles/${targetId}`;
    else if (isNote) destination = `/notes/${targetId}`;
    else destination = `/posts/${targetId}`;
  }

  // If destination is absolute url on current origin, convert to relative
  if (destination && typeof window !== 'undefined' && destination.startsWith(window.location.origin)) {
    destination = destination.slice(window.location.origin.length);
  }

  const finalImage = media_snapshot_url || thumbnail_url || thumbnail || null;
  const finalTitle = title || 'Shared Content';
  const finalAuthor = author_name || author || creator_name || '';

  // Type label & icon
  let typeLabel = 'Post';
  let TypeIcon = Sparkles;
  if (isVideo) {
    typeLabel = 'Video';
    TypeIcon = Video;
  } else if (isShort) {
    typeLabel = 'Short';
    TypeIcon = Film;
  } else if (isArticle) {
    typeLabel = 'Article';
    TypeIcon = FileText;
  } else if (isNote) {
    typeLabel = 'Note';
    TypeIcon = Code;
  }

  const cardContent = (
    <div
      className="shared-content-card group overflow-hidden rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left"
      style={{
        background: 'var(--surface, #121824)',
        borderColor: 'var(--border, rgba(255, 255, 255, 0.12))',
        width: '100%',
        maxWidth: '300px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Media Thumbnail Container */}
      <div
        className="relative w-full aspect-video overflow-hidden flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        }}
      >
        {finalImage ? (
          <img
            src={finalImage}
            alt={finalTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
            style={{
              background: 'radial-gradient(circle at center, rgba(110, 0, 255, 0.15) 0%, rgba(18, 24, 36, 0.9) 100%)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-1.5"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#4cd6fb',
              }}
            >
              <TypeIcon size={18} />
            </div>
            <span
              className="text-[10px] font-mono font-bold tracking-widest uppercase"
              style={{ color: 'var(--dim, #94a3b8)' }}
            >
              {typeLabel}
            </span>
          </div>
        )}

        {/* Video / Short Play Icon Overlay */}
        {(isVideo || isShort) && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white backdrop-blur-md shadow-lg transition-transform group-hover:scale-110"
              style={{
                background: 'rgba(0, 0, 0, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Play size={18} fill="currentColor" className="ml-0.5" />
            </div>
          </div>
        )}

        {/* Content Type Badge */}
        <div
          className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold tracking-wider uppercase backdrop-blur-md flex items-center gap-1 shadow-sm"
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#dee3ea',
          }}
        >
          <TypeIcon size={10} style={{ color: '#4cd6fb' }} />
          <span>{typeLabel}</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4
            className="text-xs font-bold leading-snug line-clamp-2 transition-colors group-hover:text-blue-400"
            style={{
              color: '#dee3ea',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            {finalTitle}
          </h4>
          <ArrowUpRight
            size={14}
            className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity mt-0.5"
            style={{ color: '#4cd6fb' }}
          />
        </div>

        {finalAuthor && (
          <p
            className="text-[11px] truncate flex items-center gap-1"
            style={{ color: '#94a3b8' }}
          >
            <span>by</span>
            <span className="font-medium text-gray-300">
              {finalAuthor.startsWith('@') ? finalAuthor : `@${finalAuthor}`}
            </span>
          </p>
        )}
      </div>
    </div>
  );

  if (!destination) {
    return cardContent;
  }

  const isExternal = destination.startsWith('http://') || destination.startsWith('https://');

  if (isExternal) {
    return (
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
        style={{ textDecoration: 'none' }}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link to={destination} className="block no-underline" style={{ textDecoration: 'none' }}>
      {cardContent}
    </Link>
  );
}
