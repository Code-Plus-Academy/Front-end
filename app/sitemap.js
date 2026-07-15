export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  // Static routes
  const routes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
    { url: `${baseUrl}/support`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/creator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/feed`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/network`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/shorts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/videos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    
    // Notes Arena Static Routes
    { url: `${baseUrl}/notes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/notes/colleges`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/notes/departments`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const safeDate = (dateVal) => {
    const d = dateVal ? new Date(dateVal) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  };

  try {
    const backendSitemapUrl = apiUrl.replace('/api', '') + '/sitemap.xml?format=json';
    const res = await fetch(backendSitemapUrl, { next: { revalidate: 3600 } }); // Cache for 1 hour
    
    if (res.ok) {
      const data = await res.json();
      
      if (data.users) {
        data.users.forEach(u => routes.push({
          url: `${baseUrl}/u/${u.username}`,
          lastModified: safeDate(u.updated_at),
          changeFrequency: 'daily',
          priority: 0.7
        }));
      }
      
      if (data.posts) {
        data.posts.forEach(p => routes.push({
          url: `${baseUrl}/posts/${p.id}`,
          lastModified: safeDate(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6
        }));
      }

      if (data.articles) {
        data.articles.forEach(a => routes.push({
          url: `${baseUrl}/articles/${a.slug}`,
          lastModified: safeDate(a.updated_at),
          changeFrequency: 'monthly',
          priority: 0.7
        }));
      }

      if (data.courses) {
        data.courses.forEach(c => routes.push({
          url: `${baseUrl}/courses/${c.slug}`,
          lastModified: safeDate(c.updated_at),
          changeFrequency: 'monthly',
          priority: 0.8
        }));
      }

      if (data.resources) {
        data.resources.forEach(r => routes.push({
          url: `${baseUrl}/resources/${r.slug}`,
          lastModified: safeDate(r.updated_at),
          changeFrequency: 'monthly',
          priority: 0.7
        }));
      }

      // Add dynamic Notes Arena resource maps
      if (data.notesColleges) {
        data.notesColleges.forEach(c => routes.push({
          url: `${baseUrl}/notes/colleges/${c.slug}`,
          lastModified: safeDate(c.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8
        }));
      }

      if (data.notesApproved) {
        data.notesApproved.forEach(n => routes.push({
          url: `${baseUrl}/notes/resource/${n.slug}`,
          lastModified: safeDate(n.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching dynamic sitemap data from backend:', err.message);
  }

  return routes;
}
