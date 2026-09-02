'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  loadStickersManifest,
  addSvgSticker,
  addPngSticker,
} from '../utils/stickerUtils';
import {
  Search,
  X,
  Upload,
  MapPin,
  Link as LinkIcon,
  Sparkles,
  Smile,
  Code,
  Flame,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

const CURATED_EMOJIS = [
  '🔥', '🚀', '💻', '✨', '⚡', '💯', '🧠', '❤️', '🙌', '🎉',
  '😎', '🤯', '😭', '💀', '👀', '☕', '📚', '🎯', '💡', '🏆',
  '👨‍💻', '👩‍💻', '👾', '💎', '🔑', '📦', '⭐', '🌈', '🍕', '🍻'
];

/**
 * StickerPickerModal Component
 * Modal providing categorized stickers (Badges, Tech & Code, Reactions, Emojis, Location, Link, Upload)
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {import('fabric').Canvas} props.fabricCanvas
 * @param {() => void} props.onOpenLocationModal
 * @param {() => void} props.onOpenLinkModal
 */
export default function StickerPickerModal({
  isOpen,
  onClose,
  fabricCanvas,
  onOpenLocationModal,
  onOpenLinkModal,
  onStickerAdded,
}) {
  const [activeTab, setActiveTab] = useState('badges');
  const [searchQuery, setSearchQuery] = useState('');
  const [manifestData, setManifestData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef(null);

  // Load manifest when opened
  useEffect(() => {
    if (isOpen && !manifestData) {
      setIsLoading(true);
      loadStickersManifest()
        .then((data) => {
          setManifestData(data);
        })
        .catch((err) => {
          console.error('[StickerPickerModal] Failed to load manifest:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, manifestData]);

  // Group packs into categories
  const categories = useMemo(() => {
    if (!manifestData || !manifestData.packs) {
      return {
        badges: [],
        tech: [],
        reactions: [],
      };
    }

    const badgesPacks = manifestData.packs.filter((p) => p.id === 'cpa_official');
    const techPacks = manifestData.packs.filter((p) => p.id === 'dev_life');
    const reactionsPacks = manifestData.packs.filter(
      (p) => p.id !== 'cpa_official' && p.id !== 'dev_life'
    );

    return {
      badges: badgesPacks.flatMap((p) => p.stickers || []),
      tech: techPacks.flatMap((p) => p.stickers || []),
      reactions: reactionsPacks.flatMap((p) => p.stickers || []),
    };
  }, [manifestData]);

  // Filtered sticker list based on tab and search query
  const displayedStickers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let list = [];
    if (activeTab === 'badges') {
      list = categories.badges;
    } else if (activeTab === 'tech') {
      list = categories.tech;
    } else if (activeTab === 'reactions') {
      list = categories.reactions;
    } else if (activeTab === 'all') {
      list = [
        ...categories.badges,
        ...categories.tech,
        ...categories.reactions,
      ];
    }

    if (!query) return list;

    return list.filter((sticker) => {
      const matchName = sticker.name?.toLowerCase().includes(query);
      const matchTags = sticker.tags?.some((t) => t.toLowerCase().includes(query));
      return matchName || matchTags;
    });
  }, [activeTab, searchQuery, categories]);

  if (!isOpen) return null;

  const handleSelectSticker = async (sticker) => {
    if (!fabricCanvas) return;
    setIsAdding(true);

    try {
      const stickerPath = sticker.file.startsWith('/')
        ? sticker.file
        : `/stickers/${sticker.file}`;

      if (sticker.file.endsWith('.svg')) {
        await addSvgSticker(fabricCanvas, stickerPath);
      } else {
        await addPngSticker(fabricCanvas, stickerPath);
      }

      if (onStickerAdded) onStickerAdded();
      onClose();
    } catch (err) {
      console.error('[StickerPickerModal] Failed to add sticker:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddEmoji = async (emojiChar) => {
    if (!fabricCanvas) return;
    try {
      const { FabricText } = await import('fabric');
      const text = new FabricText(emojiChar, {
        fontSize: 140,
        originX: 'center',
        originY: 'center',
        left: 540,
        top: 960,
        customType: 'sticker_emoji',
      });

      const { applyDefaultObjectControls } = await import('../utils/canvasConfig');
      applyDefaultObjectControls(text);

      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.requestRenderAll();
      if (onStickerAdded) onStickerAdded();
      onClose();
    } catch (err) {
      console.error('[StickerPickerModal] Failed to add emoji:', err);
    }
  };

  const handleCustomUpload = async (e) => {
    if (!fabricCanvas || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsAdding(true);

    try {
      if (file.type === 'image/svg+xml') {
        const text = await file.text();
        await addSvgSticker(fabricCanvas, text);
      } else {
        await addPngSticker(fabricCanvas, file);
      }
      if (onStickerAdded) onStickerAdded();
      onClose();
    } catch (err) {
      console.error('[StickerPickerModal] Failed to upload sticker:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[85vh] rounded-3xl bg-gray-900 border border-white/10 shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Stickers & Widgets</h2>
              <p className="text-xs text-gray-400">Add interactive chips, badges, and vectors</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Quick Widgets (Location & Link) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLocationModal?.();
            }}
            className="group flex items-center gap-3 p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all text-left"
          >
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-rose-300">📍 Location</span>
              <span className="text-[11px] text-gray-400">Interactive map tag</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLinkModal?.();
            }}
            className="group flex items-center gap-3 p-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 transition-all text-left"
          >
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-indigo-300">🔗 Link</span>
              <span className="text-[11px] text-gray-400">Interactive URL chip</span>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stickers (e.g. rocket, git, brain, exam)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'badges'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> CPA Badges
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'tech'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Tech & Code
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reactions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'reactions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Reactions & Memes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'emojis'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smile className="w-3.5 h-3.5" /> Emojis
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Custom Upload
          </button>
        </div>

        {/* Sticker Grid / Content */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[360px] pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Loading stickers catalog...</span>
            </div>
          ) : activeTab === 'emojis' ? (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 py-2">
              {CURATED_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="h-12 flex items-center justify-center text-2xl rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : activeTab === 'upload' ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/15 rounded-2xl text-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/svg+xml, image/webp"
                className="hidden"
                onChange={handleCustomUpload}
              />
              <div className="p-3 rounded-full bg-indigo-600/20 text-indigo-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Upload Custom Sticker</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Transparent PNG or SVG recommended
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-all active:scale-95"
              >
                Choose File
              </button>
            </div>
          ) : displayedStickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
              <p className="text-sm font-medium text-gray-300">No stickers found</p>
              <p className="text-xs text-gray-500 mt-1">Try another search term or category tab</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 py-1">
              {displayedStickers.map((sticker) => {
                const srcUrl = sticker.file.startsWith('/')
                  ? sticker.file
                  : `/stickers/${sticker.file}`;

                return (
                  <button
                    key={sticker.id}
                    type="button"
                    disabled={isAdding}
                    onClick={() => handleSelectSticker(sticker)}
                    className="group relative flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.1] border border-white/5 hover:border-white/20 active:scale-95 transition-all"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={srcUrl}
                        alt={sticker.name}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 group-hover:text-white mt-1.5 truncate max-w-[90px] text-center">
                      {sticker.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
