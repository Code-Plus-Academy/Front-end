export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

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
