'use client';
import { useState, useEffect, useRef } from "react";
import { Helmet } from '../components/seo/HelmetShim';
import NoIndex from '../components/seo/NoIndex';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useTheme } from '../context/ThemeContext';

const TABS = ["All", "Mentions", "Likes", "Comments", "Follows", "Messages", "Articles", "Courses", "System"];

const NOTIFICATIONS_DATA = [
  { id: 1, type: "like", unread: true, time: "2m ago", avatar: "AS", avatarColor: "#7C3AED", message: "Aman Sharma liked your article", sub: "React vs Next.js in 2026", icon: "❤️", tab: "Likes", action: "View Post", thumb: true },
  { id: 2, type: "follow", unread: true, time: "5m ago", avatar: "RK", avatarColor: "#0EA5E9", message: "Riya Kulkarni followed you", sub: null, icon: "👤", tab: "Follows", action: "Follow Back" },
  { id: 3, type: "course", unread: true, time: "1h ago", avatar: null, avatarIcon: "📘", avatarColor: "#6366F1", message: "Course Update: Blockchain Masterclass", sub: "Module 5 — Smart Contracts Deep Dive is now live", icon: "📘", tab: "Courses", action: "Open Course" },
  { id: 4, type: "comment", unread: false, time: "3h ago", avatar: "PD", avatarColor: "#EC4899", message: "Priya Desai commented on your post", sub: "\"This breakdown is 🔥 — saved for later!\"", icon: "💬", tab: "Comments", action: "Reply" },
  { id: 5, type: "mention", unread: true, time: "4h ago", avatar: "VR", avatarColor: "#F59E0B", message: "Vivek Rao mentioned you in a thread", sub: "@sayaji check this architecture pattern for your StackNet", icon: "🔔", tab: "Mentions", action: "View Thread" },
  { id: 6, type: "article", unread: false, time: "6h ago", avatar: "KM", avatarColor: "#10B981", message: "New article from Kartik Mehta", sub: "\"Why Redis is Your Secret Weapon for SaaS Apps\"", icon: "📰", tab: "Articles", action: "Read Article", thumb: true },
  { id: 7, type: "message", unread: true, time: "8h ago", avatar: "SJ", avatarColor: "#8B5CF6", message: "Sanya Joshi sent you a message", sub: "Hey, can you review my project pitch?", icon: "💬", tab: "Messages", action: "Open Chat" },
  { id: 8, type: "mentor", unread: false, time: "1d ago", avatar: "NK", avatarColor: "#0EA5E9", message: "Mentor Nikhil Kumar replied to your question", sub: "Your JWT federated auth approach is solid. Here's what to improve...", icon: "🎓", tab: "Mentions", action: "View Reply" },
  { id: 9, type: "save", unread: false, time: "1d ago", avatar: "TG", avatarColor: "#F97316", message: "Tanvi Garg saved your resource", sub: "Meilisearch + Next.js Full Guide", icon: "🔖", tab: "Likes", action: "View Resource" },
  { id: 10, type: "certification", unread: true, time: "2d ago", avatar: null, avatarIcon: "🏆", avatarColor: "#F59E0B", message: "Certification Approved!", sub: "Your Full Stack Web Dev certificate is ready to download", icon: "🏆", tab: "System", action: "Download" },
  { id: 11, type: "system", unread: false, time: "2d ago", avatar: null, avatarIcon: "🛡️", avatarColor: "#6B7280", message: "New login from Pune, Maharashtra", sub: "Chrome · Android · If this wasn't you, secure your account", icon: "🛡️", tab: "System", action: "Review" },
  { id: 12, type: "weekly", unread: false, time: "3d ago", avatar: null, avatarIcon: "📊", avatarColor: "#7C3AED", message: "Your Weekly Insights Report is ready", sub: "847 profile views · 12 new followers · 3 articles trending", icon: "📊", tab: "System", action: "View Report" },
];

