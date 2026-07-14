# Graph Report - cpa-nextjs-deploy  (2026-07-11)

## Corpus Check
- 137 files · ~243,749 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 567 nodes · 691 edges · 25 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 158 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 48 edges
2. `useNavigate()` - 35 edges
3. `useTheme()` - 25 edges
4. `useLocation()` - 15 edges
5. `useParams()` - 10 edges
6. `detectPlatform()` - 10 edges
7. `useT()` - 10 edges
8. `Page()` - 9 edges
9. `getEmbedUrl()` - 8 edges
10. `Landing()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `CPACreatorCard()` --calls--> `useNavigate()`  [INFERRED]
  src\components\videos\VideoDetailPage.jsx → src\utils\routerShim.js
- `useAuth()` --calls--> `Professional()`  [INFERRED]
  src\context\AuthContext.jsx → src\views\Settings.jsx
- `useAuth()` --calls--> `DangerZone()`  [INFERRED]
  src\context\AuthContext.jsx → src\views\Settings.jsx
- `useAuth()` --calls--> `Logout()`  [INFERRED]
  src\context\AuthContext.jsx → src\views\Settings.jsx
- `useTheme()` --calls--> `CreatorDashboard()`  [INFERRED]
  src\context\ThemeContext.jsx → src\views\CreatorDashboard.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (26): VideoEmbedBlock(), detectPlatform(), getEmbedUrl(), isDirectVideo(), isHLS(), toInstagramEmbed(), toVimeoEmbed(), toYouTubeEmbed() (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (21): useAuth(), useAnalytics(), useDataLayer(), PrivateRoute(), ProfessionalRoute(), PublicOnlyRoute(), RegisterRoute(), DeveloperCard() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (11): Login(), BottomNav(), Navbar(), SidebarRail(), useLocation(), useParams(), ShortsPage(), ActivityResolver() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (20): AuthPromptModal(), PeopleCard(), TopProfileCard(), useT(), SocialPostLayout(), timeAgo(), MobileProfile(), useNavigate() (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (13): useImmersiveChrome(), MobileBottomNav(), colorForUser(), EmbeddedDM(), initials(), MentorChip(), MobileChatView(), Network() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (21): getSystemTheme(), resolveTheme(), ThemeProvider(), useTheme(), useIsDesktop(), useIsMobile(), useIsTablet(), useMediaQuery() (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (12): ArticleCard(), coverGrad(), Explore(), extractThumbnail(), fmtCount(), HeroCard(), LoginPromptModal(), Thumbnail() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (12): Appearance(), createImage(), DangerZone(), EditProfile(), getCroppedImg(), Input(), inputStyle(), Logout() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (1): CreatorDashboard()

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (8): catColor(), CPACreatorCard(), DescriptionCard(), OriginalCreatorCard(), timeAgo(), useIsMobile(), useT(), VideoDetailPage()

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (6): getErrorMessage(), RecoveryFlow(), apiErrorShape(), RegisterFlow(), AnalyticsTracker(), useSearchParams()

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (4): DesktopProfile(), handlePostClick(), handlePostClick(), Navigate()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (5): generateMetadata(), getArticle(), getCourse(), getResource(), Page()

### Community 14 - "Community 14"
Cohesion: 0.31
Nodes (6): getTokens(), Landing(), useFeaturedCreators(), useStats(), useSystemDark(), useTrendingPosts()

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (3): normalizeNotif(), Notifications(), timeAgo()

### Community 16 - "Community 16"
Cohesion: 0.48
Nodes (6): catColor(), ShortCard(), useDebounce(), useIsMobile(), useT(), VideosPage()

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (3): generateMetadata(), getPost(), Page()

### Community 18 - "Community 18"
Cohesion: 0.47
Nodes (4): CommentItem(), timeAgo(), useT(), VideoComments()

### Community 19 - "Community 19"
Cohesion: 0.47
Nodes (4): catColor(), ShortCard(), useT(), VideoShortsRow()

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (3): useWindowWidth(), ThreeColumnLayout(), TwoColumnLayout()

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (2): PostCard(), timeAgo()

### Community 24 - "Community 24"
Cohesion: 0.83
Nodes (3): generateMetadata(), getUserProfile(), Page()

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (1): Page()

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (2): fetchHtml(), verifySEO()

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (2): initials(), ProfilePreviewCard()

## Knowledge Gaps
- **Thin community `Community 9`** (18 nodes): `CreatorDashboard.jsx`, `Badge()`, `BarChart()`, `Counter()`, `CreatorDashboard()`, `Ic()`, `IconBox()`, `LineChart()`, `PageAnalytics()`, `PageCommunity()`, `PageContent()`, `PageHeader()`, `PageMore()`, `PageOverview()`, `SectionLabel()`, `Spark()`, `StatCard()`, `ToolPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (5 nodes): `MediaCarousel()`, `PostCard()`, `timeAgo()`, `TypeTag()`, `PostCard.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (3 nodes): `page.jsx`, `page.jsx`, `Page()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (3 nodes): `fetchHtml()`, `verify-seo.js`, `verifySEO()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (3 nodes): `initials()`, `ProfilePreviewCard()`, `ProfilePreviewCard.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 15`, `Community 18`, `Community 22`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `useNavigate()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 16`, `Community 19`, `Community 22`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `Community 6` to `Community 0`, `Community 2`, `Community 3`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 15`, `Community 16`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `useAuth()` (e.g. with `PrivateRoute()` and `ProfessionalRoute()`) actually correct?**
  _`useAuth()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `useNavigate()` (e.g. with `AuthPromptModal()` and `MobileBottomNav()`) actually correct?**
  _`useNavigate()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `useTheme()` (e.g. with `Navbar()` and `useT()`) actually correct?**
  _`useTheme()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `useLocation()` (e.g. with `PrivateRoute()` and `AppRoutes()`) actually correct?**
  _`useLocation()` has 14 INFERRED edges - model-reasoned connections that need verification._