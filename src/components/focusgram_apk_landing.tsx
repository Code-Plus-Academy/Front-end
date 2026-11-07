'use client';

import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Sparkles, 
  Terminal, 
  ArrowRight, 
  Info,
  Zap,
  Bell,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FocusGramIcon } from './brand/FocusGramBrand';
import LoginPromptModal from './ui/LoginPromptModal';
import toast from 'react-hot-toast';

const APK_INFO = {
  version: '1.2.0',
  buildNumber: '42',
  releaseName: 'FocusGram Android Beta',
  packageId: 'in.codeplusacademy.focusgram',
  fileSize: '~28.4 MB',
  architecture: 'Universal (arm64-v8a / armeabi-v7a)',
  minAndroid: 'Android 8.0+ (API 26)',
  releaseDate: 'Coming Soon',
  sha256: '9f83a48e71b2d3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
};

const FEATURES = [
  {
    icon: Zap,
    title: 'Zero-Distraction Feed',
    desc: 'High-velocity developer streams with native code snippet rendering and offline caching.',
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Smartphone,
    title: 'Notes Arena on the Go',
    desc: 'Instant access to academic lecture notes, lab manuals, and previous year papers (PYQs).',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Bell,
    title: 'Real-Time Mentions & Alerts',
    desc: 'Instant push notifications for code reviews, peer discussions, and study pod invitations.',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Cryptographically Verified',
    desc: 'Signed with official Code Plus Academy keys. SHA-256 hash verified before installation.',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
];

export const FocusGramApkDownload: React.FC = () => {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleCopyHash = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(APK_INFO.sha256);
      setCopiedHash(true);
      toast.success('SHA-256 Checksum copied to clipboard!');
      setTimeout(() => setCopiedHash(false), 3000);
    }
  };

  const handleActionClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setRegistered(true);
    toast.success("FocusGram Android APK is coming soon! You're on the priority early-access list. 🚀", {
      duration: 4000,
    });
  };

  return (
    <section 
      id="download-app" 
      className="relative py-20 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors overflow-hidden"
    >
      {/* Decorative background glow & grid lines */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-purple-500/15 blur-3xl rounded-full" 
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/70 text-xs font-semibold text-amber-900 dark:text-amber-300 shadow-sm mb-4">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>FocusGram Android Client</span>
            <span className="font-mono text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          <h2 
            className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase"
            style={{ fontSize: 'clamp(1.85rem, 5vw, 3rem)' }}
          >
            FOCUSGRAM FOR ANDROID
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            The native Android experience engineered for high-velocity software engineers and CS students. 
            Direct APK downloads are launching soon — authenticate with your developer account to lock in priority early access.
          </p>
        </div>

        {/* Main Content: Left Details & Right Specs Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          
          {/* Left Column: Feature Highlights & Auth Status (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Features 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((feat, idx) => {
                const IconComp = feat.icon;
                return (
                  <div 
                    key={idx}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all backdrop-blur-sm"
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${feat.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Authentication Gateway Notice Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              user 
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60' 
                : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl border ${
                    user 
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' 
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                  }`}>
                    {user ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        user 
                          ? 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
                          : 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                      }`}>
                        {user ? 'AUTHENTICATION VERIFIED' : 'AUTHENTICATION REQUIRED'}
                      </span>
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        COMING SOON
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {user 
                        ? `Welcome, ${user.name || user.username || 'Member'}!` 
                        : 'Sign In to Authorize Early APK Access'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {user 
                        ? 'Your active session qualifies you for instant access as soon as the APK build goes live.' 
                        : 'FocusGram builds are distributed directly to authenticated members. Sign in to reserve your spot.'}
                    </p>
                  </div>
                </div>

                {user && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Priority Confirmed
                  </span>
                )}
              </div>
            </div>

            {/* CTA Download Button Cluster (Coming Soon State) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                onClick={handleActionClick}
                className={`relative flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-[0.98] ${
                  user
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:opacity-95 text-white shadow-amber-500/25'
                    : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-indigo-500/25'
                }`}
              >
                {user ? (
                  registered ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Early Access Registered ✓ (Coming Soon)</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>Coming Soon · Get Notified on Launch</span>
                      <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-normal">
                        v{APK_INFO.version}
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Sign In for Early Access (Coming Soon)</span>
                    <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center justify-center space-x-2 px-5 py-4 rounded-2xl font-semibold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{showInstructions ? 'Hide Install Guide' : 'How to Install APK'}</span>
              </button>
            </div>

            {/* Collapsible Install Guide */}
            {showInstructions && (
              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 animate-in fade-in-50 duration-200">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Step-by-Step Android Sideloading Instructions (At Launch):
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  <li>When the download opens, tap <strong>Download FocusGram APK</strong> to retrieve the signed package.</li>
                  <li>When prompted by Android, choose <strong>Settings → Allow from this source</strong> for your browser.</li>
                  <li>Tap <strong>Install</strong> when the package installer opens.</li>
                  <li>Launch FocusGram, sign in with your Code Plus Academy credentials, and elevate your workflow!</li>
                </ol>
              </div>
            )}

          </div>

          {/* Right Column: Release Specification Terminal Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
              
              {/* Terminal Title Bar */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium ml-1">
                    build-manifest.json
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  COMING SOON
                </span>
              </div>

              {/* App Icon + Title Header inside card */}
              <div className="p-5 border-b border-slate-800/80 flex items-center gap-3.5 bg-slate-900/60">
                <FocusGramIcon size={44} className="rounded-xl shadow-md bg-slate-800 border border-slate-700 p-1" />
                <div>
                  <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                    FocusGram Android
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      COMING SOON
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {APK_INFO.packageId}
                  </p>
                </div>
              </div>

              {/* Specs Table */}
              <div className="p-5 space-y-3 divide-y divide-slate-800/60">
                
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Target Version</span>
                  <span className="text-white font-semibold">{APK_INFO.version} (Build {APK_INFO.buildNumber})</span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400">Package Size</span>
                  <span className="text-cyan-400 font-semibold">{APK_INFO.fileSize}</span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400">Architecture</span>
                  <span className="text-white font-semibold">{APK_INFO.architecture}</span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400">Minimum OS</span>
                  <span className="text-white font-semibold">{APK_INFO.minAndroid}</span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400">Release Status</span>
                  <span className="text-amber-400 font-semibold">Coming Soon (Q4 2026)</span>
                </div>

                <div className="pt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">SHA-256 Checksum</span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white transition-colors bg-slate-800 px-2 py-0.5 rounded"
                      title="Copy full SHA-256 Checksum"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 break-all select-all">
                    {APK_INFO.sha256}
                  </div>
                </div>

              </div>

              {/* Card Footer Status */}
              <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Code Plus Academy Key Signed
                </span>
                <span className="text-amber-400 font-mono font-semibold">
                  Coming Soon
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Login Prompt Modal for unauthenticated guests trying to access early preview */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        actionType="download"
        onLoginSuccess={() => {
          setShowLoginModal(false);
          setRegistered(true);
          toast.success("Authentication confirmed! You're on the priority early-access list for FocusGram Android. 🚀", {
            duration: 4000,
          });
        }}
      />
    </section>
  );
};

export default FocusGramApkDownload;
