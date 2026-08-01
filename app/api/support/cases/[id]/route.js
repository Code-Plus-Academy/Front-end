import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { id } = params;
  return NextResponse.json({
    ticket: {
      id,
      category: 'General Support Inquiry',
      type: 'general-support',
      description: 'User support request description logged via compliance desk.',
      status: 'open',
      sla_resolve_by: new Date(Date.now() + 14 * 86400000).toISOString(),
    },
    actions: [],
    appeals: [],
  });
}
