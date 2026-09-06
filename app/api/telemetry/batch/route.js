import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabaseClient';

export const dynamic = 'force-dynamic';

/**
 * POST /api/telemetry/batch
 * Ingests batched frontend telemetry events (clicks, impressions, dwells, video milestones).
 * Compatible with both fetch(keepalive) and navigator.sendBeacon transports.
 */
export async function POST(request) {
  try {
    let payload = null;

    // Handle both application/json and text/plain (used by sendBeacon Blob)
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await request.json().catch(() => null);
    } else {
      const rawText = await request.text().catch(() => '');
      if (rawText) {
        try {
          payload = JSON.parse(rawText);
        } catch (_) {
          payload = null;
        }
      }
    }

    const events = Array.isArray(payload?.events) ? payload.events : [];

    if (events.length > 0 && supabase) {
      // Map frontend telemetry events to telemetry_events table schema
      const rows = events.map((e) => ({
        id: e.event_id || undefined,
        event_type: String(e.event_type || 'unknown').slice(0, 100),
        session_id: e.session_id || undefined,
        user_id: e.user_id || null,
        post_id: e.post_id || null,
        creator_id: e.creator_id || null,
        position: typeof e.position === 'number' ? e.position : null,
        source: String(e.source || 'feed').slice(0, 50),
        client_timestamp: e.client_timestamp || new Date().toISOString(),
        server_timestamp: new Date().toISOString(),
        metadata: typeof e.metadata === 'object' && e.metadata !== null ? e.metadata : {},
        created_at: new Date().toISOString(),
      }));

      // Non-blocking best-effort insert into Supabase
      supabase
        .from('telemetry_events')
        .insert(rows)
        .then(({ error }) => {
          if (error) {
            // Log as warning rather than error — telemetry ingestion should not fail hard
            console.warn('[Telemetry API] Ingestion warning:', error.message);
          }
        })
        .catch((err) => {
          console.warn('[Telemetry API] Insert error:', err?.message || err);
        });
    }

    // Always respond with 202 Accepted so client resets backoff
    return NextResponse.json(
      { status: 'ok', received: events.length },
      { status: 202 }
    );
  } catch (err) {
    console.error('[Telemetry API] Handler error:', err);
    // Even on parse failure, acknowledge to prevent client retry storm
    return NextResponse.json(
      { status: 'error', message: 'Malformed telemetry payload' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
