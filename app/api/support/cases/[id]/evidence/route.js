import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = params;
  const body = await req.json();

  return NextResponse.json({
    success: true,
    message: 'Evidence attached successfully.',
    ticket_id: id,
    evidence_urls: body.evidence_urls || [],
  });
}
