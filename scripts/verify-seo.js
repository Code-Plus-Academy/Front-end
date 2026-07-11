const https = require('https');
const http = require('http');

const DOMAIN = process.env.TEST_DOMAIN || 'http://localhost:3000'; // Target the local Next.js instance by default
const ROUTES_TO_TEST = [
  '/',
  '/posts/674d89613ed67ec54d0eb374', // Example post (use a known one if testing prod)
  // '/articles/some-article', // Wait to test dynamic pages when seeded
  // '/courses/some-course',
];

async function fetchHtml(url) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect for testing canonicals if needed, or just report
        console.log(`[Redirect] ${url} -> ${res.headers.location}`);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ html: data, status: res.statusCode, headers: res.headers }));
    }).on('error', reject);
  });
}

async function verifySEO() {
  console.log(`\n=== Starting SEO Verification for ${DOMAIN} ===\n`);
  
  let allPassed = true;

  for (const route of ROUTES_TO_TEST) {
    const url = `${DOMAIN}${route}`;
    console.log(`Testing Route: ${route}`);
    
    try {
      const { html, status } = await fetchHtml(url);
      
      if (status !== 200) {
        console.warn(`⚠️ Warning: Route returned status ${status}\n`);
        continue;
      }

      const issues = [];
      
      // Basic Regex Checks
      const hasTitle = /<title[^>]*>.*?<\/title>/i.test(html);
      if (!hasTitle) issues.push('Missing <title> tag');
      
      const hasMetaDesc = /<meta[^>]*name="description"[^>]*>/i.test(html) || /<meta[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i.test(html);
      if (!hasMetaDesc) issues.push('Missing <meta name="description">');

      const hasCanonical = /<link[^>]*rel="canonical"[^>]*>/i.test(html);
      if (!hasCanonical) issues.push('Missing <link rel="canonical">');

      const hasOgTitle = /<meta[^>]*property="og:title"[^>]*>/i.test(html);
      if (!hasOgTitle) issues.push('Missing <meta property="og:title">');

      // Check for Schema.org JSON-LD (Search intent AI readiness)
      const hasJsonLd = /<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i.test(html);
      if (!hasJsonLd) issues.push('Missing JSON-LD structured data');

      if (issues.length > 0) {
        console.error(`❌ FAILED: ${url}`);
        issues.forEach(i => console.error(`   - ${i}`));
        allPassed = false;
      } else {
        console.log(`✅ PASSED: ${url}`);
      }
      console.log('');
    } catch (e) {
      console.error(`❌ Error fetching ${url}:`, e.message);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('🎉 All tested routes passed SEO verification!');
  } else {
    console.log('⚠️ Some routes failed SEO verification. Check the logs above.');
    process.exitCode = 1;
  }
}

verifySEO();
