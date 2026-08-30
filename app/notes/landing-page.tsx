"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Search,
  ChevronUp,
  Copy,
  Check,
  FileText,
  Code2,
  BookOpen,
  Terminal,
  Zap,
  Shield,
  Download,
  Users,
  TrendingUp,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   MOCK DATA — rich, self-contained datasets so the page works out-of-box
   ═══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: "all", label: "ALL" },
  { id: "cs", label: "COMPUTER SCIENCE" },
  { id: "dbms", label: "DBMS" },
  { id: "aiml", label: "AI / ML" },
  { id: "webdev", label: "WEB DEV" },
  { id: "dsa", label: "DSA" },
];

const QUERY_PILLS = [
  { label: "topic:DBMS", filter: "dbms" },
  { label: "type:CheatSheet", filter: "all" },
  { label: "sort:Upvotes", filter: "all" },
  { label: "college:SPPU", filter: "cs" },
  { label: "sem:4", filter: "all" },
];

const RESOURCES = [
  {
    id: "r1",
    title: "Database Management Systems — Complete Semester Notes",
    type: "PDF",
    category: "dbms",
    date: "2025-06-12",
    author: "Atharva K.",
    avatar: "AK",
    avatarColor: "#0D6EFD",
    upvotes: 342,
  },
  {
    id: "r2",
    title: "Binary Trees & Graph Traversal — DSA Cheat Sheet",
    type: "MD",
    category: "dsa",
    date: "2025-05-28",
    author: "Priya S.",
    avatar: "PS",
    avatarColor: "#e22718",
    upvotes: 218,
  },
  {
    id: "r3",
    title: "Neural Networks from Scratch — PyTorch Lab Manual",
    type: "CODE",
    category: "aiml",
    date: "2025-06-01",
    author: "Rahul V.",
    avatar: "RV",
    avatarColor: "#0fa336",
    upvotes: 189,
  },
  {
    id: "r4",
    title: "React Server Components — Advanced Patterns Guide",
    type: "PDF",
    category: "webdev",
    date: "2025-05-15",
    author: "Sneha M.",
    avatar: "SM",
    avatarColor: "#1c69d4",
    upvotes: 156,
  },
  {
    id: "r5",
    title: "Operating Systems — SPPU Sem 5 PYQ Collection (2020-2025)",
    type: "PDF",
    category: "cs",
    date: "2025-04-22",
    author: "Amit P.",
    avatar: "AP",
    avatarColor: "#f4b400",
    upvotes: 274,
  },
  {
    id: "r6",
    title: "SQL Injection & Prevention — Cybersecurity Notes",
    type: "MD",
    category: "cs",
    date: "2025-06-08",
    author: "Kavya R.",
    avatar: "KR",
    avatarColor: "#9333EA",
    upvotes: 131,
  },
];

const STATS = [
  { value: "10,000+", label: "NOTES INDEXED" },
  { value: "500+", label: "CONTRIBUTING CODERS" },
  { value: "120+", label: "COLLEGES MAPPED" },
  { value: "50K+", label: "MONTHLY DOWNLOADS" },
];

const MARKDOWN_RAW = `## Binary Search
\`\`\`python
def binary_search(arr, t):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == t:
            return mid
        elif arr[mid] < t:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
\`\`\``;

const CODE_SNIPPET = `// Quick Sort — O(n log n) avg
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = arr.filter(
    (x, i) => x <= pivot && i < arr.length - 1
  );
  const right = arr.filter(x => x > pivot);
  return [
    ...quickSort(left),
    pivot,
    ...quickSort(right)
  ];
}`;

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 1 — ENGINE ROOM HERO
   ═══════════════════════════════════════════════════════════════════════════ */

