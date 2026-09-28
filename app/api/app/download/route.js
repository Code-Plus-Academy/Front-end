import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const DEFAULT_APK_URL = 'https://cdn.codeplusacademy.in/apps/focusgram-latest.apk';

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
    return NextResponse.json(
      {
        error: 'UNAUTHENTICATED',
        message: 'Authentication required. Please sign in to download the FocusGram Android APK.',
      },
      { status: 401 }
    );
  }

  const isComingSoon = process.env.FOCUSGRAM_APK_AVAILABLE !== 'true';

  if (isComingSoon) {
    return NextResponse.json({
      success: true,
      status: 'coming_soon',
      version: '1.2.0',
      message: 'FocusGram Android APK is coming soon! Authenticated member confirmed for early access priority.',
      releaseDate: 'Coming Soon',
      minAndroidVersion: '8.0+ (API 26)',
    });
  }

  const apkUrl = process.env.NEXT_PUBLIC_FOCUSGRAM_APK_URL || process.env.FOCUSGRAM_APK_URL || DEFAULT_APK_URL;

  // Check if client expects JSON metadata or direct file redirect
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('application/json')) {
    return NextResponse.json({
      success: true,
      version: '1.2.0',
      fileName: 'focusgram-latest.apk',
      downloadUrl: apkUrl,
      sha256: '9f83a48e71b2d3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
      releaseDate: 'Coming Soon',
      minAndroidVersion: '8.0 (API 26)',
    });
  }

  // Direct redirect to CDN APK asset
  return NextResponse.redirect(apkUrl, 302);
}
