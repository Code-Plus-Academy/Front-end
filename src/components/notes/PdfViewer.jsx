'use client';

import React, { useState, useEffect } from 'react';

export default function PdfViewer({ fileUrl, fileType, title, downloadsCount, noteId }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloads, setDownloads] = useState(downloadsCount || 0);

  const handleDownload = async () => {
    try {
      setDownloads(prev => prev + 1);
      // Optional: trigger backend counter increment
      await fetch(`/api/notes/${noteId}/download`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const isImage = fileUrl?.match(/\.(png|jpe?g|webp|gif)$/i);
  const isPdf = fileUrl?.toLowerCase().endsWith('.pdf');
  const isLink = fileType === 'link' || (!isPdf && !isImage);

  // If it's a PDF, we can use Google Docs Viewer for mobile/cross-platform compatibility
  const embedUrl = isPdf
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
    : fileUrl;

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
          height: 600px;
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
              href={fileUrl} 
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
        {isLink ? (
          <div className="link-placeholder">
            <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--green)', marginBottom: 12 }}>
              open_in_new
            </span>
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
            <img src={fileUrl} className="pdf-image" alt={title} />
          </div>
        ) : (
          <iframe 
            src={embedUrl} 
            className="pdf-frame" 
            title={title}
            allowFullScreen
          />
        )}
      </div>
    </>
  );
}
