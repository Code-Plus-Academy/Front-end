'use client';
import { useCallback } from 'react';
import useDataLayer from './useDataLayer';
import { GA_EVENTS } from '../analytics/events';
import { sanitizePayload, sanitizeUrl } from '../analytics/sanitize';

/**
 * Universal standalone trackEvent function for non-React contexts.
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || !eventName) return;
  try {
    window.dataLayer = window.dataLayer || [];
    const cleanParams = sanitizePayload(params);
    window.dataLayer.push({
      event: eventName,
      ...cleanParams,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Fail silently
  }
}

/**
 * Production-grade useAnalytics hook with typed convenience helpers
 */
export default function useAnalytics() {
  const { trackEvent: rawTrackEvent, setUserId } = useDataLayer();

  const trackCustomEvent = useCallback(
    (eventName, params = {}) => {
      rawTrackEvent(eventName, params);
    },
    [rawTrackEvent]
  );

  const trackNotesEvent = useCallback(
    (action, noteData = {}) => {
      rawTrackEvent(action, {
        note_id: noteData.id || noteData.noteId,
        note_title: noteData.title,
        subject: noteData.subject,
        department: noteData.department,
        university: noteData.university,
        college: noteData.college,
        file_format: noteData.fileFormat || 'pdf',
        semester: noteData.semester,
        ...noteData.extra,
      });
    },
    [rawTrackEvent]
  );

  const trackVideoEvent = useCallback(
    (action, videoData = {}) => {
      rawTrackEvent(action, {
        video_id: videoData.id || videoData.videoId,
        video_title: videoData.title,
        duration_sec: videoData.duration,
        current_time_sec: videoData.currentTime,
        progress_percent: videoData.percent,
        quality: videoData.quality,
        creator_id: videoData.creatorId,
        is_short: Boolean(videoData.isShort),
        ...videoData.extra,
      });
    },
    [rawTrackEvent]
  );

  const trackFriction = useCallback(
    (type, metadata = {}) => {
      rawTrackEvent(type, {
        friction_type: type,
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
        ...metadata,
      });
    },
    [rawTrackEvent]
  );

  return {
    trackEvent: trackCustomEvent,
    trackNotesEvent,
    trackVideoEvent,
    trackFriction,
    setUserId,
    GA_EVENTS,
  };
}
