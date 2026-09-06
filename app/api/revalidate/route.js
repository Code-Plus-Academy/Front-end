import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-demand revalidation API route.
 *
 * Usage:
 *   GET /api/revalidate?secret=<REVALIDATION_SECRET>&path=/notes
 *   GET /api/revalidate?secret=<REVALIDATION_SECRET>&path=/notes&path=/notes/colleges
 *
 * Set REVALIDATION_SECRET in your Vercel environment variables.
 * If REVALIDATION_SECRET is not set, the route is disabled for safety.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  const expectedSecret = process.env.REVALIDATION_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'REVALIDATION_SECRET not configured on server' },
      { status: 503 }
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const paths = searchParams.getAll('path');

  if (!paths.length) {
    return NextResponse.json(
      { error: 'At least one path query parameter is required' },
      { status: 400 }
    );
  }

  const revalidated = [];

  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to revalidate ${p}`, detail: err.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ revalidated, now: Date.now() });
}
