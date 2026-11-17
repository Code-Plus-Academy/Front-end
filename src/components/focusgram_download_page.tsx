'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  Sparkles,
  BookOpen,
  Users,
  Layers3,
  PackageCheck,
  Info,
  CircleHelp,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { FocusGramBrand, FocusGramIcon } from './brand/FocusGramBrand';
import { useTheme } from '../context/ThemeContext';

import { PHONEPE_APPSTORE_URL } from '../config/appDistribution';

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const appHighlights = [
  {
    icon: Users,
    title: 'Developer community',
    description: 'Share progress, exchange ideas and stay connected with other builders.',
  },
  {
    icon: BookOpen,
    title: 'Notes and learning',
    description: 'Keep study material, technical notes and useful resources close.',
  },
  {
    icon: Layers3,
    title: 'Creator workspace',
    description: 'Move between publishing, discovery and your creative workflow.',
  },
];

const installSteps = [
  {
    number: '01',
    title: 'Open the official listing',
    description: 'Use the PhonePe Appstore button on this page to open the FocusGram listing.',
  },
  {
    number: '02',
    title: 'Install or update',
    description: 'Follow the install or update action shown by the Appstore on your device.',
  },
  {
    number: '03',
    title: 'Open FocusGram',
    description: 'Launch the app and sign in with your FocusGram account.',
  },
];

const faqs = [
  {
    question: 'Where should I install FocusGram from right now?',
    answer:
      'Use the PhonePe Appstore listing linked on this page. It is the current store destination for this release workflow.',
  },
  {
    question: 'Can I download the APK directly from this website?',
    answer:
      'Direct APK distribution is not enabled on this page yet. It will be offered only after a signed release artifact and its verification details are ready.',
  },
  {
    question: 'Do I need to sign in on this website to install the app?',
    answer:
      'No website sign-in is required to open the store listing. Sign in to FocusGram after installing the Android app.',
  },
  {
    question: 'How will I receive future updates?',
    answer:
      'For the current store channel, check for updates through the PhonePe Appstore listing and the update controls available on your device.',
  },
];

export default function FocusGramDownloadPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const motionEnabled = !reduceMotion;

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-900 transition-colors duration-300 dark:bg-[#080e1b] dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-[#080e1b]/80">
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-800"
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
            <div className="absolute -left-40 top-8 h-[28rem] w-[28rem] rounded-full bg-cyan-400/15 blur-[110px] dark:bg-cyan-500/10" />
            <div className="absolute -right-40 top-24 h-[32rem] w-[32rem] rounded-full bg-indigo-400/15 blur-[120px] dark:bg-indigo-500/10" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50 dark:opacity-20" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-28 lg:pt-24">
            <motion.div
              variants={reveal}
              initial={motionEnabled ? 'hidden' : false}
              animate="visible"
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-cyan-800 shadow-sm dark:border-cyan-900/80 dark:bg-slate-900/80 dark:text-cyan-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                FOCUSGRAM FOR ANDROID
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl lg:text-[4.15rem]">
                Your community.
                <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-blue-300 dark:to-indigo-300">
                  Wherever you build.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-400 sm:text-lg">
                Take FocusGram with you on Android. Get the app through our current PhonePe Appstore destination and keep your developer, learning and creator workflows close.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={PHONEPE_APPSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25 active:translate-y-0"
                >
                  <Download className="h-5 w-5" />
                  Get it on PhonePe Appstore
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#install-guide"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-6 py-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:bg-slate-800"
                >
                  How to install
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Official store destination
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  Android
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-indigo-500" />
                  No website sign-in required
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={motionEnabled ? { opacity: 0, scale: 0.96, y: 16 } : false}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[33rem]"
            >
              <motion.div
                aria-hidden="true"
                animate={motionEnabled ? { y: [0, -9, 0], rotate: [0, 1.2, 0] } : undefined}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -right-3 top-5 h-24 w-24 rounded-[2rem] bg-gradient-to-br from-cyan-400/30 to-indigo-500/30 blur-2xl"
              />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_28px_90px_-35px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/85 dark:shadow-black/40 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Your Android companion</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                    PHONEPE STORE
                  </span>
                </div>

                <div className="mt-7 flex items-center gap-4">
                  <div className="rounded-[1.45rem] border border-slate-200 bg-slate-50 p-2 shadow-inner dark:border-slate-700 dark:bg-slate-950">
                    <FocusGramIcon size={82} className="rounded-2xl" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">FocusGram</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">by Code Plus Academy</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200">
                      <Smartphone className="h-3.5 w-3.5" />
                      Android app
                    </div>
                  </div>
                </div>

                <div className="my-7 h-px bg-slate-200 dark:bg-slate-800" />

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Users, label: 'Connect' },
                    { icon: BookOpen, label: 'Learn' },
                    { icon: Sparkles, label: 'Create' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-2 py-4 text-center dark:border-slate-800 dark:bg-slate-950/60">
                        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
                      </div>
                    );
                  })}
                </div>

                <a
                  href={PHONEPE_APPSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
                >
                  Open PhonePe listing
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">Store-first installation</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400">One clear install destination</span>
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-slate-200/80 bg-white/65 py-16 transition-colors dark:border-slate-800/80 dark:bg-slate-950/40 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Built around your workflow</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">More than a place to scroll.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                A connected space for building, learning and sharing.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {appHighlights.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.article
                    key={item.title}
                    variants={reveal}
                    initial={motionEnabled ? 'hidden' : false}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: index * 0.07 }}
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-950/5 dark:border-slate-800 dark:bg-slate-900/75 dark:hover:border-cyan-800 dark:hover:shadow-black/20"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 transition-transform duration-300 group-hover:scale-105 dark:border-cyan-900/70 dark:bg-cyan-950/60 dark:text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="install-guide" className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Getting started</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Install in three steps.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
                Use the store listing for the current release. The install or update flow is handled by the Appstore on your device.
              </p>
              <a
                href={PHONEPE_APPSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 transition hover:-translate-y-0.5"
              >
                Open PhonePe Appstore
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="space-y-3">
              {installSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={motionEnabled ? { opacity: 0, x: 14 } : false}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/75 sm:gap-5 sm:p-6"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-mono text-sm font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 dark:border-cyan-900/70 dark:from-cyan-950/50 dark:to-slate-900 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200">
                    <PackageCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-200">Current channel</p>
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">PhonePe Appstore</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  This is the current Android store destination. Use the listing to install or update FocusGram.
                </p>
                <a href={PHONEPE_APPSTORE_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-800 transition-colors hover:text-indigo-700 dark:text-cyan-200 dark:hover:text-indigo-300">
                  Go to store listing <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-100/80 p-6 dark:border-slate-800 dark:bg-slate-900/70 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Download className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Additional channel</p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Direct APK download</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  Not enabled yet. We will add this option after a signed APK, release metadata and integrity checks are ready for public distribution.
                </p>
                <span className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-4 py-2.5 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                  <Info className="h-3.5 w-3.5" />
                  Not published yet
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white/60 py-16 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <CircleHelp className="mx-auto h-7 w-7 text-indigo-600 dark:text-indigo-300" />
              <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">A few quick answers</h2>
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
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#080e1b]">
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
    </div>
  );
}
