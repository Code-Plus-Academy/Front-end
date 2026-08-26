import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, RefreshCw, AlertCircle, Loader2, Check, RotateCcw } from 'lucide-react';

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onSend,
  isDark = true,
  themeAccent = '#7C3AED',
}) {
  const [mounted, setMounted] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)

  useEffect(() => {
    setMounted(true);
  }, []);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [startingCamera, setStartingCamera] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Helper to cleanly stop all active video tracks
  const stopTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
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

  if (!isOpen || !mounted) return null;

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // If front camera, mirror horizontally for natural feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

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
    if (!capturedBlob || uploading) return;

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
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) handleClose();
      }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 flex flex-col max-h-[88dvh] overflow-y-auto"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
          color: isDark ? '#F1F5F9' : '#0F172A',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">{capturedBlob ? 'Review Photo' : 'Take Photo'}</h3>
              <p className="text-[11px] opacity-60">High-resolution camera snapshot</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder / Captured Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px] max-h-[380px] mb-4">
          {!capturedBlob ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover max-h-[380px] ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />
              {startingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white gap-2 text-xs">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Opening camera…</span>
                </div>
              )}

              {/* Viewfinder Overlay Controls */}
              {stream && !startingCamera && (
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 z-10">
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    title="Flip camera"
                    className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-md"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCapture}
                    title="Take photo"
                    className="w-14 h-14 rounded-full border-4 border-white bg-rose-500 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center text-white"
                  >
                    <Camera size={24} />
                  </button>
                  <div className="w-10" /> {/* Spacer for visual balance */}
                </div>
              )}
            </>
          ) : (
            <img
              src={capturedUrl}
              alt="Snapshot"
              className="w-full h-full object-contain max-h-[380px]"
            />
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl mb-4">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Caption (when photo is captured) */}
        {capturedBlob && (
          <div className="mb-4">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption…"
              disabled={uploading}
              className="w-full px-3.5 py-2 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: isDark ? '#F1F5F9' : '#0F172A',
              }}
            />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {capturedBlob ? (
            <button
              type="button"
              onClick={handleRetake}
              disabled={uploading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-white/10 transition-colors"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              <RotateCcw size={14} />
              <span>Retake</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Cancel
            </button>

            {capturedBlob && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${themeAccent}, #6D28D9)`,
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Send Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
