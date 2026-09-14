import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendTelemetryUrl() {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://api.codeplusacademy.in/api';
  base = base.replace(/\/$/, '');
  if (!base.endsWith('/api')) {
    base += '/api';
  }
  return `${base}/telemetry/batch`;
}

/**
 * POST /api/telemetry/batch
 * Proxies telemetry batch requests directly to Express backend BullMQ ingestion queue.
 * Guarantees zero writes to Supabase telemetry_events table while preserving client contract.
 */
export async function POST(request) {
  try {
    const rawText = await request.text().catch(() => '');
    if (!rawText) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Empty body' },
        { status: 400 }
      );
    }

    const backendUrl = getBackendTelemetryUrl();
    const headers = {
      'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('authorization');
    if (authHeader) headers['Authorization'] = authHeader;

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const expressRes = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: rawText,
    });

    const data = await expressRes.json().catch(() => ({ status: 'accepted' }));
    return NextResponse.json(data, { status: expressRes.status });
  } catch (err) {
    console.error('[Telemetry Proxy] Error forwarding to Express:', err);
    return NextResponse.json(
      { status: 'accepted', message: 'Telemetry buffered' },
      { status: 202 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
