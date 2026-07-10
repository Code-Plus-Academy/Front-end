import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import useAnalytics from './hooks/useAnalytics';

const VideoDetailPage = lazy(() => import('./views/VideoDetailPage'));
const VideosPage      = lazy(() => import('./views/VideosPage'));
const ShortsPage = lazy(() => import('./views/ShortsPage'));


// Layout
import Navbar from './components/layout/Navbar';
import SidebarRail from './components/layout/SidebarRail';
import BottomNav from './components/layout/BottomNav';
import Footer from './components/layout/Footer';

// Pages
const Landing = lazy(() => import('./views/Landing'));
const Register = lazy(() => import('./views/auth/Register'));
const Login = lazy(() => import('./views/auth/Login'));
const RecoveryFlow = lazy(() => import('./views/auth/RecoveryFlow'));
const Feed = lazy(() => import('./views/Feed'));
const PostDetail = lazy(() => import('./views/PostDetail'));
const NewPost = lazy(() => import('./views/NewPost'));
const PublicProfile = lazy(() => import('./views/PublicProfile'));
const CreatorDashboard = lazy(() => import('./views/CreatorDashboard'));
const Explore = lazy(() => import('./views/Explore'));
import { Network, Saved, Courses } from './views/Social';
const Notifications = lazy(() => import('./views/Notifications'));
import { DMThread } from './views/DM';
const Settings = lazy(() => import('./views/Settings'));
import { FAQ, Privacy, Terms, Support } from './views/Static';
import { DevProfile, Followers, Following, ArticleDetail, ResourceDetail, CourseDetail, ArticleUserDetail, ResourceUserDetail, CourseUserDetail, ActivityResolver } from './views/StubPages';


// Route guards
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

function ProfessionalRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.account_type === 'personal') return <Navigate to="/feed" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;
  return children;
}

function AppLayout({ children, hideNav = false, noPadding = false, profileLayout = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {!hideNav && <Navbar />}
      {!hideNav && <SidebarRail />}
      {/* Layouts that manage their own spacing pass noPadding=true */}
      <main style={{
        flex: 1,
        marginLeft: hideNav ? 0 : 96,
        marginTop: hideNav ? 0 : 64,
        ...(noPadding ? {} : (profileLayout ? { padding: 0 } : { padding: '16px 32px' })),
      }}>
        {noPadding ? children : (
          <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        )}
      </main>
      <style>{`
        @media(max-width: 768px) {
          main { margin-left: 0 !important; }
        }
        @media(max-width: 768px) {
          main:not(.no-pad) { padding: 0 !important; }
        }
        @media(min-width: 769px) and (max-width: 1024px) {
          main { margin-left: 96px !important; padding: ${noPadding ? '0' : (profileLayout ? '0' : '12px 16px')} !important; }
        }
      `}</style>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  // GA4 — fires page_view on every route change
  useAnalytics();

  useEffect(() => {
    // Capture inbound tracking parameter (Phase 1 spec)
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      sessionStorage.setItem('cpa_ref_source', ref);
    }
  }, [location.search]);

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <Routes>
        {/* Public Core */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><RecoveryFlow /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><RecoveryFlow /></PublicOnlyRoute>} />


        {/* V4.0 Profile Routes */}
        <Route path="/u/:username" element={<AppLayout profileLayout><PublicProfile /></AppLayout>} />
        <Route path="/u/:username/dev" element={<AppLayout profileLayout><DevProfile /></AppLayout>} />
        <Route path="/u/:username/followers" element={<AppLayout profileLayout><Followers /></AppLayout>} />
        <Route path="/u/:username/following" element={<AppLayout profileLayout><Following /></AppLayout>} />

        {/* V4.0 Content Routes (Guest / SEO) */}
        <Route path="/posts/:id" element={<AppLayout><PostDetail /></AppLayout>} />
        <Route path="/activity:id" element={<AppLayout><ActivityResolver /></AppLayout>} />
        <Route path="/articles/:slug" element={<AppLayout noPadding><ArticleDetail /></AppLayout>} />
        <Route path="/resources/:slug" element={<AppLayout noPadding><ResourceDetail /></AppLayout>} />
        <Route path="/courses/:slug" element={<AppLayout noPadding><CourseDetail /></AppLayout>} />

        {/* V4.0 Content Routes (User Namespace) */}
        <Route path="/u/:username/articles/:slug" element={<AppLayout noPadding><ArticleUserDetail /></AppLayout>} />
        <Route path="/u/:username/resources/:slug" element={<AppLayout noPadding><ResourceUserDetail /></AppLayout>} />
        <Route path="/u/:username/courses/:slug" element={<AppLayout noPadding><CourseUserDetail /></AppLayout>} />

        {/* Static */}
        <Route path="/faq" element={<AppLayout><FAQ /></AppLayout>} />
        <Route path="/privacy" element={<AppLayout><Privacy /></AppLayout>} />
        <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
        <Route path="/support" element={<AppLayout><Support /></AppLayout>} />

        {/* Private (Browsing) */}
        <Route path="/feed" element={<PrivateRoute><AppLayout><Feed /></AppLayout></PrivateRoute>} />
        <Route path="/explore" element={<AppLayout><Explore /></AppLayout>} />
        <Route path="/network" element={<PrivateRoute><AppLayout><Network /></AppLayout></PrivateRoute>} />
        {/* Legacy DM routes — redirect to canonical /network */}
        <Route path="/messages" element={<Navigate to="/network" replace />} />
        <Route path="/direct/inbox" element={<Navigate to="/network" replace />} />
        <Route path="/direct/:conversationId" element={<PrivateRoute><AppLayout><DMThread /></AppLayout></PrivateRoute>} />
        <Route path="/saved" element={<PrivateRoute><AppLayout><Saved /></AppLayout></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><AppLayout><Notifications /></AppLayout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><AppLayout><Settings /></AppLayout></PrivateRoute>} />



<Route path="/videos"     element={<PrivateRoute><AppLayout><VideosPage /></AppLayout></PrivateRoute>} />
<Route path="/videos/:id" element={<AppLayout><VideoDetailPage /></AppLayout>} />

<Route path="/shorts"     element={<ShortsPage />} />
<Route path="/shorts/:id" element={<ShortsPage />} />

        {/* Creator & Professional Only */}
        <Route path="/posts/new" element={<ProfessionalRoute><AppLayout><NewPost /></AppLayout></ProfessionalRoute>} />
        <Route path="/creator/dashboard" element={<ProfessionalRoute><AppLayout><CreatorDashboard /></AppLayout></ProfessionalRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/feed' : '/'} replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return <AppRoutes />;
}

