'use client';

import { useState } from 'react';
import { addLocationSticker, addLinkSticker } from '../utils/stickerUtils';
import { isValidUrl } from '../utils/sanitizeUtils';
import {
  MapPin,
  Link as LinkIcon,
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const PRESET_LOCATIONS = [
  { name: 'Code Plus Academy Campus', lat: 18.5204, lng: 73.8567 },
  { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Bangalore Tech Park', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai, India', lat: 19.076, lng: 72.8777 },
  { name: 'Hyderabad Tech City', lat: 17.385, lng: 78.4867 },
  { name: 'Delhi NCR', lat: 28.7041, lng: 77.1025 },
];

/**
 * LocationStickerModal Component
 * Interactive modal for configuring and adding a Location Sticker to canvas.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {import('fabric').Canvas} props.fabricCanvas
 */
export function LocationStickerModal({ isOpen, onClose, fabricCanvas }) {
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setLocationName(preset.name);
    setLatitude(preset.lat.toString());
    setLongitude(preset.lng.toString());
    setError('');
  };

  const handleAdd = () => {
    if (!fabricCanvas) return;
    const trimmed = locationName.trim();
    if (!trimmed) {
      setError('Please enter a location name.');
      return;
    }

    try {
      addLocationSticker(fabricCanvas, {
        name: trimmed,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });

      handleClose();
    } catch (err) {
      console.error('[LocationStickerModal] Failed to add location sticker:', err);
      setError('Failed to add location badge.');
    }
  };

  const handleClose = () => {
    setLocationName('');
    setLatitude('');
    setLongitude('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-gray-900 border border-white/10 shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Location Sticker</h2>
              <p className="text-xs text-gray-400">Interactive location chip for viewers</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-black/40 border border-white/5">
          <span className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Sticker Preview
          </span>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-white/20 shadow-xl">
            <MapPin className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-xs font-bold text-white tracking-wide">
              {locationName.trim() || 'Location Name'}
            </span>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Location Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => {
                setLocationName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Pune Tech Park, Mumbai"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-gray-400 mb-1.5">
              Popular Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOCATIONS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/15 border border-white/5 text-gray-300 hover:text-white transition-all active:scale-95"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          >
            Add Sticker
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * LinkStickerModal Component
 * Interactive modal for configuring and adding an HTTPS Link Sticker to canvas.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {import('fabric').Canvas} props.fabricCanvas
 */
export function LinkStickerModal({ isOpen, onClose, fabricCanvas }) {
  const [url, setUrl] = useState('');
  const [customText, setCustomText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const urlValidation = url ? isValidUrl(url) : { valid: false };

  const getDisplayDomain = () => {
    if (customText.trim()) return customText.trim().toUpperCase();
    if (urlValidation.valid && urlValidation.sanitizedUrl) {
      try {
        return new URL(urlValidation.sanitizedUrl).hostname.replace(/^www\./, '').toUpperCase();
      } catch {
        // fallback
      }
    }
    return 'CODEPLUS.ACADEMY';
  };

  const handleAdd = () => {
    if (!fabricCanvas) return;
    const check = isValidUrl(url);

    if (!check.valid || !check.sanitizedUrl) {
      setError(check.error || 'Please enter a valid HTTPS URL.');
      return;
    }

    try {
      addLinkSticker(fabricCanvas, {
        url: check.sanitizedUrl,
        text: customText.trim() || undefined,
      });

      handleClose();
    } catch (err) {
      console.error('[LinkStickerModal] Failed to add link sticker:', err);
      setError(err.message || 'Failed to add link chip.');
    }
  };

  const handleClose = () => {
    setUrl('');
    setCustomText('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-gray-900 border border-white/10 shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Link Sticker</h2>
              <p className="text-xs text-gray-400">Tappable interactive link badge</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-black/40 border border-white/5">
          <span className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Sticker Preview
          </span>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-xl">
            <LinkIcon className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-black text-slate-900 tracking-wide">
              {getDisplayDomain()}
            </span>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-300">
                URL <span className="text-indigo-400">*</span>
              </label>
              {url && urlValidation.valid && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Secure HTTPS
                </span>
              )}
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="https://codeplus.academy/courses/nextjs"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border text-xs text-white placeholder-gray-500 focus:outline-none transition-colors ${
                url && !urlValidation.valid
                  ? 'border-red-500/60 focus:border-red-500'
                  : 'border-white/10 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Custom Sticker Text <span className="text-gray-500 text-[11px]">(Optional)</span>
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Join Discord, View Course, Register Now"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            Add Sticker
          </button>
        </div>
      </div>
    </div>
  );
}
