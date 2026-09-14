#!/usr/bin/env node
/**
 * Multi-Tier Automated Quality Loop Audit Script
 * Verifies Production-Grade SEO, Performance, Semantic DOM, and UI Tokens.
 */

import fs from 'fs';
import path from 'path';

export function auditMetadata({ title, description, subjectName, collegeName, typeLabel = 'PYQ' }) {
  const issues = [];
  const warnings = [];

  // 1. Pixel estimation (~9.5px avg per char for 18px Arial font)
  const approxTitlePx = Math.round(title.length * 9.5);
  const approxDescPx = Math.round(description.length * 5.8);

  // 2. Title checks
  if (title.length > 60) {
    issues.push(`Title exceeds 60 chars (Current: ${title.length} chars, ~${approxTitlePx}px)`);
  } else if (title.length > 58) {
    warnings.push(`Title is slightly long (${title.length} chars, ~${approxTitlePx}px, recommended <= 58)`);
  }

  if (approxTitlePx > 580) {
    issues.push(`Title pixel length exceeds 580px (Estimated: ${approxTitlePx}px)`);
  }

  // Check for repeated subject name in title
  if (subjectName && subjectName.length > 4) {
    const regex = new RegExp(subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = title.match(regex);
    if (matches && matches.length > 1) {
      issues.push(`Duplicate subject keyword detected in title: "${subjectName}" appears ${matches.length} times`);
    }
  }

  // 3. Description checks
  if (description.length > 160) {
    issues.push(`Description exceeds 160 chars (Current: ${description.length} chars, ~${approxDescPx}px)`);
  } else if (description.length < 120) {
    warnings.push(`Description is too short (${description.length} chars, recommended 140-155)`);
  }

  if (approxDescPx > 1000) {
    issues.push(`Description pixel length exceeds 1000px (Estimated: ${approxDescPx}px)`);
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
    titleLen: title.length,
    titlePx: approxTitlePx,
    descLen: description.length,
    descPx: approxDescPx,
  };
}

export function synthesizeSmartMetadata(note) {
  const typeLabels = {
    question_paper: 'PYQ',
    notes: 'Notes',
    book: 'Book',
    assignment: 'Assignment',
    cheatsheet: 'Cheatsheet',
    video_link: 'Video',
    project_report: 'Project',
    lab_manual: 'Lab Manual',
    roadmap: 'Roadmap',
    other: 'Resource',
  };

  const typeLabel = typeLabels[note.type] || 'Resource';
  const rawTitle = (note.title || 'Study Resource').trim();
  const subject = (note.subject_name || note.topic_name || '').trim();
  const college = (note.college_name || '').trim();
  const sem = note.semester ? `Sem ${note.semester}` : '';

  // Clean and deduplicate title
  let cleanTitle = rawTitle;
  const lowerTitle = rawTitle.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  const containsSubject = lowerSubject && lowerTitle.includes(lowerSubject);
  const containsType = lowerTitle.includes(typeLabel.toLowerCase()) || lowerTitle.includes('pyq') || lowerTitle.includes('paper');

  if (!containsSubject && subject) {
    cleanTitle = `${cleanTitle} — ${subject}`;
  }
  if (!containsType) {
    cleanTitle = `${cleanTitle} ${typeLabel}`;
  }

  // Normalize separators
  cleanTitle = cleanTitle.replace(/\s*[|—–-]\s*[|—–-]\s*/g, ' — ').replace(/\s+/g, ' ').trim();

  // Strict clamp so `title + " | Notes Arena"` (14 chars) stays <= 58 chars (<550px)
  const maxMainLen = 42;
  if (cleanTitle.length > maxMainLen) {
    cleanTitle = cleanTitle.slice(0, maxMainLen).trim().replace(/\s+[^\s]+$/, '');
    cleanTitle = `${cleanTitle}...`;
  }
  const finalTitle = `${cleanTitle} | Notes Arena`;

  // Synthesize concise 145-155 char meta description
  let rawDesc = (note.description || '').replace(/\s+/g, ' ').trim();
  let finalDesc = '';

  if (rawDesc && rawDesc.length >= 100) {
    if (rawDesc.length > 155) {
      let trimmed = rawDesc.slice(0, 150).trim().replace(/\s+[^\s]+$/, '');
      finalDesc = `${trimmed}...`;
    } else {
      finalDesc = rawDesc;
    }
  } else {
    const parts = [
      `Download ${rawTitle}`,
      sem ? `for ${sem}` : '',
      subject ? `(${subject})` : '',
      college ? `from ${college}` : 'on Notes Arena',
      `. Free PDF preview, answers & syllabus question bank.`,
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').replace(/\s+\./g, '.');

    if (parts.length > 155) {
      let trimmed = parts.slice(0, 150).trim().replace(/\s+[^\s]+$/, '');
      finalDesc = `${trimmed}...`;
    } else {
      finalDesc = parts;
    }
  }

  return { title: finalTitle, description: finalDesc };
}

// -------------------------------------------------------------
// GATE 1: Multi-Scenario Metadata Synthesis Verification
// -------------------------------------------------------------
const testCases = [
  {
    name: 'KGDM Long Title with duplicated subject',
    note: {
      id: 'test-1',
      title: 'KGDM College Niphad – Principles of Digital Electronics Internal Exam | F.Y.B.Sc(CS) Sem 2, March 2026',
      type: 'question_paper',
      subject_name: 'Principles of Digital Electronics',
      college_name: "M.V.P.'s K.G.D.M. College, Niphad",
      semester: 2,
      description: 'Internal examination question paper for "Principles of Digital Electronics," F.Y.B.Sc. (Computer Science), NEP-2024 Pattern, Semester II, from M.V.P.\'s K.G.D.M. Arts, Commerce & Science College, Niphad (dated 24/03/2026, 20 marks). Covers octal number system, universal gates, ASCII/BCD, positive/negative logic, K-maps, even/odd parity, SOP/POS forms, EX-OR as parity checker, minterm/maxterm, binary addition rules, alphanumeric codes, 2\'s complement subtraction, AND/OR/NOT gate truth tables, number base conversions, and binary-to-gray code converter design.',
    },
  },
  {
    name: 'Short Title note with empty description',
    note: {
      id: 'test-2',
      title: 'DBMS Unit 1 Notes',
      type: 'notes',
      subject_name: 'Database Management Systems',
      college_name: 'SPPU',
      semester: 4,
      description: '',
    },
  },
  {
    name: 'Standard SPPU OS PYQ',
    note: {
      id: 'test-3',
      title: 'Operating Systems Previous Year Papers (SPPU Comp Sem 5)',
      type: 'question_paper',
      subject_name: 'Operating Systems',
      college_name: 'Savitribai Phule Pune University',
      semester: 5,
      description: 'Download Operating Systems Previous Year Question Papers (PYQs) for SPPU Computer Science Semester 5.',
    },
  },
];

console.log('\n======================================================');
console.log('🚀 RUNNING PRODUCTION-GRADE MULTI-TIER QUALITY AUDIT');
console.log('======================================================\n');

let allPassed = true;

console.log('--- GATE 1: METADATA & PIXEL ACCURACY AUDIT ---');
for (const tc of testCases) {
  const synth = synthesizeSmartMetadata(tc.note);
  const audit = auditMetadata({
    title: synth.title,
    description: synth.description,
    subjectName: tc.note.subject_name,
    collegeName: tc.note.college_name,
    typeLabel: 'PYQ',
  });

  console.log(`\nScenario: [${tc.name}]`);
  console.log(`  Title: "${synth.title}" (${audit.titleLen} chars, ~${audit.titlePx}px)`);
  console.log(`  Desc:  "${synth.description}" (${audit.descLen} chars, ~${audit.descPx}px)`);
  if (!audit.passed) {
    console.error(`  ❌ FAILED Gate 1:`, audit.issues);
    allPassed = false;
  } else {
    console.log(`  ✅ PASSED Gate 1 (Pixel limits satisfied)`);
  }
}

// -------------------------------------------------------------
// GATE 2: App Router & Layout Code Inspection
// -------------------------------------------------------------
console.log('\n--- GATE 2: CODE HYGIENE & ROUTE SAFETY AUDIT ---');

const layoutPath = path.resolve('app/layout.jsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
if (layoutContent.includes('rel="apple-touch-icon"')) {
  console.log('  ✅ Apple touch icon verified in app/layout.jsx');
} else {
  console.error('  ❌ Missing apple-touch-icon in app/layout.jsx');
  allPassed = false;
}

const pagePath = path.resolve('app/notes/resource/[resourceSlug]/page.jsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');

if (pageContent.includes('export const revalidate = 3600')) {
  console.log('  ✅ ISR Edge Caching (revalidate = 3600) verified in resource page');
} else {
  console.error('  ❌ Missing ISR revalidate setting in resource page');
  allPassed = false;
}

if (pageContent.includes('cache(') && pageContent.includes('getNoteData')) {
  console.log('  ✅ React cache() memoization verified for getNoteData');
} else {
  console.error('  ❌ Missing cache() wrapper for getNoteData');
  allPassed = false;
}

if (pageContent.includes('<nav aria-label="Breadcrumb">') && pageContent.includes('BreadcrumbList')) {
  console.log('  ✅ Semantic Breadcrumbs & BreadcrumbList Schema.org verified');
} else {
  console.error('  ❌ Missing semantic Breadcrumbs or BreadcrumbList Schema.org');
  allPassed = false;
}

const removedPagePath = path.resolve('src/components/ui/RemovedContentPage.jsx');
const removedContent = fs.readFileSync(removedPagePath, 'utf8');
if (!removedContent.includes("from 'react-router-dom'")) {
  console.log('  ✅ Clean next/navigation router verified in RemovedContentPage (no react-router-dom)');
} else {
  console.error('  ❌ react-router-dom import detected in RemovedContentPage');
  allPassed = false;
}

// -------------------------------------------------------------
// GATE 3: Summary and Verdict
// -------------------------------------------------------------
console.log('\n======================================================');
if (allPassed) {
  console.log('🏆 100% PRODUCTION-GRADE QUALITY GATES PASSED!');
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error('❌ QUALITY GATES FAILED - REVISION REQUIRED');
  console.log('======================================================\n');
  process.exit(1);
}
