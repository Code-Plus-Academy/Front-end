'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '../ui/Avatar';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Share2, Send } from 'lucide-react';

export default function StoryModal({ userStories, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const duration = 5000; // 5 seconds per story

  useEffect(() => {
    if (!userStories || userStories.length === 0) return;

    const startTimer = () => {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / duration) * 100;
        
        if (newProgress >= 100) {
          clearInterval(timerRef.current);
          if (activeIndex < userStories.length - 1) {
            setActiveIndex(prev => prev + 1);
            setProgress(0);
          } else {
            onClose();
          }
        } else {
          setProgress(newProgress);
        }
      }, 30);
    };

    setProgress(0);
    startTimer();

    return () => clearInterval(timerRef.current);
  }, [activeIndex, userStories, onClose]);

  if (!userStories || userStories.length === 0) return null;

  const currentStory = userStories[activeIndex];

  const handleNext = () => {
    if (activeIndex < userStories.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  return createPortal(
    <motion.div
      initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
      exit={{ scale: 1.1, opacity: 0, filter: 'blur(20px)' }}
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Progress Bars */}
      <div style={{
        position: 'absolute', top: 12, left: 10, right: 10,
        display: 'flex', gap: 4, zIndex: 10000
      }}>
        {userStories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              style={{
                height: '100%',
                background: '#fff',
                width: i < activeIndex ? '100%' : (i === activeIndex ? `${progress}%` : '0%')
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 24, left: 16, right: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 10000, color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={32} src={currentStory.user_avatar} name={currentStory.username} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{currentStory.username}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{currentStory.time_ago || 'recent'}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }}>
          <X size={26} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          key={currentStory.id}
          src={currentStory.content_url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        
        {/* Navigation Overlays */}
        <div onClick={handlePrev} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 5 }} />
        <div onClick={handleNext} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '70%', cursor: 'pointer', zIndex: 5 }} />
        
        {currentStory.caption && (
          <div style={{
            position: 'absolute', bottom: 100, left: 20, right: 20,
            textAlign: 'center', color: '#fff', fontSize: 15,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 6
          }}>
            {currentStory.caption}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 20px 40px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        display: 'flex', alignItems: 'center', gap: 16,
        zIndex: 10000
      }}>
        <div style={{
          flex: 1, height: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,0.4)',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', padding: '0 16px', color: '#fff'
        }}>
          <span style={{ opacity: 0.6, fontSize: 14 }}>Send message...</span>
        </div>
        <div style={{ display: 'flex', gap: 20, color: '#fff' }}>
          <Heart size={24} />
          <Share2 size={24} />
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
