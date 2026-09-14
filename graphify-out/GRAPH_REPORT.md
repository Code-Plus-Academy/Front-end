# Graph Report - Front-end  (2026-08-25)

## Corpus Check
- 409 files · ~475,056 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3415 nodes · 7194 edges · 197 communities (123 shown, 74 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 288 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Module 0
- Module 1
- Module 2
- Module 3
- Module 4
- Module 5
- Module 6
- Module 7
- Module 8
- Module 9
- Module 10
- Module 11
- Module 12
- Module 13
- Module 14
- Module 15
- Module 16
- Module 17
- Module 18
- Module 19
- Module 20
- Module 21
- Module 22
- Module 23
- Module 24
- Module 25
- Module 26
- Module 27
- Module 28
- Module 29
- Module 30
- Module 31
- Module 32
- Module 33
- Module 34
- Module 35
- Module 36
- Module 37
- Module 38
- Module 39
- Module 40
- Module 41
- Module 42
- Module 43
- Module 44
- Module 45
- Module 46
- Module 47
- Module 48
- Module 49
- Module 50
- Module 51
- Module 52
- Module 53
- Module 54
- Module 55
- Module 56
- Module 57
- Module 58
- Module 59
- Module 60
- Module 61
- Module 62
- Module 63
- Module 64
- Module 65
- Module 66
- Module 67
- Module 68
- Module 69
- Module 70
- Module 71
- Module 72
- Module 73
- Module 74
- Module 75
- Module 76
- Module 77
- Module 78
- Module 79
- Module 80
- Module 81
- Module 82
- Module 83
- Module 84
- Module 85
- Module 86
- Module 87
- Module 88
- Module 89
- Module 90
- Module 91
- Module 93
- Module 94
- Module 95
- Module 96
- Module 97
- Module 98
- Module 99
- Module 100
- Module 101
- Module 102
- Module 103
- Module 104
- Module 105
- Module 106
- Module 107
- Module 108
- Module 109
- Module 111
- Module 112
- Module 113
- Module 114
- Module 115
- Module 116
- Module 117
- Module 118
- Module 119
- Module 121
- Module 122
- Module 123
- Module 124
- Module 125
- Module 126
- Module 128
- Module 129
- Module 130
- Module 131
- Module 132
- Module 133
- Module 136
- Module 137
- Module 138
- Module 139
- Module 140
- Module 141
- Module 142
- Module 143
- Module 144
- Module 145
- Module 146
- Module 147
- Module 167
- Module 168
- Module 169
- Module 170
- Module 171
- Module 172
- Module 173
- Module 174
- Module 175
- Module 176
- Module 177
- Module 178
- Module 179
- Module 180
- Module 181
- Module 182
- Module 183
- Module 184
- Module 185
- Module 186
- Module 187
- Module 193

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 135 edges
2. `copy()` - 124 edges
3. `zt` - 74 edges
4. `api` - 72 edges
5. `useTheme()` - 71 edges
6. `queryTable()` - 55 edges
7. `yt` - 54 edges
8. `AppLayout()` - 52 edges
9. `Ct` - 51 edges
10. `qs` - 45 edges

## Surprising Connections (you probably didn't know these)
- `AudienceShowcase()` --calls--> `useAuth()`  [EXTRACTED]
  app/landing-page.tsx → src/context/AuthContext.jsx
- `GET()` --calls--> `queryTable()`  [EXTRACTED]
  app/api/colleges/[collegeId]/courses/[courseId]/semesters/[semesterId]/notes/route.js → src/lib/supabaseContent.js
- `getNoteByIdOrSlug()` --calls--> `queryTable()`  [EXTRACTED]
  app/api/download/[noteId]/route.js → src/lib/supabaseContent.js
- `POST()` --calls--> `fetchApi()`  [EXTRACTED]
  app/api/notes/[noteId]/bookmark/route.js → src/utils/notesApi.js
- `POST()` --calls--> `fetchApi()`  [EXTRACTED]
  app/api/notes/[noteId]/download/route.js → src/utils/notesApi.js

## Import Cycles
- None detected.

## Communities (197 total, 74 thin omitted)

### Community 0 - "Module 0"
Cohesion: 0.03
Nodes (40): metadata, metadata, metadata, metadata, metadata, metadata, metadata, metadata (+32 more)

### Community 1 - "Module 1"
Cohesion: 0.05
Nodes (45): api, AUTH_EXPLICIT_ENDPOINTS, baseApiUrl, ERROR_MAP, failedQueue, Feed, ThemeAwareApp(), AuthPromptModal() (+37 more)

### Community 2 - "Module 2"
Cohesion: 0.02
Nodes (35): ao, Ca, cn, co, di, dn, el(), fn (+27 more)

### Community 3 - "Module 3"
Cohesion: 0.07
Nodes (11): bs(), clone(), copy(), ea, S(), No, ut(), s() (+3 more)

### Community 4 - "Module 4"
Cohesion: 0.07
Nodes (45): ApplicationStatusPage(), CareerPage(), PositionApplyPage(), safeStatus(), STATUS_INT_MAP, LazyImage(), Navbar(), UserMenuDropdown() (+37 more)

### Community 5 - "Module 5"
Cohesion: 0.05
Nodes (42): LinkPreviewCard(), LinkPreviewSkeleton(), extractFirstUrl(), inputUrlCache, MessageInput(), ALL_EMOJI_CATEGORIES, CATEGORY_ICONS, WhatsAppEmojiPicker() (+34 more)

### Community 6 - "Module 6"
Cohesion: 0.07
Nodes (46): MainAppContent(), CpaLogo(), CpaLogoProps, ExploreHubSpotlight(), Footer(), FooterProps, Hero(), HeroProps (+38 more)

### Community 7 - "Module 7"
Cohesion: 0.07
Nodes (7): _a(), jh(), jn(), ra, ro(), setFromCamera(), xa

### Community 8 - "Module 8"
Cohesion: 0.05
Nodes (3): Eh, Ot, Ht()

### Community 9 - "Module 9"
Cohesion: 0.04
Nodes (6): de, gs(), M(), ti, updateMatrixWorld(), yc

### Community 10 - "Module 10"
Cohesion: 0.10
Nodes (35): SavedArticleCard(), SavedCourseCard(), SavedNoteCard(), SavedPostCard(), SavedSnippetCard(), formatDuration(), SavedVideoCard(), CompositeCoverCard() (+27 more)

### Community 12 - "Module 12"
Cohesion: 0.05
Nodes (27): generateMetadata(), getArticle(), Page(), safeJsonLd(), CoursePage(), generateMetadata(), getCourse(), generateMetadata() (+19 more)

### Community 13 - "Module 13"
Cohesion: 0.07
Nodes (32): generateMetadata(), getUserProfile(), Page(), safeIsoDate(), safeJsonLd(), PublicProfile, DesktopProfile(), getSocialLinks() (+24 more)

### Community 14 - "Module 14"
Cohesion: 0.06
Nodes (32): generateMetadata(), getPost(), Page(), PostDetail, VideoDetailPage, colorForName(), CommentMenu(), CommentRow() (+24 more)

### Community 18 - "Module 18"
Cohesion: 0.07
Nodes (3): Kt(), ue, Ye

### Community 19 - "Module 19"
Cohesion: 0.09
Nodes (31): CollegeProfilePage(), dynamic, generateMetadata(), CollegePyqPage(), dynamic, generateMetadata(), getCollegePyqs(), dynamic (+23 more)

### Community 20 - "Module 20"
Cohesion: 0.07
Nodes (3): Fe, mc, qn

### Community 21 - "Module 21"
Cohesion: 0.07
Nodes (16): al(), cl(), dl(), hl(), il(), jo(), ko, nl() (+8 more)

### Community 22 - "Module 22"
Cohesion: 0.09
Nodes (7): bt(), en(), v(), nr(), p(), tr(), i()

### Community 23 - "Module 23"
Cohesion: 0.08
Nodes (23): metadata, AppRoutes(), Explore, PrivateRoute(), ProfessionalRoute(), PublicOnlyRoute(), Register, Settings (+15 more)

### Community 24 - "Module 24"
Cohesion: 0.15
Nodes (23): c(), l(), o(), constructor(), t(), gi(), p(), o() (+15 more)

### Community 25 - "Module 25"
Cohesion: 0.06
Nodes (8): Do, r(), ll(), Mh, nc(), pc, rc, za

### Community 26 - "Module 26"
Cohesion: 0.11
Nodes (29): createNote(), deleteNoteAction(), getUniversityIdForCollege(), isValidUuid(), KNOWN_COLLEGE_MAP, KNOWN_COURSE_MAP, KNOWN_FIELD_MAP, KNOWN_TOPIC_MAP (+21 more)

### Community 27 - "Module 27"
Cohesion: 0.11
Nodes (24): dynamic, GET(), getNoteByIdOrSlug(), incrementDownloadCounter(), POST(), POST(), POST(), GET() (+16 more)

### Community 28 - "Module 28"
Cohesion: 0.07
Nodes (19): Appearance(), createImage(), DangerZone(), EditProfile(), getCroppedImg(), I, Input(), inputStyle() (+11 more)

### Community 29 - "Module 29"
Cohesion: 0.08
Nodes (5): gl(), ho, ml, _o, l()

### Community 30 - "Module 30"
Cohesion: 0.12
Nodes (27): ks(), j(), k(), U(), W(), mt(), J(), Mt() (+19 more)

### Community 31 - "Module 31"
Cohesion: 0.06
Nodes (5): card, ICON_MAP, LAYOUT_MAP, tag, tagGreen

### Community 32 - "Module 32"
Cohesion: 0.09
Nodes (19): metadata, LottieSearchLoader(), ArticleCard(), CHIP_MAP, CHIPS, COVER_GRAD, coverGrad(), Explore() (+11 more)

### Community 33 - "Module 33"
Cohesion: 0.10
Nodes (29): EditPost, NewPost, CodeSnippetCard(), detectLanguage(), extractCodeBlock(), highlightCode(), CODE_LANGUAGES, EditPost() (+21 more)

### Community 34 - "Module 34"
Cohesion: 0.08
Nodes (15): dispose(), ir(), s(), It, ji(), a(), o(), Mi() (+7 more)

### Community 35 - "Module 35"
Cohesion: 0.12
Nodes (23): animationLoop(), applyCanvasStyles(), constructor(), d, destroy(), getCanvasElement(), getCanvasRect(), i() (+15 more)

### Community 36 - "Module 36"
Cohesion: 0.06
Nodes (15): CreatorDashboard, ACTIVITY_ITEMS, AI_TIPS, CHART_DS, CHART_LABELS, COMMUNITY_ITEMS, Icons, METRICS (+7 more)

### Community 37 - "Module 37"
Cohesion: 0.09
Nodes (13): as(), Et, qs, Bt(), Et(), Ft(), Nt(), Ot() (+5 more)

### Community 38 - "Module 38"
Cohesion: 0.13
Nodes (22): animationLoop(), applyCanvasStyles(), constructor(), d, destroy(), getCanvasElement(), getCanvasRect(), init() (+14 more)

### Community 39 - "Module 39"
Cohesion: 0.14
Nodes (7): ac, dc, lc, load(), loadAsync(), zc, e()

### Community 40 - "Module 40"
Cohesion: 0.07
Nodes (3): cc, fl(), rh

### Community 41 - "Module 41"
Cohesion: 0.07
Nodes (3): ie, lo, oo

### Community 42 - "Module 42"
Cohesion: 0.07
Nodes (10): Ga, Ka, ol(), sa, sn, ul(), Xn(), yn (+2 more)

### Community 43 - "Module 43"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 47 - "Module 47"
Cohesion: 0.16
Nodes (18): v(), y(), d(), u(), y(), x(), R(), m() (+10 more)

### Community 48 - "Module 48"
Cohesion: 0.13
Nodes (20): getErrorMessage(), InterestPicker(), initials(), ProfilePreviewCard(), StepProgressBar(), STEPS, ACCOUNT_TYPES, EMAIL_REGEX (+12 more)

### Community 49 - "Module 49"
Cohesion: 0.13
Nodes (19): CollegeHubClient(), getCleanHandle(), SEMESTER_FILTERS, SUBJECT_FILTERS, YEAR_FILTERS, dynamic, generateMetadata(), getTopicData() (+11 more)

### Community 50 - "Module 50"
Cohesion: 0.10
Nodes (10): generateMetadata(), getShort(), ShortsPage, BottomCaption(), fmtN(), PMETA, ShortsPage(), SideRail() (+2 more)

### Community 51 - "Module 51"
Cohesion: 0.10
Nodes (13): AudienceShowcase(), CountdownTimer(), fadeUp, FEATURES, LandingPage(), stagger, T, TerminalLine (+5 more)

### Community 52 - "Module 52"
Cohesion: 0.14
Nodes (9): metadata, Login, RecoveryFlow, OtpInput(), AuthTerminalLayout(), PublicOnlyRoute(), VantaNetBackground(), Login() (+1 more)

### Community 54 - "Module 54"
Cohesion: 0.11
Nodes (8): C(), D(), L(), O(), C(), we, xs(), ys()

### Community 57 - "Module 57"
Cohesion: 0.16
Nodes (17): dynamic, GET(), GET(), CourseOverviewPage(), dynamic, generateMetadata(), dynamic, generateMetadata() (+9 more)

### Community 58 - "Module 58"
Cohesion: 0.14
Nodes (14): bindSkeletons(), hc, Ic, parse(), parseAnimations(), parseAsync(), parseGeometries(), parseImages() (+6 more)

### Community 61 - "Module 61"
Cohesion: 0.10
Nodes (10): Landing, fadeUp, FEATURES, GLOW_COLORS, Landing(), stagger, TYPE_STYLE, useFeaturedCreators() (+2 more)

### Community 62 - "Module 62"
Cohesion: 0.12
Nodes (13): metadata, orgJsonLd, orgJsonLdString, viewport, Providers(), ConsentBanner(), RouterBridge(), ImmersiveChromeContext (+5 more)

### Community 63 - "Module 63"
Cohesion: 0.18
Nodes (19): durationToISO8601(), generateMetadata(), getVideo(), Page(), safeJsonLd(), detectPlatform(), getEmbedUrl(), isDirectVideo() (+11 more)

### Community 64 - "Module 64"
Cohesion: 0.18
Nodes (14): GET(), GET(), GET(), GET(), CollegesPage(), dynamic, getColleges(), metadata (+6 more)

### Community 65 - "Module 65"
Cohesion: 0.13
Nodes (11): catColor(), CATEGORY_COLORS, DescriptionCard(), DIFFICULTY_COLORS, PLATFORM_META, RESOURCE_ICONS, timeAgo(), useIsMobile() (+3 more)

### Community 67 - "Module 67"
Cohesion: 0.18
Nodes (13): dynamic, generateMetadata(), NoteRedirectPage(), dynamic, generateMetadata(), getNoteData(), ResourceDetailPage(), NoteTypeTag() (+5 more)

### Community 68 - "Module 68"
Cohesion: 0.19
Nodes (18): Ar(), br(), Cr(), er(), fr(), gr(), Hr(), kr() (+10 more)

### Community 69 - "Module 69"
Cohesion: 0.14
Nodes (3): ft(), na, ui()

### Community 72 - "Module 72"
Cohesion: 0.12
Nodes (6): CATEGORIES, fadeUp, QUERY_PILLS, RESOURCES, stagger, STATS

### Community 73 - "Module 73"
Cohesion: 0.14
Nodes (10): Notifications, normalizeNotif(), Notifications(), SYSTEM_TYPES, TABS, timeAgo(), TYPE_ACTION, TYPE_COLOR (+2 more)

### Community 74 - "Module 74"
Cohesion: 0.12
Nodes (17): axios, combined-stream, form-data, @grpc/proto-loader, dependencies, axios, combined-stream, form-data (+9 more)

### Community 75 - "Module 75"
Cohesion: 0.17
Nodes (12): dynamic, getHomeData(), getInitials(), INITIAL_STATS, metadata, MOCK_COLLEGES, MOCK_FIELDS, MOCK_NOTES (+4 more)

### Community 76 - "Module 76"
Cohesion: 0.17
Nodes (12): VideosPage, CARD_GRADS, CAT_COLORS, catColor(), CATEGORIES, DIFF_COLORS, DIFFICULTIES, ShortCard() (+4 more)

### Community 77 - "Module 77"
Cohesion: 0.16
Nodes (3): Go, lineTo(), moveTo()

### Community 78 - "Module 78"
Cohesion: 0.21
Nodes (12): backfill(), fetchAllPublishedArticles(), HEADERS, isPlaceholderOrEmpty(), patchArticle(), PLACEHOLDER_STRINGS, extractArticleMetadata(), isPlaceholderString() (+4 more)

### Community 79 - "Module 79"
Cohesion: 0.13
Nodes (15): devDependencies, tailwindcss, @tailwindcss/postcss, @types/dompurify, @types/node, @types/react, @types/react-dom, typescript (+7 more)

### Community 80 - "Module 80"
Cohesion: 0.15
Nodes (9): cs(), ds(), es(), fs(), hs(), ms(), os(), ps() (+1 more)

### Community 81 - "Module 81"
Cohesion: 0.13
Nodes (3): ql, vl, wl

### Community 82 - "Module 82"
Cohesion: 0.28
Nodes (10): TwoFactorModal(), enrollMFA(), generateBackupCodes(), getAAL(), getMFAFactors(), saveBackupCodesToServer(), unenrollMFA(), verifyBackupCodeOnServer() (+2 more)

### Community 83 - "Module 83"
Cohesion: 0.19
Nodes (10): POST(), GET(), client, createTicket(), __dirname, __filename, getUserStanding(), packageDefinition (+2 more)

### Community 84 - "Module 84"
Cohesion: 0.20
Nodes (12): displayFromSlug(), dynamic, generateMetadata(), getUniversityData(), UniversityDetailPage(), COLLEGE_CATEGORIES, getCleanHandle(), SEMESTER_FILTERS (+4 more)

### Community 86 - "Module 86"
Cohesion: 0.26
Nodes (6): SPPU_BSC_CS_NEP_SUBJECTS, SPPU_INFO, getFromCache(), memoryCache, SearchEngine, setToCache()

### Community 87 - "Module 87"
Cohesion: 0.17
Nodes (3): ht(), Lt, Rt()

### Community 88 - "Module 88"
Cohesion: 0.23
Nodes (11): contentStatusStore, __dirname, __filename, findContentBySourceUrl(), getContentSummary(), packageDefinition, PROTO_PATH, protoDescriptor (+3 more)

### Community 93 - "Module 93"
Cohesion: 0.33
Nodes (8): displayFromSlug(), dynamic, generateMetadata(), getUniversityPYQs(), slugify(), UniversityPYQPage(), slugify(), UniversityPYQClient()

### Community 94 - "Module 94"
Cohesion: 0.22
Nodes (5): bind(), getValue(), Nh, setValue(), zh()

### Community 96 - "Module 96"
Cohesion: 0.20
Nodes (9): capabilities, tools, description, name, $schema, transport, type, url (+1 more)

### Community 97 - "Module 97"
Cohesion: 0.20
Nodes (9): Note, NoteCollege, NoteCourse, NoteField, NoteScope, NoteStatus, NoteSubject, NoteTopic (+1 more)

### Community 98 - "Module 98"
Cohesion: 0.28
Nodes (7): dynamic, filterUrl(), NotesSearchPage(), searchNotes(), SEMESTERS, TYPE_LABELS, TYPE_MAP

### Community 99 - "Module 99"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, start, type, version

### Community 101 - "Module 101"
Cohesion: 0.50
Nodes (8): isChronologicallyValid(), isValidGrade(), isValidMonth(), isValidUrl(), isValidYear(), validateCertification(), validateEducation(), EducationCerts()

### Community 106 - "Module 106"
Cohesion: 0.25
Nodes (3): diff, diffPath, rawDiff

### Community 107 - "Module 107"
Cohesion: 0.36
Nodes (6): AnalyticsProvider(), gtag(), AnalyticsTracker(), CONTENT_GROUP_RULES, GA_MEASUREMENT_ID, resolveContentGroup()

### Community 112 - "Module 112"
Cohesion: 0.29
Nodes (3): difficultyMap, typeMap, variants

### Community 117 - "Module 117"
Cohesion: 0.40
Nodes (5): fetchHtml(), http, https, ROUTES_TO_TEST, verifySEO()

### Community 119 - "Module 119"
Cohesion: 0.60
Nodes (3): useWindowWidth(), ThreeColumnLayout(), TwoColumnLayout()

### Community 123 - "Module 123"
Cohesion: 0.40
Nodes (3): difficulties, languages, types

### Community 125 - "Module 125"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

### Community 126 - "Module 126"
Cohesion: 0.50
Nodes (3): __dirname, __filename, nextConfig

### Community 132 - "Module 132"
Cohesion: 0.50
Nodes (3): panelCard, RepoRightPanel(), tagPill

### Community 133 - "Module 133"
Cohesion: 0.50
Nodes (3): *.jpg, *.png, *.svg

## Knowledge Gaps
- **353 isolated node(s):** `metadata`, `dynamic`, `dynamic`, `dynamic`, `metadata` (+348 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Module 1` to `Module 0`, `Module 4`, `Module 5`, `Module 6`, `Module 10`, `Module 12`, `Module 13`, `Module 14`, `Module 23`, `Module 28`, `Module 32`, `Module 33`, `Module 48`, `Module 50`, `Module 51`, `Module 52`, `Module 61`, `Module 62`, `Module 73`, `Module 82`, `Module 107`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `api` connect `Module 1` to `Module 0`, `Module 4`, `Module 5`, `Module 6`, `Module 10`, `Module 12`, `Module 13`, `Module 14`, `Module 23`, `Module 28`, `Module 32`, `Module 33`, `Module 36`, `Module 48`, `Module 49`, `Module 51`, `Module 52`, `Module 61`, `Module 73`, `Module 76`, `Module 82`, `Module 124`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `queryTable()` connect `Module 19` to `Module 64`, `Module 98`, `Module 67`, `Module 75`, `Module 49`, `Module 84`, `Module 57`, `Module 26`, `Module 27`, `Module 93`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `metadata`, `dynamic`, `dynamic` to the rest of the system?**
  _353 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Module 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03397893306150187 - nodes in this community are weakly interconnected._
- **Should `Module 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04814599106969521 - nodes in this community are weakly interconnected._
- **Should `Module 2` be split into smaller, more focused modules?**
  _Cohesion score 0.022674146797568958 - nodes in this community are weakly interconnected._