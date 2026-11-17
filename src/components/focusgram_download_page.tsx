'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Clapperboard,
  FileText,
  Github,
  ChevronDown,
  Code2,
  Compass,
  Download,
  ExternalLink,
  GraduationCap,
  Layers3,
  MessageCircle,
  MessageSquare,
  Moon,
  PenLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  Video,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FocusGramBrand, FocusGramIcon } from './brand/FocusGramBrand';
import { useTheme } from '../context/ThemeContext';
import { PHONEPE_APPSTORE_URL } from '../config/appDistribution';

const features = [
  {
    id: 'community',
    label: 'Community',
    eyebrow: 'Stay in the conversation',
    title: 'Build in public. Learn from people building too.',
    description:
      'Share what you are working on, exchange ideas, post technical updates and take part in conversations with other developers.',
    points: ['Developer posts and discussions', 'Code snippets and project updates', 'Profiles shaped around your work'],
    icon: Users,
    accent: 'cyan',
    visualItems: [
      { icon: MessageCircle, label: 'Technical conversations' },
      { icon: Code2, label: 'Code and project updates' },
      { icon: Users, label: 'Developer connections' },
    ],
  },
  {
    id: 'notes',
    label: 'Notes Arena',
    eyebrow: 'Make learning easier to find',
    title: 'Study material that stays connected to your journey.',
    description:
      'Explore academic notes, previous-year papers, lab manuals, reference material and other resources organised for learning.',
    points: ['Academic notes and study resources', 'Previous-year papers and solutions', 'College and subject-oriented discovery'],
    icon: BookOpen,
    accent: 'indigo',
    visualItems: [
      { icon: GraduationCap, label: 'Academic resources' },
      { icon: BookOpen, label: 'Notes and revision' },
      { icon: Layers3, label: 'Organised by subject' },
    ],
  },
  {
    id: 'discover',
    label: 'Explore',
    eyebrow: 'Find something worth learning',
    title: 'Discover technical ideas beyond your feed.',
    description:
      'Browse technical articles, video tutorials and useful learning content from creators and the wider developer ecosystem.',
    points: ['Technical articles and deep dives', 'Video discovery and learning content', 'Topics across software and technology'],
    icon: Compass,
    accent: 'violet',
    visualItems: [
      { icon: PenLine, label: 'Technical articles' },
      { icon: Video, label: 'Video learning' },
      { icon: Sparkles, label: 'Fresh discoveries' },
    ],
  },
  {
    id: 'studio',
    label: 'Creator Studio',
    eyebrow: 'Turn knowledge into something useful',
    title: 'Create, publish and share what you know.',
    description:
      'Bring your technical writing, videos and learning contributions together with tools designed for people who create.',
    points: ['Publish technical articles', 'Manage video and short-form content', 'Contribute learning resources'],
    icon: PenLine,
    accent: 'fuchsia',
    visualItems: [
      { icon: PenLine, label: 'Article publishing' },
      { icon: Video, label: 'Video management' },
      { icon: Layers3, label: 'Resource contributions' },
    ],
  },
];


const connectedItems = [
  { label: 'Community', icon: Users, accent: 'cyan', position: 'left-0 top-0' },
  { label: 'Notes Arena', icon: BookOpen, accent: 'indigo', position: 'right-0 top-6' },
  { label: 'Posts', icon: MessageSquare, accent: 'blue', position: 'left-0 top-[28%]' },
  { label: 'Shorts', icon: Clapperboard, accent: 'rose', position: 'right-0 top-[28%]' },
  { label: 'Explore', icon: Compass, accent: 'violet', position: 'left-0 bottom-[27%]' },
  { label: 'Studio', icon: PenLine, accent: 'fuchsia', position: 'right-0 bottom-[27%]' },
  { label: 'Quickbit Article', icon: FileText, accent: 'amber', position: 'left-0 bottom-0' },
  { label: 'Projects', icon: Github, accent: 'slate', position: 'left-1/2 bottom-0 -translate-x-1/2' },
  { label: 'Videos', icon: Video, accent: 'emerald', position: 'right-0 bottom-0' },
] as const;

const connectedItemAccents = {
  cyan: 'border-cyan-100 dark:border-cyan-900/70',
  indigo: 'border-indigo-100 dark:border-indigo-900/70',
  blue: 'border-blue-100 dark:border-blue-900/70',
  rose: 'border-rose-100 dark:border-rose-900/70',
  violet: 'border-violet-100 dark:border-violet-900/70',
  fuchsia: 'border-fuchsia-100 dark:border-fuchsia-900/70',
  amber: 'border-amber-100 dark:border-amber-900/70',
  slate: 'border-slate-200 dark:border-slate-700',
  emerald: 'border-emerald-100 dark:border-emerald-900/70',
};

