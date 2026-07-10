export const ACCOUNT_TYPES = ['personal', 'professional'];
export const PROFESSIONAL_TYPES = ['creator', 'business'];
export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 10;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const INTEREST_CATEGORIES = [
  {
    category: 'Build',
    items: [
      { slug: 'frontend', label: 'Frontend' },
      { slug: 'backend', label: 'Backend' },
      { slug: 'fullstack', label: 'Fullstack' },
      { slug: 'mobile', label: 'Mobile' },
    ],
  },
  {
    category: 'Cloud',
    items: [
      { slug: 'devops', label: 'DevOps' },
      { slug: 'cloud', label: 'Cloud' },
      { slug: 'infra', label: 'Infrastructure' },
      { slug: 'security', label: 'Security' },
    ],
  },
  {
    category: 'AI & Data',
    items: [
      { slug: 'ai', label: 'AI' },
      { slug: 'ml', label: 'Machine Learning' },
      { slug: 'data', label: 'Data Engineering' },
      { slug: 'analytics', label: 'Analytics' },
    ],
  },
  {
    category: 'Product',
    items: [
      { slug: 'product', label: 'Product' },
      { slug: 'design', label: 'Design Systems' },
      { slug: 'growth', label: 'Growth' },
      { slug: 'founder', label: 'Founder Mode' },
    ],
  },
  {
    category: 'Career',
    items: [
      { slug: 'interviews', label: 'Interviews' },
      { slug: 'system-design', label: 'System Design' },
      { slug: 'open-source', label: 'Open Source' },
      { slug: 'freelance', label: 'Freelance' },
    ],
  },
];

export const INTERESTS = INTEREST_CATEGORIES.flatMap((category) =>
  category.items.map((item) => ({ ...item, category: category.category }))
);

export const isValidInterestSlug = (slug) => INTERESTS.some((interest) => interest.slug === slug);
