import { NextResponse } from 'next/server';

// 24-hour LRU in-memory cache
const previewCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCached(url) {
  const item = previewCache.get(url);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    previewCache.delete(url);
    return null;
  }
  return item.data;
}

function setCached(url, data) {
  if (previewCache.size >= 1000) {
    const firstKey = previewCache.keys().next().value;
    if (firstKey) previewCache.delete(firstKey);
  }
  previewCache.set(url, { timestamp: Date.now(), data });
}

function isPrivateIp(hostname) {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower === '0.0.0.0') {
    return true;
  }
  if (lower === '169.254.169.254' || lower.includes('internal') || lower.endsWith('.local')) {
    return true;
  }
  return false;
}

function extractMeta(html, propertyOrName) {
  const ogRegex = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${propertyOrName}["'][^>]+content=["']([^"']*)["']`, 'i');
  const match = html.match(ogRegex);
  if (match && match[1]) return match[1];

  const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["'](?:og:|twitter:)?${propertyOrName}["']`, 'i');
  const reverseMatch = html.match(reverseRegex);
  if (reverseMatch && reverseMatch[1]) return reverseMatch[1];

  return null;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL_REQUIRED' }, { status: 400 });
    }

    url = url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'INVALID_URL' }, { status: 400 });
    }

    const cached = getCached(url);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    if (isPrivateIp(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'FORBIDDEN_URL' }, { status: 403 });
    }

    const domain = parsedUrl.hostname.replace(/^www\./i, '');
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CPA-Preview/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      let title = extractMeta(html, 'title');
      if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        if (titleMatch && titleMatch[1]) title = titleMatch[1];
      }

      let description = extractMeta(html, 'description');
      let image = extractMeta(html, 'image');

      if (title) title = title.trim().slice(0, 160);
      if (description) description = description.trim().slice(0, 300);
      if (image && !/^https?:\/\//i.test(image)) {
        try {
          image = new URL(image, url).href;
        } catch {
          image = null;
        }
      }

      const previewData = {
        url,
        domain,
        favicon,
        title: title || domain,
        description: description || `Visit ${domain}`,
        image: image || null,
        contentType: 'website',
        badge: '🌐 Web',
        isInternal: false,
      };

      setCached(url, previewData);
      return NextResponse.json({ success: true, data: previewData });
    } catch {
      const fallbackData = {
        url,
        domain,
        favicon,
        title: domain,
        description: null,
        image: null,
        contentType: 'website',
        badge: '🌐 Web',
        isInternal: false,
      };
      return NextResponse.json({ success: true, data: fallbackData });
    }
  } catch (err) {
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
