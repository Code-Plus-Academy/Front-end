'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginPromptModal from '../ui/LoginPromptModal';
import useAnalytics from '../../hooks/useAnalytics';

export function formatGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed.includes('drive.google.com') && !trimmed.includes('docs.google.com')) {
    return trimmed;
  }

  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/file/d/${fileDMatch[1]}/preview`;
  }

  const idParamMatch = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return `https://drive.google.com/file/d/${idParamMatch[1]}/preview`;
  }

  return trimmed;
}

export default function PdfViewer({ fileUrl, fileType, title, downloadsCount, noteId }) {
  const { user } = useAuth();
  const { trackNotesEvent, GA_EVENTS } = useAnalytics();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloads, setDownloads] = useState(downloadsCount || 0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const defaultPreviewImage = '/notes-default-thumbnail.jpg';

  useEffect(() => {
    if (noteId) {
      trackNotesEvent(GA_EVENTS.NOTES_PREVIEW, {
        id: noteId,
        title,
        fileFormat: fileType,
      });
    }
  }, [noteId, title, fileType, trackNotesEvent, GA_EVENTS]);

  const executeDownload = async () => {
    try {
      setDownloads(prev => prev + 1);
      trackNotesEvent(GA_EVENTS.NOTES_DOWNLOAD, {
        id: noteId,
        title,
        fileFormat: fileType,
      });
      await fetch(`/api/notes/${noteId}/download`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    const targetUrl = noteId ? `/api/download/${noteId}` : fileUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = (e) => {
    e.preventDefault();
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    executeDownload();
  };

  const hasFile = Boolean(fileUrl && typeof fileUrl === 'string' && fileUrl.trim().length > 0);
  const isGoogleDrive = Boolean(hasFile && (fileUrl.includes('drive.google.com') || fileUrl.includes('docs.google.com')));
  const formattedDriveUrl = isGoogleDrive ? formatGoogleDriveUrl(fileUrl) : fileUrl;

  const isImage = Boolean(hasFile && (fileUrl?.match(/\.(png|jpe?g|webp|gif)$/i) || fileType === 'image' || fileType === 'jpg' || fileType === 'png' || fileType === 'jpeg'));
  const isPdf = Boolean(hasFile && (fileType === 'pdf' || fileUrl?.toLowerCase().includes('.pdf') || fileUrl?.includes('/raw/upload/')));
  const isLink = hasFile && (fileType === 'link' || (!isPdf && !isImage)) && !isGoogleDrive;

  // Direct embed for Google Drive preview or direct PDF/file URL (no Google Docs Viewer proxy download loop)
  const embedUrl = isGoogleDrive ? formattedDriveUrl : fileUrl;

  return (
    <>
      <style>{`
        .pdf-viewer-container {
          background: #111;
          border: 1px solid var(--border-bright);
          border-radius: var(--r-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          margin-bottom: 24px;
          max-width: 100%;
          box-sizing: border-box;
        }
        .pdf-toolbar {
          background: #18181b;
          border-bottom: 1px solid var(--border);
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          max-width: 100%;
          box-sizing: border-box;
        }
        .pdf-title-label {
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
        .pdf-frame {
          border: none;
          width: 100%;
          max-width: 100%;
          height: clamp(560px, 75vh, 850px);
          background: #1f1f23;
          box-sizing: border-box;
        }
        .pdf-image-wrapper {
          width: 100%;
          max-width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #1f1f23;
          padding: 16px;
          box-sizing: border-box;
        }
        .pdf-image {
          max-width: 100%;
          max-height: 70vh;
          height: auto;
          object-fit: contain;
          border-radius: var(--r-sm);
          box-sizing: border-box;
        }
        .link-placeholder {
          height: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px;
          background: #161618;
          max-width: 100%;
          box-sizing: border-box;
        }
        .link-url-box {
          background: #202023;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 10px 16px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--green);
          max-width: 100%;
          word-break: break-all;
          margin-bottom: 20px;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .pdf-frame {
            height: 450px;
          }
        }

        @media (max-width: 600px) {
          .pdf-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px;
          }
          .pdf-title-label {
            white-space: normal;
            font-size: 12px;
            line-height: 1.4;
          }
          .pdf-frame {
            height: 350px;
          }
        }
      `}</style>

      <div className="pdf-viewer-container">
        {/* Toolbar */}
        <div className="pdf-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="material-symbols-rounded" style={{ color: 'var(--green)', fontSize: 20 }}>
              {isLink ? 'link' : isImage ? 'image' : 'picture_as_pdf'}
            </span>
            <span className="pdf-title-label">{title}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <a 
              href={noteId ? `/api/download/${noteId}` : fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={handleDownload}
              className="btn-primary" 
              style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>download</span>
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* File display */}
        {!hasFile ? (
          <div className="pdf-image-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
            <img 
              src={defaultPreviewImage} 
              className="pdf-image" 
              alt={title || 'Resource Preview'} 
              style={{ width: '100%', maxHeight: '650px', objectFit: 'contain', background: '#18181b' }}
            />
          </div>
        ) : isLink ? (
          <div className="link-placeholder">
            <div style={{ maxWidth: '420px', width: '100%', marginBottom: 16, borderRadius: '8px', overflow: 'hidden' }}>
              <img 
                src={defaultPreviewImage} 
                alt={title} 
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
              />
            </div>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>External Resource Link</h3>
            <p style={{ color: 'var(--sub)', fontSize: 13, maxWidth: 380, marginBottom: 16 }}>
              This resource is hosted externally (e.g. Google Drive, YouTube, or GitHub). Click below to view it directly.
            </p>
            <div className="link-url-box">{fileUrl}</div>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary" 
              style={{ padding: '10px 24px' }}
            >
              Open Resource Link
            </a>
          </div>
        ) : isImage ? (
          <div className="pdf-image-wrapper">
            <img 
              src={imageError ? defaultPreviewImage : fileUrl} 
              className="pdf-image" 
              alt={title} 
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <object
            data={embedUrl}
            type="application/pdf"
            className="pdf-frame"
            aria-label={title}
          >
            <iframe 
              src={embedUrl} 
              className="pdf-frame" 
              title={title}
              allowFullScreen
            />
          </object>
        )}
      </div>

      <LoginPromptModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        actionType="download"
        onLoginSuccess={executeDownload}
      />
    </>
  );
}
