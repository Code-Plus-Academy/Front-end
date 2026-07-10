# CPA Frontend Migration Checklist

This file tracks the migration status of components, pages, hooks, contexts, api, utils, and configurations from the Vite app to Next.js.

## Core Components & Source Files

| Vite File | Next.js File | Status | Notes |
|---|---|---|---|
| `src/App.jsx` | `src/App.jsx` | ✅ verified match | Next.js client-side shell routing adaptation |
| `src/api/axios.js` | `src/api/axios.js` | ✅ verified match | Ported dynamic LAN IP translation with SSR guards |
| `src/assets/cpa-icon.png` | `src/assets/cpa-icon.png` | ✅ verified match | Copied missing asset |
| `src/assets/cpa-logo-dark.png` | `src/assets/cpa-logo-dark.png` | ✅ verified match | Identical content |
| `src/assets/cpa-logo-light.png` | `src/assets/cpa-logo-light.png` | ✅ verified match | Identical content |
| `src/assets/logo.png` | `src/assets/logo.png` | ✅ verified match | Identical content |
| `src/components/ads/AdUnit.jsx` | `src/components/ads/AdUnit.jsx` | ✅ verified match | Env check adapted for Next.js |
| `src/components/ads/MidArticleAd.jsx` | `src/components/ads/MidArticleAd.jsx` | ✅ verified match | Identical content |
| `src/components/ads/RightPanelAd.jsx` | `src/components/ads/RightPanelAd.jsx` | ✅ verified match | Identical content |
| `src/components/auth/AuthPromptModal.jsx` | `src/components/auth/AuthPromptModal.jsx` | ✅ verified match | Ported from Vite |
| `src/components/auth/OtpInput.jsx` | `src/components/auth/OtpInput.jsx` | ✅ verified match | Identical content |
| `src/components/auth/registration/InterestPicker.jsx` | `src/components/auth/registration/InterestPicker.jsx` | ✅ verified match | Identical content |
| `src/components/auth/registration/ProfilePreviewCard.jsx` | `src/components/auth/registration/ProfilePreviewCard.jsx` | ✅ verified match | Identical content |
| `src/components/auth/registration/StepProgressBar.jsx` | `src/components/auth/registration/StepProgressBar.jsx` | ✅ verified match | Identical content |
| `src/components/common/LazyImage.jsx` | `src/components/common/LazyImage.jsx` | ✅ verified match | Ported from Vite |
| `src/components/layout/AuthTerminalLayout.jsx` | `src/components/layout/AuthTerminalLayout.jsx` | ✅ verified match | Identical content |
| `src/components/layout/BottomNav.jsx` | `src/components/layout/BottomNav.jsx` | ✅ verified match | Identical content |
| `src/components/layout/CardGrid.jsx` | `src/components/layout/CardGrid.jsx` | ✅ verified match | Identical content |
| `src/components/layout/Footer.jsx` | `src/components/layout/Footer.jsx` | ✅ verified match | Identical content |
| `src/components/layout/MobileBottomNav.jsx` | `src/components/layout/MobileBottomNav.jsx` | ✅ verified match | Merged floating plus overlay with sliding transitions |
| `src/components/layout/Navbar.jsx` | `src/components/layout/Navbar.jsx` | ✅ verified match | Updated with autocomplete search suggestions and dropdown |
| `src/components/layout/PageWrapper.jsx` | `src/components/layout/PageWrapper.jsx` | ✅ verified match | Identical content |
| `src/components/layout/SidebarRail.jsx` | `src/components/layout/SidebarRail.jsx` | ✅ verified match | Identical content |
| `src/components/layout/TwoColumn.jsx` | `src/components/layout/TwoColumn.jsx` | ✅ verified match | Identical content |
| `src/components/people/PeopleCards.jsx` | `src/components/people/PeopleCards.jsx` | ✅ verified match | Overwritten with Vite's card styles, roles, and LazyImage |
| `src/components/posts/PostCard.jsx` | `src/components/posts/PostCard.jsx` | ✅ verified match | Identical content |
| `src/components/posts/PostFilter.jsx` | `src/components/posts/PostFilter.jsx` | ✅ verified match | Identical content |
| `src/components/posts/SocialPostLayout.jsx` | `src/components/posts/SocialPostLayout.jsx` | ✅ verified match | Identical content |
| `src/components/profile/DesktopProfile.jsx` | `src/components/profile/DesktopProfile.jsx` | ✅ verified match | Identical content |
| `src/components/profile/DeveloperCard.jsx` | `src/components/profile/DeveloperCard.jsx` | ✅ verified match | Identical content |
| `src/components/profile/MobileProfile.jsx` | `src/components/profile/MobileProfile.jsx` | ✅ verified match | Identical content |
| `src/components/seo/NoIndex.jsx` | `src/components/seo/NoIndex.jsx` | ✅ verified match | Identical content |
| `src/components/shared/GlobalStyles.jsx` | `src/components/shared/GlobalStyles.jsx` | ✅ verified match | Identical content |
| `src/components/stories/StoryBar.jsx` | `src/components/stories/StoryBar.jsx` | ✅ verified match | Identical content |
| `src/components/stories/StoryModal.jsx` | `src/components/stories/StoryModal.jsx` | ✅ verified match | Identical content |
| `src/components/ui/Avatar.jsx` | `src/components/ui/Avatar.jsx` | ✅ verified match | Identical content |
| `src/components/ui/Badge.jsx` | `src/components/ui/Badge.jsx` | ✅ verified match | Identical content |
| `src/components/ui/CommentSheet.jsx` | `src/components/ui/CommentSheet.jsx` | ✅ verified match | Ported from Vite |
| `src/components/ui/Modal.jsx` | `src/components/ui/Modal.jsx` | ✅ verified match | Identical content |
| `src/components/ui/Skeleton.jsx` | `src/components/ui/Skeleton.jsx` | ✅ verified match | Identical content |
| `src/components/videos/Read.md` | `src/components/videos/Read.md` | ✅ verified match | Identical content |
| `src/components/videos/RecommendedVideos.jsx` | `src/components/videos/RecommendedVideos.jsx` | ✅ verified match | Identical content |
| `src/components/videos/VideoCard.jsx` | `src/components/videos/VideoCard.jsx` | ✅ verified match | Overwritten with Vite's LazyImage and verified indicators |
| `src/components/videos/VideoComments.jsx` | `src/components/videos/VideoComments.jsx` | ✅ verified match | Identical content |
| `src/components/videos/VideoDetailPage.jsx` | `src/components/videos/VideoDetailPage.jsx` | ✅ verified match | Identical content |
| `src/components/videos/VideoDiscoveryBlock.jsx` | `src/components/videos/VideoDiscoveryBlock.jsx` | ✅ verified match | Overwritten with Vite's SectionHeader and list split |
| `src/components/videos/VideoShortsRow.jsx` | `src/components/videos/VideoShortsRow.jsx` | ✅ verified match | Overwritten with Vite's variant parameter and responsive styles |
| `src/constants/registration.js` | `src/constants/registration.js` | ✅ verified match | Identical content |
| `src/context/AuthContext.jsx` | `src/context/AuthContext.jsx` | ✅ verified match | Identical content |
| `src/context/ThemeContext.jsx` | `src/context/ThemeContext.jsx` | ✅ verified match | Next.js hydration/window check adaptation |
| `src/context/ToastContext.jsx` | `src/context/ToastContext.jsx` | ✅ verified match | Identical content |
| `src/hooks/useAnalytics.js` | `src/hooks/useAnalytics.js` | ✅ verified match | Identical content |
| `src/hooks/useMediaQuery.js` | `src/hooks/useMediaQuery.js` | ✅ verified match | Next.js window guard adaptation |
| `src/hooks/useWindowWidth.js` | `src/hooks/useWindowWidth.js` | ✅ verified match | Identical content |
| `src/index.css` | `src/index.css` | ✅ verified match | Identical content |
| `src/logo.png` | `src/logo.png` | ✅ verified match | Identical content |
| `src/main.jsx` | `src/main.jsx` | ✅ verified match | Identical content |
| `src/pages/CreatorDashboard.jsx` | `src/views/CreatorDashboard.jsx` | ✅ verified match | Identical content |
| `src/pages/DM.jsx` | `src/views/DM.jsx` | ✅ verified match | Identical content |
| `src/pages/Explore.jsx` | `src/views/Explore.jsx` | ✅ verified match | Matched horizontal cards and multi-row layout |
| `src/pages/Feed.jsx` | `src/views/Feed.jsx` | ✅ verified match | Identical content |
| `src/pages/Landing.jsx` | `src/views/Landing.jsx` | ✅ verified match | Identical content |
| `src/pages/NewPost.jsx` | `src/views/NewPost.jsx` | ✅ verified match | Identical content |
| `src/pages/Notifications.jsx` | `src/views/Notifications.jsx` | ✅ verified match | Identical content |
| `src/pages/PostDetail.jsx` | `src/views/PostDetail.jsx` | ✅ verified match | Identical content |
| `src/pages/PublicProfile.jsx` | `src/views/PublicProfile.jsx` | ✅ verified match | Identical content |
| `src/pages/SearchPage.jsx` | `src/views/SearchPage.jsx` | ✅ verified match | Ported from Vite |
| `src/pages/Settings.jsx` | `src/views/Settings.jsx` | ✅ verified match | Identical content |
| `src/pages/ShortsPage.jsx` | `src/views/ShortsPage.jsx` | ✅ verified match | Identical content |
| `src/pages/Social.jsx` | `src/views/Social.jsx` | ✅ verified match | Matched active architects inside MobileChatView |
| `src/pages/Static.jsx` | `src/views/Static.jsx` | ✅ verified match | Identical content |
| `src/pages/StubPages.jsx` | `src/views/StubPages.jsx` | ✅ verified match | Identical content |
| `src/pages/VideoDetailPage.jsx` | `src/views/VideoDetailPage.jsx` | ✅ verified match | Identical content |
| `src/pages/VideosPage.jsx` | `src/views/VideosPage.jsx` | ✅ verified match | Identical content |
| `src/pages/auth/ForgotPassword.jsx` | `src/views/auth/ForgotPassword.jsx` | ✅ verified match | Identical content |
| `src/pages/auth/Login.jsx` | `src/views/auth/Login.jsx` | ✅ verified match | Identical content |
| `src/pages/auth/RecoveryFlow.jsx` | `src/views/auth/RecoveryFlow.jsx` | ✅ verified match | Identical content |
| `src/pages/auth/Register.jsx` | `src/views/auth/Register.jsx` | ✅ verified match | Identical content |
| `src/pages/auth/RegisterFlow.jsx` | `src/views/auth/RegisterFlow.jsx` | ✅ verified match | Identical content |
| `src/pages/auth/ResetPassword.jsx` | `src/views/auth/ResetPassword.jsx` | ✅ verified match | Identical content |
| `src/pages/public/ArticlePage.jsx` | `src/views/public/ArticlePage.jsx` | ✅ verified match | Identical content |
| `src/pages/public/layouts/SingleColumnLayout.jsx` | `src/views/public/layouts/SingleColumnLayout.jsx` | ✅ verified match | Identical content |
| `src/pages/public/layouts/ThreeColumnLayout.jsx` | `src/views/public/layouts/ThreeColumnLayout.jsx` | ✅ verified match | Identical content |
| `src/pages/public/layouts/TwoColumnLayout.jsx` | `src/views/public/layouts/TwoColumnLayout.jsx` | ✅ verified match | Identical content |
| `src/pages/public/panels/CourseRightPanel.jsx` | `src/views/public/panels/CourseRightPanel.jsx` | ✅ verified match | Identical content |
| `src/pages/public/panels/DocumentRightPanel.jsx` | `src/views/public/panels/DocumentRightPanel.jsx` | ✅ verified match | Identical content |
| `src/pages/public/panels/ProjectRightPanel.jsx` | `src/views/public/panels/ProjectRightPanel.jsx` | ✅ verified match | Identical content |
| `src/pages/public/panels/RepoRightPanel.jsx` | `src/views/public/panels/RepoRightPanel.jsx` | ✅ verified match | Identical content |
| `src/pages/public/panels/ResourceRightPanel.jsx` | `src/views/public/panels/ResourceRightPanel.jsx` | ✅ verified match | Identical content |
| `src/pages/public/panels/RoadmapRightPanel.jsx` | `src/views/public/panels/RoadmapRightPanel.jsx` | ✅ verified match | Identical content |
| `src/pages/public/panels/ToolkitRightPanel.jsx` | `src/views/public/panels/ToolkitRightPanel.jsx` | ✅ verified match | Identical content |
| `src/styles/Profile.css` | `src/styles/Profile.css` | ✅ verified match | Identical content |
| `src/styles/responsive.css` | `src/styles/responsive.css` | ✅ verified match | Identical content |
| `src/styles/tokens.css` | `src/styles/tokens.css` | ✅ verified match | Identical content |
| `src/styles/tokens.js` | `src/styles/tokens.js` | ✅ verified match | Identical content |
| `src/utils/.md` | `src/utils/.md` | ✅ verified match | Identical content |
| `src/utils/videoEmbed.js` | `src/utils/videoEmbed.js` | ✅ verified match | Identical content |

