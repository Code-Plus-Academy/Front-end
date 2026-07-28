import { NextResponse } from 'next/server';

export async function GET(req) {
  return NextResponse.json({
    cases: [
      {
        id: 'case-101',
        category: 'Copyright Infringement',
        type: 'copyright',
        status: 'open',
        created_at: new Date().toISOString(),
      },
    ],
  });
}
