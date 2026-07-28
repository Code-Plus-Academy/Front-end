import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = params;
  const body = await req.json();

  return NextResponse.json({
    success: true,
    message: 'Ticket reopening request submitted.',
    ticket_id: id,
    status: 'open',
    reopen_reason: body.reason,
  });
}