const connectedIconAccents = {
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/70 dark:text-fuchsia-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
};

const installSteps = [
  {
    number: '01',
    title: 'Open the PhonePe Appstore listing',
    description: 'Tap the install button to open the FocusGram listing in PhonePe Appstore.',
    icon: ExternalLink,
  },
  {
    number: '02',
    title: 'Install FocusGram',
    description: 'Continue with the install or update option shown on your Android device.',
    icon: Download,
  },
  {
    number: '03',
    title: 'Sign in and get started',
    description: 'Open FocusGram and sign in to join the community and explore its features.',
    icon: Smartphone,
  },
];

const faqs = [
  {
    question: 'Where can I install FocusGram today?',
    answer:
      'The current Android install destination is the PhonePe Appstore listing linked on this page. Open it on your Android device to install or update the app.',
  },
  {
    question: 'Can I download the APK directly from this website?',
    answer:
      'Direct APK distribution is planned, but it is not available yet. We will enable it only after the signed installer, release information and integrity checks are verified.',
  },
  {
    question: 'Do I need an account on this website before installing?',
    answer:
      'No. You can open the PhonePe Appstore listing without signing in to this website. You can sign in to FocusGram after installing the Android app.',
  },
  {
    question: 'How do I get app updates?',
    answer:
      'For the current store channel, open the FocusGram listing in PhonePe Appstore and use the update option when one is available.',
  },
];

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const accentClasses = {
  cyan: {
    icon: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-900/70',
    pill: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-200',
    glow: 'from-cyan-400/20 to-cyan-500/5',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-900/70',
    pill: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200',
    glow: 'from-indigo-400/20 to-indigo-500/5',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-900/70',
    pill: 'bg-violet-50 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200',
    glow: 'from-violet-400/20 to-violet-500/5',
  },
  fuchsia: {
    icon: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/70 dark:text-fuchsia-300',
    border: 'border-fuchsia-200 dark:border-fuchsia-900/70',
    pill: 'bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950/70 dark:text-fuchsia-200',
    glow: 'from-fuchsia-400/20 to-fuchsia-500/5',
  },
};

