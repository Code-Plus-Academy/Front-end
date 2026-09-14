import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Zap,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onSend,
  isDark = true,
  themeAccent = '#7C3AED',
}) {
  const [mounted, setMounted] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [startingCamera, setStartingCamera] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('4:3'); // '4:3' | '1:1' | '16:9'
  const [flashMode, setFlashMode] = useState('auto'); // 'auto' | 'on' | 'off'

  const videoRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to cleanly stop all active video tracks
  const stopTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      setStream(null);
    }
  }, [stream]);

  // Start Camera
  const startCamera = useCallback(async (facing = 'user') => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported by your browser.');
      return;
    }

    setStartingCamera(true);
    setError(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera permissions in your browser settings.');
      } else {
        setError('Unable to access camera hardware. Check if another app is using it.');
      }
    } finally {
      setStartingCamera(false);
    }
  }, [stream]);

  // Start stream on open, cleanup on close/unmount
  useEffect(() => {
    if (isOpen && !capturedBlob) {
      startCamera(facingMode);
    }
    return () => {
      stopTracks();
    };
  }, [isOpen, capturedBlob]); // eslint-disable-line

  // Cleanup blob URL on change
  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      stopTracks();
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      setCapturedBlob(null);
      setCapturedUrl(null);
      setCaption('');
      setError(null);
      setUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  }, [isOpen]); // eslint-disable-line

  if (!isOpen || !mounted) return null;

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const cycleAspectRatio = () => {
    const ratios = ['4:3', '1:1', '16:9'];
    const nextIdx = (ratios.indexOf(aspectRatio) + 1) % ratios.length;
    setAspectRatio(ratios[nextIdx]);
  };

  const toggleFlash = () => {
    const modes = ['auto', 'on', 'off'];
    const nextIdx = (modes.indexOf(flashMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setFlashMode(nextMode);

    // Apply torch constraint if available on track
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.applyConstraints === 'function') {
        try {
          track.applyConstraints({
            advanced: [{ torch: nextMode === 'on' }],
          }).catch(() => {});
        } catch (e) {}
      }
    }
  };

  const handleGalleryPick = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    const url = URL.createObjectURL(selected);
    setCapturedBlob(selected);
    setCapturedUrl(url);
    stopTracks();
    setError(null);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    let targetW = video.videoWidth;
    let targetH = video.videoHeight;

    // Crop coordinates according to aspect ratio
    let sx = 0;
    let sy = 0;
    let sWidth = targetW;
    let sHeight = targetH;

    if (aspectRatio === '1:1') {
      const size = Math.min(targetW, targetH);
      sx = (targetW - size) / 2;
      sy = (targetH - size) / 2;
      sWidth = size;
      sHeight = size;
      targetW = size;
      targetH = size;
    } else if (aspectRatio === '16:9') {
      const desiredH = Math.round((targetW * 9) / 16);
      if (desiredH <= targetH) {
        sy = (targetH - desiredH) / 2;
        sHeight = desiredH;
        targetH = desiredH;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // If front camera, mirror horizontally for natural feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedBlob(blob);
      setCapturedUrl(url);
      stopTracks(); // Stop camera once photo is taken
    }, 'image/jpeg', 0.9);
  };

  const handleRetake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    startCamera(facingMode);
  };

  const handleClose = () => {
    stopTracks();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!capturedBlob && !stream) return;

    // If photo hasn't been snapped yet, take snap on submit
    if (!capturedBlob) {
      handleCapture();
      return;
    }

    if (uploading) return;
    setUploading(true);
    setError(null);

    try {
      const file = new File([capturedBlob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resource_type', 'image');

      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      const uploadData = await res.json();
      const permanentUrl = uploadData.secure_url || uploadData.url;

      const attachmentPayload = {
        type: 'media',
        media_type: 'image',
        url: permanentUrl,
        thumbnail_url: permanentUrl,
        width: uploadData.width || 800,
        height: uploadData.height || 600,
        caption: caption.trim() || null,
      };

      onSend(attachmentPayload, caption.trim() || 'Shared a photo');
      handleClose();
    } catch (err) {
      console.error('Camera upload error:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) handleClose();
      }}
    >
      <div
        className="w-full sm:max-w-[460px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 flex flex-col max-h-[92dvh] overflow-y-auto"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
          color: isDark ? '#F1F5F9' : '#0F172A',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.45)',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle for Mobile View */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center flex-shrink-0 border border-rose-200/70 dark:border-rose-900/40 shadow-xs">
                <Camera size={21} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                  {capturedBlob ? 'Review Photo' : 'Take Photo'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  High-resolution camera snapshot
                </p>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Hidden Gallery File Input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleGalleryPick}
            className="hidden"
          />

          {/* Viewfinder Card */}
          <div
            className={`relative w-full rounded-3xl overflow-hidden bg-black flex items-center justify-center shadow-inner border border-slate-200/80 dark:border-white/10 transition-all ${
              aspectRatio === '1:1'
                ? 'aspect-square max-h-[380px]'
                : aspectRatio === '16:9'
                ? 'aspect-[16/9] max-h-[360px]'
                : 'aspect-[4/5] max-h-[420px]'
            }`}
          >
            {!capturedBlob ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />

                {startingCamera && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white gap-2 text-xs">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Opening camera…</span>
                  </div>
                )}

                {/* Top Overlays */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                  {/* Flash Button */}
                  <button
                    type="button"
                    onClick={toggleFlash}
                    title="Toggle flash mode"
                    className="px-2.5 py-1 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 text-[11px] font-bold flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap size={13} className={flashMode === 'on' ? 'text-amber-400 fill-amber-400' : 'text-white'} />
                    <span className="capitalize">{flashMode}</span>
                  </button>

                  {/* Aspect Ratio Button */}
                  <button
                    type="button"
                    onClick={cycleAspectRatio}
                    title="Change aspect ratio"
                    className="px-2 py-1 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>{aspectRatio}</span>
                  </button>
                </div>

                {/* Bottom Viewfinder Controls */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-around px-6 z-20">
                  {/* Flip Camera Button */}
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    title="Flip camera"
                    className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
                  >
                    <RefreshCw size={19} />
                  </button>

                  {/* Shutter Button (Matches Reference) */}
                  <button
                    type="button"
                    onClick={handleCapture}
                    title="Take photo"
                    className="w-18 h-18 rounded-full border-2 border-white/90 p-1 flex items-center justify-center shadow-xl active:scale-95 transition-transform cursor-pointer"
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 flex items-center justify-center text-white shadow-md">
                      <Camera size={26} strokeWidth={2.2} />
                    </div>
                  </button>

                  {/* Device Gallery Button */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    title="Choose from gallery"
                    className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
                  >
                    <ImageIcon size={20} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <img
                  src={capturedUrl}
                  alt="Snapshot"
                  className="w-full h-full object-cover"
                />

                {/* Retake Floating Button */}
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={uploading}
                  className="absolute top-3 right-3 py-1.5 px-3 rounded-full bg-black/75 hover:bg-black/95 text-white backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer z-20"
                  title="Retake photo"
                >
                  <RotateCcw size={13} />
                  <span>Retake</span>
                </button>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-2.5 rounded-xl">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tip Card (Matches Reference Image) */}
          <div className="rounded-2xl p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-100/80 dark:bg-rose-900/40 text-rose-500 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-2xs border border-rose-200/50 dark:border-rose-800/30">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-500 dark:text-rose-400 leading-tight">Tip</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-normal">
                Use good lighting for the best quality.
              </p>
            </div>
          </div>

          {/* Caption Input when photo is captured */}
          {capturedBlob && (
            <div>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption…"
                disabled={uploading}
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #F43F5E 0%, #EC4899 100%)',
                boxShadow: '0 6px 20px rgba(244, 63, 94, 0.35)',
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Use Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
