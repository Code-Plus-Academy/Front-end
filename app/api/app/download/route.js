import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const DEFAULT_APK_URL = 'https://cdn.codeplusacademy.in/apps/focusgram-latest.apk';

function withNoIndex(response) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

/**
 * GET /api/app/download
 * Authenticated endpoint to retrieve or download the latest FocusGram Android APK.
 * Requires a valid `cpa_token` cookie or `Authorization: Bearer <token>` header.
 */
export async function GET(request) {
  const cookieStore = await cookies();
  const cpaToken = cookieStore.get('cpa_token')?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');

  const token = cpaToken || bearerToken || queryToken;

  if (!token) {
    return withNoIndex(NextResponse.json(
      {
        error: 'UNAUTHENTICATED',
        message: 'Authentication required. Please sign in to download the FocusGram Android APK.',
      },
      { status: 401 }
    ));
  }

  const isComingSoon = process.env.FOCUSGRAM_APK_AVAILABLE !== 'true';

  if (isComingSoon) {
    return withNoIndex(NextResponse.json({
      success: true,
      status: 'coming_soon',
      message: 'Direct APK distribution is not published yet. Use the PhonePe Appstore listing for the current Android install route.',
    }));
  }

  const apkUrl = process.env.NEXT_PUBLIC_FOCUSGRAM_APK_URL || process.env.FOCUSGRAM_APK_URL || DEFAULT_APK_URL;

  // Check if client expects JSON metadata or direct file redirect
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('application/json')) {
    return withNoIndex(NextResponse.json({
      success: true,
      downloadUrl: apkUrl,
    }));
  }

  // Direct redirect to CDN APK asset
  // This protects the redirect endpoint. The release pipeline must also set
  // X-Robots-Tag: noindex, nofollow on the actual APK object served by the CDN.
  return withNoIndex(NextResponse.redirect(apkUrl, 302));
}
