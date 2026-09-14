/**
 * Code Plus Academy - GA4 Event Taxonomy & Standard Constants
 * Reference: Google Analytics 4 Recommended & Custom Events Specification
 */

export const GA_EVENTS = {
  // Navigation & Session Lifecycle
  PAGE_VIEW: 'page_view',
  ENGAGEMENT_HEARTBEAT: 'engagement_heartbeat',
  BREAKPOINT_TRANSITION: 'breakpoint_transition',
  SCROLL_MILESTONE: 'scroll_milestone',
  SESSION_START: 'session_start',
  USER_ENGAGEMENT: 'user_engagement',

  // UX Friction & Quality Observability
  RAGE_CLICK: 'rage_click',
  DEAD_CLICK: 'dead_click',
  CORE_WEB_VITALS: 'core_web_vitals',
  CLIENT_ERROR: 'client_error',
  API_FAILURE: 'api_failure',

  // Notes Arena
  NOTES_SEARCH: 'notes_search',
  NOTES_AUTOSUGGEST_CLICK: 'notes_autosuggest_click',
  NOTES_FILTER_CHANGE: 'notes_filter_change',
  NOTES_PREVIEW: 'notes_preview',
  NOTES_DOWNLOAD: 'notes_download',
  NOTES_UPVOTE: 'notes_upvote',
  NOTES_BOOKMARK: 'notes_bookmark',
  NOTES_SHARE: 'notes_share',
  NOTES_UPLOAD_START: 'notes_upload_start',
  NOTES_UPLOAD_STEP: 'notes_upload_step',
  NOTES_UPLOAD_COMPLETE: 'notes_upload_complete',
  NOTES_UPLOAD_FAILED: 'notes_upload_failed',

  // Video & Shorts Streaming
  VIDEO_START: 'video_start',
  VIDEO_PROGRESS: 'video_progress',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_COMPLETE: 'video_complete',
  VIDEO_BUFFERING: 'video_buffering',
  VIDEO_SEEK: 'video_seek',
  VIDEO_QUALITY_CHANGE: 'video_quality_change',

  // Shorts Vertical Player
  SHORT_VIEW: 'short_view',
  SHORT_PROGRESS: 'short_progress',
  SHORT_COMPLETE: 'short_complete',
  SHORT_LOOP: 'short_loop',
  SHORT_SWIPE_NEXT: 'short_swipe_next',
  SHORT_SWIPE_PREV: 'short_swipe_prev',
  SHORT_CLAP: 'short_clap',
  SHORT_SHARE: 'short_share',
  SHORT_COMMENT_OPEN: 'short_comment_open',

  // Articles & Long-form Knowledge
  ARTICLE_VIEW: 'article_view',
  ARTICLE_SCROLL: 'article_scroll',
  ARTICLE_READ_COMPLETE: 'article_read_complete',
  ARTICLE_CLAP: 'article_clap',
  ARTICLE_BOOKMARK: 'article_bookmark',
  ARTICLE_SHARE: 'article_share',
  ARTICLE_AUTHOR_FOLLOW: 'article_author_follow',

  // Authentication & Profile
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  SIGNUP_STEP: 'signup_step',
  SIGNUP_SUCCESS: 'signup_success',
  TWO_FACTOR_CHALLENGE: 'two_factor_challenge',
  LOGOUT: 'logout',

  // Creator Studio
  CREATOR_TAB_SWITCH: 'creator_tab_switch',
  CREATOR_UPLOAD_START: 'creator_upload_start',
  CREATOR_TRANSCODE_POLL: 'creator_transcode_poll',

  // Direct Messaging (DM)
  DM_CONVERSATION_OPEN: 'dm_conversation_open',
  DM_MESSAGE_SEND: 'dm_message_send',
  DM_ATTACHMENT_SELECT: 'dm_attachment_select',
  DM_REACTION: 'dm_reaction',
  DM_SEARCH: 'dm_search',
  DM_DOCK_TOGGLE: 'dm_dock_toggle',

  // Attendance & Academic Management
  ATTENDANCE_TAB_SWITCH: 'attendance_tab_switch',
  ATTENDANCE_DATE_FILTER: 'attendance_date_filter',
  ATTENDANCE_FILTER_CHANGE: 'attendance_filter_change',
  ATTENDANCE_EXPORT: 'attendance_export',
  ATTENDANCE_SCAN_TOGGLE: 'attendance_scan_toggle',
};

export const BREAKPOINTS = {
  MOBILE: 'mobile',       // < 640px
  TABLET: 'tablet',       // 640px - 1023px
  DESKTOP: 'desktop',     // 1024px - 1439px
  ULTRAWIDE: 'ultrawide', // >= 1440px
};
