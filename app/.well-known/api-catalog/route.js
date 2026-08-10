import { NextResponse } from 'next/server';

export async function GET() {
  const catalog = {
    linkset: [
      {
        anchor: 'https://www.codeplusacademy.in/api/',
        profile: 'https://www.rfc-editor.org/rfc/rfc9727',
        author: 'Code Plus Academy',
        item: [
          {
            href: 'https://www.codeplusacademy.in/api/notes/search',
            rel: 'service-desc',
            type: 'application/json',
            title: 'Notes Arena Search API'
          },
          {
            href: 'https://www.codeplusacademy.in/api/career/positions',
            rel: 'service-desc',
            type: 'application/json',
            title: 'Career Positions API'
          },
          {
            href: 'https://www.codeplusacademy.in/api/posts',
            rel: 'service-desc',
            type: 'application/json',
            title: 'Explore Content API (Articles, Shorts, Videos & Posts)'
          },
          {
            href: 'https://www.codeplusacademy.in/api/support/cases',
            rel: 'service-desc',
            type: 'application/json',
            title: 'Support & Compliance Cases API'
          }
        ]
      }
    ]
  };

  return NextResponse.json(catalog, {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