const SUGGESTED = [
  { name: "Arjun Dev", avatar: "AD", color: "#7C3AED", followers: "12.4K" },
  { name: "Meera Nair", avatar: "MN", color: "#0EA5E9", followers: "8.7K" },
  { name: "Zaid Khan", avatar: "ZK", color: "#10B981", followers: "21K" },
];

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export default function Notifications() {
  const [activeTab, setActiveTab]           = useState("All");
  const [notifications, setNotifications]   = useState(NOTIFICATIONS_DATA);
  const { resolvedTheme, toggleTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const [filterOpen, setFilterOpen]         = useState(false);
  const [toastVisible, setToastVisible]     = useState(false);
  const [swipedId, setSwipedId]             = useState(null);
  const [refreshing, setRefreshing]         = useState(false);
  const feedRef = useRef(null);
  const dm = darkMode;

  const unreadCount = notifications.filter(n => n.unread).length;
  const filtered    = activeTab === "All" ? notifications : notifications.filter(n => n.tab === activeTab);

  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, unread: false })));
  const markRead    = id => setNotifications(p => p.map(n => n.id === id ? { ...n, unread: false } : n));
  const dismiss     = id => setNotifications(p => p.filter(n => n.id !== id));

  const simulateNew = () => { setToastVisible(true); setTimeout(() => setToastVisible(false), 3000); };
  const handleRefresh = () => { setRefreshing(true); setTimeout(() => { setRefreshing(false); simulateNew(); }, 1200); };

  useEffect(() => { const t = setTimeout(simulateNew, 4000); return () => clearTimeout(t); }, []);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    .cpa-wrap {
      font-family: 'DM Sans', sans-serif;
      color: ${dm ? '#E2E8F4' : '#111827'};
      transition: background 0.3s, color 0.3s;
    }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #7C3AED55; border-radius: 4px; }

    .cpa-wrap { min-height: 100vh; background: ${dm ? '#07090E' : '#F1F3F7'}; transition: background 0.3s; }

    .refresh-bar {
      height: 2px;
      background: linear-gradient(90deg,#7C3AED,#0EA5E9,#7C3AED);
      background-size: 200% 100%;
      animation: shimmer 1s linear infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .toast {
      position: fixed; top: 16px; left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: ${dm ? 'rgba(12,16,26,0.96)' : 'rgba(255,255,255,0.97)'};
      border: 1px solid rgba(124,58,237,0.45);
      border-radius: 14px; padding: 11px 18px;
      display: flex; align-items: center; gap: 9px;
      font-size: 13px; font-weight: 500;
      color: ${dm ? '#E2E8F0' : '#1E293B'};
      box-shadow: 0 8px 32px rgba(124,58,237,0.22);
      z-index: 999; opacity: 0; pointer-events: none;
      backdrop-filter: blur(20px); white-space: nowrap;
      transition: opacity 0.3s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
    }
    .toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    .toast-dot { width: 7px; height: 7px; border-radius: 50%; background: #7C3AED; flex-shrink: 0; animation: pdot 1.6s infinite; }
    @keyframes pdot { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.5)} 50%{box-shadow:0 0 0 4px rgba(124,58,237,0)} }

    .desktop-layout { display: flex; max-width: 1080px; margin: 0 auto; }
    .main-feed-col { flex: 1; min-width: 0; }
    @media(min-width:768px) {
      .main-feed-col { border-right: 1px solid ${dm ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}; }
      .side-panel { display: flex !important; flex-direction: column; width: 268px; padding: 22px 18px; }
    }
    @media(max-width:767px) { .side-panel { display: none !important; } }

    .page-header { padding: 22px 20px 0; }
    .page-label { font-size: 11.5px; font-weight: 500; color: #7C3AED; letter-spacing: 1.2px; text-transform: uppercase; }
    .title-row { display: flex; align-items: center; justify-content: space-between; margin-top: 3px; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: ${dm ? '#F1F5F9' : '#0F172A'}; letter-spacing: -1px; line-height: 1; }

    .right-cluster { display: flex; align-items: center; gap: 7px; }

    .theme-toggle {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.25s; flex-shrink: 0;
    }
    .theme-toggle.dark {
      background: rgba(124,58,237,0.1);
      border: 1.5px solid rgba(124,58,237,0.55);
      color: #C4B5FD;
      box-shadow: 0 0 10px rgba(124,58,237,0.28), inset 0 0 8px rgba(124,58,237,0.08);
    }
    .theme-toggle.dark:hover { background: rgba(124,58,237,0.2); box-shadow: 0 0 18px rgba(124,58,237,0.45); }
    .theme-toggle.light {
      background: white; border: 1.5px solid rgba(124,58,237,0.4);
      color: #7C3AED; box-shadow: 0 2px 10px rgba(124,58,237,0.12);
    }
    .theme-toggle.light:hover { box-shadow: 0 3px 18px rgba(124,58,237,0.24); border-color: rgba(124,58,237,0.7); }
    .toggle-icon { display: flex; align-items: center; justify-content: center; transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }

    .header-btn {
      height: 30px; padding: 0 11px; border-radius: 8px;
      border: 1px solid ${dm ? 'rgba(124,58,237,0.22)' : 'rgba(124,58,237,0.18)'};
      background: ${dm ? 'rgba(124,58,237,0.07)' : 'white'};
      color: ${dm ? '#94A3B8' : '#64748B'};
      font-size: 11.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
      cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;
    }
    .header-btn:hover { border-color: #7C3AED; color: #A855F7; background: rgba(124,58,237,0.12); }
    .header-btn.icon-only { width: 30px; padding: 0; justify-content: center; }

    .unread-summary { margin-top: 9px; font-size: 12px; color: ${dm ? '#475569' : '#94A3B8'}; display: flex; align-items: center; gap: 6px; }
    .unread-dot-inline { width: 6px; height: 6px; border-radius: 50%; background: #7C3AED; display: inline-block; flex-shrink: 0; }

    .tabs-container {
      margin-top: 14px; padding: 0 20px 2px;
      display: flex; gap: 7px;
      overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
    }
    .tabs-container::-webkit-scrollbar { display: none; }
    .tab-pill {
      flex-shrink: 0; height: 32px; padding: 0 15px; border-radius: 100px;
      border: 1px solid ${dm ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'};
      background: ${dm ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
      color: ${dm ? '#64748B' : '#9CA3AF'};
      font-size: 12.5px; font-weight: 500; font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.22s; white-space: nowrap;
    }
    .tab-pill:hover { border-color: rgba(124,58,237,0.35); color: ${dm ? '#C4B5FD' : '#7C3AED'}; }
    .tab-pill.active {
      background: rgba(124,58,237,0.14);
      border-color: rgba(124,58,237,0.7);
      color: ${dm ? '#ffffff' : '#6D28D9'};
      box-shadow: 0 0 12px rgba(124,58,237,0.28), inset 0 0 6px rgba(124,58,237,0.07);
      font-weight: 600;
    }

    .section-divider {
      margin: 14px 20px 0; height: 1px;
      background: ${dm
        ? 'linear-gradient(90deg,rgba(124,58,237,0.25),rgba(14,165,233,0.1),transparent)'
        : 'linear-gradient(90deg,rgba(124,58,237,0.15),transparent)'};
    }

    .feed { padding: 10px 14px 32px; display: flex; flex-direction: column; gap: 7px; }
    .section-label {
      font-size: 10.5px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase;
      color: ${dm ? '#334155' : '#CBD5E1'}; padding: 6px 4px 2px; font-family: 'DM Sans', sans-serif;
    }

    .notif-card {
      position: relative; border-radius: 15px; padding: 13px;
      display: flex; gap: 11px; align-items: flex-start;
      cursor: pointer; border: 1px solid transparent;
      animation: fsi 0.32s ease both; overflow: hidden;
      transition: border-color 0.2s, background 0.2s, transform 0.25s;
    }
    @keyframes fsi { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
    .notif-card.unread {
      background: ${dm ? 'rgba(124,58,237,0.065)' : 'rgba(124,58,237,0.04)'};
      border-color: ${dm ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.14)'};
    }
    .notif-card.read {
      background: ${dm ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.92)'};
      border-color: ${dm ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.065)'};
    }
    .notif-card:hover { border-color: rgba(124,58,237,0.35) !important; background: ${dm ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)'} !important; transform: translateY(-1px) !important; }
    .notif-card.unread::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#7C3AED,#0EA5E9); border-radius:4px 0 0 4px; }

    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar { width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:white;font-family:'Syne',sans-serif; }
    .avatar-icon { width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:19px; }
    .unread-dot { position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#7C3AED;border:2px solid ${dm ? '#07090E' : '#F1F3F7'};animation:pdot 2s infinite; }

    .notif-content { flex:1;min-width:0; }
    .notif-message { font-size:13.5px;font-weight:500;color:${dm ? '#E2E8F0' : '#1E293B'};line-height:1.4; }
    .notif-sub { font-size:12px;color:${dm ? '#64748B' : '#9CA3AF'};margin-top:2px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .notif-bottom { display:flex;align-items:center;gap:7px;margin-top:7px;flex-wrap:wrap; }
    .notif-time { font-size:11px;color:${dm ? '#3D4F63' : '#CBD5E1'};font-weight:400; }

    .action-btn { height:25px;padding:0 11px;border-radius:7px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;transition:all 0.18s; }
    .action-btn.primary { background:rgba(124,58,237,0.13);border:1px solid rgba(124,58,237,0.32);color:#A855F7; }
    .action-btn.primary:hover { background:rgba(124,58,237,0.28);color:white; }

    .notif-thumb { width:44px;height:44px;border-radius:11px;background:${dm ? 'linear-gradient(135deg,rgba(124,58,237,0.28),rgba(14,165,233,0.25))' : 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(14,165,233,0.1))'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid rgba(124,58,237,0.17); }

    .swipe-actions { position:absolute;right:0;top:0;bottom:0;display:flex;align-items:center;border-radius:0 15px 15px 0;overflow:hidden; }
    .swipe-btn { height:100%;width:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;cursor:pointer;gap:3px;transition:all 0.15s; }
    .swipe-btn.check { background:rgba(16,185,129,0.85);color:white; }
    .swipe-btn.delete { background:rgba(239,68,68,0.85);color:white; }

    .empty-state { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 24px;text-align:center;gap:14px; }
    .empty-bell { font-size:48px;animation:bring 3s ease-in-out infinite; }
    @keyframes bring { 0%,100%{transform:rotate(0)} 10%,30%{transform:rotate(-10deg)} 20%{transform:rotate(10deg)} 40%{transform:rotate(0)} }
    .empty-title { font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:${dm ? '#E2E8F0' : '#1E293B'}; }
    .empty-sub { font-size:13.5px;color:${dm ? '#64748B' : '#9CA3AF'};max-width:240px;line-height:1.55; }
    .empty-actions { display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:6px; }
    .empty-cta { height:34px;padding:0 16px;border-radius:10px;border:1px solid rgba(124,58,237,0.32);background:rgba(124,58,237,0.09);color:#A855F7;font-size:12.5px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.2s; }
    .empty-cta:hover { background:rgba(124,58,237,0.2); }

    .side-panel { display:none; }
    .side-section-title { font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:${dm ? '#94A3B8' : '#374151'};letter-spacing:0.4px;margin-bottom:10px; }
    .insight-card { background:${dm ? 'rgba(124,58,237,0.07)' : 'white'};border:1px solid ${dm ? 'rgba(124,58,237,0.14)' : 'rgba(0,0,0,0.07)'};border-radius:14px;padding:13px;margin-bottom:14px; }
    .insight-row { display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:12.5px;border-bottom:1px solid ${dm ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}; }
    .insight-row:last-child { border-bottom:none; }
    .insight-label { color:${dm ? '#64748B' : '#9CA3AF'}; }
    .insight-value { font-weight:700;color:${dm ? '#A855F7' : '#7C3AED'}; }
    .suggest-item { display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid ${dm ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}; }
    .suggest-item:last-child { border-bottom:none; }
    .suggest-avatar { width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;font-family:'Syne',sans-serif; }
    .suggest-info { flex:1; }
    .suggest-name { font-size:12.5px;font-weight:600;color:${dm ? '#E2E8F0' : '#1E293B'}; }
    .suggest-tag { font-size:11px;color:${dm ? '#64748B' : '#9CA3AF'}; }
    .suggest-follow-btn { height:25px;padding:0 11px;border-radius:7px;background:rgba(124,58,237,0.13);border:1px solid rgba(124,58,237,0.28);color:#A855F7;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif; }

    .filter-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.48);z-index:200;backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center; }
    .filter-modal { background:${dm ? '#0D1420' : 'white'};border-radius:20px 20px 0 0;padding:18px 18px 28px;width:100%;max-width:480px;border-top:1px solid rgba(124,58,237,0.22); }
    .filter-handle { width:38px;height:4px;border-radius:4px;background:${dm ? '#374151' : '#E5E7EB'};margin:0 auto 14px; }
    .filter-title { font-family:'Syne',sans-serif;font-size:17px;font-weight:700;margin-bottom:14px;color:${dm ? '#F1F5F9' : '#0F172A'}; }
    .filter-group { margin-bottom:13px; }
    .filter-group-label { font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${dm ? '#475569' : '#9CA3AF'};margin-bottom:7px; }
    .filter-options { display:flex;flex-wrap:wrap;gap:7px; }
    .filter-option { height:30px;padding:0 13px;border-radius:100px;border:1px solid ${dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'};background:transparent;color:${dm ? '#94A3B8' : '#64748B'};font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.18s; }
    .filter-option.selected { background:rgba(124,58,237,0.14);border-color:rgba(124,58,237,0.5);color:#A855F7; }
    .apply-filter-btn { width:100%;height:42px;border-radius:12px;background:linear-gradient(135deg,#7C3AED,#0EA5E9);border:none;color:white;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:14px;transition:opacity 0.2s; }
    .apply-filter-btn:hover { opacity:0.9; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className={`toast ${toastVisible ? 'visible' : ''}`}>
        <div className="toast-dot" />
        New · Aman Sharma started following you
      </div>

      <div className="cpa-wrap">
        {refreshing && <div className="refresh-bar" />}

        <div className="desktop-layout">
          <div className="main-feed-col">

            {/* PAGE HEADER */}
            <div className="page-header">
              <div className="page-label">// notifications</div>
              <div className="title-row">
                <div className="page-title">Activity</div>
                <div className="right-cluster">
                  <button className="header-btn" onClick={markAllRead} title="Mark all as read">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><polyline points="20 6 9 17 4 12" /></svg>
                    Mark all
                  </button>
                  <button className="header-btn icon-only" onClick={() => setFilterOpen(true)} title="Filter">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                    </svg>
                  </button>
                  <button className="header-btn icon-only" onClick={handleRefresh} title="Refresh">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                      <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                  </button>
                  <button
                    className={`theme-toggle ${dm ? 'dark' : 'light'}`}
                    onClick={() => setDarkMode(p => !p)}
                    title={dm ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    <span className="toggle-icon">{dm ? <MoonIcon /> : <SunIcon />}</span>
                  </button>
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="unread-summary">
                  <span className="unread-dot-inline" />
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* TABS */}
            <div className="tabs-container">
              {TABS.map(tab => (
                <button key={tab} className={`tab-pill ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="section-divider" />

            {/* FEED */}
            <div className="feed" ref={feedRef}>
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-bell">🔔</div>
                  <div className="empty-title">All quiet here</div>
                  <div className="empty-sub">Follow creators and engage with posts to see activity here.</div>
                  <div className="empty-actions">
                    <button className="empty-cta">Explore Creators</button>
                    <button className="empty-cta">Read Articles</button>
                    <button className="empty-cta">Find Courses</button>
                  </div>
                </div>
              ) : (
                <>
                  {filtered.some(n => n.unread) && (
                    <>
                      <div className="section-label">New</div>
                      {filtered.filter(n => n.unread).map((n, i) => (
                        <NotifCard key={n.id} n={n} i={i} swipedId={swipedId} setSwipedId={setSwipedId} markRead={markRead} dismiss={dismiss} dm={dm} />
                      ))}
                    </>
                  )}
                  {filtered.some(n => !n.unread) && (
                    <>
                      <div className="section-label" style={{ marginTop: 8 }}>Earlier</div>
                      {filtered.filter(n => !n.unread).map((n, i) => (
                        <NotifCard key={n.id} n={n} i={i} swipedId={swipedId} setSwipedId={setSwipedId} markRead={markRead} dismiss={dismiss} dm={dm} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="side-panel">
            <div className="side-section-title">Today's Summary</div>
            <div className="insight-card">
              {[["Unread", unreadCount], ["Profile Views", "214"], ["New Followers", "+7"], ["Article Saves", "23"]].map(([l, v]) => (
                <div key={l} className="insight-row">
                  <span className="insight-label">{l}</span>
                  <span className="insight-value">{v}</span>
                </div>
              ))}
            </div>
            <div className="side-section-title" style={{ marginTop: 4 }}>Suggested Creators</div>
            <div className="insight-card">
              {SUGGESTED.map(s => (
                <div key={s.name} className="suggest-item">
                  <div className="suggest-avatar" style={{ background: s.color }}>{s.avatar}</div>
                  <div className="suggest-info">
                    <div className="suggest-name">{s.name}</div>
                    <div className="suggest-tag">{s.followers} followers</div>
                  </div>
                  <button className="suggest-follow-btn">Follow</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FILTER MODAL */}
        {filterOpen && (
          <div className="filter-overlay" onClick={() => setFilterOpen(false)}>
            <div className="filter-modal" onClick={e => e.stopPropagation()}>
              <div className="filter-handle" />
              <div className="filter-title">Filter Notifications</div>
              <div className="filter-group">
                <div className="filter-group-label">Status</div>
                <div className="filter-options">
                  {["Unread only", "All"].map(o => <button key={o} className={`filter-option ${o === 'All' ? 'selected' : ''}`}>{o}</button>)}
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-group-label">Time Range</div>
                <div className="filter-options">
                  {["Last 24h", "This week", "This month", "All time"].map(o => <button key={o} className={`filter-option ${o === 'All time' ? 'selected' : ''}`}>{o}</button>)}
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-group-label">Category</div>
                <div className="filter-options">
                  {["Social", "Learning", "Messages", "System"].map(o => <button key={o} className="filter-option">{o}</button>)}
                </div>
              </div>
              <button className="apply-filter-btn" onClick={() => setFilterOpen(false)}>Apply Filters</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function NotifCard({ n, i, swipedId, setSwipedId, markRead, dismiss, dm }) {
  const isSwiped = swipedId === n.id;
  return (
    <div style={{ position: 'relative', animationDelay: `${i * 0.045}s` }} onMouseLeave={() => setSwipedId(null)}>
      <div
        className={`notif-card ${n.unread ? 'unread' : 'read'}`}
        style={{ transform: isSwiped ? 'translateX(-116px)' : 'translateX(0)', transition: 'transform 0.22s ease' }}
        onClick={() => markRead(n.id)}
        onTouchStart={e => {
          const startX = e.touches[0].clientX;
          const move = e2 => {
            const dx = startX - e2.touches[0].clientX;
            if (dx > 38) setSwipedId(n.id);
            if (dx < -38) { setSwipedId(null); markRead(n.id); }
          };
          document.addEventListener('touchmove', move, { once: true });
        }}
      >
        <div className="avatar-wrap">
          {n.avatar
            ? <div className="avatar" style={{ background: n.avatarColor }}>{n.avatar}</div>
            : <div className="avatar-icon" style={{ background: `${n.avatarColor}22` }}>{n.avatarIcon}</div>
          }
          {n.unread && <div className="unread-dot" />}
        </div>
        <div className="notif-content">
          <div className="notif-message">{n.message}</div>
          {n.sub && <div className="notif-sub">{n.sub}</div>}
          <div className="notif-bottom">
            <span className="notif-time">{n.time}</span>
            {n.action && (
              <button className="action-btn primary" onClick={e => { e.stopPropagation(); markRead(n.id); }}>{n.action}</button>
            )}
          </div>
        </div>
        {n.thumb && <div className="notif-thumb">{n.icon}</div>}
      </div>
      {isSwiped && (
        <div className="swipe-actions">
          <div className="swipe-btn check" onClick={() => { markRead(n.id); setSwipedId(null); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8"><polyline points="20 6 9 17 4 12" /></svg>
            Read
          </div>
          <div className="swipe-btn delete" onClick={() => { dismiss(n.id); setSwipedId(null); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Delete
          </div>
        </div>
      )}
    </div>
  );
}
