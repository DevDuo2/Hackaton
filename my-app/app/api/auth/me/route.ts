import { NextResponse } from 'next/server';
import { DEMO_USERS } from '../../../../lib/auth';

export async function GET(request: Request) {
  // Returns current active demo user
  const user = DEMO_USERS[0];
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      selectedSubject: user.selectedSubject,
      avatar: user.avatar,
    },
  });
}