## Stale / Duplicate Directories & Cruft (Needs Human Review)

These directories were detected in the codebase/repository history and require human review. They are marked as `❓ needs human review`.

### 1. `src/pages-src` (Stale Duplicate)
Detected in `cpa-nextjs-deploy` repository. Stale duplicate of `src/views`.

Files found in deploy repo:
- `src/pages-src/CreatorDashboard.jsx`
- `src/pages-src/DM.jsx`
- `src/pages-src/Explore.jsx`
- `src/pages-src/Feed.jsx`
- `src/pages-src/Landing.jsx`
- `src/pages-src/NewPost.jsx`
- `src/pages-src/Notifications.jsx`
- `src/pages-src/PostDetail.jsx`
- `src/pages-src/PublicProfile.jsx`
- `src/pages-src/Settings.jsx`
- `src/pages-src/Social.jsx`
- `src/pages-src/Static.jsx`
- `src/pages-src/StubPages.jsx`
- `src/pages-src/VideoDetailPage.jsx`
- `src/pages-src/VideosPage.jsx`
- `src/pages-src/auth/ForgotPassword.jsx`
- `src/pages-src/auth/Login.jsx`
- `src/pages-src/auth/RecoveryFlow.jsx`
- `src/pages-src/auth/Register.jsx`
- `src/pages-src/auth/ResetPassword.jsx`
- `src/pages-src/public/ArticlePage.jsx`
- `src/pages-src/public/layouts/SingleColumnLayout.jsx`
- `src/pages-src/public/layouts/ThreeColumnLayout.jsx`
- `src/pages-src/public/layouts/TwoColumnLayout.jsx`
- `src/pages-src/public/panels/CourseRightPanel.jsx`
- `src/pages-src/public/panels/DocumentRightPanel.jsx`
- `src/pages-src/public/panels/ProjectRightPanel.jsx`
- `src/pages-src/public/panels/RepoRightPanel.jsx`
- `src/pages-src/public/panels/ResourceRightPanel.jsx`
- `src/pages-src/public/panels/RoadmapRightPanel.jsx`
- `src/pages-src/public/panels/ToolkitRightPanel.jsx`

