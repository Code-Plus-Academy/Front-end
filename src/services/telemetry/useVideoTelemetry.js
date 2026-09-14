import { useEffect, useRef, useCallback } from 'react';
import telemetry from './telemetryClient';

/**
 * Merges overlapping or adjacent numeric intervals [[start, end], ...].
 * Returns the total duration of distinct watched seconds.
 */
function calculateTotalWatchedSeconds(ranges) {
  if (!ranges || ranges.length === 0) return 0;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged.reduce((acc, [start, end]) => acc + Math.max(0, end - start), 0);
}

/**
 * useVideoTelemetry — Custom React Hook for Video Playback Telemetry
 * 
 * Features:
 * - Natural watch time vs seeking disambiguation
 * - Milestone triggers: 25%, 50%, 75%, 100% (video_complete)
 * - Loop / re-watch counting
 * - Clean cleanup with video_exit on unmount or scroll-away
 */
export default function useVideoTelemetry({ postId, creatorId, position, videoRef, source = 'feed' }) {
  const watchedRangesRef = useRef([]);
  const segmentStartRef = useRef(null);
  const seekStartRef = useRef(null);
  const milestonesEmittedRef = useRef({ 25: false, 50: false, 75: false, 100: false });
  const loopCountRef = useRef(0);
  const hasStartedRef = useRef(false);

  // Close the current watched segment and merge into ranges
  const closeCurrentSegment = useCallback((currentTime) => {
    if (segmentStartRef.current !== null && typeof currentTime === 'number') {
      const start = segmentStartRef.current;
      const end = currentTime;
      if (end > start) {
        watchedRangesRef.current.push([start, end]);
      }
      segmentStartRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video || !postId) return undefined;

    // 1. Play Event
    const handlePlay = () => {
      segmentStartRef.current = video.currentTime;

      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        telemetry.track('video_play', {
          postId,
          creatorId,
          position,
          source,
          metadata: {
            duration_s: Math.round(video.duration || 0),
            muted: video.muted,
            autoplay: video.autoplay,
          },
        });
      } else {
        telemetry.track('video_resume', {
          postId,
          creatorId,
          position,
          source,
          metadata: {
            current_time_s: Math.round(video.currentTime * 10) / 10,
          },
        });
      }
    };

    // 2. Pause Event
    const handlePause = () => {
      closeCurrentSegment(video.currentTime);
      const totalWatched = calculateTotalWatchedSeconds(watchedRangesRef.current);

      telemetry.track('video_pause', {
        postId,
        creatorId,
        position,
        source,
        metadata: {
          current_time_s: Math.round(video.currentTime * 10) / 10,
          natural_watched_s: Math.round(totalWatched * 10) / 10,
        },
      });
    };

    // 3. Seeking / Scrubber Events
    const handleSeeking = () => {
      closeCurrentSegment(video.currentTime);
      seekStartRef.current = video.currentTime;
    };

    const handleSeeked = () => {
      const fromTime = seekStartRef.current;
      const toTime = video.currentTime;
      seekStartRef.current = null;

      if (fromTime !== null && Math.abs(toTime - fromTime) > 0.5) {
        telemetry.track('video_seek', {
          postId,
          creatorId,
          position,
          source,
          metadata: {
            from_time_s: Math.round(fromTime * 10) / 10,
            to_time_s: Math.round(toTime * 10) / 10,
          },
        });
      }

      // If video is still playing after seek, open a fresh segment
      if (!video.paused) {
        segmentStartRef.current = video.currentTime;
      }
    };

    // 4. Milestone Check on Progress / TimeUpdate
    const handleTimeUpdate = () => {
      if (video.paused || !video.duration || video.duration === 0) return;

      const duration = video.duration;
      const currentTime = video.currentTime;

      // Extend current active segment
      if (segmentStartRef.current === null) {
        segmentStartRef.current = currentTime;
      }

      // Compute total distinct watched seconds including active segment
      const currentSegment = segmentStartRef.current !== null && currentTime > segmentStartRef.current
        ? [[segmentStartRef.current, currentTime]]
        : [];
      const totalWatched = calculateTotalWatchedSeconds([...watchedRangesRef.current, ...currentSegment]);

      // Check Milestones (25%, 50%, 75%, 100%)
      const milestones = [
        { pct: 25, event: 'video_25', minWatchedRatio: 0.20 },
        { pct: 50, event: 'video_50', minWatchedRatio: 0.45 },
        { pct: 75, event: 'video_75', minWatchedRatio: 0.68 },
        { pct: 100, event: 'video_100', minWatchedRatio: 0.85 },
      ];

      for (const m of milestones) {
        if (!milestonesEmittedRef.current[m.pct]) {
          const reachedPosition = (currentTime / duration) >= (m.pct / 100) - 0.03;
          const satisfiedNaturalWatch = (totalWatched / duration) >= m.minWatchedRatio;

          // Crucial: Only emit milestone if the user naturally watched the duration, not seek-jumped!
          if (reachedPosition && satisfiedNaturalWatch) {
            milestonesEmittedRef.current[m.pct] = true;

            telemetry.track(m.event, {
              postId,
              creatorId,
              position,
              source,
              metadata: {
                duration_s: Math.round(duration * 10) / 10,
                current_time_s: Math.round(currentTime * 10) / 10,
                natural_watched_s: Math.round(totalWatched * 10) / 10,
              },
            });
          }
        }
      }
    };

    // 5. Video Ended / Loop
    const handleEnded = () => {
      closeCurrentSegment(video.currentTime);
      const duration = video.duration || 1;
      const totalWatched = calculateTotalWatchedSeconds(watchedRangesRef.current);

      if (!milestonesEmittedRef.current[100]) {
        milestonesEmittedRef.current[100] = true;
        telemetry.track('video_100', {
          postId,
          creatorId,
          position,
          source,
          metadata: {
            duration_s: Math.round(duration * 10) / 10,
            natural_watched_s: Math.round(totalWatched * 10) / 10,
            completed: true,
          },
        });
      }

      // Loop detection (if video has loop attribute)
      if (video.loop) {
        loopCountRef.current += 1;
        // Reset milestones for next loop iteration
        milestonesEmittedRef.current = { 25: false, 50: false, 75: false, 100: false };
        telemetry.track('video_rewatch', {
          postId,
          creatorId,
          position,
          source,
          metadata: {
            loop_count: loopCountRef.current,
          },
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);

      // On unmount: emit video_exit if the user started playing
      if (hasStartedRef.current) {
        closeCurrentSegment(video.currentTime);
        const totalWatched = calculateTotalWatchedSeconds(watchedRangesRef.current);
        const duration = video.duration || 1;
        const completionPct = Math.min(100, Math.round((video.currentTime / duration) * 100));

        telemetry.track('video_exit', {
          postId,
          creatorId,
          position,
          source,
          metadata: {
            exit_time_s: Math.round(video.currentTime * 10) / 10,
            completion_pct: completionPct,
            natural_watched_s: Math.round(totalWatched * 10) / 10,
            completed: milestonesEmittedRef.current[100],
          },
        });
      }
    };
  }, [postId, creatorId, position, source, videoRef, closeCurrentSegment]);

  return {
    watchedRangesRef,
  };
}
