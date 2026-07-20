import { SPPU_BSC_CS_NEP_SUBJECTS } from '../src/data/sppuSyllabus';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.codeplusacademy.in';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  const currentDate = new Date();

  // Static routes
  const routes = [
    { url: baseUrl, lastModified: currentDate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/explore`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/register`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/cookie-policy`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/copyright-policy`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/legal/grievance-officer`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/support`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/creator`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/feed`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/network`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/shorts`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/videos`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.8 },
    
    // Notes Arena Main Hubs
    { url: `${baseUrl}/notes`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/notes/colleges`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/notes/colleges/add`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/notes/departments`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/notes/search`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.85 },
    { url: `${baseUrl}/notes/upload`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Colleges to index in sitemap
  const knownCollegeSlugs = [
    'sppu',
    'du',
    'karmaveer-ganpat-data-more-arts-commerce-and-science-college-niphad-422303-4fe1f4',
  ];

  const knownCourses = ['bachelor-of-computer-science-nep', 'bsc-cs', 'be-comp', 'mca', 'bba-ca'];

  // Add College, Course, and Semester URLs to sitemap
  knownCollegeSlugs.forEach(colSlug => {
    routes.push({
      url: `${baseUrl}/notes/colleges/${colSlug}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    });

    knownCourses.forEach(courseSlug => {
      routes.push({
        url: `${baseUrl}/notes/colleges/${colSlug}/${courseSlug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.85,
      });

      // Add Semesters 1 to 8
      for (let sem = 1; sem <= 8; sem++) {
        routes.push({
          url: `${baseUrl}/notes/colleges/${colSlug}/${courseSlug}/sem-${sem}`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority: 0.8,
        });

        // Add SPPU NEP Subjects for Semesters 1 to 8
        const semSubjects = SPPU_BSC_CS_NEP_SUBJECTS[sem] || [];
        semSubjects.forEach(sub => {
          routes.push({
            url: `${baseUrl}/notes/colleges/${colSlug}/${courseSlug}/sem-${sem}/${sub.slug}`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.75,
          });
        });
      }
    });
  });

  const safeDate = (dateVal) => {
    const d = dateVal ? new Date(dateVal) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Fetch dynamic database items (Users, Articles, Notes Resources)
  try {
    const backendSitemapUrl = apiUrl.replace('/api', '') + '/sitemap.xml?format=json';
    const res = await fetch(backendSitemapUrl, { next: { revalidate: 1800 } }); // 30 mins revalidation
    
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

      if (data.articles) {
        data.articles.forEach(a => routes.push({
          url: `${baseUrl}/articles/${a.slug}`,
          lastModified: safeDate(a.updated_at),
          changeFrequency: 'weekly',
          priority: 0.75
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

      if (data.notesColleges) {
        data.notesColleges.forEach(c => {
          if (!knownCollegeSlugs.includes(c.slug)) {
            routes.push({
              url: `${baseUrl}/notes/colleges/${c.slug}`,
              lastModified: safeDate(c.updated_at),
              changeFrequency: 'weekly',
              priority: 0.85
            });
          }
        });
      }

      if (data.notesApproved) {
        data.notesApproved.forEach(n => routes.push({
          url: `${baseUrl}/notes/resource/${n.slug}`,
          lastModified: safeDate(n.updated_at),
          changeFrequency: 'weekly',
          priority: 0.85
        }));
      }
    }
  } catch (err) {
    if (err.message && err.message.includes('fetch failed')) {
      console.log('Sitemap: Backend API is offline during build. Built comprehensive static + SPPU taxonomy routes.');
    } else {
      console.error('Error fetching dynamic sitemap data from backend:', err.message);
    }
  }

  return routes;
}
