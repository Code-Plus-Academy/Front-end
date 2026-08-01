import { NextResponse } from 'next/server';

export async function GET(req) {
  return NextResponse.json({
    transactional_enabled: true,
    promotional_enabled: true,
    digest_frequency: 'weekly',
  });
}

export async function POST(req) {
  const body = await req.json();
  return NextResponse.json({
    success: true,
    message: 'Email notification preferences updated successfully.',
    preferences: {
      transactional_enabled: body.transactional_enabled ?? true,
      promotional_enabled: body.promotional_enabled ?? true,
      digest_frequency: body.digest_frequency || 'weekly',
    },
  });
}
