'use client';

import { useState, useRef } from 'react';
import {
  setBackgroundCoverImage,
  addImageOverlay,
  clearBackgroundImage,
} from '../utils/imageLayerUtils';
import {
  Upload,
  Image as ImageIcon,
  Layers,
  Sparkles,
  X,
  Trash2,
  Check,
} from 'lucide-react';

const BACKGROUND_GRADIENT_PRESETS = [
  { id: 'dark-default', name: 'Dark Void', value: '#05070c' },
  { id: 'cpa-indigo', name: 'Indigo Dream', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' },
  { id: 'cyber-sunset', name: 'Sunset Glow', value: 'linear-gradient(135deg, #991b1b 0%, #c2410c 50%, #d97706 100%)' },
  { id: 'emerald-aurora', name: 'Emerald Deep', value: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' },
  { id: 'midnight-violet', name: 'Midnight Violet', value: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7e22ce 100%)' },
  { id: 'ocean-abyss', name: 'Ocean Abyss', value: 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0284c7 100%)' },
  { id: 'hot-rose', name: 'Cyber Rose', value: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #e11d48 100%)' },
];

/**
 * ImageUploadControls Component
 * Modal & control sheet for uploading images (Cover Background vs Overlay mode)
 * and configuring background presets.
 * 
 * @param {Object} props
 * @param {import('fabric').Canvas} props.fabricCanvas
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(mode: 'background' | 'overlay', file: File) => void} [props.onImageAdded]
 */
export default function ImageUploadControls({
  fabricCanvas,
  isOpen,
  onClose,
  onImageAdded,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadMode, setUploadMode] = useState('background'); // 'background' | 'overlay'
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    setErrorMessage('');
    if (!file) return;

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP, GIF, SVG).');
      return;
    }

    // Limit file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 25MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleApply = async () => {
    if (!fabricCanvas || !selectedFile) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      if (uploadMode === 'background') {
        await setBackgroundCoverImage(fabricCanvas, selectedFile);
      } else {
        await addImageOverlay(fabricCanvas, selectedFile);
      }

      if (onImageAdded) {
        onImageAdded(uploadMode, selectedFile);
      }

      handleClose();
    } catch (err) {
      console.error('[ImageUploadControls] Failed to add image:', err);
      setErrorMessage('Failed to load image on canvas. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPresetBackground = (preset) => {
    if (!fabricCanvas) return;
    clearBackgroundImage(fabricCanvas);

    fabricCanvas.backgroundColor = preset.value;
    fabricCanvas.requestRenderAll();
  };

  const handleClearBackground = () => {
    if (!fabricCanvas) return;
    clearBackgroundImage(fabricCanvas);
    fabricCanvas.backgroundColor = '#05070c';
    fabricCanvas.requestRenderAll();
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-gray-900 border border-white/10 shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Add Image or Background</h2>
              <p className="text-xs text-gray-400">Choose how to place your image onto the story</p>
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

        {/* Dropzone / File Picker */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-600/10 scale-[0.99]'
              : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {previewUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-32 h-44 rounded-xl overflow-hidden border border-white/20 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-indigo-300 font-medium truncate max-w-xs">
                {selectedFile?.name} ({(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
              <span className="text-[11px] text-gray-400">Click or drop to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 text-center">
              <div className="p-3 rounded-full bg-white/5 border border-white/10 text-gray-300">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  PNG, JPG, WEBP, SVG or GIF (max 25MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Mode Selector Cards */}
        {selectedFile && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUploadMode('background')}
              className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                uploadMode === 'background'
                  ? 'border-indigo-500 bg-indigo-600/15 shadow-lg shadow-indigo-900/30'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Cover Background
                </span>
                {uploadMode === 'background' && (
                  <Check className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Fits 1080x1920 canvas proportionally as locked background
              </p>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode('overlay')}
              className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                uploadMode === 'overlay'
                  ? 'border-indigo-500 bg-indigo-600/15 shadow-lg shadow-indigo-900/30'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Movable Overlay
                </span>
                {uploadMode === 'overlay' && (
                  <Check className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Add as a movable, resizable layer on top of your story
              </p>
            </button>
          </div>
        )}

        {/* Background Presets Section (Optional Quick Styling) */}
        {!selectedFile && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Solid & Gradient Presets</span>
              <button
                type="button"
                onClick={handleClearBackground}
                className="hover:text-red-400 flex items-center gap-1 transition-colors"
                title="Reset to default background"
              >
                <Trash2 className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {BACKGROUND_GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPresetBackground(preset)}
                  title={preset.name}
                  className="group relative h-10 rounded-xl border border-white/15 overflow-hidden hover:scale-105 active:scale-95 transition-transform"
                  style={{ background: preset.value }}
                >
                  <span className="sr-only">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>

          {selectedFile && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Placing...' : `Add as ${uploadMode === 'background' ? 'Background' : 'Overlay'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
