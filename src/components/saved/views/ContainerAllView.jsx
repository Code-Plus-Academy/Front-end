'use client';

import React from 'react';
import { ArrowLeft, Plus, Folder } from 'lucide-react';
import ContainerCard from '../containers/ContainerCard';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from '../icons/ContainerIcons';

const CONTAINER_VIEW_META = {
  envelope: {
    title: 'Learning Envelopes',
    singular: 'Learning Envelope',
    icon: EnvelopeIcon,
    accent: '#0284C7',
    gradient: 'linear-gradient(135deg, #0284C7, #38BDF8)',
    desc: 'Structured course tracks, progress rings & curriculum bundles',
  },
  playlist: {
    title: 'Video Playlists',
    singular: 'Video Playlist',
    icon: PlaylistIcon,
    accent: 'var(--primary, #3B7CFF)',
    gradient: 'linear-gradient(135deg, #3B7CFF, #6366F1)',
    desc: 'Dev shorts & video tutorials with continuous queue playback',
  },
  packs: {
    title: 'Study Packs',
    singular: 'Study Pack',
    icon: StudyPackIcon,
    accent: 'var(--green, #34C77B)',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    desc: 'Semester notes, PYQs, and revision exam cheatsheets',
  },
  study_pack: {
    title: 'Study Packs',
    singular: 'Study Pack',
    icon: StudyPackIcon,
    accent: 'var(--green, #34C77B)',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    desc: 'Semester notes, PYQs, and revision exam cheatsheets',
  },
  collection: {
    title: 'Social Collections',
    singular: 'Social Collection',
    icon: CollectionIcon,
    accent: 'var(--accent-purple, #9333EA)',
    gradient: 'linear-gradient(135deg, #9333EA, #EC4899)',
    desc: 'Curated community discussions, posts & articles',
  },
  vaults: {
    title: 'Code Vaults',
    singular: 'Code Vault',
    icon: VaultIcon,
    accent: 'var(--yellow, #F59E0B)',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    desc: 'Code snippets, algorithmic blueprints & secret templates',
  },
  snippet_notebook: {
    title: 'Code Vaults',
    singular: 'Code Vault',
    icon: VaultIcon,
    accent: 'var(--yellow, #F59E0B)',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    desc: 'Code snippets, algorithmic blueprints & secret templates',
  },
};

export default function ContainerAllView({
  containerType = 'envelope',
  containers = [],
  items = [],
  onBack,
  onSelectContainer,
  onOpenCreateModal,
  onPlayAll,
}) {
  const meta = CONTAINER_VIEW_META[containerType] || CONTAINER_VIEW_META.envelope;
  const Icon = meta.icon || Folder;

  const relevantContainers = containers.filter(c => {
    if (containerType === 'packs' || containerType === 'study_pack') {
      return c.container_type === 'packs' || c.container_type === 'study_pack';
    }
    if (containerType === 'vaults' || containerType === 'snippet_notebook') {
      return c.container_type === 'vaults' || c.container_type === 'snippet_notebook';
    }
    return c.container_type === containerType;
  });

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: 'var(--sub)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 16,
          padding: '6px 0',
          minHeight: 36,
          transition: 'all 0.15s ease',
        }}
        className="hover:text-blue-400 active:scale-95"
      >
        <ArrowLeft size={16} />
        <span>Back to All Saved</span>
      </button>

      {/* ── View All Header Card ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md, 18px)',
        padding: 'clamp(16px, 3vw, 24px)',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxSizing: 'border-box',
        width: '100%',
        boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '1 1 260px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: meta.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: `0 4px 16px ${meta.accent}40`,
            flexShrink: 0,
          }}>
            <Icon size={24} color="#fff" />
          </div>

          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 'clamp(18px, 4vw, 26px)',
              fontWeight: 800,
              color: 'var(--text)',
              margin: '0 0 4px',
              lineHeight: 1.2,
            }}>
              All {meta.title}
            </h1>
            <p style={{ margin: 0, fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--sub)', lineHeight: 1.4 }}>
              {relevantContainers.length} {relevantContainers.length === 1 ? 'container' : 'containers'} • {meta.desc}
            </p>
          </div>
        </div>

        {/* Create button */}
        <button
          type="button"
          onClick={() => onOpenCreateModal && onOpenCreateModal(containerType)}
          className="btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: 13,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 40,
          }}
        >
          <Plus size={15} />
          <span>New {meta.singular}</span>
        </button>
      </div>

      {/* ── Containers Responsive Grid ── */}
      {relevantContainers.length === 0 ? (
        <div style={{
          padding: 'clamp(48px, 8vw, 64px) clamp(16px, 4vw, 24px)',
          textAlign: 'center',
          background: 'var(--surface)',
          border: '1.5px dashed var(--border)',
          borderRadius: 'var(--r-md, 18px)',
          boxSizing: 'border-box',
          width: '100%',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `${meta.accent}18`,
            color: meta.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Icon size={28} color={meta.accent} />
          </div>
          <h3 style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 800, margin: '0 0 6px', color: 'var(--text)' }}>
            No {meta.title.toLowerCase()} created yet
          </h3>
          <p style={{ fontSize: 'clamp(12.5px, 2vw, 13.5px)', color: 'var(--sub)', margin: '0 auto 20px', maxWidth: 420 }}>
            Create your first {meta.singular.toLowerCase()} to organize and curate your saved resources.
          </p>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal(containerType)}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 38 }}
          >
            <Plus size={14} />
            <span>Create {meta.singular}</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: 16,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {relevantContainers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              items={items}
              onClick={() => onSelectContainer && onSelectContainer(container)}
              onPlayAll={onPlayAll}
              fixedWidth={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
