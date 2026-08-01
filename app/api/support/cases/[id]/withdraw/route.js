import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = params;

  return NextResponse.json({
    success: true,
    message: 'Report withdrawn successfully.',
    ticket_id: id,
    status: 'closed',
  });
}
