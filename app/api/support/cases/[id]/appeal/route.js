import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = params;
  const body = await req.json();

  return NextResponse.json({
    success: true,
    message: 'Appeal logged successfully.',
    appeal: {
      ticket_id: id,
      reason: body.reason,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  });
}
