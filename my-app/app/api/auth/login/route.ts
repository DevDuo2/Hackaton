import { NextResponse } from 'next/server';
import { forwardedFor, proxyJson } from '../../../../lib/proxy';

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri" }, { status: 400 });
  }

  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email va parol kiritilishi shart' },
      { status: 400 }
    );
  }

  const { status, body: data } = await proxyJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: forwardedFor(request),
  });

  return NextResponse.json(data, { status });
}
