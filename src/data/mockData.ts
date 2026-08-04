import { 
  SocialPost, 
  Story, 
  DeveloperProfile, 
  ArticleTypeInfo, 
  ArticleItem, 
  AcademicNoteItem, 
  ExploreVideo 
} from '../types';

export const MOCK_STORIES: Story[] = [
  { id: '1', authorName: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', hasUnseen: true, title: 'Shipped v2.0 Go microservice!' },
  { id: '2', authorName: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', hasUnseen: true, title: 'OS Lab Manual Notes uploaded' },
  { id: '3', authorName: 'Devon Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', hasUnseen: false, title: 'React 19 Server Components guide' },
  { id: '4', authorName: 'Aarav Mehta', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', hasUnseen: true, title: 'PYQs 2024 for Computer Networks' },
  { id: '5', authorName: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', hasUnseen: false, title: 'Rust memory safety deep-dive' }
];

export const MOCK_POSTS: SocialPost[] = [
  {
    id: 'p1',
    author: {
      name: 'Rohan Deshmukh',
      handle: 'rohan_dev',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
      role: 'Full Stack Engineer @ CPA',
      verified: true
    },
    content: 'Just deployed our custom WebSocket engine for real-time collaboration on CPA Notes Arena! Reduced sync latency from 180ms to 24ms. Here is how we managed connection state in TypeScript:',
    codeSnippet: {
      language: 'typescript',
      code: `export class RealtimeSyncManager {\n  private ws: WebSocket;\n  private patchBuffer: Delta[] = [];\n\n  constructor(private documentId: string) {\n    this.ws = new WebSocket(\`wss://api.codeplusacademy.in/sync/\${documentId}\`);\n    this.ws.onmessage = (event) => this.applyLocalDelta(JSON.parse(event.data));\n  }\n}`
    },
    type: 'snippet',
    difficulty: 'Advanced',
    languageTags: ['TypeScript', 'WebSockets', 'Go'],
    upvotes: 142,
    commentsCount: 28,
    timeAgo: '2h ago',
    isUpvoted: true
  },
  {
    id: 'p2',
    author: {
      name: 'Ananya Gupta',
      handle: 'ananyacodes',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      role: 'B.Tech CSE 3rd Year • Contributor',
      verified: true
    },
    content: 'Uploaded the entire 2021-2024 Solved Previous Year Question Papers (PYQs) for Design & Analysis of Algorithms! Includes step-by-step dynamic programming state transitions.',
    type: 'project_update',
    difficulty: 'Intermediate',
    languageTags: ['Algorithms', 'C++', 'Academic'],
    upvotes: 389,
    commentsCount: 64,
    timeAgo: '5h ago'
  },
  {
    id: 'p3',
    author: {
      name: 'Marcus Chen',
      handle: 'mchen_systems',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      role: 'Systems Architect',
      verified: false
    },
    content: 'What is your go-to strategy when handling database connection pools in serverless environments? Do you prefer PgBouncer, HTTP database proxies, or single persistent runtime instances?',
    type: 'discussion',
    difficulty: 'Advanced',
    languageTags: ['PostgreSQL', 'Database', 'Serverless'],
    upvotes: 87,
    commentsCount: 45,
    timeAgo: '1d ago'
  }
];

export const MOCK_DEVELOPERS: DeveloperProfile[] = [
  {
    id: 'd1',
    name: 'Siddharth Nair',
    handle: 'sid_nair',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    bio: 'Backend Specialist. Building high-throughput microservices in Go & Rust. Contributor to CPA Notes Arena.',
    primaryStack: ['Go', 'Rust', 'PostgreSQL', 'Docker', 'Kubernetes'],
    openToWork: true,
    isHiring: false,
    location: 'Bengaluru, India',
    activityStats: {
      publishedNotes: 18,
      articlesCount: 7,
      projectsBuilt: 4,
      reputation: 1420
    },
    activityDerivedSkills: ['Go Microservices', 'Distributed Systems', 'PostgreSQL Query Optimization', 'Notes Contributor'],
    isFollowing: false
  },
  {
    id: 'd2',
    name: 'Kavya Reddy',
    handle: 'kavyareddy_ui',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    bio: 'Frontend Architect & Design Systems Lead. Passionate about accessible UI, React 19, & Web Performance.',
    primaryStack: ['React', 'TypeScript', 'TailwindCSS', 'Next.js', 'Framer Motion'],
    openToWork: false,
    isHiring: true,
    location: 'Hyderabad, India',
    activityStats: {
      publishedNotes: 12,
      articlesCount: 15,
      projectsBuilt: 9,
      reputation: 2890
    },
    activityDerivedSkills: ['React 19 Architecture', 'Design Systems', 'Web Vitals Optimization', 'CPA Tech Author'],
    isFollowing: true
  },
  {
    id: 'd3',
    name: 'Vikram Joshi',
    handle: 'vjoshi_ml',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150',
    bio: 'AI Researcher & ML Engineer. Fine-tuning LLMs and building retrieval augmented generation pipelines.',
    primaryStack: ['Python', 'PyTorch', 'FastAPI', 'LangChain', 'Vector DBs'],
    openToWork: true,
    isHiring: false,
    location: 'Pune, India',
    activityStats: {
      publishedNotes: 25,
      articlesCount: 11,
      projectsBuilt: 6,
      reputation: 3100
    },
    activityDerivedSkills: ['LLM Fine-tuning', 'PyTorch Models', 'RAG Systems', 'Lab Manual Author'],
    isFollowing: false
  }
];

export const ARTICLE_TYPES: ArticleTypeInfo[] = [
  // Standard & Deep Dives
  { id: 'article', title: 'Standard Article', category: 'standard', categoryLabel: 'Standard & Deep Dives', description: 'Default technical & engineering posts with formatted text & syntax highlighting.', iconName: 'FileText', exampleTitle: 'Building Resilient Microservices with Go' },
  { id: 'deep-dive', title: 'Tech Deep-Dive', category: 'standard', categoryLabel: 'Standard & Deep Dives', description: 'Comprehensive architectural breakdowns, memory models, and system internals.', iconName: 'Cpu', exampleTitle: 'Inside V8: How JavaScript Memory Management Works' },
  { id: 'doc', title: 'Document / Spec', category: 'standard', categoryLabel: 'Standard & Deep Dives', description: 'Formal specifications, API references, and architecture design records (ADRs).', iconName: 'BookOpen', exampleTitle: 'REST API Specification v3.2 for Payment Gateway' },
  { id: 'compare', title: 'Comparison', category: 'standard', categoryLabel: 'Standard & Deep Dives', description: 'Side-by-side technology, framework, and performance benchmark breakdowns.', iconName: 'Scale', exampleTitle: 'Bun vs Node.js vs Deno: 2026 Production Benchmark' },

  // Learning & Education
  { id: 'course', title: 'Course', category: 'learning', categoryLabel: 'Learning & Education', description: 'Structured multi-module courses with exercises and progress tracking.', iconName: 'GraduationCap', exampleTitle: 'Complete Rust Programming: Zero to Production' },
  { id: 'learning', title: 'Learning Path / Roadmap', category: 'learning', categoryLabel: 'Learning & Education', description: 'Step-by-step technical roadmaps for career specialization.', iconName: 'Milestone', exampleTitle: 'DevOps & Site Reliability Engineer Roadmap 2026' },

  // Projects & Repositories
  { id: 'project', title: 'Project Showcase', category: 'projects', categoryLabel: 'Projects & Repositories', description: 'Community project demos, architecture overviews, and live deployments.', iconName: 'Rocket', exampleTitle: 'Building a Distributed Cache Engine in C++' },
  { id: 'repo', title: 'Repository Article', category: 'projects', categoryLabel: 'Projects & Repositories', description: 'Codebase walkthroughs, GitHub repository tours, and open-source guides.', iconName: 'FolderGit2', exampleTitle: 'Under the Hood of React Core Renderer' },

  // Resources & Tooling
  { id: 'resource', title: 'Resource Article', category: 'resources', categoryLabel: 'Resources & Tooling', description: 'Curated developer resource lists, public API collections, and cheat sheets.', iconName: 'Layers', exampleTitle: 'Top 50 Public APIs for Developers in 2026' },
  { id: 'toolkit', title: 'Toolkit', category: 'resources', categoryLabel: 'Resources & Tooling', description: 'Developer toolkits, UI component libraries, and workflow automations.', iconName: 'Wrench', exampleTitle: 'Minimalist Tailwind & Radix UI Design Kit' },
  { id: 'playground', title: 'Code Playground', category: 'resources', categoryLabel: 'Resources & Tooling', description: 'Interactive runnable snippets embedded directly inside technical articles.', iconName: 'Code2', exampleTitle: 'Interactive WebAssembly C++ Simulator' }
];

export const MOCK_ARTICLES: ArticleItem[] = [
  {
    id: 'a1',
    title: 'Understanding Database Indexing: From B-Trees to LSM-Trees',
    type: 'deep-dive',
    categoryLabel: 'Standard & Deep Dives',
    author: {
      name: 'CPA Engineering Team',
      handle: 'cpa_engineering',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150',
      verified: true
    },
    readTime: '12 min read',
    viewCount: 14200,
    clapCount: 1280,
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800',
    publishedAt: 'Yesterday',
    tags: ['Databases', 'B-Trees', 'Performance', 'Storage Engine'],
    snippet: 'An in-depth visual dive into how relational databases organize index pages, compare B+Trees against Log-Structured Merge-Trees, and optimize disk IO.'
  },
  {
    id: 'a2',
    title: 'Quick Read: 5 CSS Anchor Positioning Tricks for 2026',
    type: 'playground',
    categoryLabel: 'Resources & Tooling',
    author: {
      name: 'Kavya Reddy',
      handle: 'kavyareddy_ui',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      verified: true
    },
    readTime: '4 min read',
    viewCount: 8900,
    clapCount: 740,
    gradientBg: 'from-cyan-600 via-indigo-600 to-purple-600',
    isQuickRead: true,
    hasPlayground: true,
    publishedAt: '3 days ago',
    tags: ['CSS', 'Web Dev', 'Interactive Playground'],
    snippet: 'Master native CSS anchor positioning without JavaScript libraries. Try the live interactive sandbox embedded right inside this quick read!'
  },
  {
    id: 'a3',
    title: 'Full Course: Distributed Systems & Consensus Protocols',
    type: 'course',
    categoryLabel: 'Learning & Education',
    author: {
      name: 'Siddharth Nair',
      handle: 'sid_nair',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      verified: false
    },
    readTime: '45 min course',
    viewCount: 22400,
    clapCount: 3100,
    inlineImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
    publishedAt: '1 week ago',
    tags: ['Distributed Systems', 'Raft', 'Paxos', 'Go'],
    snippet: 'A multi-part comprehensive course exploring Paxos, Raft consensus algorithm, vector clocks, and network partition resilience.'
  }
];

export const MOCK_NOTES_ITEMS: AcademicNoteItem[] = [
  {
    id: 'n1',
    title: 'Operating Systems - Complete Lecture Notes & Kernel Architecture',
    resourceType: 'notes',
    resourceTypeLabel: 'Lecture Notes',
    fileFormat: 'pdf',
    scope: 'college',
    institution: 'VTU / Autonomous Autonomous Tech Institutes',
    course: 'B.Tech Computer Science & Engineering',
    semester: 'Semester 4',
    subject: 'Operating Systems (CS402)',
    contributor: {
      name: 'Aarav Mehta',
      role: 'Class Representative & CPA Contributor',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
    },
    downloadsCount: 4210,
    rating: 4.9,
    isVerifiedPR: true,
    fileSize: '14.2 MB PDF'
  },
  {
    id: 'n2',
    title: 'Solved PYQs (2018 - 2024): Design & Analysis of Algorithms',
    resourceType: 'question_paper',
    resourceTypeLabel: 'Previous Year Paper (PYQ)',
    fileFormat: 'pdf',
    scope: 'college',
    institution: 'Anna University / JNTU / Autonomous',
    course: 'B.Tech Information Technology',
    semester: 'Semester 5',
    subject: 'Design & Analysis of Algorithms',
    contributor: {
      name: 'Ananya Gupta',
      role: 'Top Contributor',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    },
    downloadsCount: 8900,
    rating: 5.0,
    isVerifiedPR: true,
    fileSize: '8.7 MB PDF'
  },
  {
    id: 'n3',
    title: 'Computer Networks Practical Lab Manual with Wireshark Screenshots',
    resourceType: 'lab_manual',
    resourceTypeLabel: 'Lab Manual',
    fileFormat: 'pdf',
    scope: 'college',
    institution: 'Mumbai University / SPPU',
    course: 'B.Tech CSE',
    semester: 'Semester 5',
    subject: 'Computer Networks Lab',
    contributor: {
      name: 'Vikram Joshi',
      role: 'Lab Assistant Contributor',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150'
    },
    downloadsCount: 3100,
    rating: 4.8,
    isVerifiedPR: true,
    fileSize: '19.5 MB PDF'
  },
  {
    id: 'n4',
    title: 'Data Structures & Algorithms - Ultimate Revision Cheat Sheet',
    resourceType: 'cheatsheet',
    resourceTypeLabel: 'Cheat Sheet',
    fileFormat: 'image',
    scope: 'department',
    field: 'Computer Science',
    topic: 'Data Structures & Algorithms',
    subject: 'DSA Core Concepts',
    contributor: {
      name: 'Priya Sharma',
      role: 'Lead Academic Reviewer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
    },
    downloadsCount: 12500,
    rating: 4.9,
    isVerifiedPR: true,
    fileSize: '4.1 MB PNG'
  },
  {
    id: 'n5',
    title: 'Standard Textbook Reference: Database System Concepts (Silberschatz)',
    resourceType: 'book',
    resourceTypeLabel: 'Reference Book',
    fileFormat: 'link',
    scope: 'department',
    field: 'Database Systems',
    topic: 'Relational Database Theory',
    subject: 'DBMS',
    contributor: {
      name: 'Rohan Deshmukh',
      role: 'Senior Member',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'
    },
    downloadsCount: 6400,
    rating: 4.7,
    isVerifiedPR: true,
    fileSize: 'External Drive Link'
  }
];

export const MOCK_VIDEOS: ExploreVideo[] = [
  {
    id: 'v1',
    title: 'Building a Full-Stack Social App with React 19 & Go in 45 Minutes',
    channel: 'Code Plus Academy Studio',
    views: '48K views',
    duration: '42:15',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
    isShort: false,
    category: 'Web Dev'
  },
  {
    id: 'v2',
    title: 'How Operating Systems Handle Page Faults in 60 Seconds #shorts',
    channel: 'Ananya Tech Shorts',
    views: '120K views',
    duration: '0:58',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
    isShort: true,
    category: 'Shorts'
  },
  {
    id: 'v3',
    title: 'Deep Learning with PyTorch: Tensor Operations & Backprop Explained',
    channel: 'CPA AI Lab',
    views: '34K views',
    duration: '28:10',
    thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
    isShort: false,
    category: 'AI & ML'
  }
];
