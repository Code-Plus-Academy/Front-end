"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight, BookOpen, Check, Code2, Compass, FileText, Github,
  MessageCircle, Search, Send, Sparkles, Users,
} from "lucide-react";

const features = [
  { label: "01 / DISCOVER", title: "A feed for what you are building", body: "Follow developers, save practical tutorials, and keep useful ideas close to the work.", icon: Compass, span: "md:col-span-2" },
  { label: "02 / PUBLISH", title: "Turn your work into a body of work", body: "Share projects, articles, tutorials, resources, and media from one creator profile.", icon: FileText, span: "md:row-span-2" },
  { label: "03 / LEARN", title: "The format that clicks", body: "Courses, notes, long-form video, shorts, and documentation in one focused library.", icon: BookOpen, span: "" },
  { label: "04 / CONNECT", title: "Conversations around real work", body: "Find people by what they make, then move from a useful post to a useful conversation.", icon: MessageCircle, span: "" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="Code Plus Academy home">
      <Image
        src="/cpa-logo-dark.png"
        alt="Code Plus Academy"
        width={compact ? 128 : 168}
        height={compact ? 36 : 46}
        className="h-auto w-auto object-contain"
        priority
      />
    </Link>
  );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#00B4D8]">{eyebrow}</p>
      <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-[#e8edf2] sm:text-5xl">{title}</h2>
      <p className="mt-5 text-pretty text-base leading-7 text-[#8899aa] sm:text-lg">{body}</p>
    </div>
  );
}

function FeedPreview() {
  return (
    <div className="relative mt-14 overflow-hidden rounded-[22px] border border-white/[0.12] bg-[#0e0e0e] shadow-[0_24px_80px_rgba(0,0,0,.55)]">
      <div className="absolute -inset-24 -z-10 bg-[radial-gradient(circle,rgba(0,180,216,.22),transparent_60%)] blur-3xl" />
      <div className="flex h-10 items-center gap-2 border-b border-white/[0.08] px-4">
        <span className="size-2 rounded-full bg-[#ff4466]" /><span className="size-2 rounded-full bg-[#ffd700]" /><span className="size-2 rounded-full bg-[#00B4D8]" />
        <span className="ml-3 font-mono text-[10px] tracking-wider text-[#4a5568]">CPA://FEED</span>
      </div>
      <div className="grid min-h-[390px] grid-cols-[58px_1fr] sm:grid-cols-[190px_1fr_220px]">
        <aside className="border-r border-white/[0.08] bg-black/20 p-3 sm:p-5">
          <Brand compact />
          <div className="mt-10 space-y-2">
            {["Explore", "Feed", "Network", "Saved"].map((item, i) => (
              <div key={item} className={"flex items-center gap-3 rounded-md px-2 py-2 font-mono text-[10px] " + (i === 1 ? "bg-[#00B4D8]/10 text-[#00B4D8]" : "text-[#4a5568]")}>
                <span className="size-1.5 rounded-full bg-current" /><span className="hidden sm:inline">{item}</span>
              </div>
            ))}
          </div>
        </aside>
        <section className="min-w-0 p-5 sm:p-8">
          <div className="mb-6 flex items-end justify-between border-b border-white/[0.08] pb-4">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00B4D8]">/ activity</p><h3 className="mt-2 font-display text-xl font-semibold text-[#e8edf2]">What builders are shipping</h3></div>
            <Search className="size-4 text-[#4a5568]" />
          </div>
          <article className="rounded-xl border border-white/[0.1] bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#00B4D8] to-[#9333EA] font-mono text-[10px] font-bold text-black">AS</div><div><p className="text-sm font-medium text-[#e8edf2]">Aarav Shah</p><p className="font-mono text-[10px] text-[#4a5568]">@aarav · tutorial · 12m</p></div></div>
            <h4 className="mt-5 text-sm font-medium leading-6 text-[#e8edf2]">I rebuilt our dashboard loading state. Here is the pattern that finally made it feel instant.</h4>
            <div className="mt-4 rounded-lg border border-[#00B4D8]/20 bg-[#00151b] p-3 font-mono text-[11px] leading-6 text-[#b6f4ff]"><span className="text-[#9333EA]">const</span> experience = await optimize(<span className="text-[#00B4D8]">"perceived performance"</span>);</div>
            <div className="mt-4 flex gap-4 font-mono text-[10px] text-[#4a5568]"><span>♡ 128</span><span>◌ 24 replies</span><span>⌑ save</span></div>
          </article>
        </section>
        <aside className="hidden border-l border-white/[0.08] p-5 sm:block"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a5568]">/ explore now</p>{["Next.js", "System design", "TypeScript"].map((skill, i) => <div key={skill} className="mt-4 border-b border-white/[0.08] pb-3"><p className="text-sm text-[#e8edf2]">#{skill}</p><p className="mt-1 font-mono text-[10px] text-[#4a5568]">{(i + 2) * 126} learning</p></div>)}</aside>
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.article custom={index} variants={fadeUp as any} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} whileHover={{ y: -5 }} className={"group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-6 transition-colors hover:border-[#00B4D8]/40 " + feature.span}>
      <div className="absolute right-0 top-0 h-px w-1/2 bg-gradient-to-l from-[#00B4D8] to-transparent opacity-50 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between"><span className="font-mono text-[10px] tracking-[0.16em] text-[#4a5568]">{feature.label}</span><Icon className="size-5 text-[#00B4D8]" /></div>
      <div className="mt-16 max-w-md"><h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#e8edf2]">{feature.title}</h3><p className="mt-3 leading-7 text-[#8899aa]">{feature.body}</p></div>
    </motion.article>
  );
}

