import { useEffect, useRef, useState, useCallback } from 'react';
import telemetry from './telemetryClient';

const IMPRESSION_THRESHOLD_MS = 1500; // 1.5 seconds continuous visibility required for an impression
const MIN_DWELL_REPORT_MS = 1000; // Minimum 1 second active dwell to log post_dwell

// In-memory set of post IDs already impressed in this page session to prevent duplicates
const sessionImpressedPosts = new Set();

/**
 * usePostTelemetry — Custom React Hook for PostCard.jsx
 * 
 * Manages:
 * - Viewport enter / exit detection (threshold >= 0.5)
 * - 1.5-second continuous visibility timer for post_impression
 * - Active dwell time accumulation (pauses on hidden tab / window blur)
 * - Clean cleanup on unmount
 */
export default function usePostTelemetry({ postId, creatorId, position, source = 'feed' }) {
  const containerRef = useRef(null);
  const impressionTimerRef = useRef(null);
  const dwellStartRef = useRef(null);
  const accumulatedDwellRef = useRef(0);
  const isVisibleRef = useRef(false);
  const [hasImpressed, setHasImpressed] = useState(() => sessionImpressedPosts.has(postId));

  // Flush accumulated dwell time to telemetry client
  const flushDwellTime = useCallback(() => {
    if (dwellStartRef.current && isVisibleRef.current && document.visibilityState === 'visible') {
      const now = Date.now();
      accumulatedDwellRef.current += Math.max(0, now - dwellStartRef.current);
      dwellStartRef.current = now;
    }

    const totalDwell = accumulatedDwellRef.current;
    if (totalDwell >= MIN_DWELL_REPORT_MS && postId) {
      telemetry.track('post_dwell', {
        postId,
        creatorId,
        position,
        source,
        metadata: {
          dwell_ms: totalDwell,
        },
      });
    }
    // Reset accumulator after flushing
    accumulatedDwellRef.current = 0;
  }, [postId, creatorId, position, source]);

  // Handle Tab / Window Visibility Changes (pause dwell time if backgrounded)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab backgrounded: freeze dwell timer & cancel pending 1.5s impression
        if (dwellStartRef.current && isVisibleRef.current) {
          accumulatedDwellRef.current += Math.max(0, Date.now() - dwellStartRef.current);
          dwellStartRef.current = null;
        }
        if (impressionTimerRef.current) {
          clearTimeout(impressionTimerRef.current);
          impressionTimerRef.current = null;
        }
      } else if (document.visibilityState === 'visible' && isVisibleRef.current) {
        // Tab active again: resume dwell timer
        dwellStartRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Viewport IntersectionObserver
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !postId) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // ─── Post enters viewport (>= 50%) ───
            if (!isVisibleRef.current) {
              isVisibleRef.current = true;
              dwellStartRef.current = Date.now();

              telemetry.track('post_viewport_enter', {
                postId,
                creatorId,
                position,
                source,
                metadata: {
                  intersection_ratio: Math.round(entry.intersectionRatio * 100) / 100,
                },
              });

              // Start 1.5-second continuous impression timer
              if (!sessionImpressedPosts.has(postId) && !impressionTimerRef.current) {
                impressionTimerRef.current = setTimeout(() => {
                  if (isVisibleRef.current && document.visibilityState === 'visible') {
                    sessionImpressedPosts.add(postId);
                    setHasImpressed(true);

                    telemetry.track('post_impression', {
                      postId,
                      creatorId,
                      position,
                      source,
                      metadata: {
                        dwell_threshold_satisfied: true,
                        duration_ms: IMPRESSION_THRESHOLD_MS,
                      },
                    });
                  }
                  impressionTimerRef.current = null;
                }, IMPRESSION_THRESHOLD_MS);
              }
            }
          } else {
            // ─── Post exits viewport (< 50%) ───
            if (isVisibleRef.current) {
              isVisibleRef.current = false;

              // Cancel pending 1.5s impression if user scrolled away too quickly
              if (impressionTimerRef.current) {
                clearTimeout(impressionTimerRef.current);
                impressionTimerRef.current = null;
              }

              // Accumulate dwell duration
              let exitDwell = 0;
              if (dwellStartRef.current) {
                exitDwell = Math.max(0, Date.now() - dwellStartRef.current);
                accumulatedDwellRef.current += exitDwell;
                dwellStartRef.current = null;
              }

              telemetry.track('post_viewport_exit', {
                postId,
                creatorId,
                position,
                source,
                metadata: {
                  dwell_ms: exitDwell,
                  dwell_time_ms: exitDwell,
                },
              });

              // Flush dwell time upon exiting
              flushDwellTime();
            }
          }
        });
      },
      {
        threshold: [0.1, 0.5, 0.9],
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
        impressionTimerRef.current = null;
      }
      flushDwellTime();
    };
  }, [postId, creatorId, position, source, flushDwellTime]);

  return {
    containerRef,
    hasImpressed,
  };
}