function HeroSection({
  onPillClick,
}: {
  onPillClick: (filter: string) => void;
}) {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="relative w-full bg-black overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(13,110,253,.06),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-24 pb-20 sm:pt-36 sm:pb-28 text-center">
        {/* Eyebrow */}
        <motion.p
          initial={reduce ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#7e7e7e] mb-6"
        >
          NOTES ARENA — BY CODE PLUS ACADEMY
        </motion.p>

        {/* Main Headline */}
        <motion.h1
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-5xl font-black text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.92] tracking-tight text-white uppercase"
        >
          FIND. DOWNLOAD.
          <br />
          <span className="bg-gradient-to-r from-[#0D6EFD] via-[#6366f1] to-[#e22718] bg-clip-text text-transparent">
            DOMINATE EXAMS.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={reduce ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-[16px] font-light leading-7 text-[#bbbbbb]"
        >
          The open-source note exchange where students upload, verify, and
          download college notes, PYQs, cheat sheets, and lab manuals — indexed
          by college, course, and semester.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/notes/upload"
            className="inline-flex items-center gap-2 rounded-none border border-white bg-white px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-transparent hover:text-white"
          >
            UPLOAD RESOURCE <ArrowUpRight className="size-4" />
          </Link>
          <Link
            href="/notes/colleges"
            className="inline-flex items-center gap-2 rounded-none border border-[#3c3c3c] bg-transparent px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:border-white"
          >
            BROWSE COLLEGES <ArrowUpRight className="size-4" />
          </Link>
        </motion.div>

        {/* Live Query Terminal */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mx-auto mt-14 max-w-2xl"
        >
          <div className="rounded-none border border-[#3c3c3c] bg-[#0d0d0d]">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 border-b border-[#3c3c3c] px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#e22718]" />
              <span className="size-2.5 rounded-full bg-[#f4b400]" />
              <span className="size-2.5 rounded-full bg-[#0fa336]" />
              <span className="ml-3 font-mono text-[10px] tracking-wider text-[#7e7e7e]">
                notes-arena://query
              </span>
            </div>
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Terminal className="size-4 text-[#0D6EFD] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='search "DBMS previous year papers SPPU sem 4"'
                className="flex-1 bg-transparent font-mono text-[13px] text-white placeholder:text-[#7e7e7e] outline-none"
              />
              <Search className="size-4 text-[#7e7e7e] shrink-0" />
            </div>
          </div>

          {/* Query Tag Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {QUERY_PILLS.map((pill) => (
              <button
                key={pill.label}
                onClick={() => onPillClick(pill.filter)}
                className="rounded-none border border-[#3c3c3c] bg-[#1a1a1a] px-3 py-1.5 font-mono text-[11px] tracking-wider text-[#bbbbbb] transition-all hover:border-[#0D6EFD] hover:text-[#0D6EFD]"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 2 — INTERACTIVE FEATURE SHOWROOM (BENTO GRID)
   ═══════════════════════════════════════════════════════════════════════════ */

function MarkdownParseDemo() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="size-4 text-[#0D6EFD]" />
        <span className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#7e7e7e]">
          INSTANT PARSING
        </span>
      </div>
      <h3 className="text-[20px] font-bold text-white uppercase tracking-tight mb-4">
        RAW → RENDERED
      </h3>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-lg overflow-hidden border border-[#3c3c3c]">
        {/* Raw side */}
        <div className="bg-[#0d0d0d] p-4 border-b sm:border-b-0 sm:border-r border-[#3c3c3c] overflow-auto">
          <p className="font-mono text-[10px] text-[#7e7e7e] uppercase tracking-wider mb-2">
            MARKDOWN
          </p>
          <pre className="font-mono text-[11px] text-[#bbbbbb] whitespace-pre-wrap leading-5">
            {MARKDOWN_RAW}
          </pre>
        </div>
        {/* Rendered side */}
        <div className="bg-[#111] p-4 overflow-auto">
          <p className="font-mono text-[10px] text-[#7e7e7e] uppercase tracking-wider mb-2">
            RENDERED
          </p>
          <h4 className="text-[16px] font-bold text-white mb-3">
            Binary Search
          </h4>
          <div className="rounded-sm bg-[#0d0d0d] border border-[#3c3c3c] p-3 font-mono text-[11px] leading-5">
            <span className="text-[#0D6EFD]">def</span>{" "}
            <span className="text-[#e6e6e6]">binary_search</span>
            <span className="text-[#7e7e7e]">(arr, t):</span>
            <br />
            <span className="text-[#7e7e7e]">{"    "}lo, hi = </span>
            <span className="text-[#f4b400]">0</span>
            <span className="text-[#7e7e7e]">, len(arr) - </span>
            <span className="text-[#f4b400]">1</span>
            <br />
            <span className="text-[#0D6EFD]">{"    "}while</span>{" "}
            <span className="text-[#e6e6e6]">lo {"<="} hi:</span>
            <br />
            <span className="text-[#7e7e7e]">{"        "}mid = (lo + hi) // </span>
            <span className="text-[#f4b400]">2</span>
            <br />
            <span className="text-[#0D6EFD]">{"        "}if</span>{" "}
            <span className="text-[#e6e6e6]">arr[mid] == t:</span>
            <br />
            <span className="text-[#0D6EFD]">{"            "}return</span>{" "}
            <span className="text-[#e6e6e6]">mid</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpvoteWidget() {
  const [count, setCount] = useState(127);
  const [voted, setVoted] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="size-4 text-[#0D6EFD]" />
        <span className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#7e7e7e]">
          PEER VERIFICATION
        </span>
      </div>
      <h3 className="text-[20px] font-bold text-white uppercase tracking-tight mb-4">
        COMMUNITY VALIDATED
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-lg border border-[#3c3c3c] bg-[#0d0d0d] p-6">
        {/* Mock note card */}
        <div className="w-full rounded-sm border border-[#3c3c3c] bg-[#1a1a1a] p-4">
          <p className="text-[13px] font-bold text-white truncate">
            DBMS Normalization — Complete Guide
          </p>
          <p className="mt-1 text-[11px] text-[#7e7e7e] font-mono">
            PDF · 24 pages · Sem 4
          </p>
        </div>

        {/* Verification badge */}
        <AnimatePresence mode="wait">
          {voted && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2 rounded-none border border-[#0D6EFD] bg-[#0D6EFD]/10 px-4 py-2"
            >
              <Check className="size-4 text-[#0D6EFD]" />
              <span className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#0D6EFD]">
                VERIFIED
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upvote button */}
        <button
          onClick={() => {
            setVoted(!voted);
            setCount(voted ? count - 1 : count + 1);
          }}
          className={`flex items-center gap-3 rounded-none border px-6 py-3 transition-all ${
            voted
              ? "border-[#0D6EFD] bg-[#0D6EFD]/10 text-[#0D6EFD]"
              : "border-[#3c3c3c] bg-transparent text-white hover:border-[#0D6EFD]"
          }`}
        >
          <ChevronUp className={`size-5 ${voted ? "text-[#0D6EFD]" : ""}`} />
          <span className="font-mono text-[18px] font-bold tabular-nums">
            {count}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[1.5px]">
            UPVOTE
          </span>
        </button>
      </div>
    </div>
  );
}

function SnippetVault() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CODE_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Code2 className="size-4 text-[#0D6EFD]" />
        <span className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#7e7e7e]">
          SNIPPET VAULT
        </span>
      </div>
      <h3 className="text-[20px] font-bold text-white uppercase tracking-tight mb-4">
        COPY. PASTE. SHIP.
      </h3>
      <div className="flex-1 rounded-lg border border-[#3c3c3c] bg-[#0d0d0d] overflow-hidden flex flex-col">
        {/* Terminal header */}
        <div className="flex items-center justify-between border-b border-[#3c3c3c] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#e22718]" />
            <span className="size-2.5 rounded-full bg-[#f4b400]" />
            <span className="size-2.5 rounded-full bg-[#0fa336]" />
            <span className="ml-2 font-mono text-[10px] text-[#7e7e7e]">
              quicksort.js
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded-none border px-3 py-1 text-[10px] font-bold uppercase tracking-[1.5px] transition-all ${
              copied
                ? "border-[#0fa336] text-[#0fa336]"
                : "border-[#3c3c3c] text-[#7e7e7e] hover:border-white hover:text-white"
            }`}
          >
            {copied ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? "COPIED!" : "COPY"}
          </button>
        </div>
        {/* Code body */}
        <div className="flex-1 p-4 overflow-auto">
          <pre className="font-mono text-[12px] leading-6 text-[#e6e6e6] whitespace-pre">
            <code>
              {CODE_SNIPPET.split("\n").map((line, i) => (
                <span key={i} className="block">
                  <span className="inline-block w-6 text-right text-[#3c3c3c] mr-4 select-none">
                    {i + 1}
                  </span>
                  {line
                    .replace(
                      /(function|const|return|if)/g,
                      "§KW§$1§/KW§"
                    )
                    .replace(/('.*?'|".*?")/g, "§STR§$1§/STR§")
                    .replace(/(\/\/.*)/g, "§CMT§$1§/CMT§")
                    .split(/§(KW|STR|CMT|\/KW|\/STR|\/CMT)§/)
                    .reduce((acc: any[], token, idx, arr) => {
                      if (token === "KW") {
                        acc.push(
                          <span key={`${i}-${idx}`} className="text-[#0D6EFD]">
                            {arr[idx + 1]}
                          </span>
                        );
                        return acc;
                      }
                      if (token === "STR") {
                        acc.push(
                          <span key={`${i}-${idx}`} className="text-[#0fa336]">
                            {arr[idx + 1]}
                          </span>
                        );
                        return acc;
                      }
                      if (token === "CMT") {
                        acc.push(
                          <span key={`${i}-${idx}`} className="text-[#7e7e7e]">
                            {arr[idx + 1]}
                          </span>
                        );
                        return acc;
                      }
                      if (
                        token === "/KW" ||
                        token === "/STR" ||
                        token === "/CMT"
                      )
                        return acc;
                      if (
                        idx > 0 &&
                        (arr[idx - 1] === "KW" ||
                          arr[idx - 1] === "STR" ||
                          arr[idx - 1] === "CMT")
                      )
                        return acc;
                      acc.push(<span key={`${i}-${idx}`}>{token}</span>);
                      return acc;
                    }, [])}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function BentoGrid() {
  const reduce = useReducedMotion();
  return (
    <section className="w-full bg-black">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:py-24">
        {/* Section head */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#0D6EFD] mb-3">
            / INTERACTIVE FEATURES
          </p>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-bold text-white uppercase tracking-tight leading-[1.05]">
            THE FEATURE SHOWROOM
          </h2>
          <p className="mt-3 max-w-xl text-[15px] font-light text-[#bbbbbb] leading-7">
            Every tool you need to upload, verify, and share study
            material — built into the platform.
          </p>
        </motion.div>

        {/* 3-column async bento grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {/* Card 1: Parsing Demo — spans 2 cols */}
          <motion.div
            variants={fadeUp}
            custom={0}
            className="md:col-span-2 rounded-lg border border-[#3c3c3c] bg-[#1A181B] p-6 min-h-[380px]"
          >
            <MarkdownParseDemo />
          </motion.div>

          {/* Card 2: Peer Verification */}
          <motion.div
            variants={fadeUp}
            custom={1}
            className="rounded-lg border border-[#3c3c3c] bg-[#1A181B] p-6 min-h-[380px]"
          >
            <UpvoteWidget />
          </motion.div>

          {/* Card 3: Snippet Vault — full width */}
          <motion.div
            variants={fadeUp}
            custom={2}
            className="md:col-span-3 rounded-lg border border-[#3c3c3c] bg-[#1A181B] p-6 min-h-[320px]"
          >
            <SnippetVault />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 3 — TECHNICAL RESOURCE GRID
   ═══════════════════════════════════════════════════════════════════════════ */

function ResourceGrid({ activeCategory }: { activeCategory: string }) {
  const [cat, setCat] = useState(activeCategory);
  const reduce = useReducedMotion();

  // Sync external filter changes
  useEffect(() => {
    setCat(activeCategory);
  }, [activeCategory]);

  const filtered =
    cat === "all"
      ? RESOURCES
      : RESOURCES.filter((r) => r.category === cat);

  const typeBadgeColor: Record<string, string> = {
    PDF: "text-[#e22718] border-[#e22718]/30",
    CODE: "text-[#0D6EFD] border-[#0D6EFD]/30",
    MD: "text-[#0fa336] border-[#0fa336]/30",
  };

  return (
    <section className="w-full bg-[#0d0d0d]">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:py-24">
        {/* Section head */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#0D6EFD] mb-3">
            / RESOURCE LIBRARY
          </p>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-bold text-white uppercase tracking-tight leading-[1.05] mb-8">
            STUDY MATERIAL GRID
          </h2>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-0 border-b border-[#3c3c3c] mb-10">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-5 py-3 text-[12px] font-bold uppercase tracking-[1.5px] transition-colors border-b-2 -mb-px ${
                cat === c.id
                  ? "border-white text-white"
                  : "border-transparent text-[#7e7e7e] hover:text-[#bbbbbb]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <motion.div
          key={cat}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {(filtered.length > 0 ? filtered : RESOURCES.slice(0, 3)).map(
            (resource) => (
              <div
                key={resource.id}
                className="group relative rounded-none border border-[#3c3c3c] bg-[#1A181B] p-6 transition-all duration-300 hover:scale-[1.02] hover:border-[#0D6EFD] hover:shadow-[0_0_24px_rgba(13,110,253,0.08)]"
              >
                {/* Type badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`rounded-none border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${
                      typeBadgeColor[resource.type] || "text-white border-[#3c3c3c]"
                    }`}
                  >
                    {resource.type}
                  </span>
                  <span className="text-[11px] text-[#7e7e7e] font-mono">
                    {resource.date}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-[15px] font-bold text-white leading-snug mb-4 line-clamp-2">
                  {resource.title}
                </h4>

                {/* Author + Upvotes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="grid size-7 place-items-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: resource.avatarColor }}
                    >
                      {resource.avatar}
                    </div>
                    <span className="text-[12px] text-[#bbbbbb]">
                      {resource.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-[#7e7e7e]">
                    <ChevronUp className="size-3.5" />
                    <span className="font-mono tabular-nums">
                      {resource.upvotes}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <Link
                  href="/notes"
                  className="mt-5 flex items-center gap-2 rounded-none border border-[#3c3c3c] bg-transparent px-4 py-2.5 text-[11px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:border-white group-hover:border-[#0D6EFD] group-hover:text-[#0D6EFD] w-full justify-center"
                >
                  VIEW RESOURCE <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            )
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 4 — TELEMETRY STATS BANNER
   ═══════════════════════════════════════════════════════════════════════════ */

function TelemetryBanner() {
  const reduce = useReducedMotion();
  return (
    <section className="w-full bg-black">
      {/* M Tricolor Stripe */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#0066b1]" />
        <div className="flex-1 bg-[#1c69d4]" />
        <div className="flex-1 bg-[#e22718]" />
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:py-20">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? {} : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <p className="font-mono text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-white tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[1.5px] text-[#7e7e7e]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 5 — CTA BAND & FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

function CtaBand() {
  return (
    <section className="w-full bg-[#0d0d0d] border-t border-[#3c3c3c]">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:py-28 text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#0D6EFD] mb-5">
          / OPEN CONTRIBUTION
        </p>
        <h2 className="mx-auto max-w-3xl text-[clamp(1.75rem,5vw,3.5rem)] font-bold text-white uppercase tracking-tight leading-[1.05]">
          YOUR NOTES COULD HELP
          <br />
          THOUSANDS PASS.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15px] font-light text-[#bbbbbb] leading-7">
          Upload your semester notes, PYQs, and lab manuals. Get upvotes, build
          your contributor profile, and help students at your college.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/notes/upload"
            className="inline-flex items-center gap-2 rounded-none border border-white bg-white px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-transparent hover:text-white"
          >
            START UPLOADING <ArrowUpRight className="size-4" />
          </Link>
          <Link
            href="/notes/departments"
            className="inline-flex items-center gap-2 rounded-none border border-[#3c3c3c] bg-transparent px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:border-white"
          >
            BROWSE DEPARTMENTS <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="w-full bg-black border-t border-[#3c3c3c]">
      {/* M Tricolor Stripe */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#0066b1]" />
        <div className="flex-1 bg-[#1c69d4]" />
        <div className="flex-1 bg-[#e22718]" />
      </div>
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/notes-arena-logo.svg"
                alt="Notes Arena"
                width={160}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 text-[13px] font-light text-[#7e7e7e] max-w-xs">
              The open-source study material exchange by Code Plus Academy.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8">
            {[
              { label: "BROWSE", href: "/notes/colleges" },
              { label: "UPLOAD", href: "/notes/upload" },
              { label: "DEPARTMENTS", href: "/notes/departments" },
              { label: "COMMUNITY", href: "/feed" },
              { label: "SUPPORT", href: "/support" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#7e7e7e] transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#7e7e7e]">
            © {new Date().getFullYear()} Code Plus Academy. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-[11px] text-[#7e7e7e] hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[11px] text-[#7e7e7e] hover:text-white transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NotesArenaLanding() {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <main className="min-h-screen w-full bg-black text-white selection:bg-[#0D6EFD] selection:text-black overflow-x-hidden">
      <HeroSection onPillClick={setActiveFilter} />
      <BentoGrid />
      <ResourceGrid activeCategory={activeFilter} />
      <TelemetryBanner />
      <CtaBand />
      <LandingFooter />
    </main>
  );
}
