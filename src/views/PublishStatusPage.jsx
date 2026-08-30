import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Share2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Play,
  Zap,
  Globe,
  Lock,
  Users,
  FileText,
  Clock,
  ArrowDownCircle,
  Film,
  Activity,
  Rocket,
  Eye,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

const STAGES = [
  {
    key: 'PIPELINE_INIT',
    label: 'Video Processing Pipeline',
    getDesc: (job) => `Job ID: ${job?.id || '—'}`,
    icon: FileText,
  },
  {
    key: 'PENDING',
    label: 'Job Queued',
    getDesc: () => 'Processing pipeline initialized',
    icon: Clock,
  },
  {
    key: 'PROCESSING',
    label: 'Downloading Video',
    getDesc: () => 'Fetching video stream & assets',
    icon: ArrowDownCircle,
  },
  {
    key: 'DOWNLOADED',
    label: 'Media Downloaded',
    getDesc: () => 'Video asset saved, initiating HLS transcode',
    icon: Film,
  },
  {
    key: 'CHUNKING',
    label: 'HLS Transcoding',
    getDesc: () => 'Generating adaptive streaming chunks',
    icon: Activity,
  },
  {
    key: 'READY',
    label: 'Published & Live',
    getDesc: () => 'Video is active on CPA',
    icon: Rocket,
  },
];

function stageIndex(status) {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return 1;
    case 'PROCESSING':
      return 2;
    case 'DOWNLOADED':
      return 3;
    case 'CHUNKING':
      return 4;
    case 'READY':
    case 'COMPLETED':
      return 5;
    default:
      return 0;
  }
}

function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch (_) {
    return '';
  }
}

