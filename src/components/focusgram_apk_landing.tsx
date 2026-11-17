'use client';

import React from 'react';
import { ArrowRight, Download, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const APPSTORE_URL =
  process.env.NEXT_PUBLIC_PHONEPE_APPSTORE_URL || 'https://indusapp.store/0ae2to7v';

/**
 * Kept as a compact promotion block for the legacy landing view.
 * The canonical distribution experience lives at /download.
 */
export const FocusGramApkDownload: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="download-app"
      className="relative isolate overflow-hidden border-t border-slate-200 bg-slate-50 py-20 transition-colors dark:border-slate-800 dark:bg-slate-950"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/10" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200">
            <Smartphone className="h-3.5 w-3.5" />
            Android app
          </div>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Take your developer community with you.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            Get FocusGram from our current PhonePe Appstore listing. One place for developer conversations,
            study resources and creator tools on Android.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={APPSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
            >
              <Download className="h-4 w-4" />
              Get FocusGram on PhonePe
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/download"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-800"
            >
              View install options
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300">
                <Smartphone className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-950 dark:text-white">FocusGram for Android</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current store destination · PhonePe Appstore</p>
              </div>
            </div>
            <div className="my-6 h-px bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Use the supplied store listing
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Keep your learning and creator workflow close
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-3 -top-4 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-800 shadow-lg dark:border-cyan-900 dark:bg-slate-950 dark:text-cyan-200">
            Android
          </div>
        </motion.div>
      </div>
    </section>
  );
};
