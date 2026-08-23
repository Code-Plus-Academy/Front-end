'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import ContainerCard from './ContainerCard';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from '../icons/ContainerIcons';

const SECTION_CONFIG = {
  envelope: {
    title: 'Learning Envelopes',
    typeKey: 'envelope',
    allParam: 'envelope=all',
    icon: EnvelopeIcon,
    accent: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED, #A855F7)',
    desc: 'Structured course tracks, progress rings & syllabus bundles',
  },
  playlist: {
    title: 'Video Playlists',
    typeKey: 'playlist',
    allParam: 'playlist=all',
    icon: PlaylistIcon,
    accent: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
    desc: 'Dev shorts & tutorials with sequential continuous queue',
  },
  packs: {
    title: 'Study Packs',
    typeKey: 'packs',
    allParam: 'packs=all',
    icon: StudyPackIcon,
    accent: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    desc: 'Semester notes, PYQs, and revision cheatsheets',
  },
  collection: {
    title: 'Social Collections',
    typeKey: 'collection',
    allParam: 'collection=all',
    icon: CollectionIcon,
    accent: '#9333EA',
    gradient: 'linear-gradient(135deg, #9333EA, #EC4899)',
    desc: 'Community posts, discussions & tech articles',
  },
  vaults: {
    title: 'Code Vaults',
    typeKey: 'vaults',
    allParam: 'vaults=all',
    icon: VaultIcon,
    accent: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    desc: 'Code snippets, algorithm templates & cheat scripts',
  },
};

export default function ContainerCarouselSection({
  type = 'envelope',
  containers = [],
  items = [],
  onSelectContainer,
  onOpenViewAll,
  onOpenCreateModal,
  onPlayAll,
}) {
  const scrollRef = useRef(null);
  const config = SECTION_CONFIG[type] || SECTION_CONFIG.envelope;
  const Icon = config.icon;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (containers.length === 0) return null;

  return (
    <section style={{ marginBottom: 28, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* ── Section Header: Icon + Title + Count & "View all" link ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        padding: '0 4px',
        flexWrap: 'wrap',
        gap: 8,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Left: Avatar + Title + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: config.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: `0 3px 10px ${config.accent}40`,
            flexShrink: 0,
          }}>
            <Icon size={16} color="#fff" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <h2 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 'clamp(15px, 2.5vw, 17px)',
              fontWeight: 800,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {config.title}
            </h2>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '1px 7px',
              borderRadius: 12,
              background: 'var(--s2)',
              color: 'var(--sub)',
              fontFamily: "'JetBrains Mono', monospace",
              flexShrink: 0,
            }}>
              {containers.length}
            </span>
          </div>
        </div>

        {/* Right: Controls (Scroll Buttons + View All link) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Desktop Arrow Scroll Controls */}
          <div className="carousel-nav-arrows" style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => scroll('left')}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--sub)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'all 0.15s ease',
              }}
              className="hover:border-purple-400 hover:text-purple-400 active:scale-90"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--sub)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'all 0.15s ease',
              }}
              className="hover:border-purple-400 hover:text-purple-400 active:scale-90"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View All Link */}
          <button
            type="button"
            onClick={() => onOpenViewAll && onOpenViewAll(config.typeKey)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 8,
              background: 'none',
              border: 'none',
              color: '#7C3AED',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="hover:bg-purple-500/10 active:scale-95"
          >
            <span>View all</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Horizontal Scrolling Carousel Container ── */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '6px 2px 14px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
        className="hide-scrollbar"
      >
        {containers.map((container) => (
          <div key={container.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
            <ContainerCard
              container={container}
              items={items}
              onClick={() => onSelectContainer && onSelectContainer(container)}
              onPlayAll={onPlayAll}
              fixedWidth={true}
            />
          </div>
        ))}

        {/* "+ New" Container Quick Action Card at end of carousel */}
        <div style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal(config.typeKey)}
            style={{
              width: 'clamp(160px, 42vw, 220px)',
              maxWidth: 'calc(100vw - 60px)',
              height: '100%',
              minHeight: 180,
              borderRadius: 'var(--r-md, 18px)',
              background: 'var(--surface)',
              border: '1.5px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              color: 'var(--sub)',
              padding: 16,
              boxSizing: 'border-box',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="hover:border-purple-400 hover:text-purple-400 hover:-translate-y-1 active:scale-[0.98]"
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `${config.accent}15`,
              color: config.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Plus size={18} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>+ New {config.title.slice(0, -1)}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 640px) {
          .carousel-nav-arrows {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
