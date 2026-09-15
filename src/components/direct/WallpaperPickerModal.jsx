'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Image as ImageIcon, Palette, Sparkles, RefreshCw, Upload } from 'lucide-react';

export const WALLPAPER_STORAGE_KEY = 'cpa_chat_wallpaper';

export const PRESET_WALLPAPERS = [
  {
    id: 'default',
    name: 'Auto (System / Theme)',
    type: 'auto',
    description: 'Dynamic light & dark illustrated doodle',
    previewLight: '/assets/chat-bg-light.png',
    previewDark: '/assets/chat-bg-dark.png',
  },
  {
    id: 'doodle-dark',
    name: 'Doodle Dark',
    type: 'image',
    value: '/assets/chat-bg-dark.png',
    description: 'WhatsApp doodle illustration dark',
    preview: '/assets/chat-bg-dark.png',
  },
  {
    id: 'doodle-light',
    name: 'Doodle Light',
    type: 'image',
    value: '/assets/chat-bg-light.png',
    description: 'WhatsApp doodle illustration light',
    preview: '/assets/chat-bg-light.png',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    type: 'color',
    value: '#0b0f19',
    description: 'Deep OLED minimalist slate',
    previewColor: '#0b0f19',
  },
  {
    id: 'clean-soft',
    name: 'Soft Paper',
    type: 'color',
    value: '#f8fafc',
    description: 'Clean bright background',
    previewColor: '#f8fafc',
  },
  {
    id: 'lavender-night',
    name: 'Lavender Dusk',
    type: 'color',
    value: '#131127',
    description: 'Deep purple twilight ambiance',
    previewColor: '#131127',
  },
  {
    id: 'emerald-dark',
    name: 'Forest Emerald',
    type: 'color',
    value: '#06201a',
    description: 'Rich dark evergreen tone',
    previewColor: '#06201a',
  },
  {
    id: 'sunset-amber',
    name: 'Warm Sunset',
    type: 'gradient',
    value: 'linear-gradient(180deg, #1c1326 0%, #0f172a 100%)',
    description: 'Subtle vertical dusk gradient',
    previewGradient: 'linear-gradient(180deg, #1c1326 0%, #0f172a 100%)',
  },
];

export function getSavedChatWallpaper() {
  if (typeof window === 'undefined') return PRESET_WALLPAPERS[0];
  try {
    const raw = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    if (!raw) return PRESET_WALLPAPERS[0];
    const parsed = JSON.parse(raw);
    return parsed || PRESET_WALLPAPERS[0];
  } catch (err) {
    return PRESET_WALLPAPERS[0];
  }
}

export function saveChatWallpaper(wallpaper) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(wallpaper));
    window.dispatchEvent(new CustomEvent('cpa_wallpaper_changed', { detail: wallpaper }));
  } catch (err) {
    console.error('Failed to save chat wallpaper:', err);
  }
}

export function getChatWallpaperStyle(wallpaper, isDark = true) {
  const wp = wallpaper || getSavedChatWallpaper();
  if (!wp || wp.id === 'default' || wp.type === 'auto') {
    return {
      backgroundImage: isDark ? 'url(/assets/chat-bg-dark.png)' : 'url(/assets/chat-bg-light.png)',
      backgroundRepeat: 'repeat',
      backgroundSize: '420px',
      backgroundColor: isDark ? '#0b0f19' : '#f0f2f5',
    };
  }

  if (wp.type === 'image') {
    return {
      backgroundImage: `url(${wp.value})`,
      backgroundRepeat: wp.repeat || 'repeat',
      backgroundSize: wp.size || '420px',
      backgroundColor: isDark ? '#0b0f19' : '#f0f2f5',
    };
  }

  if (wp.type === 'color') {
    return {
      backgroundColor: wp.value,
    };
  }

  if (wp.type === 'gradient') {
    return {
      background: wp.value,
    };
  }

  return {
    backgroundImage: isDark ? 'url(/assets/chat-bg-dark.png)' : 'url(/assets/chat-bg-light.png)',
    backgroundRepeat: 'repeat',
    backgroundSize: '420px',
  };
}

export default function WallpaperPickerModal({
  isOpen,
  onClose,
  onSelectWallpaper,
  currentWallpaper,
  isDark = true,
}) {
  const [selected, setSelected] = useState(currentWallpaper || PRESET_WALLPAPERS[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState('presets');

  useEffect(() => {
    if (isOpen) {
      setSelected(currentWallpaper || getSavedChatWallpaper());
    }
  }, [isOpen, currentWallpaper]);

  if (!isOpen) return null;

  const handleApply = (wp) => {
    const target = wp || selected;
    saveChatWallpaper(target);
    if (onSelectWallpaper) onSelectWallpaper(target);
    onClose();
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    const customWp = {
      id: `custom_${Date.now()}`,
      name: 'Custom Wallpaper',
      type: 'image',
      value: customUrl.trim(),
      description: 'User specified image',
    };
    setSelected(customWp);
    handleApply(customWp);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result;
      if (dataUrl) {
        const customWp = {
          id: `custom_${Date.now()}`,
          name: file.name || 'Uploaded Wallpaper',
          type: 'image',
          value: dataUrl,
          description: 'Local uploaded file',
        };
        setSelected(customWp);
        handleApply(customWp);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          color: isDark ? '#f8fafc' : '#0f172a',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-none">Chat Wallpaper</h3>
              <p className="text-xs text-slate-400 mt-1">Personalize your chat background</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex px-5 pt-3 pb-1 gap-2 border-b border-black/5 dark:border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2 px-1 border-b-2 transition-all cursor-pointer ${activeTab === 'presets' ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-2 px-1 border-b-2 transition-all cursor-pointer ${activeTab === 'custom' ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            Custom Image
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 edm-scroll space-y-4">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_WALLPAPERS.map((wp) => {
                const isSelected = selected?.id === wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setSelected(wp)}
                    className={`relative rounded-2xl p-1.5 flex flex-col items-center gap-2 border transition-all text-left group overflow-hidden cursor-pointer ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-black/10 dark:border-white/10 hover:border-purple-500/50'}`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div
                      className="w-full h-24 rounded-xl overflow-hidden relative flex items-center justify-center border border-black/5 dark:border-white/10"
                      style={
                        wp.type === 'color'
                          ? { backgroundColor: wp.value }
                          : wp.type === 'gradient'
                          ? { background: wp.value }
                          : wp.id === 'default'
                          ? {
                              backgroundImage: isDark
                                ? `url(${wp.previewDark})`
                                : `url(${wp.previewLight})`,
                              backgroundSize: 'cover',
                            }
                          : {
                              backgroundImage: `url(${wp.preview || wp.value})`,
                              backgroundSize: 'cover',
                            }
                      }
                    >
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg animate-in zoom-in-75">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="w-full px-1 pb-1">
                      <p className="text-xs font-semibold truncate leading-tight">{wp.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{wp.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/wallpaper.png"
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Or Upload From Device
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-black/10 dark:border-white/15 hover:border-purple-500/60 rounded-2xl p-6 cursor-pointer transition-all hover:bg-purple-500/5">
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <span className="text-xs font-semibold">Choose photo or image</span>
                  <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3 bg-black/[0.02] dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={() => {
              const def = PRESET_WALLPAPERS[0];
              setSelected(def);
              handleApply(def);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw size={13} /> Reset to Default
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleApply(selected)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              Apply Wallpaper
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