function CreatorPreview() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-5 shadow-[0_16px_50px_rgba(0,0,0,.35)] sm:p-7">
      <div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-xl bg-gradient-to-br from-[#9333EA] to-[#00B4D8] font-display text-xl font-semibold text-black">RM</div><div><p className="text-base font-semibold text-[#e8edf2]">Riya Menon</p><p className="font-mono text-[10px] text-[#4a5568]">@riya · developer educator</p></div><span className="ml-auto rounded-full border border-[#00B4D8]/30 px-2 py-1 font-mono text-[9px] text-[#00B4D8]">PRO</span></div>
      <div className="mt-7 grid grid-cols-3 gap-2">{[[BookOpen, "Courses"], [FileText, "Articles"], [Github, "Projects"]].map(([Icon, label]) => { const I = Icon as typeof BookOpen; return <div key={label as string} className="rounded-xl border border-white/[0.08] bg-black/20 p-3"><I className="size-4 text-[#00B4D8]" /><p className="mt-6 font-mono text-[10px] text-[#4a5568]">{label as string}</p><p className="mt-1 text-xl font-semibold text-[#e8edf2]">12</p></div>; })}</div>
      <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-[#4a5568]">Latest contribution</p><p className="mt-2 font-medium text-[#e8edf2]">Designing resilient React data flows</p><p className="mt-2 text-sm leading-6 text-[#8899aa]">Patterns, examples, and the mistakes to avoid.</p></div>
    </div>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-24 sm:py-32"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-[#00B4D8]/30 bg-[#0e0e0e] px-6 py-20 text-center sm:px-16"><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(0,180,216,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,216,.12)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_68%)]" /><div className="relative mx-auto max-w-2xl"><Sparkles className="mx-auto size-5 text-[#ffd700]" /><p className="mt-5 font-mono text-[11px] uppercase tracking-[0.24em] text-[#00B4D8]">/ initialize your profile</p><h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-[#e8edf2] sm:text-6xl">Your next chapter starts with what you ship.</h2><p className="mt-5 text-lg leading-8 text-[#8899aa]">Join the developer network built around learning, contribution, and real connection.</p><Link href="/register" className="mt-9 inline-flex items-center gap-2 rounded-md bg-[#00B4D8] px-6 py-3.5 font-semibold text-black transition hover:bg-[#48d7f1]"><Code2 className="size-4" /> Create your CPA profile <ArrowUpRight className="size-4" /></Link></div></div></section>
  );
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const heroAnimation = reduceMotion ? {} : { opacity: 1, y: 0, transition: { duration: .65, ease: [0.16, 1, .3, 1] as any } };
  return (
    <main className="min-h-screen overflow-hidden bg-black font-body text-[#e8edf2] selection:bg-[#00B4D8] selection:text-black">
      <div className="pointer-events-none fixed inset-0 -z-0 opacity-40 [background-image:linear-gradient(rgba(0,180,216,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,216,.06)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[620px] bg-[radial-gradient(ellipse_at_top,rgba(0,180,216,.12),transparent_58%)]" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Brand /><div className="flex items-center gap-4"><Link href="/explore" className="hidden font-mono text-[11px] uppercase tracking-wider text-[#8899aa] transition hover:text-[#00B4D8] sm:block">Explore</Link><Link href="/login" className="hidden text-sm text-[#8899aa] transition hover:text-white sm:block">Sign in</Link><Link href="/register" className="rounded-md border border-[#00B4D8]/40 bg-[#00B4D8]/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00B4D8] transition hover:bg-[#00B4D8] hover:text-black">Enter academy</Link></div></nav>
      <section className="relative z-10 px-5 pb-24 pt-16 sm:pt-28"><motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} animate={heroAnimation as any} className="mx-auto max-w-5xl"><div className="flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#00B4D8]"><span className="h-px w-8 bg-[#00B4D8]" />CODE PLUS ACADEMY<span className="h-px w-8 bg-[#00B4D8]" /></div><h1 className="mx-auto mt-7 max-w-4xl text-center font-display text-5xl font-semibold leading-[.96] tracking-[-0.07em] text-[#e8edf2] sm:text-8xl">Learn the stack.<br /><span className="bg-gradient-to-r from-[#00B4D8] via-[#4ea8de] to-[#9333EA] bg-clip-text text-transparent">Ship the work.</span><br />Find your people.</h1><p className="mx-auto mt-7 max-w-2xl text-center text-lg leading-8 text-[#8899aa] sm:text-xl">The developer-first platform to build skills, publish what you know, and grow around people who are actually shipping.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#00B4D8] px-6 py-3.5 font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[#48d7f1]">Start building <ArrowUpRight className="size-4" /></Link><Link href="/explore" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/[0.14] bg-white/[0.03] px-6 py-3.5 font-semibold text-[#e8edf2] transition hover:border-[#00B4D8]/40 hover:bg-[#00B4D8]/10">See what is shipping <Compass className="size-4 text-[#00B4D8]" /></Link></div><p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-[#4a5568]">// free to join · built for the next generation</p></motion.div><FeedPreview /></section>
      <section className="relative z-10 border-y border-white/[0.08] bg-[#0e0e0e]/70 px-5 py-7"><div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-3 sm:gap-0">{[["LEARN", "Practical courses, notes, video"], ["PUBLISH", "A profile built on contribution"], ["CONNECT", "Conversations with builders"]].map(([title, body], i) => <div key={title} className={"text-center " + (i < 2 ? "sm:border-r sm:border-white/[0.1]" : "")}><p className="font-mono text-xs font-semibold tracking-[0.18em] text-[#00B4D8]">{title}</p><p className="mt-2 text-sm text-[#8899aa]">{body}</p></div>)}</div></section>
      <section className="relative z-10 px-5 py-24 sm:py-32"><div className="mx-auto max-w-6xl"><SectionIntro eyebrow="/ the platform" title="Every useful part of a developer journey, in one place." body="CPA connects the loop between discovering knowledge, making something with it, and finding the people who can take it further." /><div className="mt-14 grid gap-4 md:grid-cols-3 md:grid-rows-2">{features.map((feature, i) => <FeatureCard key={feature.title} feature={feature} index={i} />)}</div></div></section>
      <section className="relative z-10 border-y border-white/[0.08] bg-[#0e0e0e]/60 px-5 py-24 sm:py-32"><div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2"><div><p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9333EA]">/ for creators who teach</p><h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-[#e8edf2] sm:text-5xl">Make your expertise discoverable.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-[#8899aa]">Your profile should say more than a job title. Publish the work behind your thinking and let the right people find it.</p><ul className="mt-8 space-y-4 text-[#e8edf2]">{["A public profile organised around what you contribute", "Creator tools for projects, articles, tutorials, and media", "A direct path from discovery to meaningful conversations"].map(item => <li key={item} className="flex gap-3 text-sm"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#9333EA]/20 text-[#c084fc]"><Check className="size-3" /></span>{item}</li>)}</ul><Link href="/register" className="mt-9 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00B4D8] transition hover:text-[#48d7f1]">Create a creator profile <ArrowUpRight className="size-4" /></Link></div><CreatorPreview /></div></section>
      <section className="relative z-10 px-5 py-24 sm:py-32"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.9fr_1fr]"><div className="order-2 rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-5 lg:order-1"><div className="flex items-center gap-3 border-b border-white/[0.08] pb-4"><div className="grid size-9 place-items-center rounded-full bg-[#00B4D8] font-mono font-bold text-black">K</div><div><p className="text-sm font-medium text-[#e8edf2]">Karan invited you to connect</p><p className="font-mono text-[10px] text-[#4a5568]">full-stack apps · developer tools</p></div></div><div className="mt-5 space-y-3"><div className="mr-12 rounded-xl rounded-tl-sm bg-white/[0.06] p-3 text-sm leading-6 text-[#8899aa]">Your caching write-up was exactly what I needed. How did you handle invalidation?</div><div className="ml-12 rounded-xl rounded-tr-sm bg-[#00B4D8]/15 p-3 text-sm leading-6 text-[#b6f4ff]">I mapped it by resource ownership. I’ll send over the example repo.</div></div><div className="mt-5 flex items-center gap-3 rounded-md border border-white/[0.08] px-3 py-2 font-mono text-[10px] text-[#4a5568]">Write a reply <Send className="ml-auto size-4 text-[#00B4D8]" /></div></div><div className="order-1 lg:order-2"><p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#00B4D8]">/ network, with context</p><h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-[#e8edf2] sm:text-5xl">Find the people behind the pull requests.</h2><p className="mt-5 text-lg leading-8 text-[#8899aa]">Follow creators whose work is useful. Explore profiles by skill and contribution. Move from a good post to a useful conversation.</p><Link href="/network" className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00B4D8]">Meet the network <Users className="size-4" /></Link></div></div></section>
      <FinalCta />
      <footer className="relative z-10 border-t border-white/[0.08] px-5 py-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center"><Brand compact /><div className="flex flex-wrap gap-5 font-mono text-[10px] uppercase tracking-wider text-[#4a5568]"><Link href="/explore" className="hover:text-[#00B4D8]">Explore</Link><Link href="/support" className="hover:text-[#00B4D8]">Support</Link><Link href="/privacy" className="hover:text-[#00B4D8]">Privacy</Link><Link href="/terms" className="hover:text-[#00B4D8]">Terms</Link></div><p className="font-mono text-[10px] text-[#4a5568]">© {new Date().getFullYear()} CPA</p></div></footer>
    </main>
  );
}