export default function FocusGramDownloadPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeFeatureId, setActiveFeatureId] = useState('community');
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;
  const activeFeature = features.find((feature) => feature.id === activeFeatureId) || features[0];
  const ActiveFeatureIcon = activeFeature.icon;
  const activeAccent = accentClasses[activeFeature.accent];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f9fd] pb-24 text-slate-900 transition-colors duration-300 dark:bg-[#080d18] dark:text-slate-100 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200/75 bg-white/85 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-[#080d18]/85">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="/" aria-label="FocusGram home" className="inline-flex min-w-0 items-center">
            <FocusGramBrand size={34} showSubtitle={true} />
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={mounted ? (resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
              title={mounted ? (resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-800"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-48 top-0 h-[34rem] w-[34rem] rounded-full bg-cyan-400/15 blur-[125px] dark:bg-cyan-500/10" />
            <div className="absolute -right-48 top-20 h-[36rem] w-[36rem] rounded-full bg-indigo-400/15 blur-[135px] dark:bg-indigo-500/10" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.055)_1px,transparent_1px)] bg-[size:56px_56px] dark:opacity-35" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-24">
            <motion.div
              variants={reveal}
              initial={motionEnabled ? 'hidden' : false}
              animate="visible"
              transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/90 bg-white/80 px-3.5 py-2 text-xs font-semibold text-cyan-900 shadow-sm dark:border-cyan-900/80 dark:bg-slate-900/80 dark:text-cyan-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-45" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                FOCUSGRAM FOR ANDROID
                <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                Available on PhonePe Appstore
              </div>

              <h1 className="mt-7 max-w-3xl text-[2.7rem] font-bold leading-[1.04] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-6xl lg:text-[4.35rem]">
                Find your people.
                <span className="mt-1 block bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text pb-1 text-transparent dark:from-cyan-300 dark:via-blue-300 dark:to-indigo-300">
                  Keep building.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-400 sm:text-lg">
                Join a developer community where you can share what you are building, discover technical ideas, explore study resources and publish what you know.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={PHONEPE_APPSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25 active:translate-y-0"
                >
                  <Download className="h-5 w-5" />
                  Get FocusGram on PhonePe
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#inside-focusgram"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-6 py-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:bg-slate-800"
                >
                  Explore the app
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Store listing install
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  Android
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-indigo-500" />
                  No website sign-in needed
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={motionEnabled ? { opacity: 0, y: 20, scale: 0.97 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.72, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[34rem]"
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-10 rounded-full bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-indigo-500/20 blur-3xl" />
              <motion.div
                whileHover={motionEnabled ? { y: -4, rotate: -0.4 } : undefined}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/90 p-6 shadow-[0_32px_100px_-42px_rgba(15,23,42,0.38)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-black/40 sm:p-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.19em] text-slate-400">One connected space</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Android app
                  </span>
                </div>

                <div
                  role="img"
                  aria-label="One connected space: Community, Notes Arena, Posts, Shorts, Explore, Creator Studio, Quickbit Articles, Projects with GitHub, and Videos."
                  className="relative mx-auto mt-7 flex min-h-[29rem] w-full max-w-[28rem] items-center justify-center"
                >
                  <div aria-hidden="true" className="absolute h-[18rem] w-[18rem] rounded-full border border-dashed border-cyan-300/70 dark:border-cyan-900/80" />
                  <div aria-hidden="true" className="absolute h-[14rem] w-[14rem] rounded-full border border-indigo-200/80 dark:border-indigo-900/80" />
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-[1.9rem] border border-white bg-white shadow-[0_18px_55px_-18px_rgba(37,99,235,0.35)] dark:border-slate-700 dark:bg-slate-950 sm:h-28 sm:w-28">
                    <FocusGramIcon size={88} className="rounded-[1.5rem] sm:hidden" />
                    <span className="hidden sm:block">
                      <FocusGramIcon size={100} className="rounded-[1.5rem]" />
                    </span>
                  </div>

                  {connectedItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={motionEnabled ? { opacity: 0, y: 8 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.24 + index * 0.055 }}
                        className={`absolute ${item.position} z-20 inline-flex items-center gap-1.5 rounded-xl border bg-white px-2.5 py-2 shadow-lg shadow-slate-950/5 dark:bg-slate-950 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2.5 ${connectedItemAccents[item.accent]}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl ${connectedIconAccents[item.accent]}`}>
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <span className="whitespace-nowrap text-[10px] font-bold text-slate-800 dark:text-slate-100 sm:text-xs">
                          {item.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>                </div>

                <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <p className="text-center text-sm font-semibold text-slate-900 dark:text-white">A community for the way you build.</p>
                  <p className="mt-1 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">Connect ideas, learning and publishing in one app.</p>
                </div>
              </motion.div>
              <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">Product overview illustration · not an in-app screenshot</p>
            </motion.div>
          </div>
        </section>

        <section id="inside-focusgram" className="scroll-mt-24 border-y border-slate-200/80 bg-white/65 py-16 dark:border-slate-800/80 dark:bg-slate-950/40 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={reveal}
              initial={motionEnabled ? 'hidden' : false}
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-11 max-w-3xl text-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Inside FocusGram</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                More room for what you do.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                Move between the conversations, resources and creative tools that support your work and learning.
              </p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1 lg:gap-3" role="group" aria-label="Choose a FocusGram feature">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  const isActive = feature.id === activeFeatureId;
                  const accent = accentClasses[feature.accent];
                  return (
                    <button
                      key={feature.id}
                      id={`feature-tab-${feature.id}`}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveFeatureId(feature.id)}
                      className={`group flex min-h-[4.6rem] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 sm:px-4 lg:min-h-[5.1rem] ${
                        isActive
                          ? `border-cyan-300 bg-white shadow-md shadow-cyan-950/5 dark:border-cyan-800 dark:bg-slate-900 dark:shadow-black/20`
                          : 'border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/45 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${accent.icon}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-xs font-bold sm:text-sm ${isActive ? 'text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{feature.label}</span>
                        <span className="mt-0.5 hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">{feature.eyebrow}</span>
                      </span>
                      <span className={`ml-auto hidden h-2 w-2 rounded-full lg:block ${isActive ? 'bg-cyan-500' : 'bg-transparent'}`} />
                    </button>
                  );
                })}
              </div>

              <div
                id="feature-panel"
                className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8"
              >
                <div aria-hidden="true" className={`pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gradient-to-br blur-3xl ${activeAccent.glow}`} />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeFeature.id}
                    initial={motionEnabled ? { opacity: 0, y: 12 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={motionEnabled ? { opacity: 0, y: -8 } : undefined}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className="relative"
                  >
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] ${activeAccent.pill}`}>
                      <ActiveFeatureIcon className="h-3.5 w-3.5" />
                      {activeFeature.eyebrow}
                    </span>

                    <h3 className="mt-5 max-w-2xl text-2xl font-bold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                      {activeFeature.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                      {activeFeature.description}
                    </p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                      {activeFeature.visualItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-950/65">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${activeAccent.icon}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <p className="mt-3 text-xs font-semibold leading-5 text-slate-800 dark:text-slate-200">{item.label}</p>
                          </div>
                        );
                      })}
                    </div>

                    <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                      {activeFeature.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={reveal}
              initial={motionEnabled ? 'hidden' : false}
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Made for curious minds</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Whether you build, study or teach.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                FocusGram brings people with different goals into the same learning and creator community.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: 'Developers',
                  description: 'Share your progress, discuss implementation ideas and discover how other people approach problems.',
                  icon: Code2,
                  tone: 'cyan',
                },
                {
                  title: 'Students and learners',
                  description: 'Explore academic notes, previous-year papers and learning resources alongside your developer community.',
                  icon: GraduationCap,
                  tone: 'indigo',
                },
                {
                  title: 'Technical creators',
                  description: 'Publish articles, videos and useful resources to share what you have learned.',
                  icon: PenLine,
                  tone: 'violet',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                const accent = accentClasses[item.tone];
                return (
                  <motion.article
                    key={item.title}
                    variants={reveal}
                    initial={motionEnabled ? 'hidden' : false}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.42, delay: index * 0.07 }}
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/75 dark:hover:border-cyan-800 dark:hover:shadow-black/20 sm:p-7"
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${accent.icon}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="install-guide" className="border-y border-slate-200/80 bg-white/65 py-16 dark:border-slate-800/80 dark:bg-slate-950/40 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Get started</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Ready when you are.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                Install the current Android version from the PhonePe Appstore listing. You do not need to create an account on this website first.
              </p>
              <a
                href={PHONEPE_APPSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              >
                Install from PhonePe Appstore
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="space-y-3">
              {installSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={motionEnabled ? { opacity: 0, x: 14 } : false}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.38, delay: index * 0.07 }}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/75 sm:gap-5 sm:p-6"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400">{step.number}</p>
                      <h3 className="mt-1 text-base font-bold text-slate-950 dark:text-white">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{step.description}</p>
                    </div>
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-[2rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-6 dark:border-cyan-900/70 dark:from-cyan-950/50 dark:via-slate-900 dark:to-indigo-950/50 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-800 dark:border-cyan-900 dark:bg-slate-950/70 dark:text-cyan-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Current install option
                  </span>
                  <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Get FocusGram on Android.</h2>
                  <p className="mt-3 max-w-md text-sm leading-7 text-slate-700 dark:text-slate-300">
                    Open the PhonePe Appstore listing to install or update the app on your device.
                  </p>
                  <a
                    href={PHONEPE_APPSTORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
                  >
                    Open PhonePe listing
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-slate-100/80 p-6 dark:border-slate-800 dark:bg-slate-900/70 sm:p-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                  <Download className="h-3.5 w-3.5" />
                  Planned distribution channel
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Direct APK download.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  A direct installer is planned. It will be enabled after the signed APK, release details and integrity checks are verified.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {['Release signature verification', 'SHA-256 integrity details', 'Version and file information', 'Installation guidance'].map((item) => (
                    <span key={item} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {item}
                    </span>
                  ))}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/75 px-4 py-2.5 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Not available yet · No installer link published
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200/80 bg-white/65 py-16 dark:border-slate-800/80 dark:bg-slate-950/40 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">A few things you might want to know.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Quick answers before you install.</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors open:border-cyan-300 dark:border-slate-800 dark:bg-slate-900/75 dark:open:border-cyan-800">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 marker:hidden dark:text-slate-100">
                    {faq.question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 pr-8 text-sm leading-7 text-slate-600 dark:text-slate-400">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 px-6 py-10 text-center shadow-xl shadow-indigo-950/15 sm:px-10 sm:py-14">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -left-16 h-80 w-80 rounded-full border border-white/10" />
            <div className="relative mx-auto max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">Your next idea starts somewhere</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Bring your learning and building together.</h2>
              <p className="mt-3 text-sm leading-7 text-blue-50 sm:text-base">
                Install FocusGram on Android and find your place in the developer community.
              </p>
              <a
                href={PHONEPE_APPSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-800 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-50 active:translate-y-0"
              >
                Get FocusGram
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#080d18]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <FocusGramBrand size={27} showSubtitle={false} />
            <span className="text-xs text-slate-500 dark:text-slate-400">© 2026 FocusGram · Code Plus Academy</span>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <a href="/privacy" className="transition-colors hover:text-cyan-700 dark:hover:text-cyan-300">Privacy</a>
            <a href="/terms" className="transition-colors hover:text-cyan-700 dark:hover:text-cyan-300">Terms</a>
            <a href="/" className="transition-colors hover:text-cyan-700 dark:hover:text-cyan-300">Website</a>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/92 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-15px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/92 sm:hidden">
        <a
          href={PHONEPE_APPSTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 active:scale-[0.99]"
        >
          <Download className="h-4 w-4" />
          Get FocusGram on PhonePe
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
