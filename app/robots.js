export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/notes/*'],
      disallow: [
        '/private/', 
        '/api/', 
        '/admin/',
        '/notes/upload',
        '/notes/colleges/add',
        '/dashboard/',
        '/creator/'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
