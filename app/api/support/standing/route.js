import { NextResponse } from 'next/server';
import { getUserStanding } from '../../../../src/grpc/client.js';

export async function GET(req) {
  try {
    const userId = 'user-current';
    const res = await getUserStanding(userId);
    return NextResponse.json({
      active_strikes: res.active_strikes || 0,
      suspension_status: res.suspension_status || 'good_standing',
      suspended_until: res.suspended_until || null,
    });
  } catch (err) {
    return NextResponse.json({
      active_strikes: 0,
      suspension_status: 'good_standing',
      suspended_until: null,
    });
  }
}
