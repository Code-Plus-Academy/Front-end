/**
 * scripts/integrate-searchpage-projects-tab.js
 *
 * Idempotent codemod: inserts the Projects tab into the legacy
 * src/views/SearchPage.jsx using exact string anchors — never a rewrite.
 * Run from the repository root:
 *
 *   node scripts/integrate-searchpage-projects-tab.js
 *
 * Each insertion is applied only if its anchor is present and the target
 * text is not already there (safe to re-run; exits non-zero on any anchor
 * miss so drift is caught instead of silently skipped).
 *
 * After running, verify with:
 *   grep -c "ProjectSearchResults" src/views/SearchPage.jsx   # expect >= 2
 *   npm run build
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'views', 'SearchPage.jsx');

// [name, anchor (must exist verbatim), insertion (added directly AFTER anchor)]
const INSERTIONS = [
  [
    'lucide FolderGit2 import',
    "  GraduationCap,\n} from 'lucide-react';",
    "  GraduationCap,\n  FolderGit2,\n} from 'lucide-react';",
  ],
  [
    'ProjectSearchResults import',
    "} from 'lucide-react';",
    "} from 'lucide-react';\nimport ProjectSearchResults from '../components/projects/ProjectSearchResults';",
  ],
  [
    'SEARCH_TABS entry',
    "  { id: 'Notes', label: 'Notes', icon: GraduationCap },",
    "  { id: 'Notes', label: 'Notes', icon: GraduationCap },\n  { id: 'Projects', label: 'Projects', icon: FolderGit2 },",
  ],
  [
    'renderTabContent Projects branch',
    "    if (activeTab === 'Topics' || activeTab === 'Tags') {",
    [
      "    if (activeTab === 'Projects') {",
      "      return (",
      "        <div style={{ background: t.card, borderRadius: 20, padding: 18, border: `1px solid ${t.cardBorder}` }}>",
      "          <ProjectSearchResults query={query} />",
      "        </div>",
      "      );",
      "    }",
      "",
      "    if (activeTab === 'Topics' || activeTab === 'Tags') {",
    ].join('\n'),
  ],
];

let src = fs.readFileSync(FILE, 'utf8');
let changed = false;

for (const [name, anchor, replacement] of INSERTIONS) {
  if (src.includes(replacement) && replacement !== anchor) {
    console.log(`[skip] ${name} — already applied`);
    continue;
  }
  const first = src.indexOf(anchor);
  if (first === -1) {
    const second = src.indexOf(anchor, first + 1); // anchor may repeat
    if (second === -1) {
      console.error(`[FAIL] anchor not found for: ${name}`);
      console.error(`        expected anchor: ${JSON.stringify(anchor.slice(0, 80))}`);
      process.exit(1);
    }
  }
  const count = src.split(anchor).length - 1;
  if (count > 1) {
    console.error(`[FAIL] anchor is ambiguous (${count} occurrences) for: ${name} — manual review required`);
    process.exit(1);
  }
  src = src.replace(anchor, replacement);
  changed = true;
  console.log(`[ok] applied: ${name}`);
}

if (!changed) {
  console.log('Nothing to do — all insertions already present.');
  process.exit(0);
}

fs.writeFileSync(FILE, src);
console.log('Wrote src/views/SearchPage.jsx');
console.log('Next: grep -c "ProjectSearchResults" src/views/SearchPage.jsx  (expect >= 2)');
console.log('Then: npm run build');
