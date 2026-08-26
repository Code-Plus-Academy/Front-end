'use client';

import React from 'react';
import { FileText, Download } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DocumentMessageCard({ attachment, isMine }) {
  if (!attachment) return null;

  const fileName = attachment.file_name || attachment.title || 'Document';
  const fileExt = (attachment.file_extension || fileName.split('.').pop() || 'FILE').toUpperCase();
  const fileSize = formatBytes(attachment.file_size);
  const fileUrl = attachment.url;

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!fileUrl) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={handleDownload}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      style={{
        backgroundColor: isMine ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.07)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        maxWidth: '340px',
        width: '100%',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[11px] uppercase tracking-wider flex-shrink-0"
        style={{
          backgroundColor: fileExt === 'PDF' ? '#EF4444' : (fileExt.startsWith('DOC') ? '#3B82F6' : (fileExt.startsWith('XLS') ? '#10B981' : '#6366F1')),
          color: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {fileExt.slice(0, 4)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate leading-snug" style={{ color: isMine ? '#FFFFFF' : '#F1F5F9' }}>
          {fileName}
        </p>
        <div className="flex items-center gap-2 mt-0.5 opacity-70 text-[10.5px] font-mono">
          {fileSize && <span>{fileSize}</span>}
          <span>•</span>
          <span>{fileExt} Document</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        title="Download file"
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
      >
        <Download size={14} />
      </button>
    </div>
  );
}