### 2. `src/app` (Parallel app Directory)
Detected in `cpa-nextjs-deploy` repository. Parallel app directory containing duplicate routes.

Files found in deploy repo:
- `src/app/.md`
- `src/app/client-providers.jsx`
- `src/app/error.jsx`
- `src/app/layout.jsx`
- `src/app/not-found.jsx`
- `src/app/page.jsx`
- `src/app/providers.jsx`
- `src/app/activity/[id]/page.jsx`
- `src/app/articles/[slug]/page.jsx`
- `src/app/courses/[slug]/page.jsx`
- `src/app/creator/dashboard/page.jsx`
- `src/app/direct/inbox/page.jsx`
- `src/app/direct/[conversationId]/page.jsx`
- `src/app/explore/page.jsx`
- `src/app/faq/page.jsx`
- `src/app/feed/page.jsx`
- `src/app/forgot-password/page.jsx`
- `src/app/login/page.jsx`
- `src/app/messages/page.jsx`
- `src/app/network/page.jsx`
- `src/app/notifications/page.jsx`
- `src/app/posts/new/page.jsx`
- `src/app/posts/[id]/page.jsx`
- `src/app/privacy/page.jsx`
- `src/app/register/page.jsx`
- `src/app/reset-password/page.jsx`
- `src/app/resources/[slug]/page.jsx`
- `src/app/saved/page.jsx`
- `src/app/settings/page.jsx`
- `src/app/support/page.jsx`
- `src/app/terms/page.jsx`
- `src/app/u/[username]/page.jsx`
- `src/app/u/[username]/articles/[slug]/page.jsx`
- `src/app/u/[username]/courses/[slug]/page.jsx`
- `src/app/u/[username]/dev/page.jsx`
- `src/app/u/[username]/followers/page.jsx`
- `src/app/u/[username]/following/page.jsx`
- `src/app/u/[username]/resources/[slug]/page.jsx`
- `src/app/videos/page.jsx`
- `src/app/videos/[id]/page.jsx`
