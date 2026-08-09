export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.codeplusacademy.in';
  const isBeta = process.env.NEXT_PUBLIC_APP_URL?.includes('beta.') || process.env.VERCEL_ENV === 'preview';

  if (isBeta) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/notes', '/notes/*'],
      disallow: [
        '/private/', 
        '/api/', 
        '/admin/',
        '/dashboard/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
