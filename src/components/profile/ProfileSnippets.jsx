'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Bookmark, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StoryModal from '../stories/StoryModal';
import AddToSnippetModal from '../stories/AddToSnippetModal';

export default function ProfileSnippets({ username, isOwnProfile }) {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSnippetStories, setActiveSnippetStories] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!username) return;
    fetchUserSnippets();
  }, [username]);

  const fetchUserSnippets = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/snippets/user/${username}`);
      setSnippets(res.data?.snippets || []);
    } catch {
      setSnippets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSnippet = (snippet) => {
    if (!snippet.stories || snippet.stories.length === 0) return;
    const formatted = snippet.stories.map((st) => ({
      ...st,
      user_avatar: snippet.cover_image_url || user?.avatar_url,
      username: username,
      user: { username, avatar_url: snippet.cover_image_url || user?.avatar_url },
    }));
    setActiveSnippetStories(formatted);
  };

  if (!loading && snippets.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div style={{ margin: '18px 0 24px', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        overflowX: 'auto',
        padding: '6px 4px 10px',
        scrollbarWidth: 'none',
      }}>
        {/* + New Button for Profile Owner */}
        {isOwnProfile && (
          <div
            onClick={() => setCreateModalOpen(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1.5px dashed rgba(0, 219, 233, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00dbe9',
              transition: 'all 0.2s ease',
            }}
            className="hover:scale-105 hover:border-cyan-400"
            >
              <Plus size={22} />
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#94a3b8',
              fontFamily: 'var(--font-display, sans-serif)',
            }}>
              New
            </span>
          </div>
        )}

        {/* Snippet (Highlight) Circles */}
        {snippets.map((snippet) => (
          <div
            key={snippet.id}
            onClick={() => handleOpenSnippet(snippet)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: 76,
            }}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              padding: 2.5,
              background: 'linear-gradient(135deg, #00dbe9 0%, #7000ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 219, 233, 0.2)',
              transition: 'transform 0.2s ease',
            }}
            className="hover:scale-105"
            >
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#090d16',
                border: '2px solid #090d16',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {snippet.cover_image_url ? (
                  <img
                    src={snippet.cover_image_url}
                    alt={snippet.title || 'Snippet'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle, rgba(0,219,233,0.2) 0%, rgba(9,13,22,1) 100%)',
                    color: '#00dbe9',
                    fontWeight: 800,
                    fontSize: 14,
                    fontFamily: 'var(--font-display, sans-serif)',
                  }}>
                    {snippet.title?.[0]?.toUpperCase() || 'S'}
                  </div>
                )}
              </div>
            </div>
            <span 
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--text, #dee3ea)',
                fontFamily: 'var(--font-display, sans-serif)',
                maxWidth: 76,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                display: 'block',
              }}
              title={snippet.title}
            >
              {snippet.title || 'Snippet'}
            </span>
          </div>
        ))}
      </div>

      {/* Snippet Story Viewer */}
      {activeSnippetStories && (
        <StoryModal
          userStories={activeSnippetStories}
          onClose={() => setActiveSnippetStories(null)}
        />
      )}

      {/* Create New Snippet Modal */}
      {createModalOpen && (
        <AddToSnippetModal
          isOpen={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            fetchUserSnippets();
          }}
          storyId={null}
        />
      )}
    </div>
  );
}
