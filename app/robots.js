export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/api/', '/admin/'], // Hide non-public routes from crawlers
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