export default function PublishStatusPage() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();
  const navigate = useNavigate();

  // Extract jobId from multiple possible query/route parameters:
  // /posts/publish?job_id=xxx OR ?id=xxx OR ?job=xxx OR ?slug=xxx OR /posts/publish/:jobId
  const jobId = routeParams.jobId ||
    searchParams.get('job_id') ||
    searchParams.get('id') ||
    searchParams.get('job') ||
    searchParams.get('slug') ||
    searchParams.get('') || // handles ?=xxxx
    null;

  const urlVideoId = searchParams.get('video_id');

  const [jobData, setJobData] = useState(null);
  const [jobLogs, setJobLogs] = useState([]);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const pollIntervalRef = useRef(null);
  const backoffDelayRef = useRef(2000);
  const isMountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      setError('No publish job ID provided.');
      return;
    }

    try {
      const res = await api.get(`/videos/studio/jobs/${jobId}`);
      if (!isMountedRef.current) return;

      const { job, logs, video } = res.data;
      setJobData(job);
      setJobLogs(logs || []);

      if (video) {
        setVideoData(video);
      } else if (job?.video_id && !videoData) {
        // Fallback: fetch post or video directly based on destination
        const isFeedDest = job?.destination === 'feed' || searchParams.get('destination') === 'feed';
        const targetEndpoint = isFeedDest ? `/posts/${job.video_id}` : `/videos/${job.video_id}`;
        api.get(targetEndpoint)
          .then(vRes => {
            if (isMountedRef.current) {
              const data = vRes.data?.video || vRes.data?.post || vRes.data;
              if (data) setVideoData(data);
            }
          })
          .catch(() => {});
      }

      const hasReadyLog = logs?.some(l => (l.stage === 'READY' || l.stage === 'COMPLETED') && (l.status === 'completed' || l.status === 'READY'));
      const isComplete = job?.status === 'READY' || hasReadyLog || job?.status === 'FAILED';

      if (isComplete) {
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        // Schedule next poll with backoff capped at 10s
        backoffDelayRef.current = Math.min(Math.round(backoffDelayRef.current * 1.25), 10000);
        pollIntervalRef.current = setTimeout(fetchStatus, backoffDelayRef.current);
      }

      setError('');
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.response?.status === 404) {
        setError('Job not found or unauthorized.');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to fetch status.');
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [jobId, videoData]);

  useEffect(() => {
    isMountedRef.current = true;
    backoffDelayRef.current = 2000;
    fetchStatus();

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
    };
  }, [fetchStatus]);

  // Target destination and video ID for actions
  const isFeed = jobData?.destination === 'feed' || searchParams.get('destination') === 'feed';
  const targetVideoId = videoData?.id || jobData?.video_id || urlVideoId;
  const isShort = videoData?.content_type === 'short' || videoData?.is_short || true;
  const videoViewUrl = isFeed
    ? (targetVideoId ? `/posts/${targetVideoId}` : '/feed')
    : (targetVideoId ? (isShort ? `/shorts/${targetVideoId}` : `/videos/${targetVideoId}`) : '/explore');

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${videoViewUrl}`;
    const shareTitle = videoData?.title || (isFeed ? 'Check out my post on FocusGram!' : 'Check out my new video on FocusGram!');

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Video link copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      toast.error('Could not copy link');
    }
  };

  const effectiveStatus = (() => {
    const hasReadyLog = jobLogs?.some(l => (l.stage === 'READY' || l.stage === 'COMPLETED') && (l.status === 'completed' || l.status === 'READY'));
    if (jobData?.status === 'READY' || hasReadyLog) return 'READY';
    if (jobData?.status === 'FAILED') return 'FAILED';
    return jobData?.status || 'PENDING';
  })();

  const isLive = effectiveStatus === 'READY';
  const isFailed = effectiveStatus === 'FAILED';
  const currentStageIdx = stageIndex(effectiveStatus);

  // Time lookup per stage from logs
  const getStageTime = (stageKey, fallbackIdx) => {
    if (stageKey === 'PIPELINE_INIT') {
      return formatTimestamp(jobData?.created_at) || 'Just now';
    }
    const matchingLog = jobLogs?.find(l => l.stage?.toUpperCase() === stageKey.toUpperCase());
    if (matchingLog?.created_at) {
      return formatTimestamp(matchingLog.created_at);
    }
    if (isLive) {
      return formatTimestamp(jobData?.updated_at || jobData?.created_at);
    }
    return '';
  };

  if (loading && !jobData) {
    return (
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
      }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#8b5cf6',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: 14, color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
          Loading publish status…
        </span>
      </div>
    );
  }

  if (error && !jobData) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
      }}>
        <AlertCircle size={44} color="#ef4444" />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          Could not load status
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted, #64748b)', margin: 0, maxWidth: 360 }}>
          {error}
        </p>
        <button
          onClick={() => navigate('/creator/dashboard')}
          style={{
            marginTop: 8,
            padding: '10px 20px',
            borderRadius: 12,
            background: '#8b5cf6',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 580,
      margin: '0 auto',
      padding: '16px 16px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {/* ── Top Navigation Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 0',
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--card, #fff)',
            border: '1px solid var(--border, rgba(0,0,0,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          title="Go Back"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          type="button"
          onClick={handleShare}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--card, #fff)',
            border: '1px solid var(--border, rgba(0,0,0,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          title="Share Video"
        >
          {copied ? <Check size={18} color="#10b981" /> : <Share2 size={18} />}
        </button>
      </div>

      {/* ── Hero Success Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12,
          padding: '10px 0 6px',
        }}
      >
        {/* Celebration Confetti Circle Icon */}
        <div style={{ position: 'relative', width: 76, height: 76 }}>
          {/* Confetti particles */}
          <span style={{ position: 'absolute', top: -4, left: 14, width: 6, height: 6, borderRadius: '50%', background: '#ec4899' }} />
          <span style={{ position: 'absolute', top: 4, right: 10, width: 5, height: 5, borderRadius: '50%', background: '#3b82f6' }} />
          <span style={{ position: 'absolute', bottom: 6, left: 2, width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />
          <span style={{ position: 'absolute', bottom: 2, right: 12, width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ position: 'absolute', top: 22, left: -6, width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6' }} />
          <span style={{ position: 'absolute', top: 16, right: -4, width: 5, height: 5, borderRadius: '50%', background: '#06b6d4' }} />

          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'var(--card, #fff)',
            border: '2.5px solid #3b82f6',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isLive ? (
              <CheckCircle2 size={38} color="#3b82f6" strokeWidth={2.5} />
            ) : isFailed ? (
              <AlertCircle size={38} color="#ef4444" strokeWidth={2.5} />
            ) : (
              <Loader2 size={36} color="#8b5cf6" style={{ animation: 'spin 1.2s linear infinite' }} />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(1.6rem, 5vw, 2rem)',
          fontWeight: 800,
          color: 'var(--text, #0f172a)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          {isLive ? (
            <>
              Video <span style={{
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Published!</span>
            </>
          ) : isFailed ? (
            <span style={{ color: '#ef4444' }}>Publish Failed</span>
          ) : (
            <>
              Publishing <span style={{
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Video…</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-muted, #64748b)',
        }}>
          {isLive
            ? 'Your video is now live on CPA Shorts.'
            : isFailed
            ? (jobData?.error || 'Video transcoding failed. Please try again.')
            : 'Your video is processing in the cloud pipeline. Almost ready.'}
        </p>
      </motion.div>

      {/* ── Video Details Summary Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          background: 'var(--card, #ffffff)',
          border: '1px solid var(--border, rgba(0,0,0,0.07))',
          borderRadius: 20,
          padding: '14px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          gap: 14,
          alignItems: 'center',
        }}
      >
        {/* Left Thumbnail */}
        <div style={{
          position: 'relative',
          width: 90,
          minWidth: 80,
          aspectRatio: '9 / 15',
          borderRadius: 12,
          flexShrink: 0,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #1e1b4b, #312e81, #0f172a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {videoData?.thumbnail_url ? (
            <img
              src={videoData.thumbnail_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Play size={16} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
            </div>
          )}

          {/* Play icon overlay if image present */}
          {videoData?.thumbnail_url && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.25)',
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
              </div>
            </div>
          )}

          {/* Duration Badge */}
          <div style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            borderRadius: 4,
            padding: '2px 5px',
            fontSize: 9.5,
            fontWeight: 700,
            fontFamily: 'monospace',
          }}>
            {videoData?.duration_formatted || (videoData?.duration ? `${Math.floor(videoData.duration / 60)}:${String(videoData.duration % 60).padStart(2, '0')}` : '00:45')}
          </div>
        </div>

        {/* Right Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Title */}
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(13.5px, 2.5vw, 15px)',
            fontWeight: 700,
            color: 'var(--text, #0f172a)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {videoData?.title || 'Published Video'}
          </h2>

          {/* Badges row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 700,
              background: isFeed ? 'rgba(99, 102, 241, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: isFeed ? '#6366f1' : '#d97706',
              border: isFeed ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
            }}>
              {isFeed ? <FileText size={11} /> : <Zap size={11} />} {isFeed ? `Feed Post (${jobData?.aspect_ratio || '4:5'})` : 'Short / Reel'}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 700,
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#7c3aed',
              border: '1px solid rgba(139, 92, 246, 0.25)',
            }}>
              <Globe size={11} /> Public
            </span>
          </div>

          {/* Metadata Grid (Responsive auto-fit with no truncation overflow) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(62px, 1fr))',
            gap: '6px 8px',
            paddingTop: 8,
            borderTop: '1px solid var(--border, rgba(0,0,0,0.06))',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7c3aed', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoData?.category || 'General'}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Difficulty</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#10b981', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoData?.difficulty || 'Beginner'}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Language</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoData?.language || 'English'}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text, #0f172a)', fontFamily: 'monospace' }}>
                {videoData?.duration_formatted || (videoData?.duration ? `${Math.floor(videoData.duration / 60)}:${String(videoData.duration % 60).padStart(2, '0')}` : '00:45')}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Publish Status Vertical Stepper Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          background: 'var(--card, #ffffff)',
          border: '1px solid var(--border, rgba(0,0,0,0.07))',
          borderRadius: 20,
          padding: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Card Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 4,
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#7c3aed',
          }}>
            PUBLISH STATUS
          </span>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            background: isLive
              ? 'rgba(16, 185, 129, 0.12)'
              : isFailed
              ? 'rgba(239, 68, 68, 0.12)'
              : 'rgba(245, 158, 11, 0.12)',
            color: isLive ? '#10b981' : isFailed ? '#ef4444' : '#d97706',
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isLive ? '#10b981' : isFailed ? '#ef4444' : '#d97706',
            }} />
            {isLive ? 'Live' : isFailed ? 'Failed' : 'Processing'}
          </span>
        </div>

        {/* Vertical Connected Stepper */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isDone = isLive || currentStageIdx > idx;
            const isActive = !isLive && !isFailed && currentStageIdx === idx;
            const isStageFailed = isFailed && currentStageIdx === idx;
            const isLast = idx === STAGES.length - 1;
            const timestamp = getStageTime(stage.key, idx);

            return (
              <div
                key={stage.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  position: 'relative',
                  paddingBottom: isLast ? 0 : 20,
                  opacity: isDone || isActive ? 1 : 0.45,
                }}
              >
                {/* Connecting Rail Line */}
                {!isLast && (
                  <div style={{
                    position: 'absolute',
                    top: 36,
                    left: 17,
                    width: 2,
                    bottom: 0,
                    background: isDone
                      ? 'linear-gradient(to bottom, #8b5cf6, #3b82f6)'
                      : 'var(--border, rgba(0,0,0,0.1))',
                    zIndex: 1,
                  }} />
                )}

                {/* Circular Icon Node */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isDone
                    ? 'rgba(139, 92, 246, 0.12)'
                    : isActive
                    ? 'rgba(59, 130, 246, 0.12)'
                    : 'var(--elevated, #f1f5f9)',
                  border: `1.5px solid ${isDone ? '#8b5cf6' : isActive ? '#3b82f6' : 'var(--border, #cbd5e1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 2,
                  marginRight: 14,
                }}>
                  <Icon size={16} color={isDone ? '#7c3aed' : isActive ? '#2563eb' : '#94a3b8'} />
                </div>

                {/* Step Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}>
                    <div style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: isDone ? 'var(--text, #0f172a)' : isActive ? '#2563eb' : 'var(--text-muted, #64748b)',
                    }}>
                      {stage.label}
                    </div>

                    {/* Right timestamp & status icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {timestamp && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
                          {timestamp}
                        </span>
                      )}
                      {isDone ? (
                        <CheckCircle2 size={16} color={isLast ? '#7c3aed' : '#10b981'} />
                      ) : isActive ? (
                        <Loader2 size={15} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
                      ) : isStageFailed ? (
                        <AlertCircle size={16} color="#ef4444" />
                      ) : (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border, #cbd5e1)' }} />
                      )}
                    </div>
                  </div>

                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-muted, #64748b)',
                    marginTop: 2,
                    wordBreak: 'break-word',
                  }}>
                    {stage.getDesc(jobData)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Celebration Card */}
        {isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              marginTop: 4,
              padding: '12px 16px',
              borderRadius: 14,
              background: 'rgba(238, 242, 255, 0.7)',
              border: '1px solid #c7d2fe',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sparkles size={16} color="#4338ca" />
            </div>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#4338ca',
              lineHeight: 1.35,
            }}>
              {isFeed
                ? 'Feed video successfully transcoded & published to Community Feed'
                : 'Video successfully transcoded & published to CPA Shorts'}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* ── Sticky / Fixed Bottom Action Buttons ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--card, #ffffff)',
        borderTop: '1px solid var(--border, rgba(0,0,0,0.08))',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 580,
          margin: '0 auto',
          display: 'flex',
          gap: 12,
        }}>
          {/* View Video / Feed Post Button */}
          <button
            type="button"
            onClick={() => navigate(videoViewUrl)}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 14,
              background: 'var(--card, #ffffff)',
              border: '1.5px solid #c7d2fe',
              color: '#4f46e5',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)',
            }}
          >
            <Eye size={18} /> {isFeed ? 'View Post in Feed' : 'View Video'}
          </button>

          {/* Share Video Button */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)',
            }}
          >
            Share Video <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
