"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Compass,
  FileText,
  Github,
  MessageCircle,
  Play,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    title: "A feed worth opening",
    description:
      "Follow developers, save practical tutorials, and keep your next breakthrough close.",
    icon: Compass,
    className: "md:col-span-2",
  },
  {
    title: "Share work that compounds",
    description:
      "Publish projects, articles, tutorials, and resources from one creator workspace.",
    icon: FileText,
    className: "md:row-span-2",
  },
  {
    title: "Learn in the format that clicks",
    description: "Courses, long-form video, shorts, notes, and curated resources—without the noise.",
    icon: Play,
    className: "",
  },
  {
    title: "Meet builders, not just profiles",
    description: "Discover people by what they make, follow their work, and start the conversation.",
    icon: MessageCircle,
    className: "",
  },
];

const proof = [
  ["One profile", "for your work, skills, and ideas"],
  ["Multiple formats", "from notes to short-form video"],
  ["Built for builders", "not empty engagement"],
];

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.24em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-base leading-7 text-zinc-400 sm:text-lg">{body}</p>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-2 shadow-2xl shadow-cyan-950/30">
      <div className="absolute -inset-16 -z-10 rounded-full bg-cyan-500/15 blur-[100px]" />
      <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#0a0b12]">
        <div className="flex h-12 items-center gap-2 border-b border-white/10 px-5">
          <span className="size-2.5 rounded-full bg-rose-400/80" />
          <span className="size-2.5 rounded-full bg-amber-300/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <div className="ml-4 h-6 w-48 rounded-md bg-white/[0.06]" />
        </div>
        <div className="grid min-h-[360px] grid-cols-[60px_1fr] sm:grid-cols-[190px_1fr_220px]">
          <aside className="border-r border-white/10 p-3 sm:p-5">
            <div className="mb-8 flex items-center gap-2 text-sm font-bold text-white">
              <Code2 className="size-5 text-cyan-300" /><span className="hidden sm:inline">CPA</span>
            </div>
            {["Explore", "My feed", "Network", "Saved"].map((item, index) => (
              <div key={item} className={`mb-2 flex items-center gap-3 rounded-xl px-2 py-2 text-xs ${index === 1 ? "bg-cyan-400/10 text-cyan-200" : "text-zinc-500"}`}>
                <span className="size-2 rounded-full bg-current" /><span className="hidden sm:inline">{item}</span>
              </div>
            ))}
          </aside>
          <main className="p-5 sm:p-8">
            <div className="mb-6 flex items-center justify-between"><div><p className="text-xs text-zinc-500">Good morning, builder</p><h3 className="mt-1 text-lg font-semibold text-white">Your developer feed</h3></div><Search className="size-5 text-zinc-500" /></div>
            <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
              <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-xs font-bold text-slate-950">AS</div><div><p className="text-sm font-medium text-white">Aarav Shah</p><p className="text-xs text-zinc-500">Frontend engineer · 12 min</p></div></div>
              <h4 className="mt-4 font-medium text-white">I rebuilt our dashboard loading state. Here is the pattern that finally made it feel instant.</h4>
              <div className="mt-4 rounded-xl border border-cyan-300/10 bg-[#071118] p-3 font-mono text-xs leading-6 text-cyan-100/80"><span className="text-violet-300">const</span> experience = await optimize(<span className="text-cyan-300">"perceived performance"</span>);</div>
              <div className="mt-4 flex gap-4 text-xs text-zinc-500"><span>♡ 128</span><span>◌ 24 replies</span><span>⌑ Save</span></div>
            </article>
          </main>
          <aside className="hidden border-l border-white/10 p-5 sm:block"><p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Trending skills</p>{["Next.js", "System design", "TypeScript"].map((skill, index) => <div key={skill} className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-sm text-zinc-200">#{skill}</p><p className="mt-1 text-xs text-zinc-500">{(index + 2) * 126} builders learning</p></div>)}</aside>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.article custom={index} variants={rise as any} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} whileHover={{ y: -6 }} className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-7 transition-colors hover:border-cyan-300/30 hover:bg-white/[0.055] ${feature.className}`}>
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-cyan-300/0 blur-3xl transition group-hover:bg-cyan-300/10" />
      <div className="relative"><div className="mb-14 grid size-11 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Icon className="size-5" /></div><h3 className="text-xl font-medium tracking-tight text-white">{feature.title}</h3><p className="mt-3 max-w-sm leading-7 text-zinc-400">{feature.description}</p></div>
    </motion.article>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 via-[#121224] to-violet-500/20 px-6 py-20 text-center sm:px-16">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
        <div className="relative mx-auto max-w-2xl"><Sparkles className="mx-auto size-6 text-cyan-200" /><h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">The internet is full of code. Build where the people are.</h2><p className="mt-5 text-lg leading-8 text-zinc-300">Create your CPA profile and turn the things you learn and ship into a body of work.</p><Link href="/register" className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-100">Create your profile <ArrowRight className="size-4" /></Link></div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const heroAnimation = reduceMotion ? {} : { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as any } };

  return (
    <main className="min-h-screen overflow-hidden bg-[#050509] text-zinc-100 selection:bg-cyan-300 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(34,211,238,.14),transparent_36%),radial-gradient(circle_at_85%_30%,rgba(139,92,246,.12),transparent_25%)]" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white"><span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-violet-500 text-sm text-slate-950"><Code2 className="size-5" /></span>Code Plus Academy</Link><div className="flex items-center gap-3"><Link href="/login" className="hidden text-sm text-zinc-300 transition hover:text-white sm:block">Sign in</Link><Link href="/register" className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-200/50 hover:bg-white/10">Join CPA</Link></div></nav>

      <section className="relative z-10 px-5 pb-20 pt-16 sm:pt-24"><motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} animate={heroAnimation as any} className="mx-auto max-w-4xl text-center"><div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[0.07] px-3 py-1.5 text-xs font-medium text-cyan-100"><span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />Built for people who build</div><h1 className="mt-7 text-balance text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl">Your developer journey deserves more than another tab.</h1><p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400 sm:text-xl">Code Plus Academy is a focused space to learn practical skills, share your work, and grow alongside developers who are actually shipping.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200">Start building your profile <ArrowRight className="size-4" /></Link><Link href="/explore" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.05]">Explore the community <Compass className="size-4" /></Link></div><p className="mt-4 text-xs text-zinc-500">Free to join. Make your profile yours.</p></motion.div><ProductPreview /></section>

      <section className="relative z-10 border-y border-white/[0.08] bg-white/[0.025] px-5 py-8"><div className="mx-auto grid max-w-6xl gap-7 sm:grid-cols-3 sm:gap-0">{proof.map(([title, description], index) => <div key={title} className={`text-center ${index < 2 ? "sm:border-r sm:border-white/10" : ""}`}><p className="text-lg font-medium text-white">{title}</p><p className="mt-1 text-sm text-zinc-500">{description}</p></div>)}</div></section>

      <section className="relative z-10 px-5 py-24 sm:py-32"><SectionIntro eyebrow="The CPA experience" title="Everything useful. Nothing that pulls you away from the work." body="Every surface turns developer curiosity into momentum—from the first resource you save to the project you publish." /><div className="mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-3 md:grid-rows-2">{features.map((feature, index) => <FeatureCard key={feature.title} feature={feature} index={index} />)}</div></section>

      <section className="relative z-10 px-5 py-24 sm:py-32"><div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2"><div><p className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-violet-300">For the builders who teach</p><h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Make your expertise discoverable—and your next opportunity closer.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">CPA gives creators a professional home for the work that usually gets scattered across posts, repositories, and bookmarks. Publish a course, resource, article, or tutorial; then let your profile tell the whole story.</p><ul className="mt-8 space-y-4 text-zinc-300">{["A public developer profile built around your actual contributions", "Creator tools for publishing projects, articles, tutorials, and media", "A direct path from discovery to meaningful conversations"].map((item) => <li key={item} className="flex gap-3"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-violet-400/15 text-violet-200"><Check className="size-3" /></span>{item}</li>)}</ul><Link href="/register" className="mt-9 inline-flex items-center gap-2 font-medium text-cyan-200 transition hover:text-cyan-100">Create a creator profile <ArrowRight className="size-4" /></Link></div><div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.025] p-6"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-300 text-lg font-bold text-slate-950">RM</div><div><p className="font-medium text-white">Riya Menon</p><p className="text-sm text-zinc-500">Developer educator · React & DX</p></div></div><div className="mt-6 grid grid-cols-3 gap-3">{[[BookOpen,"Courses"],[FileText,"Articles"],[Github,"Projects"]].map(([Icon, label]) => { const I = Icon as typeof BookOpen; return <div key={label as string} className="rounded-2xl border border-white/10 bg-black/20 p-3"><I className="size-4 text-cyan-200" /><p className="mt-7 text-xs text-zinc-400">{label as string}</p><p className="mt-1 text-lg font-medium text-white">12</p></div>; })}</div><div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Latest contribution</p><p className="mt-2 font-medium text-white">Designing resilient React data flows</p><p className="mt-2 text-sm leading-6 text-zinc-500">A practical guide with patterns, examples, and the mistakes to avoid.</p></div></div></div></section>

      <section className="relative z-10 border-y border-white/[0.08] bg-white/[0.025] px-5 py-24 sm:py-32"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_.85fr]"><div className="order-2 rounded-3xl border border-white/10 bg-[#0b0c14] p-5 lg:order-1"><div className="flex items-center gap-3 border-b border-white/10 pb-4"><div className="grid size-9 place-items-center rounded-full bg-cyan-300 font-bold text-slate-950">K</div><div><p className="text-sm font-medium text-white">Karan invited you to connect</p><p className="text-xs text-zinc-500">Works on full-stack apps and developer tools</p></div></div><div className="mt-5 space-y-3"><div className="mr-12 rounded-2xl rounded-tl-sm bg-white/[0.07] p-3 text-sm text-zinc-300">Your caching write-up was exactly what I needed. How did you handle invalidation?</div><div className="ml-12 rounded-2xl rounded-tr-sm bg-cyan-300/15 p-3 text-sm text-cyan-50">I mapped it by resource ownership. I’ll send over the example repo.</div></div><div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-500">Write a reply <Send className="ml-auto size-4 text-cyan-200" /></div></div><div className="order-1 lg:order-2"><p className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-cyan-300">Your professional network, made practical</p><h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Find the people behind the pull requests.</h2><p className="mt-5 text-lg leading-8 text-zinc-400">Follow creators whose work is useful. Explore profiles by skill and contribution. Move from a good post to a useful conversation in one place.</p><Link href="/network" className="mt-8 inline-flex items-center gap-2 font-medium text-cyan-200 transition hover:text-cyan-100">Meet the network <Users className="size-4" /></Link></div></div></section>

      <FinalCta />
      <footer className="relative z-10 border-t border-white/[0.08] px-5 py-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-zinc-500 sm:flex-row sm:items-center"><p className="flex items-center gap-2 text-zinc-300"><Code2 className="size-4 text-cyan-300" />Code Plus Academy</p><div className="flex gap-5"><Link href="/explore" className="hover:text-white">Explore</Link><Link href="/support" className="hover:text-white">Support</Link><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link></div><p>© {new Date().getFullYear()} CPA</p></div></footer>
    </main>
  );
}
